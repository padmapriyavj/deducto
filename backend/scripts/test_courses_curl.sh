#!/usr/bin/env bash
# Tests course CRUD and enrollment endpoints. Requires jq and a running API server.
# Usage: BASE=http://127.0.0.1:8000 bash scripts/test_courses_curl.sh (from backend/)

set -euo pipefail
BASE="${BASE:-http://127.0.0.1:8000}"

echo "Setup: login as professor (prof@test.com / test123), store token"
PROF_LOGIN=$(curl -sS -X POST "$BASE/api/v1/auth/login" -H "Content-Type: application/json" -d '{"email":"prof@test.com","password":"test123"}')
echo "$PROF_LOGIN"
PROF_TOKEN=$(echo "$PROF_LOGIN" | jq -r '.access_token')

echo "Setup: login as student (stu@test.com / test123), store token"
STU_LOGIN=$(curl -sS -X POST "$BASE/api/v1/auth/login" -H "Content-Type: application/json" -d '{"email":"stu@test.com","password":"test123"}')
echo "$STU_LOGIN"
STU_TOKEN=$(echo "$STU_LOGIN" | jq -r '.access_token')

echo "1) Create course as professor"
CREATE_OUT=$(curl -sS -X POST "$BASE/api/v1/courses/" -H "Authorization: Bearer $PROF_TOKEN" -H "Content-Type: application/json" -d '{"name":"Test Course","description":"From curl script"}')
echo "$CREATE_OUT"
COURSE_ID=$(echo "$CREATE_OUT" | jq -r '.id')
JOIN_CODE=$(echo "$CREATE_OUT" | jq -r '.join_code')

echo "2) Fail create course as student (expect 403)"
curl -sS -w "\nHTTP_STATUS:%{http_code}\n" -X POST "$BASE/api/v1/courses/" -H "Authorization: Bearer $STU_TOKEN" -H "Content-Type: application/json" -d '{"name":"Should Fail"}' || true

echo "3) List courses as professor"
curl -sS -X GET "$BASE/api/v1/courses/" -H "Authorization: Bearer $PROF_TOKEN"

echo "4) Get course detail"
curl -sS -X GET "$BASE/api/v1/courses/$COURSE_ID" -H "Authorization: Bearer $PROF_TOKEN"

echo "5) Enroll student with correct join code"
curl -sS -X POST "$BASE/api/v1/courses/$COURSE_ID/enroll" -H "Authorization: Bearer $STU_TOKEN" -H "Content-Type: application/json" -d "{\"join_code\":\"$JOIN_CODE\"}"

echo "6) Fail duplicate enrollment (expect 409)"
curl -sS -w "\nHTTP_STATUS:%{http_code}\n" -X POST "$BASE/api/v1/courses/$COURSE_ID/enroll" -H "Authorization: Bearer $STU_TOKEN" -H "Content-Type: application/json" -d "{\"join_code\":\"$JOIN_CODE\"}" || true

echo "7) Fail enroll with wrong join code (expect 400)"
curl -sS -w "\nHTTP_STATUS:%{http_code}\n" -X POST "$BASE/api/v1/courses/$COURSE_ID/enroll" -H "Authorization: Bearer $STU_TOKEN" -H "Content-Type: application/json" -d '{"join_code":"XXXXXX"}' || true

echo "8) List courses as student (should show enrolled course)"
curl -sS -X GET "$BASE/api/v1/courses/" -H "Authorization: Bearer $STU_TOKEN"

echo "9) Get students as professor"
curl -sS -X GET "$BASE/api/v1/courses/$COURSE_ID/students" -H "Authorization: Bearer $PROF_TOKEN"

echo "10) Fail get students as student (expect 403)"
curl -sS -w "\nHTTP_STATUS:%{http_code}\n" -X GET "$BASE/api/v1/courses/$COURSE_ID/students" -H "Authorization: Bearer $STU_TOKEN" || true

echo "11) Patch course as professor"
curl -sS -X PATCH "$BASE/api/v1/courses/$COURSE_ID" -H "Authorization: Bearer $PROF_TOKEN" -H "Content-Type: application/json" -d '{"name":"Updated Course Name","description":"patched"}'

echo "12) Fail patch course as student (expect 403)"
curl -sS -w "\nHTTP_STATUS:%{http_code}\n" -X PATCH "$BASE/api/v1/courses/$COURSE_ID" -H "Authorization: Bearer $STU_TOKEN" -H "Content-Type: application/json" -d '{"name":"Hacked"}' || true
