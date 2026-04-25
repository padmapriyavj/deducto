# Hybrid stack operations (Nginx, CORS, TLS)

## Local development

- **Nginx on the host** (often port 80 with `sudo`): use [nginx/nginx.conf](../nginx/nginx.conf) and run Spring on 8080, FastAPI on 8000. The `location` for courses must allow **both** `POST /api/v1/courses` and paths under `/api/v1/courses/…` (a `location` of `/api/v1/courses/` does *not* match `POST /api/v1/courses` with no extra slash, so the request can fall through to the FastAPI catch-all and return 301).
- **Nginx in Docker** (same routing): [docker-compose.yml](../docker-compose.yml) `gateway` service; backends stay on the host at `host.docker.internal`.

## Browser origin and CORS

- The gateway must emit `Access-Control-Allow-Origin` for the **real** frontend origin. For Docker Nginx, set `CORS_ORIGIN` (see `docker-compose.yml`).
- For a static [nginx/nginx.conf](../nginx/nginx.conf) on the host, change the `add_header Access-Control-Allow-Origin` value or adopt the same `sed` pattern as [docker/gateway-entrypoint.sh](../docker/gateway-entrypoint.sh).

## TLS / production

- Terminate TLS at Nginx (or a load balancer in front of it). Set `CORS_ORIGIN` to the HTTPS public origin and update `VITE_API_BASE_URL` / `VITE_WS_BASE_URL` in the frontend to the same public API origin (or path-only if same host).

## Frontend

- Point `VITE_API_BASE_URL` at the Nginx base URL (e.g. `http://localhost` in dev, not :8080). Socket.IO can use the same host via [frontend/.env.example](../frontend/.env.example).

## PRD E2E

- [backend-spring/scripts/prd-e2e-nginx-curl.sh](../backend-spring/scripts/prd-e2e-nginx-curl.sh) runs the Phase 9 sequence through Nginx. If signup returns 409, it logs in with the same `pass123` password. Optional `E2E_TAG` scopes emails (`e2eprof+${TAG}@test.com`).
