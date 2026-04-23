#!/usr/bin/env bash
# Phase 2 — Courses & enrollment (PRD smoke)
# Prereq: run from backend-spring.
#
# You MUST set real JWT strings (the long eyJ... values from /auth/signup or /auth/login).
# Do NOT copy the angle-bracket text from docs — that is a placeholder, not a token.
#
# Example (after app is running, with jq):
#   P=$(curl -sS -X POST "$BASE/api/v1/auth/login" -H "Content-Type: application/json" \
#     -d '{"email":"you@example.com","password":"..."}' | jq -r .access_token)
#   export PROF_TOKEN="$P"
# Same for a student user into STUDENT_TOKEN.

set -euo pipefail
BASE="${BASE:-http://localhost:8080}"

if [ -z "${PROF_TOKEN:-}" ] || [ -z "${STUDENT_TOKEN:-}" ]; then
  echo "Set PROF_TOKEN and STUDENT_TOKEN to the real access_token strings from Phase 1 (login or signup response)."
  exit 1
fi

# Reject common mistake: user pasted the literal text "<professor access_token>" from instructions
if [[ "$PROF_TOKEN" != eyJ* ]] || [[ "$STUDENT_TOKEN" != eyJ* ]]; then
  echo "PROF_TOKEN and STUDENT_TOKEN must be real JWTs (they usually start with eyJ)."
  echo "Get them with:  curl -sS -X POST ${BASE}/api/v1/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"...\",\"password\":\"...\"}' | jq -r .access_token"
  echo "Do not use angle-bracket placeholders from the documentation."
  exit 1
fi

echo "== 1) Create course =="
COURSE_JSON="$(curl -sS -X POST "${BASE}/api/v1/courses" \
  -H "Authorization: Bearer ${PROF_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{"name":"CS 141: Algorithms","description":"Intro to algorithms","schedule":{"days":["Monday","Wednesday"],"time":"10:00","tz":"America/Los_Angeles"}}')"
echo "$COURSE_JSON"
COURSE_ID="$(echo "$COURSE_JSON" | jq -r .id)"
JOIN_CODE="$(echo "$COURSE_JSON" | jq -r .join_code)"
echo "COURSE_ID=$COURSE_ID JOIN_CODE=$JOIN_CODE"
echo

echo "== 2) List (professor) =="
curl -sS "${BASE}/api/v1/courses" -H "Authorization: Bearer ${PROF_TOKEN}" | jq .
echo

echo "== 3) Enroll (student) =="
curl -sS -X POST "${BASE}/api/v1/courses/${COURSE_ID}/enroll" \
  -H "Authorization: Bearer ${STUDENT_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\"join_code\":\"${JOIN_CODE}\"}" | jq .
echo

echo "== 4) List (student) =="
curl -sS "${BASE}/api/v1/courses" -H "Authorization: Bearer ${STUDENT_TOKEN}" | jq .
echo

echo "== 5) Roster (professor) =="
curl -sS "${BASE}/api/v1/courses/${COURSE_ID}/students" -H "Authorization: Bearer ${PROF_TOKEN}" | jq .
echo
echo "Done."
