#!/usr/bin/env bash
# PRD Phase 8 — smoke through Nginx (not :8080 / :8000).
# Prereq: Nginx (repo root nginx/nginx.conf), Spring :8080, FastAPI :8000.
#
#   BASE              default http://localhost  (e.g. http://localhost:8888 if Nginx listens there)
#   TOKEN             optional; Spring JWT for /api/v1/auth/me
#   LOGIN_EMAIL       with LOGIN_PASSWORD: script logs in and sets TOKEN (overrides any prior TOKEN)
#   LOGIN_PASSWORD
#   QUIZ_SMOKE_ID     default 1 — GET /api/v1/quizzes/{id} hits FastAPI (there is no GET /quizzes list)
#
# Examples (put vars and script on one line, or use export; a lone line-continuation is easy to get wrong):
#   LOGIN_EMAIL=smoke-test@example.com LOGIN_PASSWORD=password123 ./backend-spring/scripts/phase8-nginx-curl-tests.sh
#   # or:
#   export LOGIN_EMAIL=... LOGIN_PASSWORD=password123; ./backend-spring/scripts/phase8-nginx-curl-tests.sh
#
#   export TOKEN='eyJ...'   # no LOGIN_* — uses TOKEN only
#   ./backend-spring/scripts/phase8-nginx-curl-tests.sh

set -euo pipefail

BASE="${BASE:-http://localhost}"
QUIZ_SMOKE_ID="${QUIZ_SMOKE_ID:-1}"

read_token_from_json() {
  python3 -c "
import json, sys
try:
    raw = sys.stdin.read()
    if not raw.strip():
        print('', end='')
        sys.exit(0)
    d = json.loads(raw)
    print(d.get('access_token') or d.get('token') or '', end='')
except Exception:
    print('', end='')
"
}

# When creds are set, always fetch a fresh token (replaces a stale export TOKEN)
if [[ -n "${LOGIN_EMAIL:-}" && -n "${LOGIN_PASSWORD:-}" ]]; then
  _login_json="$(
    LOGIN_EMAIL="$LOGIN_EMAIL" LOGIN_PASSWORD="$LOGIN_PASSWORD" python3 -c \
      'import json, os; print(json.dumps({"email": os.environ["LOGIN_EMAIL"], "password": os.environ["LOGIN_PASSWORD"]}))'
  )"
  TOKEN="$(
    curl -sS -X POST "${BASE}/api/v1/auth/login" \
      -H "Content-Type: application/json" \
      -d "$_login_json" | read_token_from_json
  )" || true
  if [[ -z "${TOKEN:-}" ]]; then
    echo "Note: login did not yield a token (check creds and that Spring is up)." >&2
    echo >&2
  fi
elif [[ -n "${TOKEN:-}" ]]; then
  echo "Note: reusing \${TOKEN} from your shell. If /me is 401: unset TOKEN, or re-run with LOGIN_EMAIL and LOGIN_PASSWORD on the same line as this script." >&2
  echo >&2
fi

echo "== GET /health (Spring) =="
curl -sS "${BASE}/health" | head -c 500
echo
echo

echo "== POST /api/v1/auth/login =="
if [[ -n "${LOGIN_EMAIL:-}" && -n "${LOGIN_PASSWORD:-}" ]]; then
  _login_json="$(
    LOGIN_EMAIL="$LOGIN_EMAIL" LOGIN_PASSWORD="$LOGIN_PASSWORD" python3 -c \
      'import json, os; print(json.dumps({"email": os.environ["LOGIN_EMAIL"], "password": os.environ["LOGIN_PASSWORD"]}))'
  )"
  curl -sS -X POST "${BASE}/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d "$_login_json" | head -c 800
else
  echo "(skipped: set LOGIN_EMAIL and LOGIN_PASSWORD to exercise login; or set TOKEN for /me)"
fi
echo
echo

echo "== GET /api/v1/quizzes/${QUIZ_SMOKE_ID} (FastAPI) =="
curl -sS "${BASE}/api/v1/quizzes/${QUIZ_SMOKE_ID}" | head -c 500
echo
echo

if [[ -n "${TOKEN:-}" ]]; then
  echo "== GET /api/v1/auth/me (one Access-Control-Allow-Origin) =="
  curl -siS "${BASE}/api/v1/auth/me" -H "Authorization: Bearer ${TOKEN}" 2>&1 | head -n 40
  echo
else
  echo "== GET /api/v1/auth/me (skipped: set TOKEN or LOGIN_EMAIL+LOGIN_PASSWORD) =="
  echo
fi

echo "== OPTIONS preflight =="
curl -siS -X OPTIONS "${BASE}/api/v1/auth/login" -H "Origin: http://localhost:5173" 2>&1 | head -n 25
echo
echo
echo "Done. Nginx: repo nginx/nginx.conf. Port 80 may need sudo; use another listen + BASE if needed."
