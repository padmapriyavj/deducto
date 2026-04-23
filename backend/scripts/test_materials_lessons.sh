#!/bin/bash

BASE_URL="${BASE_URL:-http://localhost:8000}"

echo "=== Materials & Lessons Integration Test ==="
echo ""

# Step 1: Login as professor
echo "Step 1: Login as professor"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" -H "Content-Type: application/json" -d '{"email": "padma@example.com", "password": "padma123"}')
echo "$LOGIN_RESPONSE"
TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)
if [ -z "$TOKEN" ]; then
    echo "ERROR: Failed to get token. Make sure a professor user exists."
    exit 1
fi
echo "Token obtained successfully"
echo ""

# Step 2: Create a course
echo "Step 2: Create a course"
COURSE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/courses/" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name": "Test Course for Materials", "description": "Testing materials upload"}')
echo "$COURSE_RESPONSE"
COURSE_ID=$(echo "$COURSE_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
if [ -z "$COURSE_ID" ]; then
    echo "ERROR: Failed to create course"
    exit 1
fi
echo "Course ID: $COURSE_ID"
echo ""

# Step 3: Create a lesson (week 1)
echo "Step 3: Create a lesson (week 1)"
LESSON1_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/courses/$COURSE_ID/lessons" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"title": "Introduction to Algorithms", "week_number": 1}')
echo "$LESSON1_RESPONSE"
LESSON1_ID=$(echo "$LESSON1_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
if [ -z "$LESSON1_ID" ]; then
    echo "ERROR: Failed to create lesson"
    exit 1
fi
echo "Lesson 1 ID: $LESSON1_ID"
echo ""

# Step 4: Create a small test PDF
echo "Step 4: Create a small test PDF"
python3 -c "import fitz; doc=fitz.open(); page=doc.new_page(); page.insert_text((50,50),'Hello World page 1'); page=doc.new_page(); page.insert_text((50,50),'Algorithms content page 2'); doc.save('/tmp/test_upload.pdf')"
if [ -f "/tmp/test_upload.pdf" ]; then
    echo "Test PDF created at /tmp/test_upload.pdf"
else
    echo "ERROR: Failed to create test PDF"
    exit 1
fi
echo ""

# Step 5: Upload the PDF to the course linked to the lesson
echo "Step 5: Upload the PDF to the course linked to the lesson"
UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/courses/$COURSE_ID/materials?lesson_id=$LESSON1_ID" -H "Authorization: Bearer $TOKEN" -F "file=@/tmp/test_upload.pdf")
echo "$UPLOAD_RESPONSE"
MATERIAL_ID=$(echo "$UPLOAD_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
if [ -z "$MATERIAL_ID" ]; then
    echo "ERROR: Failed to upload material"
    exit 1
fi
echo "Material ID: $MATERIAL_ID"
echo ""

# Step 6: Wait for background processing
echo "Step 6: Wait 3 seconds for background processing"
sleep 3
echo "Done waiting"
echo ""

# Step 7: Get material detail
echo "Step 7: Get material detail - check processing_status is ready and metadata has full_text"
MATERIAL_DETAIL=$(curl -s -X GET "$BASE_URL/api/v1/materials/$MATERIAL_ID" -H "Authorization: Bearer $TOKEN")
echo "$MATERIAL_DETAIL"
STATUS=$(echo "$MATERIAL_DETAIL" | python3 -c "import sys, json; print(json.load(sys.stdin)['processing_status'])" 2>/dev/null)
FULL_TEXT=$(echo "$MATERIAL_DETAIL" | python3 -c "import sys, json; print(json.load(sys.stdin)['metadata'].get('full_text', '')[:50])" 2>/dev/null)
echo "Processing status: $STATUS"
echo "Full text (first 50 chars): $FULL_TEXT"
echo ""

# Step 8: List materials for course
echo "Step 8: List materials for course"
curl -s -X GET "$BASE_URL/api/v1/courses/$COURSE_ID/materials" -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

# Step 9: Create another lesson (week 2)
echo "Step 9: Create another lesson (week 2)"
LESSON2_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/courses/$COURSE_ID/lessons" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"title": "Data Structures", "week_number": 2}')
echo "$LESSON2_RESPONSE"
LESSON2_ID=$(echo "$LESSON2_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
echo "Lesson 2 ID: $LESSON2_ID"
echo ""

# Step 10: List lessons - should be ordered by week_number
echo "Step 10: List lessons - should be ordered by week_number"
curl -s -X GET "$BASE_URL/api/v1/courses/$COURSE_ID/lessons" -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

# Step 11: Get lesson detail - should show material_id linked
echo "Step 11: Get lesson detail - should show material_id linked"
LESSON_DETAIL=$(curl -s -X GET "$BASE_URL/api/v1/lessons/$LESSON1_ID" -H "Authorization: Bearer $TOKEN")
echo "$LESSON_DETAIL"
LINKED_MATERIAL=$(echo "$LESSON_DETAIL" | python3 -c "import sys, json; print(json.load(sys.stdin)['material_id'])" 2>/dev/null)
echo "Linked material_id: $LINKED_MATERIAL"
echo ""

# Step 12: Patch lesson title
echo "Step 12: Patch lesson title"
curl -s -X PATCH "$BASE_URL/api/v1/lessons/$LESSON1_ID" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"title": "Updated: Introduction to Algorithms"}'
echo ""
echo ""

# Step 13: Delete the material - should return 204
echo "Step 13: Delete the material - should return 204"
DELETE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/api/v1/materials/$MATERIAL_ID" -H "Authorization: Bearer $TOKEN")
echo "Delete status code: $DELETE_STATUS"
echo ""

# Step 14: Get lesson detail again - material_id should be null now
echo "Step 14: Get lesson detail again - material_id should be null now"
LESSON_DETAIL_AFTER=$(curl -s -X GET "$BASE_URL/api/v1/lessons/$LESSON1_ID" -H "Authorization: Bearer $TOKEN")
echo "$LESSON_DETAIL_AFTER"
MATERIAL_AFTER=$(echo "$LESSON_DETAIL_AFTER" | python3 -c "import sys, json; print(json.load(sys.stdin)['material_id'])" 2>/dev/null)
echo "Material ID after delete: $MATERIAL_AFTER"
echo ""

# Cleanup
rm -f /tmp/test_upload.pdf

echo "=== Test Complete ==="
