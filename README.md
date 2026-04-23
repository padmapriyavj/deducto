# 🦊 Deducto

<p align="center">
  <img src="./frontend/public/mascot/mascot.png" height="200" />
</p>

<p align="center">An AI-powered learning platform that turns real coursework into a daily habit loop.</p>

Deducto helps professors publish high-quality lesson-aligned quizzes fast, and helps students stay engaged through timed Tempos, duels, confidence wagers, streaks, coins, a customizable Space, and Finn the Fox voice companion.

---

## Why This Project Exists

Most LMS tools are functional but not habit-forming. Deductible combines:

- Real class content and lesson workflows
- AI concept extraction and quiz generation
- Social + game mechanics (live events, duels, wagers, streaks, rewards)
- A voice-first mascot experience (Finn) to make studying feel alive

The result is an education product designed for retention, not just administration.

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
- FastAPI REST APIs (`/api/v1/...`)
- Realtime quiz room over Socket.IO
- AI integration for concept and quiz generation
- Scoring engine tied to streak + coins
- Supabase-backed data access

---

## Core Feature Highlights

- **Tempo (scheduled synchronized quizzes):** build urgency and routine through time-window quiz events.
- **Practice + Duels:** solo reps or head-to-head challenge flow to increase repetition volume.
- **Betcha confidence wagering:** rewards calibrated confidence and adds metacognitive feedback.
- **Finn voice UX:** voice responses and readouts for emotionally engaging study interactions.
- **Gamified persistence loop:** coins + streaks + shop + personal Space encourage return behavior.
- **Professor AI workflow:** from raw lesson content to reviewable quiz drafts quickly.
- **Realtime architecture:** live room events and synchronized quiz progression via Socket.IO.

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

### Backend

- FastAPI + Uvicorn
- Supabase Python client
- Pydantic v2
- JWT auth (`python-jose`) + password hashing (`passlib`/`bcrypt`)
- `python-socketio` for realtime rooms
- `boto3` for file storage integration
- OpenAI-compatible LLM client utilities
- PyMuPDF + python-pptx for document extraction

### Supporting Tooling

- OpenAPI -> TypeScript generation (`openapi-typescript`)
- Pytest test suite for key backend modules

---

## Repository Structure

```text
deducto/
├── frontend/                  # React + Vite web app
│   ├── src/routes/            # Student and professor pages
│   ├── src/components/        # UI building blocks + Finn UI
│   ├── src/lib/               # API clients, voice, realtime, utilities
│   └── scripts/generate-api.mjs
├── backend/                   # FastAPI + realtime + intelligence services
    ├── app_platform/          # Auth, courses, lessons, materials, dashboard, shop
    ├── intelligence/          # LLM adapters, concepts, quiz, ingestion, betcha
    ├── engagement/            # Tempo, duels, scoring, realtime Socket.IO
    ├── tests/                 # Backend tests
    └── main.py                # ASGI entry (FastAPI + Socket.IO mount)

```

---

## Local Development Setup

### Prerequisites

- Node.js 20+
- Python 3.11+ (recommended)
- `npm` and `pip`
- A Supabase project (URL + key)

### 1) Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend health endpoint:

- `GET http://127.0.0.1:8000/health`

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend typically runs on:

- `http://127.0.0.1:5173`

---

## Environment Variables

### Frontend (`frontend/.env.local`)

Start from `frontend/.env.example`.

Key variables:

- `VITE_API_BASE_URL` (FastAPI base URL)
- `VITE_WS_BASE_URL` (optional realtime base override)
- `VITE_OPENAPI_URL` (optional live OpenAPI URL for type generation)
- `VITE_AUTH_MOCK` (force UI mock auth behavior)
- `VITE_ELEVENLABS_API_KEY`
- `VITE_ELEVENLABS_VOICE_ID`
- `VITE_ELEVENLABS_TTS_SPEED`
- `VITE_ELEVENLABS_AGENT_ID`
- `VITE_FINN_GREETING_AUDIO_URL`
- `VITE_VOICE_CACHE_*` (optional cache URLs for static Finn lines)

### Backend (`backend/.env`)

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `JWT_SECRET_KEY`
- `OPENAI_API_KEY` (or compatible provider key)
- `OPENAI_BASE_URL` (optional custom endpoint)
- `GEMINI_API_KEY` (optional, if using Gemini mode)
- `LLM_MODEL`
- `LLM_JSON_SCHEMA`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `S3_BUCKET_NAME`

---

## API and Realtime Notes

- REST APIs are mounted under `/api/v1`
- Auth routes: `/api/v1/auth/*`
- Course routes: `/api/v1/courses/*`
- Engagement routes include scoring, tempo, duel, realtime docs
- Socket.IO is mounted at `/socket.io/`
- Quiz room namespace on frontend: `/quiz-room`

---

## Development Commands

### Frontend

```bash
cd frontend
npm run dev
npm run build
npm run lint
npm run typecheck
npm run generate:api
```

### Backend

```bash
cd backend
pytest
```

Current backend tests include modules for concepts, quiz generation, scoring rules, realtime session behavior, tempo validation, and betcha logic.

---

## Demo

<!-- YOUTUBE LINK HERE  -->


## What Makes This Submission Strong

- Clear product thesis: retention mechanics applied to real coursework
- Full-stack execution with student and professor workflows
- AI integrated into meaningful educator workflows (not a standalone chatbot)
- Realtime and voice interactions that improve demo memorability
- Extensible architecture for post-hackathon scaling
