"""Socket.IO orchestration: rooms, timers, broadcasts (practice / tempo / duel)."""

from __future__ import annotations

import asyncio
import time
from typing import Any
from urllib.parse import parse_qs
from uuid import UUID

import socketio
from pydantic import ValidationError

from app_platform.auth.security import decode_access_token
from jose import JWTError
from engagement.realtime.protocol import (
    NAMESPACE,
    QuizAnswerPayload,
    QuizNextPayload,
    QuizPeerAnsweredPayload,
    QuizQuestionPayload,
    QuizStartPayload,
    RoomErrorPayload,
    RoomJoinPayload,
    RoomLeavePayload,
    ServerEvent,
)
from engagement.realtime.session import (
    Participant,
    QuizRoomSession,
    ensure_attempt_stub,
    utc_now_iso,
)
from engagement.realtime.store import RoomStore
from intelligence.quiz.repository import get_quiz_row, list_questions


def _err(code: str, message: str, detail: dict[str, Any] | None = None) -> dict[str, Any]:
    return RoomErrorPayload(code=code, message=message, detail=detail).model_dump(mode="json")


def _session_user_id_to_int(user_id: str) -> int:
    """Map Socket session user id (JWT ``sub`` as digits, or legacy UUID(int=pk) string) to ``users.id``."""
    s = (user_id or "").strip()
    if not s:
        raise ValueError("empty user id")
    if s.isdigit():
        return int(s)
    return int(UUID(s).int)


class QuizRealtimeService:
    """Shared by Socket.IO handlers; one instance per process."""

    def __init__(self, sio: socketio.AsyncServer) -> None:
        self.sio = sio
        self.store = RoomStore()
        self._lock = asyncio.Lock()
        # O(1) disconnect / answer routing — avoid scanning every room under load.
        self._sid_to_room: dict[str, str] = {}
        self._user_to_room: dict[str, str] = {}

    def _parse_user_id(self, environ: dict, auth: dict | None) -> str | None:
        auth = auth or {}
        uid = auth.get("user_id")
        if uid:
            return str(uid)
        token = auth.get("token")
        if token and isinstance(token, str) and token.strip():
            try:
                payload = decode_access_token(token.strip())
                sub = payload.get("sub")
                if sub is not None and str(sub).strip():
                    return str(sub).strip()
            except JWTError:
                pass
        q = environ.get("QUERY_STRING") or ""
        qs = parse_qs(q)
        if qs.get("user_id"):
            return str(qs["user_id"][0])
        return None

    async def on_connect(self, sid: str, environ: dict, auth: Any) -> bool:
        uid = self._parse_user_id(environ, auth if isinstance(auth, dict) else None)
        if not uid:
            return False
        await self.sio.save_session(sid, {"user_id": uid}, namespace=NAMESPACE)
        return True

    async def on_disconnect(self, sid: str) -> None:
        async with self._lock:
            rid = self._sid_to_room.pop(sid, None)
            if not rid:
                return
            room = self.store.get(rid)
            if not room:
                return
            to_drop = [u for u, p in room.participants.items() if p.sid == sid]
            for u in to_drop:
                del room.participants[u]
                self._user_to_room.pop(u, None)
                room.answers.pop(u, None)
                room.attempt_by_user.pop(u, None)
            if not room.participants:
                room.cancel_timer()
                self.store.delete(rid)

    async def on_room_join(self, sid: str, data: dict[str, Any]) -> None:
        try:
            body = RoomJoinPayload.model_validate(data or {})
        except ValidationError as e:
            await self.sio.emit(
                ServerEvent.ROOM_ERROR.value,
                _err("INVALID_PAYLOAD", "room:join validation failed", {"errors": e.errors()}),
                to=sid,
                namespace=NAMESPACE,
            )
            return

        session = await self.sio.get_session(sid, namespace=NAMESPACE)
        user_id = str(session.get("user_id") or "")

        async with self._lock:
            try:
                quiz = get_quiz_row(int(body.quiz_id))
            except Exception:
                await self.sio.emit(
                    ServerEvent.ROOM_ERROR.value,
                    _err("NOT_FOUND", "Quiz not found"),
                    to=sid,
                    namespace=NAMESPACE,
                )
                return

            if str(quiz.get("status") or "") != "published":
                await self.sio.emit(
                    ServerEvent.ROOM_ERROR.value,
                    _err("QUIZ_NOT_PUBLISHED", "Quiz is not published"),
                    to=sid,
                    namespace=NAMESPACE,
                )
                return

            questions = list_questions(int(body.quiz_id))
            if not questions:
                await self.sio.emit(
                    ServerEvent.ROOM_ERROR.value,
                    _err("INVALID_QUIZ", "Quiz has no questions"),
                    to=sid,
                    namespace=NAMESPACE,
                )
                return

            room = self.store.get(body.room_id)
            if room is None:
                room = QuizRoomSession.build(
                    room_id=body.room_id,
                    quiz_id=body.quiz_id,
                    mode=body.mode,
                    quiz_row=quiz,
                    questions=questions,
                )
                self.store.put(room)
            else:
                if room.quiz_id != body.quiz_id or room.mode != body.mode:
                    await self.sio.emit(
                        ServerEvent.ROOM_ERROR.value,
                        _err("ROOM_MISMATCH", "room_id is already bound to another quiz/mode"),
                        to=sid,
                        namespace=NAMESPACE,
                    )
                    return
                if room.status != "waiting" and user_id not in room.participants:
                    await self.sio.emit(
                        ServerEvent.ROOM_ERROR.value,
                        _err("SESSION_STARTED", "Quiz already in progress"),
                        to=sid,
                        namespace=NAMESPACE,
                    )
                    return

            if user_id in room.participants:
                old_sid = room.participants[user_id].sid
                if old_sid != sid:
                    self._sid_to_room.pop(old_sid, None)
                room.participants[user_id] = Participant(
                    user_id=user_id,
                    display_name=room.participants[user_id].display_name,
                    sid=sid,
                )
            elif len(room.participants) >= room.policy.max_participants:
                await self.sio.emit(
                    ServerEvent.ROOM_ERROR.value,
                    _err("ROOM_FULL", "Room is full"),
                    to=sid,
                    namespace=NAMESPACE,
                )
                return
            else:
                if body.attempt_id:
                    room.attempt_by_user[user_id] = body.attempt_id
                else:
                    try:
                        aid = ensure_attempt_stub(
                            quiz_id=int(body.quiz_id),
                            user_id=_session_user_id_to_int(user_id),
                            mode=body.mode,
                            room_id=body.room_id,
                        )
                        room.attempt_by_user[user_id] = str(aid)
                    except Exception as e:
                        await self.sio.emit(
                            ServerEvent.ROOM_ERROR.value,
                            _err("ATTEMPT_FAILED", str(e)),
                            to=sid,
                            namespace=NAMESPACE,
                        )
                        return
                display = body.display_name or "Player"
                room.participants[user_id] = Participant(
                    user_id=user_id, display_name=display, sid=sid
                )

            self._sid_to_room[sid] = body.room_id
            self._user_to_room[user_id] = body.room_id

            await self.sio.enter_room(sid, body.room_id, namespace=NAMESPACE)

            # Duel: start as soon as both players are present (no reliance on a flaky client ``quiz:start``).
            if (
                room.mode == "duel"
                and room.status == "waiting"
                and len(room.participants) >= 2
            ):
                await self._begin_questions_locked(room)
                try:
                    from engagement.duels.service import mark_duel_active

                    mark_duel_active(room.room_id)
                except ValueError:
                    pass
            elif room.policy.auto_start_on_join and room.status == "waiting":
                await self._begin_questions_locked(room)
            else:
                await self._emit_room_state(room)

    async def on_quiz_start(self, sid: str, data: dict[str, Any]) -> None:
        try:
            body = QuizStartPayload.model_validate(data or {})
        except ValidationError as e:
            await self.sio.emit(
                ServerEvent.ROOM_ERROR.value,
                _err("INVALID_PAYLOAD", "quiz:start validation failed", {"errors": e.errors()}),
                to=sid,
                namespace=NAMESPACE,
            )
            return

        session = await self.sio.get_session(sid, namespace=NAMESPACE)
        user_id = str(session.get("user_id") or "")

        async with self._lock:
            room = self.store.get(body.room_id)
            if not room:
                await self.sio.emit(
                    ServerEvent.ROOM_ERROR.value,
                    _err("NOT_FOUND", "Room not found"),
                    to=sid,
                    namespace=NAMESPACE,
                )
                return
            if user_id not in room.participants:
                await self.sio.emit(
                    ServerEvent.ROOM_ERROR.value,
                    _err("FORBIDDEN", "Not in this room"),
                    to=sid,
                    namespace=NAMESPACE,
                )
                return
            if room.status != "waiting":
                await self.sio.emit(
                    ServerEvent.ROOM_ERROR.value,
                    _err("INVALID_STATE", "Quiz already started or completed"),
                    to=sid,
                    namespace=NAMESPACE,
                )
                return
            if room.mode == "duel" and len(room.participants) < 2:
                await self.sio.emit(
                    ServerEvent.ROOM_ERROR.value,
                    _err("WAITING_OPPONENT", "Need two players to start"),
                    to=sid,
                    namespace=NAMESPACE,
                )
                return

            await self._begin_questions_locked(room)
            if room.mode == "duel":
                try:
                    from engagement.duels.service import mark_duel_active

                    mark_duel_active(room.room_id)
                except ValueError:
                    pass

    async def on_quiz_answer(self, sid: str, data: dict[str, Any]) -> None:
        try:
            body = QuizAnswerPayload.model_validate(data or {})
        except ValidationError as e:
            await self.sio.emit(
                ServerEvent.ROOM_ERROR.value,
                _err("INVALID_PAYLOAD", "quiz:answer validation failed", {"errors": e.errors()}),
                to=sid,
                namespace=NAMESPACE,
            )
            return

        session = await self.sio.get_session(sid, namespace=NAMESPACE)
        user_id = str(session.get("user_id") or "")

        async with self._lock:
            room = self._find_room_for_user(user_id)
            if not room:
                await self.sio.emit(
                    ServerEvent.ROOM_ERROR.value,
                    _err("NOT_FOUND", "No active room"),
                    to=sid,
                    namespace=NAMESPACE,
                )
                return
            if room.status != "active" or room.current_index is None:
                await self.sio.emit(
                    ServerEvent.ROOM_ERROR.value,
                    _err("INVALID_STATE", "No active question"),
                    to=sid,
                    namespace=NAMESPACE,
                )
                return

            q_cur = room.questions[room.current_index]
            if str(q_cur["id"]) != body.question_id:
                await self.sio.emit(
                    ServerEvent.ROOM_ERROR.value,
                    _err("WRONG_QUESTION", "Not the current question"),
                    to=sid,
                    namespace=NAMESPACE,
                )
                return

            if user_id not in room.participants:
                await self.sio.emit(
                    ServerEvent.ROOM_ERROR.value,
                    _err("FORBIDDEN", "Not in this room"),
                    to=sid,
                    namespace=NAMESPACE,
                )
                return

            qid = str(body.question_id)
            if qid in room.answers.get(user_id, {}):
                await self.sio.emit(
                    ServerEvent.ROOM_ERROR.value,
                    _err("DUPLICATE_ANSWER", "Already answered this question"),
                    to=sid,
                    namespace=NAMESPACE,
                )
                return

            room.answers.setdefault(user_id, {})[qid] = {
                "selected_choice": body.selected_choice,
                "time_taken_ms": body.time_taken_ms,
            }
            room.answered_current.add(user_id)

            if room.policy.emit_peer_answered:
                for uid, p in room.participants.items():
                    if uid != user_id:
                        payload = QuizPeerAnsweredPayload(
                            room_id=room.room_id,
                            question_index=room.current_index,
                            peer_user_id=user_id,
                        ).model_dump(mode="json")
                        await self.sio.emit(
                            ServerEvent.QUIZ_PEER_ANSWERED.value,
                            payload,
                            to=p.sid,
                            namespace=NAMESPACE,
                        )

            await self._maybe_advance_locked(room)

    async def on_room_leave(self, sid: str, data: dict[str, Any]) -> None:
        try:
            body = RoomLeavePayload.model_validate(data or {})
        except ValidationError:
            return
        session = await self.sio.get_session(sid, namespace=NAMESPACE)
        user_id = str(session.get("user_id") or "")
        async with self._lock:
            room = self.store.get(body.room_id)
            if not room or user_id not in room.participants:
                return
            del room.participants[user_id]
            self._sid_to_room.pop(sid, None)
            self._user_to_room.pop(user_id, None)
            await self.sio.leave_room(sid, body.room_id, namespace=NAMESPACE)
            if not room.participants:
                room.cancel_timer()
                self.store.delete(body.room_id)

    def _find_room_for_user(self, user_id: str) -> QuizRoomSession | None:
        rid = self._user_to_room.get(user_id)
        if rid:
            room = self.store.get(rid)
            if room and user_id in room.participants:
                return room
            self._user_to_room.pop(user_id, None)
        for room in self.store.all_sessions():
            if user_id in room.participants:
                self._user_to_room[user_id] = room.room_id
                return room
        return None

    async def _emit_room_state(self, room: QuizRoomSession) -> None:
        payload = room.room_state_payload().model_dump(mode="json")
        await self.sio.emit(
            ServerEvent.ROOM_STATE.value,
            payload,
            room=room.room_id,
            namespace=NAMESPACE,
        )

    async def _begin_questions_locked(self, room: QuizRoomSession) -> None:
        room.status = "active"
        room.started_at = utc_now_iso()
        room.current_index = 0
        room.answered_current.clear()
        await self._emit_room_state(room)
        await self._emit_question_locked(room, 0)

    async def _emit_question_locked(self, room: QuizRoomSession, index: int) -> None:
        prev = index - 1 if index > 0 else None
        nxt = QuizNextPayload(
            room_id=room.room_id,
            previous_index=prev,
            next_index=index,
        ).model_dump(mode="json")
        await self.sio.emit(ServerEvent.QUIZ_NEXT.value, nxt, room=room.room_id, namespace=NAMESPACE)

        pub = room.question_public_at(index)
        qp = QuizQuestionPayload(room_id=room.room_id, question=pub).model_dump(mode="json")
        await self.sio.emit(
            ServerEvent.QUIZ_QUESTION.value,
            qp,
            room=room.room_id,
            namespace=NAMESPACE,
        )

        room.cancel_timer()
        if room.policy.use_question_timer:
            sec = room.time_limit_sec()
            if sec:
                room.timer_deadline_ts = time.monotonic() + float(sec)
                tidx = index

                async def _timeout() -> None:
                    await asyncio.sleep(float(sec))
                    async with self._lock:
                        r = self.store.get(room.room_id)
                        if (
                            not r
                            or r.status != "active"
                            or r.current_index != tidx
                        ):
                            return
                        await self._maybe_advance_locked(r, from_timer=True)

                room._timer_task = asyncio.create_task(_timeout())

    async def _maybe_advance_locked(self, room: QuizRoomSession, *, from_timer: bool = False) -> None:
        idx = room.current_index
        if idx is None:
            return
        n = len(room.participants)

        if from_timer:
            if not room.policy.use_question_timer:
                return
        else:
            if room.mode in ("tempo", "duel"):
                if len(room.answered_current) < n:
                    return
            else:
                if len(room.answered_current) < 1:
                    return

        room.cancel_timer()
        room.answered_current.clear()

        next_i = idx + 1
        if next_i >= len(room.questions):
            await self._complete_locked(room)
            return

        room.current_index = next_i
        await self._emit_room_state(room)
        await self._emit_question_locked(room, next_i)

    async def _complete_locked(self, room: QuizRoomSession) -> None:
        room.status = "completed"
        room.current_index = None
        room.cancel_timer()
        await self._emit_room_state(room)
        for uid, p in room.participants.items():
            pl = room.complete_payload_for_user(uid).model_dump(mode="json")
            await self.sio.emit(
                ServerEvent.QUIZ_COMPLETE.value,
                pl,
                to=p.sid,
                namespace=NAMESPACE,
            )