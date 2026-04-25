#!/bin/sh
set -e
ORIGIN="${CORS_ORIGIN:-http://localhost:5173}"
# | delimiter avoids / in URLs breaking sed
sed "s|__CORS_ORIGIN__|${ORIGIN}|g" /templates/gateway.docker.conf > /tmp/nginx-deducto.conf
exec nginx -c /tmp/nginx-deducto.conf -g "daemon off;"
