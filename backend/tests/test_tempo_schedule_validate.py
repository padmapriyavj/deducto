"""Tests for class schedule vs Tempo ``scheduled_at`` validation."""

from datetime import datetime, timezone

from engagement.tempo.schedule_validate import (
    assert_schedule_allows_tempo,
    scheduled_at_matches_class_schedule,
)


def test_empty_schedule_always_matches() -> None:
    assert scheduled_at_matches_class_schedule(datetime(2026, 1, 1, tzinfo=timezone.utc), None) is True
    assert scheduled_at_matches_class_schedule(datetime(2026, 1, 1, tzinfo=timezone.utc), {}) is True
    assert scheduled_at_matches_class_schedule(datetime(2026, 1, 1, tzinfo=timezone.utc), {"foo": 1}) is True


def test_weekday_and_window_utc() -> None:
    schedule = {
        "timezone": "UTC",
        "class_meetings": [{"weekday": 0, "start": "14:00", "end": "15:00"}],
    }
    # 2026-01-05 is Monday (weekday 0)
    ok = datetime(2026, 1, 5, 14, 30, tzinfo=timezone.utc)
    bad = datetime(2026, 1, 5, 16, 0, tzinfo=timezone.utc)
    assert scheduled_at_matches_class_schedule(ok, schedule) is True
    assert scheduled_at_matches_class_schedule(bad, schedule) is False


def test_assert_raises_outside_window() -> None:
    schedule = {
        "timezone": "UTC",
        "class_meetings": [{"weekday": 0, "start": "14:00", "end": "15:00"}],
    }
    bad = datetime(2026, 1, 5, 16, 0, tzinfo=timezone.utc)
    try:
        assert_schedule_allows_tempo(bad, schedule)
    except ValueError as e:
        assert "outside" in str(e).lower()
    else:
        raise AssertionError("expected ValueError")


def test_assert_ok_inside_window() -> None:
    schedule = {
        "timezone": "UTC",
        "class_meetings": [{"weekday": 0, "start": "14:00", "end": "15:00"}],
    }
    ok = datetime(2026, 1, 5, 14, 30, tzinfo=timezone.utc)
    assert_schedule_allows_tempo(ok, schedule)
