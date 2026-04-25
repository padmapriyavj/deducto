# 🦊 Deducto

<p align="center">
  <img src="./frontend/public/mascot/mascot.png" height="200" alt="Finn the Fox" />
</p>

<p align="center">An AI-powered learning platform that turns real coursework into a daily habit loop.</p>

Deducto helps professors publish high-quality lesson-aligned quizzes fast, and helps students stay engaged through timed Tempos, duels, confidence wagers, streaks, coins, a customizable Space, and Finn the Fox voice companion.

---

## Why This Project Exists

Most LMS tools are functional but not habit-forming. Deducto combines:

- Real class content and lesson workflows
- AI concept extraction and quiz generation
- Social + game mechanics (live events, duels, wagers, streaks, rewards)
- A voice-first mascot experience (Finn) to make studying feel alive

The result is an education product designed for retention, not just administration.

---

## Architecture (hybrid)

The app is split between **two backends** behind a single **Nginx** entry (recommended: port 80, via Docker; see `docker-compose.yml`):

| Layer | Role |
| --- | --- |
| **Nginx** | One browser origin for `/api/v1` and `/socket.io`; CORS to the Vite app |
| **Spring Boot** (host `:8080`) | Auth, courses, lessons, materials, concepts, shop, dashboard, leaderboard, `me` — JPA/PostgreSQL (e.g. Supabase Postgres) |
| **FastAPI** (host `:8000`) | Quizzes, attempts, tempos, practice, scoring, and **Socket.IO** realtime; Supabase/PostgREST where applicable |

- **JWT:** Use the same `JWT_SECRET_KEY` in both `backend-spring` and `backend` when running hybrid so tokens work across both services.
- **Local dev** can point the frontend at Nginx (`VITE_API_BASE_URL=http://localhost/api/v1`, `VITE_WS_BASE_URL=http://localhost`) or at FastAPI only for narrower debugging — see `frontend/.env.example`.

---

## What We Built

### Student Experience

- Join courses with a code
- Track progress from a student dashboard
- Practice on-demand (solo or duel)
- Join scheduled Tempo quiz events
- Place Betcha multipliers (1x / 3x / 5x) before quiz attempts
- Earn coins and streak progression
- Spend coins in the shop
- Personalize and share a public Space
- Hear Finn voice interactions (greetings, prompts, reactions)

### Professor Experience

- Create and manage courses
- Upload materials (PDF/PPT; storage-backed pipeline)
- Create lessons and trigger concept extraction
- Generate quizzes from lesson context
- Review/regenerate questions
- Schedule Tempos
- View class and course-level dashboard analytics

### Platform Capabilities

- JWT auth with role-based route protection
- Spring Boot APIs for course lifecycle, materials, and gamification data
- FastAPI for engagement APIs under `/api/v1/...` and realtime
- Realtime quiz room over Socket.IO
- AI integration for concept and quiz generation
- Scoring engine tied to streak + coins
- Database access via Spring JPA and/or Supabase client (depending on service)

---

## Core Feature Highlights

- **Tempo (scheduled synchronized quizzes):** build urgency and routine through time-window quiz events.
- **Practice + Duels:** solo reps or head-to-head challenge flow to increase repetition volume.
- **Betcha confidence wagering:** rewards calibrated confidence and adds metacognitive feedback.
- **Finn voice UX:** voice responses and readouts for emotionally engaging study interactions.
- **Gamified persistence loop:** coins + streaks + shop + personal Space encourage return behavior.
- **Professor AI workflow:** from raw lesson content to reviewable quiz drafts quickly.
- **Realtime architecture:** live room events and synchronized quiz progression via Socket.IO (FastAPI).

---

## Tech Stack

### Frontend

- React 19 + TypeScript + Vite
- React Router 7
- TanStack Query
- Zustand
- Tailwind CSS 4
- Framer Motion
- `socket.io-client`
- ElevenLabs client + Howler + canvas-confetti

### Backends

- **Spring Boot 3** (Java 21), Spring Security, Spring Data JPA, PostgreSQL
- **FastAPI** + Uvicorn
- Supabase Python client (FastAPI paths)
- Pydantic v2, JWT (`python-jose`), `python-socketio`, `boto3`, OpenAI-compatible LLM utilities
- PyMuPDF + python-pptx for document extraction (Python pipeline)

### Gateway & ops

- Nginx (Docker) — `docker-compose.yml` + `nginx/`
- OpenAPI → TypeScript generation (`openapi-typescript`) against FastAPI where applicable
- Pytest for key FastAPI modules

---

## Repository structure

```text
deducto/
├── frontend/                 # React + Vite web app
├── backend/                 # FastAPI + Socket.IO + engagement + intelligence
├── backend-spring/         # Spring Boot (hybrid API surface)
├── nginx/                   # Nginx config (e.g. gateway for Docker)
├── docker-compose.yml      # Nginx gateway → host Spring + FastAPI
└── Deducto-SpringBoot-Implementation-PRD-v2.md
```

---

## Local development

### Prerequisites

- Node.js 20+
- Python 3.11+
- Java 21+ (for Spring) — see `backend-spring/README.md`
- `npm` / `pip`
- PostgreSQL (e.g. Supabase) and credentials for Spring; Supabase project for FastAPI as documented in each backend

### 1) FastAPI (`backend/`)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

- Health: `GET http://127.0.0.1:8000/health`

### 2) Spring Boot (`backend-spring/`)

See **[backend-spring/README.md](backend-spring/README.md)** for `.env` variables, `./mvnw spring-boot:run`, and which routes Spring owns.

- Health: `GET http://127.0.0.1:8080/health`

### 3) Nginx gateway (optional, full hybrid)

With Spring on `8080` and FastAPI on `8000`:

```bash
docker compose up gateway
```

`CORS_ORIGIN` should match the frontend origin (default in compose: `http://localhost:5173`).

### 4) Frontend (`frontend/`)

```bash
cd frontend
npm install
cp .env.example .env   # or .env.local
npm run dev
```

For the hybrid single-origin setup, set `VITE_API_BASE_URL` and `VITE_WS_BASE_URL` as in `frontend/.env.example`.

---

## Environment variables

### Frontend

Copy from `frontend/.env.example` into `.env` or `.env.local`. Key entries:

- `VITE_API_BASE_URL` — e.g. `http://localhost/api/v1` (Nginx) or `http://127.0.0.1:8000` (FastAPI only)
- `VITE_WS_BASE_URL` — Socket.IO origin (often `http://localhost` with Nginx)
- ElevenLabs and optional OpenAPI URL for `npm run generate:api` — see the example file

### Backend (FastAPI) — `backend/.env`

- `SUPABASE_URL`, `SUPABASE_KEY`, `JWT_SECRET_KEY` (match Spring in hybrid)
- `OPENAI_API_KEY`, `LLM_MODEL`, optional `AWS_*` / `S3_BUCKET_NAME`, etc.

### Backend (Spring) — `backend-spring/`

- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET_KEY`, S3 and LLM vars as in `backend-spring/.env.example`

---

## API and realtime

- **Route ownership** is split: auth/courses/lessons/materials/shop/dashboard/leaderboard/me are implemented in Spring; quizzes, tempos, practice, scoring, and Socket.IO stay in FastAPI. Use Nginx in front for one `/api/v1` URL in the browser, or call each service on its port during local debugging.
- REST under `/api/v1` (prefix depends on which service handles the path).
- Socket.IO is mounted on the FastAPI app; path `/socket.io/`.

---

## Development commands

### Frontend

```bash
cd frontend
npm run dev
npm run build
npm run lint
npm run typecheck
npm run generate:api
```

### Backend (FastAPI)

```bash
cd backend
pytest
```

### Spring

```bash
cd backend-spring
./mvnw -q test
```

---

## Demo

<!-- Add YouTube or hosted demo link. -->

## What makes this project strong

- Clear product thesis: retention mechanics applied to real coursework
- Full-stack execution with student and professor workflows
- AI integrated into meaningful educator workflows (not a standalone chatbot)
- Realtime and voice interactions for memorable demos
- Extensible split-backend architecture (Spring for transactional API surface, FastAPI for engagement and realtime)
