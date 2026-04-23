#!/usr/bin/env bash
# Tests professor dashboard endpoints. Requires jq and a running API server.
# Usage: BASE=http://127.0.0.1:8000 bash scripts/test_professor_dashboard.sh (from backend/)

set -euo pipefail
BASE="${BASE:-http://127.0.0.1:8000}"

echo "============================================================"
echo "Professor Dashboard Endpoint Tests"
echo "============================================================"

echo ""
echo "Setup: Login as professor (prof@test.com / test123)"
PROF_LOGIN=$(curl -sS -X POST "$BASE/api/v1/auth/login" -H "Content-Type: application/json" -d '{"email":"prof@test.com","password":"test123"}')
echo "$PROF_LOGIN" | jq .
PROF_TOKEN=$(echo "$PROF_LOGIN" | jq -r '.access_token')

echo ""
echo "Setup: Login as student (stu@test.com / test123)"
STU_LOGIN=$(curl -sS -X POST "$BASE/api/v1/auth/login" -H "Content-Type: application/json" -d '{"email":"stu@test.com","password":"test123"}')
echo "$STU_LOGIN" | jq .
STU_TOKEN=$(echo "$STU_LOGIN" | jq -r '.access_token')

echo ""
echo "============================================================"
echo "Test 1: GET /api/v1/dashboard/professor as professor"
echo "Expected: 200 with user info and courses array"
echo "============================================================"
RESP=$(curl -sS -w "\n%{http_code}" -X GET "$BASE/api/v1/dashboard/professor" \
  -H "Authorization: Bearer $PROF_TOKEN")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
echo "$BODY" | jq .
echo "HTTP_STATUS: $HTTP_CODE"

echo ""
echo "============================================================"
echo "Test 2: GET /api/v1/dashboard/professor as student"
echo "Expected: 403 Forbidden"
echo "============================================================"
RESP=$(curl -sS -w "\n%{http_code}" -X GET "$BASE/api/v1/dashboard/professor" \
  -H "Authorization: Bearer $STU_TOKEN")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
echo "$BODY"
echo "HTTP_STATUS: $HTTP_CODE"

echo ""
echo "============================================================"
echo "Test 3: GET /api/v1/dashboard/professor without auth"
echo "Expected: 401 Unauthorized"
echo "============================================================"
RESP=$(curl -sS -w "\n%{http_code}" -X GET "$BASE/api/v1/dashboard/professor")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
echo "$BODY"
echo "HTTP_STATUS: $HTTP_CODE"

echo ""
echo "============================================================"
echo "Get a course ID for analytics test"
echo "============================================================"
COURSES=$(curl -sS -X GET "$BASE/api/v1/courses/" -H "Authorization: Bearer $PROF_TOKEN")
echo "$COURSES" | jq .
COURSE_ID=$(echo "$COURSES" | jq -r '.[0].id // empty')

if [ -n "$COURSE_ID" ]; then
  echo ""
  echo "============================================================"
  echo "Test 4: GET /api/v1/dashboard/professor/courses/$COURSE_ID/analytics as professor"
  echo "Expected: 200 with course_id, course_name, roster, concept_heatmap"
  echo "============================================================"
  RESP=$(curl -sS -w "\n%{http_code}" -X GET "$BASE/api/v1/dashboard/professor/courses/$COURSE_ID/analytics" \
    -H "Authorization: Bearer $PROF_TOKEN")
  HTTP_CODE=$(echo "$RESP" | tail -n1)
  BODY=$(echo "$RESP" | sed '$d')
  echo "$BODY" | jq .
  echo "HTTP_STATUS: $HTTP_CODE"

  echo ""
  echo "============================================================"
  echo "Test 5: GET /api/v1/dashboard/professor/courses/$COURSE_ID/analytics as student"
  echo "Expected: 403 Forbidden"
  echo "============================================================"
  RESP=$(curl -sS -w "\n%{http_code}" -X GET "$BASE/api/v1/dashboard/professor/courses/$COURSE_ID/analytics" \
    -H "Authorization: Bearer $STU_TOKEN")
  HTTP_CODE=$(echo "$RESP" | tail -n1)
  BODY=$(echo "$RESP" | sed '$d')
  echo "$BODY"
  echo "HTTP_STATUS: $HTTP_CODE"
else
  echo ""
  echo "No courses found for professor. Creating a test course..."
  CREATE_OUT=$(curl -sS -X POST "$BASE/api/v1/courses/" -H "Authorization: Bearer $PROF_TOKEN" -H "Content-Type: application/json" -d '{"name":"Test Course for Dashboard","description":"Created for dashboard testing"}')
  echo "$CREATE_OUT" | jq .
  COURSE_ID=$(echo "$CREATE_OUT" | jq -r '.id')
  
  echo ""
  echo "============================================================"
  echo "Test 4: GET /api/v1/dashboard/professor/courses/$COURSE_ID/analytics as professor"
  echo "Expected: 200 with empty roster and heatmap (no enrollments)"
  echo "============================================================"
  RESP=$(curl -sS -w "\n%{http_code}" -X GET "$BASE/api/v1/dashboard/professor/courses/$COURSE_ID/analytics" \
    -H "Authorization: Bearer $PROF_TOKEN")
  HTTP_CODE=$(echo "$RESP" | tail -n1)
  BODY=$(echo "$RESP" | sed '$d')
  echo "$BODY" | jq .
  echo "HTTP_STATUS: $HTTP_CODE"

  echo ""
  echo "============================================================"
  echo "Test 5: GET /api/v1/dashboard/professor/courses/$COURSE_ID/analytics as student"
  echo "Expected: 403 Forbidden"
  echo "============================================================"
  RESP=$(curl -sS -w "\n%{http_code}" -X GET "$BASE/api/v1/dashboard/professor/courses/$COURSE_ID/analytics" \
    -H "Authorization: Bearer $STU_TOKEN")
  HTTP_CODE=$(echo "$RESP" | tail -n1)
  BODY=$(echo "$RESP" | sed '$d')
  echo "$BODY"
  echo "HTTP_STATUS: $HTTP_CODE"
fi

echo ""
echo "============================================================"
echo "Test 6: GET /api/v1/dashboard/professor/courses/99999/analytics (non-existent course)"
echo "Expected: 404 Not Found"
echo "============================================================"
RESP=$(curl -sS -w "\n%{http_code}" -X GET "$BASE/api/v1/dashboard/professor/courses/99999/analytics" \
  -H "Authorization: Bearer $PROF_TOKEN")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
echo "$BODY"
echo "HTTP_STATUS: $HTTP_CODE"

echo ""
echo "============================================================"
echo "All tests completed!"
echo "============================================================"
