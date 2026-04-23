"""REST surface for realtime protocol documentation (OpenAPI)."""

from __future__ import annotations

from fastapi import APIRouter

from engagement.realtime.protocol import protocol_contract

router = APIRouter(prefix="/realtime", tags=["Realtime"])


@router.get("/protocol")
def get_socket_protocol() -> dict:
    """JSON contract for Socket.IO ``/quiz-room`` — use for UI clients and codegen."""
    return protocol_contract()
