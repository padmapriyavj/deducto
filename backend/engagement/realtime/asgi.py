"""Mount Socket.IO on the FastAPI ASGI app."""

from __future__ import annotations

from typing import TYPE_CHECKING

import socketio

from engagement.realtime.handlers import register_handlers
from engagement.realtime.service import QuizRealtimeService

if TYPE_CHECKING:
    from starlette.types import ASGIApp

_socketio_server: socketio.AsyncServer | None = None


def get_socketio_server() -> socketio.AsyncServer:
    if _socketio_server is None:
        raise RuntimeError("Socket.IO server not initialized (mount_socketio not called)")
    return _socketio_server


def mount_socketio(fastapi_app: "ASGIApp") -> socketio.ASGIApp:
    """
    Returns a combined ASGI app: Socket.IO handles ``/socket.io/``; all other traffic
    goes to FastAPI (REST, health, etc.).
    """
    global _socketio_server
    sio = socketio.AsyncServer(
        async_mode="asgi",
        cors_allowed_origins="*",
        logger=False,
        engineio_logger=False,
    )
    _socketio_server = sio
    svc = QuizRealtimeService(sio)
    register_handlers(sio, svc)
    return socketio.ASGIApp(sio, fastapi_app)
