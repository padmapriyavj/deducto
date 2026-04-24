#!/usr/bin/env bash
# Phase 4 — Lessons (PRD smoke)
# Prereq: app running, Phase 1 tokens, a course the professor owns, a material in that course.
# Run from backend-spring.
#
#   export PROF_TOKEN=eyJ... STUDENT_TOKEN=eyJ...
#   export COURSE_ID=15
#   export MATERIAL_ID=24
#   ./scripts/phase4-lessons-curl-tests.sh
#
# MATERIAL_ID must still exist in the DB. If you ran Phase 3 with DELETE, re-upload
# or set PHASE3_DELETE=0 when running phase3 so the material is not removed.

set -euo pipefail
BASE="${BASE:-http://localhost:8080}"

if [ -z "${PROF_TOKEN:-}" ] || [ -z "${STUDENT_TOKEN:-}" ]; then
  echo "Set PROF_TOKEN and STUDENT_TOKEN (Phase 1 login access_token values)."
  exit 1
fi
if [[ "$PROF_TOKEN" != eyJ* ]] || [[ "$STUDENT_TOKEN" != eyJ* ]]; then
  echo "PROF_TOKEN and STUDENT_TOKEN must be real JWTs (usually start with eyJ)."
  exit 1
fi
if [ -z "${COURSE_ID:-}" ] || [ -z "${MATERIAL_ID:-}" ]; then
  echo "Set COURSE_ID and MATERIAL_ID (material must belong to that course, e.g. from Phase 3 upload)."
  echo "  export COURSE_ID=15 MATERIAL_ID=24"
  exit 1
fi

echo "== 1) Create lesson =="
# sources is a JSON *string* containing a JSON array (PRD)
SRC="[{\"materialId\":${MATERIAL_ID},\"start\":1,\"end\":10}]"
POST_HTTP="$(mktemp "${TMPDIR:-/tmp}/phase4_post_http.XXXXXX")"
POST_BODY="$(mktemp "${TMPDIR:-/tmp}/phase4_post_body.XXXXXX")"
trap 'rm -f "$POST_HTTP" "$POST_BODY"' EXIT
curl -sS -o "$POST_BODY" -w '%{http_code}' -X POST "${BASE}/api/v1/courses/${COURSE_ID}/lessons" \
  -H "Authorization: Bearer ${PROF_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg t "Week 1: Sorting Algorithms" --argjson wn 1 --argjson mid "$MATERIAL_ID" --arg src "$SRC" \
      '{title:$t, week_number:$wn, material_id:$mid, sources:$src}')" >"$POST_HTTP"
pcode="$(cat "$POST_HTTP")"
CREATE_JSON="$(cat "$POST_BODY")"
echo "$CREATE_JSON"
if [ "$pcode" -lt 200 ] || [ "$pcode" -ge 300 ]; then
  echo
  echo "Create lesson failed (HTTP $pcode). Common: MATERIAL_ID was deleted (e.g. Phase 3 step 4). Re-run Phase 3 with PHASE3_DELETE=0, note the new id, set MATERIAL_ID, then re-run this script."
  exit 1
fi
LESSON_ID="$(echo "$CREATE_JSON" | jq -r .id)"
if [ -z "$LESSON_ID" ] || [ "$LESSON_ID" = "null" ]; then
  echo "No lesson id in response; aborting."
  exit 1
fi
echo "LESSON_ID=$LESSON_ID"
echo

echo "== 2) List lessons (student) =="
curl -sS "${BASE}/api/v1/courses/${COURSE_ID}/lessons" \
  -H "Authorization: Bearer ${STUDENT_TOKEN}" | jq .
echo

echo "== 3) PATCH lesson =="
curl -sS -X PATCH "${BASE}/api/v1/lessons/${LESSON_ID}" \
  -H "Authorization: Bearer ${PROF_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"title":"Week 1: Sorting Algorithms (Updated)"}' | jq .
echo
echo "Done."
