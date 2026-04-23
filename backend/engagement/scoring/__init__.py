"""Coin and streak scoring (PRD §7.9–§7.10). Import ``finalize_quiz_attempt`` from ``engagement.scoring.service``."""

from engagement.scoring.rules import compute_base_coins, duel_outcome_coins

__all__ = ["compute_base_coins", "duel_outcome_coins"]
