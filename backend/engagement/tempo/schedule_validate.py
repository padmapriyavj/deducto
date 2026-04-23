"""Validate Tempo ``scheduled_at`` against ``courses.schedule.class_meetings``."""

from __future__ import annotations

from datetime import datetime, time
from typing import Any

from zoneinfo import ZoneInfo


def _parse_hhmm(s: str) -> time:
    parts = str(s).strip().split(":")
    h = int(parts[0])
    m = int(parts[1]) if len(parts) > 1 else 0
    return time(h, min(59, max(0, m)))


def scheduled_at_matches_class_schedule(
    scheduled_at: datetime,
    schedule: dict[str, Any] | None,
) -> bool:
    """
    Return True if there are no class meetings, or if ``scheduled_at`` falls inside
    at least one meeting window. Weekdays follow Python: Monday=0 … Sunday=6.
    Times use ``schedule["timezone"]`` (IANA), default UTC.
    """
    if not schedule:
        return True
    meetings = schedule.get("class_meetings")
    if not meetings or not isinstance(meetings, list):
        return True

    tzname = str(schedule.get("timezone") or "UTC")
    try:
        tz = ZoneInfo(tzname)
    except Exception:
        tz = ZoneInfo("UTC")

    if scheduled_at.tzinfo is None:
        scheduled_at = scheduled_at.replace(tzinfo=ZoneInfo("UTC"))
    local = scheduled_at.astimezone(tz)
    wd = local.weekday()
    t = local.time()

    for m in meetings:
        if not isinstance(m, dict):
            continue
        try:
            if int(m.get("weekday", -999)) != wd:
                continue
            st = _parse_hhmm(str(m.get("start", "00:00")))
            en = _parse_hhmm(str(m.get("end", "23:59")))
        except (TypeError, ValueError, IndexError):
            continue
        if st <= t <= en:
            return True
    return False


def assert_schedule_allows_tempo(
    scheduled_at: datetime,
    schedule: dict[str, Any] | None,
) -> None:
    if scheduled_at_matches_class_schedule(scheduled_at, schedule):
        return
    raise ValueError(
        "Scheduled time is outside the class meeting hours for this course. "
        "Choose a date and time that falls within one of the meeting slots (in the course timezone), "
        "or update the course schedule."
    )
