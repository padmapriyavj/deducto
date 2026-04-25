"""Pydantic models for Betcha HTTP API (PRD §7.7)."""
from __future__ import annotations

from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


class PlaceBetchaBody(BaseModel):
    attempt_id: int = Field(description="Quiz attempt row to attach the wager to")
    multiplier: Literal["1x", "3x", "5x"]


class PlaceBetchaResponse(BaseModel):
    attempt_id: int
    multiplier: str
    coins_balance_after: int


class FinalizeBetchaBody(BaseModel):
    score_percent: Decimal = Field(ge=Decimal("0"), le=Decimal("100"))
    base_coins: int = Field(ge=0, description="Pre-Betcha coin pool from scoring (PRD §7.7)")


class FinalizeBetchaResponse(BaseModel):
    attempt_id: int
    betcha_applied: bool
    payout_coins: int | None = None
    effective_factor: int | None = None
