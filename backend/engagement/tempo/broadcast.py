"""Emit ``tempo:fire`` on ``/quiz-room`` when a scheduled Tempo is due."""

from __future__ import annotations

from engagement.realtime.protocol import ServerEvent, TempoFirePayload


async def emit_tempo_fire(*, quiz_id: str, course_id: str, scheduled_at: str | None) -> None:
    from engagement.realtime.asgi import get_socketio_server
    from engagement.realtime.protocol import NAMESPACE

    sio = get_socketio_server()
    payload = TempoFirePayload(
        quiz_id=quiz_id,
        course_id=course_id,
        scheduled_at=scheduled_at,
    ).model_dump(mode="json")
    await sio.emit(ServerEvent.TEMPO_FIRE.value, payload, namespace=NAMESPACE)
