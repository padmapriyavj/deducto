#!/usr/bin/env python3
"""Seed the shop_items table with initial items across all categories."""

import os
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv

load_dotenv(backend_dir / ".env")

from database import get_supabase


SHOP_ITEMS = [
    # finn_skin category (3 items)
    {
        "name": "Cool Fox",
        "category": "finn_skin",
        "asset_url": "/assets/skins/cool-fox.png",
        "price_coins": 150,
        "rarity": "rare",
    },
    {
        "name": "Party Fox",
        "category": "finn_skin",
        "asset_url": "/assets/skins/party-fox.png",
        "price_coins": 100,
        "rarity": "common",
    },
    {
        "name": "Space Fox",
        "category": "finn_skin",
        "asset_url": "/assets/skins/space-fox.png",
        "price_coins": 250,
        "rarity": "epic",
    },
    # backdrop category - space items (5 items)
    {
        "name": "Cozy Bookshelf",
        "category": "backdrop",
        "asset_url": "/assets/items/bookshelf.png",
        "price_coins": 80,
        "rarity": "common",
    },
    {
        "name": "Study Chair",
        "category": "backdrop",
        "asset_url": "/assets/items/chair.png",
        "price_coins": 60,
        "rarity": "common",
    },
    {
        "name": "Warm Desk Lamp",
        "category": "backdrop",
        "asset_url": "/assets/items/lamp.png",
        "price_coins": 45,
        "rarity": "common",
    },
    {
        "name": "Spinning Globe",
        "category": "backdrop",
        "asset_url": "/assets/items/globe.png",
        "price_coins": 120,
        "rarity": "rare",
    },
    {
        "name": "Coffee Maker",
        "category": "backdrop",
        "asset_url": "/assets/items/coffee-maker.png",
        "price_coins": 90,
        "rarity": "common",
    },
    # backdrop category (4 items)
    {
        "name": "Mountain View",
        "category": "backdrop",
        "asset_url": "/assets/backdrops/mountain.png",
        "price_coins": 200,
        "rarity": "rare",
    },
    {
        "name": "City Night",
        "category": "backdrop",
        "asset_url": "/assets/backdrops/city.png",
        "price_coins": 180,
        "rarity": "rare",
    },
    {
        "name": "Enchanted Forest",
        "category": "backdrop",
        "asset_url": "/assets/backdrops/forest.png",
        "price_coins": 220,
        "rarity": "epic",
    },
    {
        "name": "Ocean Waves",
        "category": "backdrop",
        "asset_url": "/assets/backdrops/ocean.png",
        "price_coins": 160,
        "rarity": "common",
    },
    # streak_freeze category (consumable, 1 item)
    {
        "name": "Streak Freeze",
        "category": "streak_freeze",
        "asset_url": "/assets/items/streak-freeze.png",
        "price_coins": 50,
        "rarity": "common",
    },
]


def seed_shop_items():
    """Insert shop items in the database (skips duplicates by name)."""
    sb = get_supabase()
    
    print(f"Seeding {len(SHOP_ITEMS)} shop items...")
    
    for item in SHOP_ITEMS:
        try:
            existing = sb.table("shop_items").select("id").eq("name", item["name"]).execute()
            if existing.data:
                print(f"  - {item['name']} already exists, skipping")
                continue
            
            result = sb.table("shop_items").insert(item).execute()
            print(f"  ✓ {item['name']} ({item['category']}) - {item['price_coins']} coins")
        except Exception as e:
            print(f"  ✗ Failed to seed {item['name']}: {e}")
    
    print("\nDone! Shop items seeded successfully.")


if __name__ == "__main__":
    seed_shop_items()
