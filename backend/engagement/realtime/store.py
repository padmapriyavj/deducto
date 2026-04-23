"""Process-local room index (swap for Redis for multi-worker)."""

from __future__ import annotations

from engagement.realtime.session import QuizRoomSession


class RoomStore:
    def __init__(self) -> None:
        self._rooms: dict[str, QuizRoomSession] = {}

    def get(self, room_id: str) -> QuizRoomSession | None:
        return self._rooms.get(room_id)

    def put(self, room: QuizRoomSession) -> None:
        self._rooms[room.room_id] = room

    def delete(self, room_id: str) -> None:
        self._rooms.pop(room_id, None)

    def all_room_ids(self) -> list[str]:
        return list(self._rooms.keys())

    def all_sessions(self) -> list[QuizRoomSession]:
        return list(self._rooms.values())
