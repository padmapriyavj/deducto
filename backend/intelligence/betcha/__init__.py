"""Betcha: confidence multiplier (PRD §7.7). Import ``intelligence.betcha.router`` for FastAPI routes."""

from intelligence.betcha.resolve import (
    ALLOWED_OPTIONAL_STAKES,
    BetchaMultiplier,
    BetchaResolution,
    parse_multiplier,
    resolve_betcha_payout,
)
from intelligence.betcha.service import apply_betcha_resolution_to_attempt, place_betcha_wager

__all__ = [
    "ALLOWED_OPTIONAL_STAKES",
    "BetchaMultiplier",
    "BetchaResolution",
    "apply_betcha_resolution_to_attempt",
    "parse_multiplier",
    "place_betcha_wager",
    "resolve_betcha_payout",
]
