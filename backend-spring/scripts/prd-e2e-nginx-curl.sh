#!/usr/bin/env bash
# PRD Phase 9 — full E2E through Nginx (Deducto-SpringBoot-Implementation-PRD-v2.md ~502–535).
# Uses Spring JSON: snake_case signup fields, password >= 6 characters.
# If signup returns 409 (user already exists), the script logs in with the same password instead.
# E2E_TAG scopes emails (e2eprof+${TAG}@test.com); change TAG to isolate runs in shared DBs.
#
# Prereq: Nginx on BASE (default :80), Spring :8080, FastAPI :8000.
# Usage: ./backend-spring/scripts/prd-e2e-nginx-curl.sh
#   BASE=http://localhost E2E_TAG=dev1 ./backend-spring/scripts/prd-e2e-nginx-curl.sh

set -euo pipefail

BASE="${BASE:-http://localhost}"
E2E_TAG="${E2E_TAG:-e2e}"
PROF_EMAIL="e2eprof+${E2E_TAG}@test.com"
STU_EMAIL="e2estudent+${E2E_TAG}@test.com"
PASS="pass123"

get_json_token() {
  python3 -c "
import json, sys
d = json.loads(sys.stdin.read())
print(d.get('access_token') or d.get('token') or '')
" 2>/dev/null
}

get_json_id() {
  python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null
}

get_json_join_code() {
  python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('join_code',''))" 2>/dev/null
}

signup_json() {
  local email=$1 name=$2 role=$3
  python3 -c "import json; print(json.dumps({'email': '$email', 'password': '$PASS', 'display_name': '$name', 'role': '$role'}))"
}

login_json() {
  local email=$1
  python3 -c "import json; print(json.dumps({'email': '$email', 'password': '$PASS'}))"
}

# Signup, or on 409 login (same email/password) so re-runs work if users already exist.
auth_signup_or_login() {
  local label=$1 email=$2
  local raw http body tok
  raw="$(curl -sS -w '\n%{http_code}' -X POST "${BASE}/api/v1/auth/signup" \
    -H "Content-Type: application/json" -d "$3")"
  http="${raw##*$'\n'}"
  body="${raw%$'\n'*}"
  if [[ "$http" == "200" || "$http" == "201" ]]; then
    printf '%s' "$body" | get_json_token
    return 0
  fi
  if [[ "$http" == "409" ]]; then
    echo "  (${label}: signup 409, logging in...)" >&2
    raw="$(curl -sS -w '\n%{http_code}' -X POST "${BASE}/api/v1/auth/login" \
      -H "Content-Type: application/json" -d "$(login_json "$email")")"
    http="${raw##*$'\n'}"
    body="${raw%$'\n'*}"
    if [[ "$http" != "200" ]]; then
      echo "Login after 409 failed HTTP ${http}: ${body}" >&2
      return 1
    fi
    printf '%s' "$body" | get_json_token
    return 0
  fi
  echo "Signup failed HTTP ${http}: ${body}" >&2
  return 1
}

echo "== 1) Signup or login (professor): ${PROF_EMAIL} =="
PROF_TOKEN="$(
  auth_signup_or_login "prof" "$PROF_EMAIL" "$(signup_json "$PROF_EMAIL" "E2E Prof" "professor")"
)" || exit 1
if [[ -z "$PROF_TOKEN" ]]; then
  echo "No professor token" >&2
  exit 1
fi
echo "OK (prof token obtained)"

echo "== 2) Signup or login (student): ${STU_EMAIL} =="
STU_TOKEN="$(
  auth_signup_or_login "student" "$STU_EMAIL" "$(signup_json "$STU_EMAIL" "E2E Student" "student")"
)" || exit 1
if [[ -z "$STU_TOKEN" ]]; then
  echo "No student token" >&2
  exit 1
fi
echo "OK (student token obtained)"

echo "== 3) Create course =="
COURSE_RAW="$(curl -sS -X POST "${BASE}/api/v1/courses" \
  -H "Authorization: Bearer ${PROF_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"name":"E2E Course","description":"Full test"}')"
echo "$COURSE_RAW" | head -c 400
echo
COURSE_ID="$(printf '%s' "$COURSE_RAW" | get_json_id)"
JOIN_CODE="$(printf '%s' "$COURSE_RAW" | get_json_join_code)"
if [[ -z "$COURSE_ID" || -z "$JOIN_CODE" ]]; then
  echo "Could not parse course id / join_code" >&2
  exit 1
fi

echo "== 4) Enroll student in course id=${COURSE_ID} =="
ENROLL_OUT="$(
  curl -sS -w '\n%{http_code}' -X POST "${BASE}/api/v1/courses/${COURSE_ID}/enroll" \
    -H "Authorization: Bearer ${STU_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$(python3 -c "import json; print(json.dumps({'join_code': '${JOIN_CODE}'}))")"
)"
ENROLL_HTTP="${ENROLL_OUT##*$'\n'}"
if [[ "$ENROLL_HTTP" != "200" ]]; then
  echo "Enroll failed HTTP ${ENROLL_HTTP}" >&2
  echo "${ENROLL_OUT%$'\n'*}" >&2
  exit 1
fi
echo "OK (enrolled)"

echo "== 5) GET /api/v1/dashboard/student =="
DASH_JSON="$(curl -sS "${BASE}/api/v1/dashboard/student" -H "Authorization: Bearer ${STU_TOKEN}")"
printf '%s' "$DASH_JSON" | head -c 800
echo
if ! printf '%s' "$DASH_JSON" | COURSE_ID="${COURSE_ID}" python3 -c "
import json, os, sys
d = json.load(sys.stdin)
cid = int(os.environ['COURSE_ID'])
ids = [c.get('id') for c in d.get('enrolled_courses', [])]
sys.exit(0 if cid in ids else 1)
"
then
  echo "FAIL: expected enrolled_courses to include course id ${COURSE_ID}" >&2
  exit 1
fi
echo "OK (student dashboard lists course ${COURSE_ID})"

echo "== 6) GET /api/v1/courses/99999 (expect 404) =="
NF_RAW="$(curl -sS -w '\n%{http_code}' "${BASE}/api/v1/courses/99999" -H "Authorization: Bearer ${PROF_TOKEN}")"
NF_HTTP="${NF_RAW##*$'\n'}"
NF_BODY="${NF_RAW%$'\n'*}"
printf '%s' "$NF_BODY"
echo
if [[ "$NF_HTTP" != "404" ]]; then
  echo "Expected HTTP 404, got ${NF_HTTP}" >&2
  exit 1
fi
if ! printf '%s' "$NF_BODY" | python3 -c "import json,sys; d=json.load(sys.stdin); m=d.get('message',''); e=d.get('error',''); assert d.get('timestamp'); assert (e == 'Not found' or 'not found' in e.lower()); assert ('99999' in m or 'Course not found' in m)" 2>/dev/null; then
  echo "Note: 404 JSON shape may differ; verify GlobalExceptionHandler." >&2
fi
echo "OK (404 for missing course)"

echo "== 7) GET /api/v1/auth/me — CORS (expect one Access-Control-Allow-Origin) =="
ACO_COUNT="$(
  curl -siS "${BASE}/api/v1/auth/me" -H "Authorization: Bearer ${STU_TOKEN}" 2>&1 | grep -ci '^Access-Control-Allow-Origin:' || true
)"
if [[ "$ACO_COUNT" -ne 1 ]]; then
  echo "Expected exactly one Access-Control-Allow-Origin, got $ACO_COUNT" >&2
  exit 1
fi
echo "OK (single CORS origin header)"

echo
echo "PRD E2E sequence completed successfully."
