"""Async loop: poll for due Tempos (APScheduler-free; PRD §8.5 job shape)."""

from __future__ import annotations

import asyncio
import contextlib
from typing import Any

_task: asyncio.Task[None] | None = None


async def _loop() -> None:
    from engagement.tempo.service import fire_due_tempos

    while True:
        await asyncio.sleep(20)
        with contextlib.suppress(Exception):
            await fire_due_tempos()


def start_tempo_scheduler() -> asyncio.Task[None] | None:
    global _task
    if _task is not None and not _task.done():
        return _task
    _task = asyncio.create_task(_loop())
    return _task


async def stop_tempo_scheduler() -> None:
    global _task
    if _task and not _task.done():
        _task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await _task
    _task = None
