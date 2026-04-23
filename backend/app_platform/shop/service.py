"""Shop service layer with atomic coin deduction and duplicate prevention."""

from datetime import datetime, timezone
from typing import Any

from postgrest.exceptions import APIError

from database import get_supabase


CONSUMABLE_CATEGORIES = {"streak_freeze"}


def fetch_shop_items(category: str | None = None) -> list[dict[str, Any]]:
    """
    Fetch all shop items, optionally filtered by category.
    
    Returns list of shop item dicts.
    """
    sb = get_supabase()
    query = sb.table("shop_items").select("*")
    
    if category:
        query = query.eq("category", category)
    
    result = query.execute()
    return result.data or []


def fetch_user_inventory(user_id: int) -> list[dict[str, Any]]:
    """
    Fetch all items in a user's inventory with shop item details.
    
    Returns list of inventory item dicts with joined shop item info.
    """
    sb = get_supabase()
    
    result = (
        sb.table("user_inventory")
        .select("id,user_id,shop_item_id,acquired_at,placement,shop_items(*)")
        .eq("user_id", user_id)
        .execute()
    )
    
    items = []
    for row in result.data or []:
        shop_item = row.get("shop_items", {})
        items.append({
            "id": row["id"],
            "shop_item_id": row["shop_item_id"],
            "name": shop_item.get("name", ""),
            "category": shop_item.get("category", ""),
            "asset_url": shop_item.get("asset_url", ""),
            "price_coins": shop_item.get("price_coins", 0),
            "rarity": shop_item.get("rarity", "common"),
            "acquired_at": row["acquired_at"],
            "placement": row.get("placement"),
        })
    
    return items


class PurchaseError(Exception):
    """Base exception for purchase errors."""

    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def process_purchase(user_id: int, item_id: int) -> dict[str, Any]:
    """
    Process a shop item purchase with atomic coin deduction.
    
    Uses compare-and-swap pattern to prevent race conditions on coin balance.
    Prevents duplicate purchases for non-consumable items.
    
    Returns dict with new_balance and item info.
    Raises PurchaseError on failure.
    """
    sb = get_supabase()
    
    try:
        item_result = sb.table("shop_items").select("*").eq("id", item_id).single().execute()
    except APIError:
        raise PurchaseError("Item not found", 404)
    
    item = item_result.data
    price = int(item["price_coins"])
    category = item.get("category", "")
    
    is_consumable = category in CONSUMABLE_CATEGORIES
    if not is_consumable:
        existing = (
            sb.table("user_inventory")
            .select("id")
            .eq("user_id", user_id)
            .eq("shop_item_id", item_id)
            .execute()
        )
        if existing.data:
            raise PurchaseError("Item already owned", 409)
    
    try:
        user_result = sb.table("users").select("coins").eq("id", user_id).single().execute()
    except APIError:
        raise PurchaseError("User not found", 404)
    
    old_coins = int(user_result.data["coins"])
    if old_coins < price:
        raise PurchaseError("Insufficient coins", 402)
    
    new_coins = old_coins - price
    cas_result = (
        sb.table("users")
        .update({"coins": new_coins})
        .eq("id", user_id)
        .eq("coins", old_coins)
        .execute()
    )
    
    if not cas_result.data:
        raise PurchaseError("Balance changed during purchase, please retry", 409)
    
    acquired_at = datetime.now(timezone.utc).isoformat()
    
    try:
        sb.table("user_inventory").insert({
            "user_id": user_id,
            "shop_item_id": item_id,
            "acquired_at": acquired_at,
            "placement": None,
        }).execute()
    except APIError:
        sb.table("users").update({"coins": old_coins}).eq("id", user_id).eq("coins", new_coins).execute()
        raise PurchaseError("Failed to add item to inventory", 500)
    
    return {
        "new_balance": new_coins,
        "item": item,
    }


def save_space_placements(user_id: int, placements: list[dict[str, Any]]) -> None:
    """
    Save space placements for a user.
    
    Clears old placements and saves the new ones.
    placements: list of {slot_id, inventory_item_id}
    """
    sb = get_supabase()
    
    # First, clear all placements for this user's inventory items
    inventory_result = (
        sb.table("user_inventory")
        .select("id")
        .eq("user_id", user_id)
        .execute()
    )
    
    inventory_ids = [row["id"] for row in (inventory_result.data or [])]
    if inventory_ids:
        sb.table("user_inventory").update({"placement": None}).in_("id", inventory_ids).execute()
    
    # Now save the new placements
    for p in placements:
        inv_id = p.get("inventory_item_id")
        slot_id = p.get("slot_id")
        if inv_id and slot_id:
            sb.table("user_inventory").update(
                {"placement": {"slot_id": slot_id}}
            ).eq("id", int(inv_id)).eq("user_id", user_id).execute()


def get_public_space(user_id: int) -> dict[str, Any] | None:
    """
    Get public view of a user's space.
    
    Returns user info and placed items, or None if user not found.
    """
    sb = get_supabase()
    
    # Get user info
    try:
        user_result = sb.table("users").select("id,display_name").eq("id", user_id).single().execute()
    except:
        return None
    
    user = user_result.data
    if not user:
        return None
    
    # Get inventory items with placements
    inventory_result = (
        sb.table("user_inventory")
        .select("id,placement,shop_items(name,category,asset_url)")
        .eq("user_id", user_id)
        .not_.is_("placement", "null")
        .execute()
    )
    
    placements = []
    for row in (inventory_result.data or []):
        placement = row.get("placement", {})
        shop_item = row.get("shop_items", {})
        slot_id = placement.get("slot_id") if isinstance(placement, dict) else None
        if slot_id:
            placements.append({
                "slot_id": slot_id,
                "item_name": shop_item.get("name", ""),
                "item_category": shop_item.get("category", ""),
                "item_asset_url": shop_item.get("asset_url", ""),
            })
    
    return {
        "user_id": user["id"],
        "display_name": user["display_name"],
        "placements": placements,
    }
