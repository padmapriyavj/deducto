#!/usr/bin/env bash
# Phase 3 — Materials (PRD smoke)
# Prereq: app running, AWS S3 env configured, a course owned by the professor, and a sample .pdf
# Run from backend-spring.
#
#   export PROF_TOKEN=eyJ...   # from Phase 1 login
#   export COURSE_ID=1         # a course the professor owns
#   export SAMPLE_PDF=/path/to/sample.pdf
#   ./scripts/phase3-materials-curl-tests.sh
#
# Default: the uploaded material is NOT deleted (for Phase 4). Use PHASE3_DELETE=1 to delete it after the test.
#
# Or pass course id and pdf path as arguments (same shell can skip export for these two):
#   export PROF_TOKEN=eyJ...
#   ./scripts/phase3-materials-curl-tests.sh 15 /path/to/sample.pdf

set -euo pipefail
BASE="${BASE:-http://localhost:8080}"

if [ -n "${1:-}" ]; then
  COURSE_ID="$1"
fi
if [ -n "${2:-}" ]; then
  SAMPLE_PDF="$2"
fi

if [ -z "${PROF_TOKEN:-}" ]; then
  echo "Set PROF_TOKEN to a professor access_token (Phase 1 login or signup)."
  exit 1
fi
if [[ "$PROF_TOKEN" != eyJ* ]]; then
  echo "PROF_TOKEN must be a real JWT (usually starts with eyJ)."
  exit 1
fi
if [ -z "${COURSE_ID:-}" ]; then
  echo "Missing COURSE_ID. Use the number from phase2 output (e.g. COURSE_ID=15)."
  echo "  export COURSE_ID=15"
  echo "  or:  $0 15 /path/to/your-file.pdf"
  exit 1
fi
if [ -z "${SAMPLE_PDF:-}" ] || [ ! -f "$SAMPLE_PDF" ]; then
  echo "Missing or unreadable SAMPLE_PDF."
  echo "  export SAMPLE_PDF=/path/to/your-file.pdf"
  echo "  or:  $0 ${COURSE_ID} /path/to/your-file.pdf"
  exit 1
fi

echo "== 1) Upload material =="
UP_HTTP="$(mktemp "${TMPDIR:-/tmp}/phase3_up_http.XXXXXX")"
UP_BODY="$(mktemp "${TMPDIR:-/tmp}/phase3_up_body.XXXXXX")"
trap 'rm -f "$UP_HTTP" "$UP_BODY"' EXIT
curl -sS -o "$UP_BODY" -w '%{http_code}' -X POST "${BASE}/api/v1/courses/${COURSE_ID}/materials" \
  -H "Authorization: Bearer ${PROF_TOKEN}" \
  -F "file=@${SAMPLE_PDF}" \
  -F "description=Phase 3 smoke test" >"$UP_HTTP"
code="$(cat "$UP_HTTP")"
UP_JSON="$(cat "$UP_BODY")"
echo "$UP_JSON"
if [ "$code" -lt 200 ] || [ "$code" -ge 300 ]; then
  echo
  echo "Upload failed (HTTP $code). Fix the error above, then re-run."
  echo "  Common: invalid AWS keys — set real AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY and S3_BUCKET in backend-spring .env, restart the app."
  exit 1
fi
MATERIAL_ID="$(echo "$UP_JSON" | jq -r .id)"
if [ -z "$MATERIAL_ID" ] || [ "$MATERIAL_ID" = "null" ]; then
  echo "No material id in response; aborting."
  exit 1
fi
echo "MATERIAL_ID=$MATERIAL_ID"
echo

echo "== 2) List materials for course =="
curl -sS "${BASE}/api/v1/courses/${COURSE_ID}/materials" \
  -H "Authorization: Bearer ${PROF_TOKEN}" | jq .
echo

echo "== 3) Get material by id =="
curl -sS "${BASE}/api/v1/materials/${MATERIAL_ID}" \
  -H "Authorization: Bearer ${PROF_TOKEN}" | jq .
echo

echo "== 4) Delete material (optional cleanup) =="
# Default: skip delete so MATERIAL_ID still exists for Phase 4 (lessons). Set PHASE3_DELETE=1 to remove the row + S3 object.
if [ "${PHASE3_DELETE:-0}" = "1" ] && [ -n "$MATERIAL_ID" ] && [ "$MATERIAL_ID" != "null" ]; then
  code="$(curl -sS -o /dev/null -w '%{http_code}' -X DELETE \
    "${BASE}/api/v1/materials/${MATERIAL_ID}" \
    -H "Authorization: Bearer ${PHASE3_DELETE_TOKEN:-$PROF_TOKEN}")"
  echo "DELETE HTTP $code"
else
  echo "Skipped (default). Export PHASE3_DELETE=1 to delete this material after the smoke test."
fi

echo
echo "Done."