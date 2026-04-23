"""Pure Betcha payout tests (PRD §7.7 boundaries)."""

from decimal import Decimal

import pytest

from intelligence.betcha import resolve_betcha_payout


@pytest.mark.parametrize(
    ("score", "mult", "expected_payout", "expected_factor"),
    [
        # 1x — always factor 1
        (Decimal("69"), "1x", 69, 1),
        (Decimal("70"), "1x", 70, 1),
        (Decimal("89"), "1x", 89, 1),
        (Decimal("90"), "1x", 90, 1),
        (Decimal("100"), "1x", 100, 1),
        # 3x — threshold 70%
        (Decimal("69"), "3x", 69, 1),
        (Decimal("70"), "3x", 210, 3),
        (Decimal("89"), "3x", 267, 3),
        (Decimal("90"), "3x", 270, 3),
        (Decimal("100"), "3x", 300, 3),
        # 5x — threshold 90%
        (Decimal("69"), "5x", 69, 1),
        (Decimal("70"), "5x", 70, 1),
        (Decimal("89"), "5x", 89, 1),
        (Decimal("90"), "5x", 450, 5),
        (Decimal("100"), "5x", 500, 5),
    ],
)
def test_resolve_betcha_payout_boundaries(
    score: Decimal,
    mult: str,
    expected_payout: int,
    expected_factor: int,
) -> None:
    base = 100
    r = resolve_betcha_payout(score, base, mult)  # type: ignore[arg-type]
    assert r.payout_coins == expected_payout
    assert r.effective_factor == expected_factor


def test_met_flags() -> None:
    r = resolve_betcha_payout(Decimal("70"), 100, "3x")
    assert r.met_70 is True
    assert r.met_90 is False

    r2 = resolve_betcha_payout(Decimal("90"), 100, "5x")
    assert r2.met_70 is True
    assert r2.met_90 is True


def test_invalid_raises() -> None:
    with pytest.raises(ValueError):
        resolve_betcha_payout(Decimal("50"), -1, "1x")
    with pytest.raises(ValueError):
        resolve_betcha_payout(Decimal("101"), 100, "1x")
