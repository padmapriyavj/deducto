#!/usr/bin/env bash
# Phase 6–7 — end-to-end API smoke (dashboard, shop, me, leaderboard)
#
# Prereq: Spring Boot on BASE (default http://localhost:8080), DB reachable for signup/DDL.
# Requires: curl, bash 4+, jq
#
# Run (default BASE=http://localhost:8080; Spring must be running with latest JAR for this project):
#   cd backend-spring
#   ./scripts/phase6-7-e2e-curl-tests.sh
#   BASE=https://dev.example.com:8080 ./scripts/phase6-7-e2e-curl-tests.sh
#
# What it does (unique emails per run, no manual tokens):
#  - GET /health
#  - POST signup: professor + student
#  - POST create course (professor) → COURSE_ID + JOIN_CODE
#  - POST enroll (student)
#  - GET /dashboard/student, /dashboard/professor, /leaderboard/{id}
#  - GET /shop/items, /me/inventory, /me/space
#  - POST /shop/purchase: expects 400 "Insufficient coins" for brand-new users (0 coins)
#  - (optional) wrong-role checks: prof hits student dashboard → 403
#
# If purchase must succeed, grant coins in Postgres then set RUN_PURCHASE=1 in your shell:
#   UPDATE users SET coins = 500 WHERE email = '<student email printed below>';
#   export RUN_PURCHASE=1
#   ./scripts/phase6-7-e2e-curl-tests.sh  # re-run; script will re-create users or use a manual flow

set -euo pipefail
BASE="${BASE:-http://localhost:8080}"
SUF="$(date +%s)-${RANDOM}"

die() { echo "ERROR: $*" >&2; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || die "missing required command: $1"; }
need curl
need jq

TMPDIR="${TMPDIR:-/tmp}"
HTTP="$(mktemp "$TMPDIR/phase67_e2e_http.XXXXXX")"
BODY="$(mktemp "$TMPDIR/phase67_e2e_body.XXXXXX")"
cleanup() { rm -f "$HTTP" "$BODY"; }
trap cleanup EXIT

http_json() {
  # args: method url [curl args...]
  local m="$1" url="$2"
  shift 2
  curl -sS -o "$BODY" -w '%{http_code}' -X "$m" "$url" "$@" >"$HTTP" || return 1
  cat "$HTTP"
}

expect_http() {
  local got="$1" want="$2" what="$3"
  if [ "$got" != "$want" ]; then
    echo "---- response body ----"
    cat "$BODY" 2>/dev/null || true
    echo "------------------------"
    die "HTTP $what: expected $want, got $got"
  fi
}

echo "== 0) Health =="
code="$(http_json GET "${BASE}/health")"
expect_http "$code" 200 "GET /health"
cat "$BODY" | jq . 2>/dev/null || cat "$BODY"
echo

PR_EMAIL="prof67-${SUF}@e2e.example.com"
ST_EMAIL="stu67-${SUF}@e2e.example.com"
PASS='Phase67Test!1'

echo "== 1) Signup professor: ${PR_EMAIL} =="
code="$(http_json POST "${BASE}/api/v1/auth/signup" -H "Content-Type: application/json" \
  -d "{\"email\":\"${PR_EMAIL}\",\"password\":\"${PASS}\",\"display_name\":\"E2E Prof\",\"role\":\"professor\"}")"
expect_http "$code" 200 "POST signup (professor)"
PR_TOKEN="$(jq -r '.access_token // .token // empty' <"$BODY")"
[ -n "$PR_TOKEN" ] && [ "$PR_TOKEN" != "null" ] || die "no access_token (professor)"
echo "ok (prof token length ${#PR_TOKEN})"
echo

echo "== 2) Signup student: ${ST_EMAIL} =="
code="$(http_json POST "${BASE}/api/v1/auth/signup" -H "Content-Type: application/json" \
  -d "{\"email\":\"${ST_EMAIL}\",\"password\":\"${PASS}\",\"display_name\":\"E2E Student\",\"role\":\"student\"}")"
expect_http "$code" 200 "POST signup (student)"
ST_TOKEN="$(jq -r '.access_token // .token // empty' <"$BODY")"
[ -n "$ST_TOKEN" ] && [ "$ST_TOKEN" != "null" ] || die "no access_token (student)"
ST_USER_ID="$(jq -r '.user.id // empty' <"$BODY")"
echo "ok (student id=${ST_USER_ID})"
echo

echo "== 3) Create course (professor) =="
code="$(http_json POST "${BASE}/api/v1/courses" -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${PR_TOKEN}" \
  -d '{"name":"Phase 6-7 E2E Course","description":"automation","schedule":{}}')"
expect_http "$code" 201 "POST /courses"
COURSE_ID="$(jq -r '.id' <"$BODY")"
JOIN_CODE="$(jq -r '.join_code' <"$BODY")"
[ -n "$COURSE_ID" ] && [ "$COURSE_ID" != "null" ] || die "no course id"
[ -n "$JOIN_CODE" ] && [ "$JOIN_CODE" != "null" ] || die "no join_code"
echo "COURSE_ID=$COURSE_ID JOIN_CODE=$JOIN_CODE"
echo

echo "== 4) Enroll student =="
code="$(http_json POST "${BASE}/api/v1/courses/${COURSE_ID}/enroll" -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ST_TOKEN}" \
  -d "{\"join_code\":\"${JOIN_CODE}\"}")"
expect_http "$code" 200 "POST enroll"
echo "$(cat "$BODY" | jq -c . 2>/dev/null || cat "$BODY")"
echo

echo "== 5) GET /dashboard/student =="
code="$(http_json GET "${BASE}/api/v1/dashboard/student" -H "Authorization: Bearer ${ST_TOKEN}")"
expect_http "$code" 200 "GET /dashboard/student"
ENR_COUNT="$(jq '.enrolled_courses | length' <"$BODY")"
if [ "${ENR_COUNT:-0}" -lt 1 ]; then
  die "student dashboard: expected enrolled_courses.length >= 1, got $ENR_COUNT"
fi
cat "$BODY" | jq . 
echo

echo "== 6) GET /dashboard/professor =="
code="$(http_json GET "${BASE}/api/v1/dashboard/professor" -H "Authorization: Bearer ${PR_TOKEN}")"
expect_http "$code" 200 "GET /dashboard/professor"
COURSE_ROWS="$(jq '.courses | length' <"$BODY")"
if [ "${COURSE_ROWS:-0}" -lt 1 ]; then
  die "professor dashboard: expected courses.length >= 1, got $COURSE_ROWS"
fi
cat "$BODY" | jq . 
echo

echo "== 7) GET /leaderboard/{courseId} (student) =="
code="$(http_json GET "${BASE}/api/v1/leaderboard/${COURSE_ID}" -H "Authorization: Bearer ${ST_TOKEN}")"
expect_http "$code" 200 "GET /leaderboard"
cat "$BODY" | jq . 
echo

echo "== 8) GET /shop/items (no auth) =="
code="$(http_json GET "${BASE}/api/v1/shop/items")"
expect_http "$code" 200 "GET /shop/items"
SHOP_N="$(jq 'length' <"$BODY")"
echo "shop item count: $SHOP_N"
echo

echo "== 9) GET /me/inventory, /me/space =="
code="$(http_json GET "${BASE}/api/v1/me/inventory" -H "Authorization: Bearer ${ST_TOKEN}")"
expect_http "$code" 200 "GET /me/inventory"
code="$(http_json GET "${BASE}/api/v1/me/space" -H "Authorization: Bearer ${ST_TOKEN}")"
expect_http "$code" 200 "GET /me/space"
echo "inventory/space: ok"
echo

echo "== 10) Role guard: professor → student dashboard (expect 403) =="
code="$(http_json GET "${BASE}/api/v1/dashboard/student" -H "Authorization: Bearer ${PR_TOKEN}")"
expect_http "$code" 403 "GET /dashboard/student as professor"
echo

echo "== 11) POST /shop/purchase =="
code="$(http_json GET "${BASE}/api/v1/shop/items")"
expect_http "$code" 200 "GET /shop/items (for item id)"
if [ "$(jq 'length' <"$BODY")" -lt 1 ]; then
  echo "SKIP: no shop items in DB; seed shop_items then re-run to test purchase."
else
  ITEM_ID="$(jq -r 'min_by(.price_coins) | .id' <"$BODY")"
  [ -n "$ITEM_ID" ] && [ "$ITEM_ID" != "null" ] || die "could not pick shop item"
  code="$(http_json POST "${BASE}/api/v1/shop/purchase" -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${ST_TOKEN}" \
    -d "{\"item_id\":${ITEM_ID}}")"
  if [ "$code" = "400" ]; then
    MSG="$(jq -r '.message // empty' <"$BODY" 2>/dev/null || true)"
    echo "HTTP 400 (expected for 0 coins): $MSG"
    if ! echo "$MSG" | grep -qi insufficient; then
      echo "---- body ----"; cat "$BODY"; echo
      die "expected message to mention insufficient coins, got: $MSG"
    fi
  elif [ "$code" = "200" ] || [ "$code" = "201" ]; then
    if [ "${RUN_PURCHASE:-0}" != "1" ]; then
      echo "---- body ----"; cat "$BODY"; echo
      die "POST /shop/purchase: got $code but RUN_PURCHASE is not 1 (unexpected success for new user?)"
    fi
    echo "Purchase succeeded (RUN_PURCHASE=1)."
    cat "$BODY" | jq . 
  else
    echo "---- body ----"; cat "$BODY"; echo
    die "POST /shop/purchase: expected 400 (insufficient) or 200/201 with RUN_PURCHASE=1, got $code"
  fi
fi
echo

echo "== 12) PUT /me/space (empty list, no-op) =="
code="$(http_json PUT "${BASE}/api/v1/me/space" -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ST_TOKEN}" \
  -d '[]')"
expect_http "$code" 200 "PUT /me/space (empty array)"
cat "$BODY" | jq . 
echo

echo "== Done. Phase 6–7 e2e checks passed. =="
echo "  Professor:  ${PR_EMAIL}  (password: ${PASS})"
echo "  Student:     ${ST_EMAIL}  (password: ${PASS})"
echo "  Course id:   ${COURSE_ID}   join: ${JOIN_CODE}"
echo
echo "To test a successful purchase next time, set student coins in DB, then:"
echo "  export BASE=${BASE} RUN_PURCHASE=1"
echo "  (Re-run; note RUN_PURCHASE=1 expects purchase to return 2xx if coins were granted for ${ST_EMAIL})"
echo
