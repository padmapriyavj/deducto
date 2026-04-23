"""Socket.IO event wiring for namespace ``/quiz-room``."""

from __future__ import annotations

import socketio

from engagement.realtime.protocol import NAMESPACE
from engagement.realtime.service import QuizRealtimeService


def register_handlers(sio: socketio.AsyncServer, svc: QuizRealtimeService) -> None:
    @sio.on("connect", namespace=NAMESPACE)
    async def connect(sid: str, environ: dict, auth) -> bool:
        return await svc.on_connect(sid, environ, auth)

    @sio.on("disconnect", namespace=NAMESPACE)
    async def disconnect(sid: str) -> None:
        await svc.on_disconnect(sid)

    @sio.on("room:join", namespace=NAMESPACE)
    async def room_join(sid: str, data: dict) -> None:
        await svc.on_room_join(sid, data)

    @sio.on("quiz:start", namespace=NAMESPACE)
    async def quiz_start(sid: str, data: dict) -> None:
        await svc.on_quiz_start(sid, data)

    @sio.on("quiz:answer", namespace=NAMESPACE)
    async def quiz_answer(sid: str, data: dict) -> None:
        await svc.on_quiz_answer(sid, data)

    @sio.on("room:leave", namespace=NAMESPACE)
    async def room_leave(sid: str, data: dict) -> None:
        await svc.on_room_leave(sid, data)
