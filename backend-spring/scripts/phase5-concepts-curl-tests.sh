#!/usr/bin/env bash
# Phase 5 — Concepts (PRD smoke)
# Prereq: app running, Phase 1 tokens, a lesson with an attached material (metadata.full_text from Phase 3).
# LLM: keys + model in the environment the app was started with (OpenAI, or Groq: GROQ_API_KEY + OPENAI_BASE_URL + LLM_MODEL).
# Run from backend-spring.
#
#   export PROF_TOKEN=eyJ... STUDENT_TOKEN=eyJ...
#   export LESSON_ID=35
#   ./scripts/phase5-concepts-curl-tests.sh

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
if [ -z "${LESSON_ID:-}" ]; then
  echo "Set LESSON_ID (from Phase 4 create-lesson response, or GET /api/v1/courses/{id}/lessons)."
  echo "  export LESSON_ID=35"
  exit 1
fi

echo "== 1) Generate concepts (professor) =="
POST_HTTP="$(mktemp "${TMPDIR:-/tmp}/phase5_post_http.XXXXXX")"
POST_BODY="$(mktemp "${TMPDIR:-/tmp}/phase5_post_body.XXXXXX")"
trap 'rm -f "$POST_HTTP" "$POST_BODY"' EXIT
curl -sS -o "$POST_BODY" -w '%{http_code}' -X POST "${BASE}/api/v1/lessons/${LESSON_ID}/concepts/generate" \
  -H "Authorization: Bearer ${PROF_TOKEN}" >"$POST_HTTP"
gcode="$(cat "$POST_HTTP")"
GEN_JSON="$(cat "$POST_BODY")"
echo "$GEN_JSON" | jq . 2>/dev/null || echo "$GEN_JSON"
if [ "$gcode" -lt 200 ] || [ "$gcode" -ge 300 ]; then
  echo
  echo "Generate failed (HTTP $gcode). Ensure the lesson has material with full_text, the LLM env is set (OpenAI or Groq), and you own the course."
  exit 1
fi
CONCEPT_ID="$(echo "$GEN_JSON" | jq -r '.concepts[0].id // empty')"
if [ -n "$CONCEPT_ID" ] && [ "$CONCEPT_ID" != "null" ]; then
  echo "CONCEPT_ID=$CONCEPT_ID"
fi
echo

echo "== 2) List concepts (student) =="
curl -sS "${BASE}/api/v1/lessons/${LESSON_ID}/concepts" \
  -H "Authorization: Bearer ${STUDENT_TOKEN}" | jq .
echo
echo "Done."
