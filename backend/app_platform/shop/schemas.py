"""Pydantic schemas for shop endpoints."""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel


CategoryType = Literal["finn_skin", "space_item", "backdrop", "streak_freeze"]
RarityType = Literal["common", "rare", "epic"]


class ShopItemResponse(BaseModel):
    """A purchasable item in the shop."""

    model_config = {"from_attributes": True}

    id: int
    name: str
    category: str
    asset_url: str
    price_coins: int
    rarity: str


class PurchaseRequest(BaseModel):
    """Request body for purchasing an item."""

    item_id: int


class PurchaseResponse(BaseModel):
    """Response after a successful purchase."""

    success: bool
    new_balance: int
    item: ShopItemResponse


class InventoryItemResponse(BaseModel):
    """An item in the user's inventory."""

    id: int
    shop_item_id: int
    name: str
    category: str
    asset_url: str
    price_coins: int
    rarity: str
    acquired_at: datetime
    placement: dict[str, Any] | None


class SpacePlacement(BaseModel):
    """A single slot placement in the space."""

    slot_id: str
    inventory_item_id: int | None


class SaveSpaceRequest(BaseModel):
    """Request to save space placements."""

    placements: list[SpacePlacement]


class SpaceItemPublic(BaseModel):
    """Public view of a placed item (no sensitive data)."""

    slot_id: str
    item_name: str
    item_category: str
    item_asset_url: str


class PublicSpaceResponse(BaseModel):
    """Public view of a user's space."""

    user_id: int
    display_name: str
    placements: list[SpaceItemPublic]
