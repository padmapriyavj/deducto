#!/usr/bin/env bash
# Phase 1 — Auth API manual checks (Deducto Spring Boot)
# Prereq: app running on $BASE, optional: `jq` to parse access_token

set -euo pipefail
BASE="${BASE:-http://localhost:8080}"
echo "Using BASE=${BASE}  (override: BASE=https://... ./scripts/phase1-auth-curl-tests.sh)"
echo "CWD must be the backend-spring directory (where pom.xml is)."
echo "  If prompt already shows backend-spring, run:  ./scripts/phase1-auth-curl-tests.sh"
echo "  From repo root (deducto/), run:  (cd backend-spring && ./scripts/phase1-auth-curl-tests.sh)"
echo "  Do not paste lines starting with # from documentation into the shell (optional usage hints)."
echo

echo "== 0) Health =="
curl -sS "${BASE}/health"
echo; echo

echo "== 1) Signup professor =="
PROF_EMAIL="${PROF_EMAIL:-phase1.prof+$(date +%s)@test.com}"
curl -sS -X POST "${BASE}/api/v1/auth/signup" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${PROF_EMAIL}\",\"password\":\"password123\",\"display_name\":\"Prof Test\",\"role\":\"professor\"}"
echo; echo

echo "== 2) Signup student (different email) =="
STU_EMAIL="${STU_EMAIL:-phase1.stu+$(date +%s)@test.com}"
curl -sS -X POST "${BASE}/api/v1/auth/signup" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${STU_EMAIL}\",\"password\":\"password123\",\"display_name\":\"Stu Test\",\"role\":\"student\"}"
echo; echo

if ! command -v jq >/dev/null 2>&1; then
  echo "Install jq to auto-run login/me/logout, or set PROF_TOKEN and STU_TOKEN yourself."
  echo "PROF_EMAIL=${PROF_EMAIL}"
  echo "STU_EMAIL=${STU_EMAIL}"
  exit 0
fi

echo "== 3) Login (professor) =="
PROF_TOKEN="$(curl -sS -X POST "${BASE}/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${PROF_EMAIL}\",\"password\":\"password123\"}" | jq -r '.access_token')"
echo "PROF_TOKEN (first 32 chars): ${PROF_TOKEN:0:32}..."
echo

echo "== 4) GET /me (professor) =="
curl -sS "${BASE}/api/v1/auth/me" -H "Authorization: Bearer ${PROF_TOKEN}"
echo; echo

echo "== 5) POST /logout (professor) =="
curl -sS -X POST "${BASE}/api/v1/auth/logout" -H "Authorization: Bearer ${PROF_TOKEN}"
echo; echo

echo "== 6) Signup duplicate email (expect 409) =="
code="$(curl -sS -o /tmp/phase1_dup.json -w '%{http_code}' -X POST "${BASE}/api/v1/auth/signup" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${PROF_EMAIL}\",\"password\":\"password123\",\"display_name\":\"Dupe\",\"role\":\"professor\"}")"
echo "HTTP ${code}"; cat /tmp/phase1_dup.json; echo; echo

echo "== 7) Login bad password (expect 401) =="
code="$(curl -sS -o /tmp/phase1_bad.json -w '%{http_code}' -X POST "${BASE}/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${PROF_EMAIL}\",\"password\":\"wrong\"}")"
echo "HTTP ${code}"; cat /tmp/phase1_bad.json; echo; echo

echo "== 8) GET /me without token (expect 401) =="
code="$(curl -sS -o /tmp/phase1_noauth.json -w '%{http_code}' "${BASE}/api/v1/auth/me")"
echo "HTTP ${code}"; cat /tmp/phase1_noauth.json; echo; echo

STU_TOKEN="$(curl -sS -X POST "${BASE}/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${STU_EMAIL}\",\"password\":\"password123\"}" | jq -r '.access_token')"
echo "== 9) GET /me (student) =="
curl -sS "${BASE}/api/v1/auth/me" -H "Authorization: Bearer ${STU_TOKEN}"
echo; echo

echo "Done. Expect: 200/201-style bodies for 1,2,3,4,5,9; HTTP 409 for 6; 401 for 7,8"
echo "Use access_token in Authorization (same value as token in response)."
