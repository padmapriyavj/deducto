#!/bin/bash

BASE_URL="${BASE_URL:-http://localhost:8000}"

echo "=== Shop & Inventory Integration Test ==="
echo ""

# Step 1: Login as a student (or create one)
echo "Step 1: Login as student"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" -H "Content-Type: application/json" -d '{"email": "student@example.com", "password": "student123"}')
TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo "Creating test student user..."
    SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/auth/signup" -H "Content-Type: application/json" -d '{"email": "student@example.com", "password": "student123", "display_name": "Test Student", "role": "student"}')
    TOKEN=$(echo "$SIGNUP_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))" 2>/dev/null)
fi

if [ -z "$TOKEN" ]; then
    echo "ERROR: Failed to get token"
    exit 1
fi
echo "Token obtained successfully"
echo ""

# Step 2: Get current user info to see coins
echo "Step 2: Get current user info"
ME_RESPONSE=$(curl -s -X GET "$BASE_URL/api/v1/auth/me" -H "Authorization: Bearer $TOKEN")
echo "$ME_RESPONSE"
USER_ID=$(echo "$ME_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
CURRENT_COINS=$(echo "$ME_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['coins'])" 2>/dev/null)
echo "User ID: $USER_ID, Current coins: $CURRENT_COINS"
echo ""

# Step 3: Set user coins to 500 directly via Supabase (for testing)
echo "Step 3: Set user coins to 500 for testing"
cd "$(dirname "$0")/.."
python3 -c "
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path('.env'))
from database import get_supabase
sb = get_supabase()
result = sb.table('users').update({'coins': 500}).eq('id', $USER_ID).execute()
print(f'Updated user $USER_ID coins to 500')
"
cd - > /dev/null
echo ""

# Verify coins are now 500
ME_RESPONSE=$(curl -s -X GET "$BASE_URL/api/v1/auth/me" -H "Authorization: Bearer $TOKEN")
CURRENT_COINS=$(echo "$ME_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['coins'])" 2>/dev/null)
echo "Verified coins: $CURRENT_COINS"
if [ "$CURRENT_COINS" != "500" ]; then
    echo "WARNING: Coins not set to 500. Test may not work as expected."
fi
echo ""

# Step 4: List all shop items and get IDs
echo "Step 4: List all shop items"
ITEMS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/v1/shop/items")
echo "$ITEMS_RESPONSE" | python3 -c "import sys, json; items=json.load(sys.stdin); print(f'Found {len(items)} items'); [print(f'  - ID {i[\"id\"]}: {i[\"name\"]} ({i[\"price_coins\"]} coins)') for i in items]"

# Get item IDs by name for testing
PARTY_FOX_ID=$(echo "$ITEMS_RESPONSE" | python3 -c "import sys, json; items=json.load(sys.stdin); print(next((i['id'] for i in items if i['name'] == 'Party Fox'), ''))" 2>/dev/null)
SPACE_FOX_ID=$(echo "$ITEMS_RESPONSE" | python3 -c "import sys, json; items=json.load(sys.stdin); print(next((i['id'] for i in items if i['name'] == 'Space Fox'), ''))" 2>/dev/null)
MOUNTAIN_ID=$(echo "$ITEMS_RESPONSE" | python3 -c "import sys, json; items=json.load(sys.stdin); print(next((i['id'] for i in items if i['name'] == 'Mountain View'), ''))" 2>/dev/null)
STREAK_FREEZE_ID=$(echo "$ITEMS_RESPONSE" | python3 -c "import sys, json; items=json.load(sys.stdin); print(next((i['id'] for i in items if i['name'] == 'Streak Freeze'), ''))" 2>/dev/null)

echo ""
echo "Item IDs for testing:"
echo "  Party Fox (100 coins): $PARTY_FOX_ID"
echo "  Space Fox (250 coins): $SPACE_FOX_ID"
echo "  Mountain View (200 coins): $MOUNTAIN_ID"
echo "  Streak Freeze (50 coins): $STREAK_FREEZE_ID"
echo ""

# Step 5: List shop items filtered by category
echo "Step 5: List shop items filtered by category (finn_skin)"
curl -s -X GET "$BASE_URL/api/v1/shop/items?category=finn_skin" | python3 -c "import sys, json; items=json.load(sys.stdin); print(f'Found {len(items)} finn_skin items'); [print(f'  - {i[\"name\"]}') for i in items]"
echo ""

# Step 6: Buy a 100-coin item (Party Fox)
echo "Step 6: Buy 100-coin item (Party Fox, ID: $PARTY_FOX_ID)"
PURCHASE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/shop/purchase" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "{\"item_id\": $PARTY_FOX_ID}")
echo "$PURCHASE_RESPONSE"
NEW_BALANCE=$(echo "$PURCHASE_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('new_balance', 'ERROR'))" 2>/dev/null)
echo "New balance after purchase: $NEW_BALANCE"

if [ "$NEW_BALANCE" == "400" ]; then
    echo "✓ PASS: Coins correctly deducted (500 -> 400)"
else
    echo "✗ FAIL: Expected 400 coins, got $NEW_BALANCE"
fi
echo ""

# Step 7: Check inventory - should contain the purchased item
echo "Step 7: Check inventory"
INVENTORY_RESPONSE=$(curl -s -X GET "$BASE_URL/me/inventory" -H "Authorization: Bearer $TOKEN")
echo "$INVENTORY_RESPONSE" | python3 -c "import sys, json; items=json.load(sys.stdin); print(f'Inventory has {len(items)} items'); [print(f'  - {i[\"name\"]} (acquired: {i[\"acquired_at\"]})') for i in items]"
ITEM_COUNT=$(echo "$INVENTORY_RESPONSE" | python3 -c "import sys, json; items=json.load(sys.stdin); print(len([i for i in items if i['name'] == 'Party Fox']))" 2>/dev/null)
if [ "$ITEM_COUNT" == "1" ]; then
    echo "✓ PASS: Item found in inventory"
else
    echo "✗ FAIL: Item not found in inventory"
fi
echo ""

# Step 8: Try to buy an expensive item (Space Fox costs 250, should succeed)
echo "Step 8: Try to buy expensive item (Space Fox costs 250, should succeed)"
PURCHASE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/shop/purchase" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "{\"item_id\": $SPACE_FOX_ID}")
echo "$PURCHASE_RESPONSE"
NEW_BALANCE=$(echo "$PURCHASE_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('new_balance', 'ERROR'))" 2>/dev/null)
echo "Balance after second purchase: $NEW_BALANCE"

if [ "$NEW_BALANCE" == "150" ]; then
    echo "✓ PASS: Coins correctly deducted (400 -> 150)"
else
    echo "✗ FAIL: Expected 150 coins, got $NEW_BALANCE"
fi
echo ""

# Step 9: Try to buy a 200-coin item with only 150 coins (should fail with 402)
echo "Step 9: Try to buy 200-coin item with insufficient coins (Mountain View costs 200)"
PURCHASE_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/api/v1/shop/purchase" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "{\"item_id\": $MOUNTAIN_ID}")
HTTP_CODE=$(echo "$PURCHASE_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$PURCHASE_RESPONSE" | grep -v "HTTP_CODE:")
echo "$BODY"
echo "HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" == "402" ]; then
    echo "✓ PASS: Correctly rejected with 402 Insufficient coins"
else
    echo "✗ FAIL: Expected 402, got $HTTP_CODE"
fi

# Verify coins unchanged
ME_RESPONSE=$(curl -s -X GET "$BASE_URL/api/v1/auth/me" -H "Authorization: Bearer $TOKEN")
CURRENT_COINS=$(echo "$ME_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['coins'])" 2>/dev/null)
echo "Coins after failed purchase: $CURRENT_COINS"
if [ "$CURRENT_COINS" == "150" ]; then
    echo "✓ PASS: Coins unchanged after failed purchase"
else
    echo "✗ FAIL: Coins changed unexpectedly"
fi
echo ""

# Step 10: Try to buy the same item again (should fail with 409)
echo "Step 10: Try to buy same item again (Party Fox - should get 409 Conflict)"
PURCHASE_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/api/v1/shop/purchase" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "{\"item_id\": $PARTY_FOX_ID}")
HTTP_CODE=$(echo "$PURCHASE_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$PURCHASE_RESPONSE" | grep -v "HTTP_CODE:")
echo "$BODY"
echo "HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" == "409" ]; then
    echo "✓ PASS: Correctly rejected duplicate purchase with 409"
else
    echo "✗ FAIL: Expected 409, got $HTTP_CODE"
fi
echo ""

# Step 11: Buy a consumable item (streak_freeze) - should allow duplicates
echo "Step 11: Buy consumable item (Streak Freeze costs 50)"
PURCHASE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/shop/purchase" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "{\"item_id\": $STREAK_FREEZE_ID}")
echo "$PURCHASE_RESPONSE"
NEW_BALANCE=$(echo "$PURCHASE_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('new_balance', 'ERROR'))" 2>/dev/null)
echo "Balance after buying streak freeze: $NEW_BALANCE"
if [ "$NEW_BALANCE" == "100" ]; then
    echo "✓ PASS: Streak freeze purchased (150 -> 100)"
else
    echo "✗ FAIL: Expected 100 coins, got $NEW_BALANCE"
fi
echo ""

# Step 12: Buy another streak freeze (consumables allow duplicates)
echo "Step 12: Buy another streak freeze (consumables allow multiple purchases)"
PURCHASE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/shop/purchase" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "{\"item_id\": $STREAK_FREEZE_ID}")
echo "$PURCHASE_RESPONSE"
NEW_BALANCE=$(echo "$PURCHASE_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('new_balance', 'ERROR'))" 2>/dev/null)
echo "Balance after second streak freeze: $NEW_BALANCE"
if [ "$NEW_BALANCE" == "50" ]; then
    echo "✓ PASS: Second streak freeze purchased (100 -> 50)"
else
    echo "✗ FAIL: Expected 50 coins, got $NEW_BALANCE"
fi
echo ""

# Step 13: Final inventory check
echo "Step 13: Final inventory check"
INVENTORY_RESPONSE=$(curl -s -X GET "$BASE_URL/me/inventory" -H "Authorization: Bearer $TOKEN")
echo "$INVENTORY_RESPONSE" | python3 -c "
import sys, json
items = json.load(sys.stdin)
print(f'Total items in inventory: {len(items)}')
for item in items:
    print(f'  - {item[\"name\"]} (ID: {item[\"shop_item_id\"]})')
"
echo ""

echo "=== Shop Test Complete ==="
