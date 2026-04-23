"""Pure Betcha payout math (PRD §7.7). Student-friendly floors — retention, not gambling."""

from dataclasses import dataclass
from decimal import Decimal, ROUND_FLOOR
from typing import Literal

BetchaMultiplier = Literal["1x", "3x", "5x"]

# Optional voluntary commitment (not stored on quiz_attempts in baseline PRD)
ALLOWED_OPTIONAL_STAKES = frozenset({0, 10, 25, 50})


@dataclass(frozen=True)
class BetchaResolution:
    payout_coins: int
    effective_factor: int
    met_70: bool
    met_90: bool


def parse_multiplier(s: str) -> BetchaMultiplier:
    if s not in ("1x", "3x", "5x"):
        raise ValueError("multiplier must be one of 1x, 3x, 5x")
    return s  # type: ignore[return-value]


def _effective_factor(multiplier: BetchaMultiplier, score_percent: Decimal) -> int:
    sp = score_percent
    if multiplier == "1x":
        return 1
    if multiplier == "3x":
        return 3 if sp >= Decimal("70") else 1
    if multiplier == "5x":
        return 5 if sp >= Decimal("90") else 1
    raise ValueError(f"unknown multiplier: {multiplier}")


def resolve_betcha_payout(
    score_percent: Decimal,
    base_coins: int,
    multiplier: BetchaMultiplier,
) -> BetchaResolution:
    """
    PRD §7.7:

    - 1x: coins = base_coins × score% (proportional).
    - 3x: if score ≥ 70%: ×3 on that product; else fallback to 1x product.
    - 5x: if score ≥ 90%: ×5; else fallback to 1x product.

    Generous floors: small scores should still feel rewarding (student portal).
    """
    if base_coins < 0:
        raise ValueError("base_coins must be non-negative")
    if score_percent < 0 or score_percent > Decimal("100"):
        raise ValueError("score_percent must be between 0 and 100")

    met_70 = score_percent >= Decimal("70")
    met_90 = score_percent >= Decimal("90")
    eff = _effective_factor(multiplier, score_percent)

    # PRD integer floor: base * score * eff / 100
    num = Decimal(base_coins) * score_percent * Decimal(eff)
    den = Decimal(100)
    prd = int((num / den).to_integral_value(rounding=ROUND_FLOOR))

    # Retention bonus: at least 20 coins for a decent effort (≥40%) when formula is tiny
    MIN_SNACK = 20
    if score_percent >= Decimal("40") and prd < MIN_SNACK and score_percent > Decimal("0"):
        prd = MIN_SNACK

    # No coin pool (e.g. duel with scoring base 0): scaled visit bonus so multipliers still feel fun
    if base_coins == 0 and score_percent >= Decimal("55"):
        prd = max(prd, min(MIN_SNACK * eff, 150))

    return BetchaResolution(
        payout_coins=prd,
        effective_factor=eff,
        met_70=met_70,
        met_90=met_90,
    )
