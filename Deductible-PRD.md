# Deductible — Product Requirements Document

**Version:** 2.0 (Hackathon Final)
**Event:** CitrusHack 2026 (UC Riverside, April 18–19, 2026)
**Team size:** 3
**Build window:** 24 hours

---

## 1. Executive Summary

Deductible is a web-based learning companion that turns college coursework into a daily habit. Professors upload course materials and define weekly lessons; the system automatically extracts concepts, generates difficulty-weighted quizzes ("Tempos"), and powers on-demand practice tests. Students engage through synchronized weekly Tempos, head-to-head practice duels, a voice-driven AI coach (Finn the Fox), and a persistent personalization surface (Space) fueled by earned coins and streaks.

The product targets the engagement crisis in higher education: students skip class and skip studying not because teaching is bad, but because nothing in their educational stack competes with the dopamine mechanics of TikTok, Duolingo, and BeReal. Deductible imports those mechanics (synchronized windows, streaks, loss aversion, head-to-head competition, wagering, voice companionship) and points them at students' actual coursework.

The product is standalone — not a Canvas plugin — but architected to be LMS-integrable in a future release.

---

## 2. Product Identity

| Attribute | Value |
|---|---|
| **Product name** | Deductible |
| **Domain** | deductible.tech |
| **Mascot** | Finn, the Fox |
| **Mascot voice** | Warm, friendly, patient — ElevenLabs voice to be finalized in hour 0 |

### 2.1 Color Palette

| Role | Hex | Usage |
|---|---|---|
| Background | `#F3ECDC` | Main background |
| Surface | `#FCF8EE` | Cards, panels |
| Primary text | `#1E2A44` | All primary text |
| Brand / primary button | `#E07A3C` | Primary actions, brand |
| Secondary button | `#3F6B4E` | Secondary actions, active states |
| Gold | `#D4A534` | Coins, streak flame |
| Success | `#7FB085` | Correct answers |
| Warning | `#E0A334` | Warnings, stakes |
| Danger | `#B5533A` | Wrong answers, errors |
| Divider | `#C7BFAE` | Dividers, inactive states |

### 2.2 Typography

- **Headings:** Fraunces
- **Body:** Inter
- **Numbers, timers, IDs:** JetBrains Mono

### 2.3 Visual Language

- Rounded corners minimum 12px
- Soft shadows, no hard edges
- Warm, clean, readable

---

## 3. Problem Statement

College students disengage from their coursework. They know they should study, but when they pick up their phone, they open TikTok or Instagram — not Canvas. The root cause isn't poor teaching; it's that education tools have no retention mechanics. Meanwhile, a generation spends 90+ minutes a day on short-video apps designed with behavioral psychology.

Existing edtech products fall into three camps, and none solves this:

- **LMS platforms (Canvas, Blackboard, Moodle):** content-heavy, utility-driven, no habit mechanics. Students visit only when forced.
- **Gamified study apps (Quizlet, Kahoot, Blooket):** isolated study-mode activities disconnected from actual coursework. Students use them once, forget them.
- **AI tutors (Khanmigo, Gemini LTI, LearnWise):** teach well, but don't solve the "getting students to show up" problem Duolingo's CEO has named as the central challenge in education.

Meanwhile, students *already attend* the daily ritual of TikTok, BeReal, and Duolingo streaks — because those apps give them dopamine, identity, and social presence. Nothing in the educational stack competes.

---

## 4. Solution Overview

Deductible is a habit app built on top of a student's actual course content. It imports five proven retention mechanics from consumer apps and applies them to coursework:

1. **Synchronized class moments (from BeReal):** professor-scheduled weekly Tempos fire to everyone in the class at once. Miss the window, break your streak.
2. **Daily streak with forgiveness (from Duolingo):** any learning activity counts toward the streak; earned Streak Freezes offer limited forgiveness.
3. **Head-to-head competition (from Chess.com / League):** on-demand 1v1 practice duels with classmates on specific lessons.
4. **Confidence wagering (original mechanic, educational-psychology-backed):** Betcha lets students wager coins on their performance, turning metacognition into a game.
5. **Voice companion (ElevenLabs, differentiated):** Finn the Fox hosts every quiz, commentates duels, coaches weak concepts, and greets students daily. He's the interface, not a feature.

On top of this engagement layer sits real coursework: professors upload materials (PDF, PPT, video), define weekly lessons with page/time ranges, trigger AI concept extraction, set weightages, review AI-generated quizzes, and schedule Tempos. The AI content pipeline (concept extraction + quiz generation) is fully abstracted as a reusable module shared between Tempos and practice tests.

Students earn coins from quizzes, streaks, and duels. Coins buy items and decorations in their **Space** — a 2D personalization surface where Finn lives. This creates a sink for earned coins and a reason to come back tomorrow.

---

## 5. Target Users

### 5.1 Primary user: The Struggling Student

**Profile:** Sophomore, takes 5 classes, attends maybe 3 regularly, crams 48 hours before exams.
**Goal:** Pass her classes without feeling like she's drowning.
**Hook:** The daily streak and the voice coach who remembers what she got wrong last week.

### 5.2 Primary user: The Engaged Student

**Profile:** Junior CS major, studies hard but isolated. Uses Quizlet but it feels passive.
**Goal:** Compete, rank, feel mastery.
**Hook:** Duels, leaderboards, Betcha wagering on his own performance.

### 5.3 Secondary user: The Professor

**Profile:** Teaches intro CS. Class attendance plummets by week 4. Grades cluster bimodally.
**Goal:** Increase engagement without adding grading burden.
**Hook:** AI auto-generates weekly quizzes from uploaded materials; he reviews and approves in ~90 seconds.

---

## 6. User Stories

Stories grouped by actor, priority-tagged for 24-hour scope. **P0** = must for demo. **P1** = should have. **P2** = cut if behind.

### 6.1 Professor stories

**P0:**
1. As a professor, I want to sign up and log in, so I can access my portal.
2. As a professor, I want to create a course with name, description, and schedule, so students can enroll.
3. As a professor, I want the system to autogenerate a 6-character join code for my course, so I can share it with my class.
4. As a professor, I want to upload PDF, PPT, and video course materials, so I can define lessons from them.
5. As a professor, I want the system to automatically process uploaded materials (text extraction from PDFs/PPTs, transcription for videos), so content is indexable.
6. As a professor, I want to create a weekly lesson by selecting a material and a page range or time range, so I can define exactly what the lesson covers.
7. As a professor, I want to trigger concept extraction for a lesson, so the AI surfaces candidate concepts.
8. As a professor, I want to set concept weightages and difficulty weightages (easy/medium/hard) for a quiz, so the generated questions match my teaching priorities.
9. As a professor, I want to trigger AI quiz generation with the number of questions and time per question I choose, so I get a draft quiz aligned to my weightages.
10. As a professor, I want to review each generated question and accept, edit, or regenerate it individually, so I trust the final quiz.
11. As a professor, I want to schedule a Tempo for a specific day and time window, so students receive a synchronized notification.
12. As a professor, I want to see my course dashboard with the student roster and performance stats, so I know who needs help.
13. As a professor, I want to see concept-level performance for my class, so I know what to re-teach.

**P1:**
14. As a professor, I want to preview the Tempo flow before publishing, so I can catch issues early.
15. As a professor, I want a "Start Tempo Now" override (dev mode) during demo, so I can show the feature live.

**P2:**
16. As a professor, I want to edit the autogenerated concept names, so I can correct AI mistakes.

### 6.2 Student stories

**P0:**
1. As a student, I want to sign up and log in, so I can access the platform.
2. As a student, I want to join a course using a join code, so I can see its content.
3. As a student, I want a personalized home dashboard showing my enrolled courses, streak, and upcoming Tempos, so I know what's next.
4. As a student, I want to see per-course stats (tests taken, coins earned, weak concepts), so I know where I stand.
5. As a student, I want to receive a notification when a Tempo window opens, so I don't miss it.
6. As a student, I want to take a Tempo quiz hosted by Finn's voice, so it feels engaging rather than clinical.
7. As a student, I want to place a Betcha (1x / 3x / 5x) before a quiz starts, so I can earn bonus coins based on my confidence.
8. As a student, I want to start a solo practice test on any enrolled lesson, so I can study on my own schedule.
9. As a student, I want to invite a classmate to a practice test duel, so we can compete head-to-head.
10. As a student, I want to see my results after any quiz — including coins earned, per-concept breakdown, and Betcha resolution — so I know how I did.
11. As a student, I want a daily streak that increments when I do any learning activity, so I build a habit.
12. As a student, I want to earn coins from quizzes, streaks, and duel wins, so I have a reason to engage.
13. As a student, I want to spend coins on items in the shop, so coins feel meaningful.
14. As a student, I want to place purchased items in my Space, so it feels personal.
15. As a student, I want to see upcoming and completed events per course, with an accordion showing details for each completed test, so I can review my history.

**P1:**
16. As a student, I want to chat with Finn via voice on demand in a Coach session, so I can get personalized help on weak concepts.
17. As a student, I want to see a per-concept mastery heatmap, so I know what to focus on.
18. As a student, I want to see a class leaderboard per course, so I can see where I rank.
19. As a student, I want to customize my avatar appearance, so it feels like mine.

**P2:**
20. As a student, I want to view a classmate's Space as a read-only share, so I can see what they've unlocked.
21. As a student, I want a weekly Finn voice recap summarizing my week, so I feel seen.

### 6.3 System / Mascot stories

**P0:**
1. As the system (Finn), I greet the student on their first login of the day with a personalized voice message, so the app feels alive.
2. As Finn, I host Tempo and practice test quizzes by reading questions aloud, so students are immersed.
3. As Finn, I react to correct and wrong answers with voice and mascot animation, so every interaction has feedback.

**P1:**
4. As Finn, I proactively offer a study session when I detect a weak concept, so the student gets targeted help.
5. As Finn, I narrate the end-of-quiz result with a brief voice summary, so the close of each session feels personal.

---

## 7. Core Features — Detail

### 7.1 Course Management (Professor)

A professor creates a course with:
- Name (e.g., "CS 141: Algorithms")
- Description
- Schedule (days + time, used for context and notification timing)
- Auto-generated 6-character join code

Students join via code on their dashboard. Professor sees roster and can remove students.

### 7.2 Course Materials

Professor uploads files of three types:
- **PDF** — text extracted per page using PyMuPDF
- **PPT** — text extracted per slide using python-pptx
- **Video** — transcribed with timestamps (Whisper; **for hackathon: mocked to avoid 30+ min processing delays**)

Each uploaded file is processed in the background and stored as a collection of **material chunks**, each tagged by page number (for PDFs/PPTs) or timestamp range (for videos). This chunk index is the knowledge base for downstream AI operations.

Processing status is exposed on the material record (`pending` / `processing` / `ready` / `failed`) so the UI can show progress.

### 7.3 Lessons

A lesson represents one week of class content. The professor:
- Names the lesson (e.g., "Week 3: Sorting Algorithms")
- Sets a week number
- Selects one or more materials, and for each, specifies a range (page X–Y for docs, time A–B for video)

A lesson can combine multiple sources (e.g., pages 30–50 of a PDF plus minutes 20–40 of a lecture video). The backend links the relevant material chunks to the lesson via a scheduler that backpopulates the `material_chunk_id` reference after chunks are processed.

### 7.4 Tempo

A Tempo is a scheduled, time-limited quiz that fires to all enrolled students simultaneously.

**Creation flow:**
1. Professor selects a lesson.
2. Professor triggers **Concept Generation**: LLM reads the lesson's chunks and extracts candidate concepts (typically 4–8). Each concept has a name and a short description.
3. Professor edits or accepts concepts and sets **weightages** (stored on the quiz config, not on the concept itself):
   - **Conceptual weightage:** per-concept percentage (must sum to 100).
   - **Difficulty weightage:** easy/medium/hard percentage (must sum to 100).
4. Professor sets quiz options: number of questions, time per question.
5. Professor triggers **Quiz Generation**: the system calls the abstract Quiz Module with the collected config.
6. Professor enters **Review Stage**: reviews each generated question; can accept, edit text/choices/correct answer, or regenerate a single question using the same config. Unapproved questions cannot be published.
7. Professor **Publishes** and the Tempo is scheduled for delivery at the configured day/time.

**Student delivery flow:**
1. At the scheduled time (APScheduler cron), the system broadcasts a socket event to all enrolled students.
2. Students receive a push notification + in-app toast + Finn voice ping.
3. Student opens the Tempo screen, which shows the Betcha placement first.
4. Student locks in 1x/3x/5x, then joins the quiz room.
5. Finn (voice) announces and reads each question; the student answers within the time limit.
6. On completion, score computed, Betcha resolved, coins awarded, streak updated.

**Note:** For demo purposes, include a professor-side "Start Tempo Now" override so judges can see the flow without waiting for a scheduled time.

### 7.5 Practice Test

A student can start a practice test on any lesson from any course they're enrolled in.

Two modes:
- **Solo:** single-player quiz using default weightages (even split across concepts, balanced difficulty).
- **Duel:** student invites another enrolled classmate. Both join a live room; both see the same questions in parallel; fastest-correct-per-question earns extra coins; winner takes the duel pot (see Coin Economy).

Practice tests reuse the same Quiz Module as Tempos — same generation path, same runner, same Betcha. The only difference is:
- Config origin (default config vs. professor-set weightages).
- Mode flag (solo/duel vs. tempo).
- Scoring multipliers (practice < tempo by design, so Tempo feels higher stakes).

**This is the primary ElevenLabs showcase moment.** Finn hosts the entire live duel — introduces the match, reads each question, comments on peer activity, announces the winner.

### 7.6 Quiz Module (Abstract)

The Quiz Module is the heart of Deductible and is deliberately reusable.

**Responsibilities:**
- `generate_quiz(config)` — takes a full `QuizGenerationConfig` and returns a complete quiz with questions.
- `regenerate_question(question_id, config)` — regenerates a single question using the same original config, so partial regeneration doesn't require re-running the whole quiz.
- `validate_quiz(quiz)` — structural validation (no duplicate correct answers, all concepts represented per weightages, etc.).
- `score_attempt(quiz_id, answers, user_id, betcha)` — computes score, applies Betcha resolution, awards coins.

**QuizGenerationConfig contents:**
- `lesson_ids` — one or more lesson IDs to pull content from
- `concepts` — list of concepts with their weightages (weightages live in the config, not the concept record)
- `difficulty_weights` — dict of easy/medium/hard percentages
- `num_questions` — total count
- `time_per_question` — seconds
- `knowledge_base_ref` — pointer to the relevant material chunks

**QuizRunner** handles live orchestration:
- `create_room(quiz_id, mode)` — spins up a socket room
- `join_room(room_id, user_id)` — adds a player
- `start(room_id)` — begins the quiz
- `submit_answer(room_id, user_id, question_idx, choice)`
- `advance_to_next(room_id)`
- `finalize(room_id)` — computes all results

Both Tempos and practice tests run through the QuizRunner with a mode flag.

### 7.7 Betcha Module (Abstract)

Betcha is a confidence-wagering mechanic invoked before any quiz starts.

**Wagers:**
- **1x (safe):** coins earned = base_coins × score_percent. Always pays out proportionally.
- **3x (bold):** if final score ≥ 70%, coins = base_coins × score_percent × 3. If below 70%, coins = base_coins × score_percent (fallback to 1x payout).
- **5x (all-in):** if final score ≥ 90%, coins = base_coins × score_percent × 5. If below 90%, coins = base_coins × score_percent.

Betcha is **placed before the quiz begins** (not mid-quiz) and is **locked in** once the first question is shown. The Betcha Module is abstracted — both Tempo and Practice Tests invoke it identically. Resolution happens at `score_attempt()` time.

### 7.8 Finn the Coach (Voice AI)

Finn is not a feature — Finn is the interface. Every major moment in the app has a Finn voice reaction.

**Trigger moments:**
- First login of the day: warm greeting with streak reference.
- Before a Tempo: announcement.
- During a Tempo/Practice: reads each question, reacts to answers.
- After a wrong answer: gentle reframe.
- End of quiz: voice summary with concept breakdown.
- On-demand Coach session: full conversational session.

**Coach session architecture:**
- Student clicks "Study with Finn" button.
- Frontend opens an ElevenLabs Conversational AI agent session.
- System prompt injected with: student's enrolled courses, last 30 attempts, weak concepts, streak, current time.
- Tools available to the agent (tool-calling):
  - `get_question(topic, difficulty)` — pulls a real question from the question bank
  - `explain_concept(concept_id)` — generates a 2–3 sentence explanation from lesson material
  - `record_attempt(question_id, correct)` — logs the attempt and awards coins
  - `end_session()` — wraps up with a summary

**Voice persona for Finn:** warm, friendly, competent, encouraging, never condescending. A good friend who happens to know your coursework.

### 7.9 Coin Economy

**Earning:**
- Tempo correct answer: 50 base + (0–50 time bonus) × Betcha multiplier
- Tempo wrong answer: 0 (no negative)
- Practice correct answer: 10
- Duel win: 100 + opponent's ante (if any)
- Duel loss: 20 consolation (prevents tilt)
- Streak milestones: 7 days = 200, 14 = 500, 30 = 1000
- Weekly course leaderboard top 3: 500 / 300 / 200

**Spending:**
- Cosmetic Finn skins: 50–500
- Space items (furniture, props): 100–2000
- Rare items (epic category): 3000+
- Streak Freeze: 200 (max 2 equipped)
- Betcha wager stake (paid upfront): 50, 100, or 200

**Design goal:** a moderately active student earns ~500 coins/day; cheap items feel instant, mid items are week-long goals, epic items are month-long flexes.

### 7.10 Streak System

A user's streak increments when they complete **any** qualifying activity in a calendar day (UTC). Qualifying activities:
- Any completed quiz (Tempo or Practice, solo or duel)
- Any completed Coach session (minimum 2 answered questions)

Streak logic:
- Nightly cron job at midnight UTC: for each user, if `last_activity_date` was today → streak intact; if yesterday → streak at risk; if more than 1 day ago → streak breaks.
- **Streak Freezes** prevent breaks for up to 2 missed days if equipped. Automatically consumed.
- On break, the user sees a gentle message from Finn, not a harsh penalty screen.

### 7.11 Shop & Inventory

**Shop categories:**
- Finn skins (alternate outfits for the mascot)
- Space items (desk objects, wall pieces, shelf decor)
- Backdrops (alternate space themes)
- Streak Freezes (consumable)

Items have a `rarity` tag (common / rare / epic) for visual emphasis and price tiering.

**Purchase flow:**
- Student browses shop grid filtered by category.
- Clicks item → modal shows preview and price.
- Confirms → coins deducted, item added to inventory.

**Inventory** is the collection of owned items. Cosmetic items can be equipped on Finn or placed in the Space.

### 7.12 Space

A 2D scene with fixed layout:
- Center: Finn sits or stands depending on mood.
- Behind him: two shelves (6 slots total) for placeable decorative items.
- Background: walls with a board on the left (displaying recent completed quizzes as pinned notes), a window on the right.
- Foreground: desk surface (2 slots for desk-sized items).

**Placement UX (simplified for 24-hour scope):**
- Each slot is a `+` placeholder when empty.
- Click `+` → modal shows owned items of compatible category.
- Click an item → placed in that slot.
- Click an occupied slot → option to swap or remove.
- **No drag-and-drop.** Click-to-place only.

**Shareable profile card:** student can click "Share" → generates a PNG of their Space + avatar + streak + top courses, downloadable for social sharing.

### 7.13 Dashboard

**Student dashboard:**
- Streak flame with day count
- Coin balance
- Courses grid — each tile shows: course name, stats snapshot (tests taken, coins from this course, top weak concept), in-progress Tempo indicator (if live), "Start Practice Test" button
- Per-course expanded view includes: upcoming events list, completed events accordion (per event: questions attempted, correct/wrong, concepts covered, coins earned, Betcha result)
- "Chat with Finn" button — opens Coach session

**Professor dashboard:**
- Courses grid — each tile shows: enrollment count, Tempos scheduled, class avg performance
- Per-course drill-down: student roster with personal performance summary
- Concept-level performance heatmap for the class

---

## 8. Technical Architecture

### 8.1 Tech Stack

**Frontend:**
- React 18 + Vite + TypeScript
- Tailwind CSS + ESLint
- Zustand (client state) + TanStack Query (server state)
- React Router
- Socket.IO client
- DiceBear (avatar generation via URL params)
- Howler.js (sound effects)
- canvas-confetti (celebration animations)
- Framer Motion (transitions, mascot animation)

**Backend:**
- Python 3.11 + FastAPI + Pydantic v2 + Uvicorn
- SQLAlchemy 2.0 + Alembic (migrations)
- LangChain (LLM abstraction)
- APScheduler (scheduled Tempo firing + material chunk backpopulation)
- python-socketio (real-time rooms)
- boto3 (S3)
- PyMuPDF (PDF extraction), python-pptx (PPT extraction)

**Data:**
- **PostgreSQL** (single primary database)
- **Amazon S3** (uploaded files + generated audio cache)
- **Redis** (optional, for real-time room state; falls back to in-memory dict if not available)

**AI:**
- Primary LLM: Ollama (local, dev); swappable to Gemini / Anthropic via env var
- Voice: ElevenLabs (TTS + Conversational AI)
- PDF/PPT text extraction in-process

**Deployment:**
- Vultr VPS running Docker Compose (Postgres + Redis + FastAPI + Nginx)
- Frontend on Vercel or served via Nginx on same Vultr box

**Rationale for single DB (Postgres):**
- Deeply relational data model (Course → Lesson → Question → Attempt → Concept mastery)
- `JSONB` columns handle flexible fields (question choices, placement config, schedule) without needing a document DB
- Full-text search + optional `pgvector` for embeddings if RAG is added
- One mental model for a 3-person team prevents data-sync bugs

### 8.2 Abstract Modules

Three modules are explicitly designed as swappable/reusable. Every other module depends on their interfaces, not their implementations.

#### 8.2.1 LLM Provider

An interface defining:
- `generate_text(prompt, system, temperature)` — returns string
- `generate_structured(prompt, system, schema)` — returns a Pydantic model
- `embed(text)` — returns vector (for future RAG)
- `chat(messages, tools)` — returns ChatResponse with optional tool calls

Implementations: `OllamaProvider`, `GeminiProvider`, `AnthropicProvider`. Factory reads `LLM_PROVIDER` env var at startup and returns the appropriate instance. All callers use `get_llm()` — never instantiate providers directly.

#### 8.2.2 Quiz Module

Interface described in section 7.6. The module owns:
- Concept extraction from knowledge base
- Weightage-driven question generation
- Single-question regeneration
- Structural validation
- Score computation

Both Tempo and Practice flows invoke the same methods with different configs. The module has no awareness of which caller it serves.

#### 8.2.3 Betcha Module

Interface described in section 7.7. Pure functions; no persistent state beyond the wager record. Pluggable before any quiz begins; invoked during score resolution.

### 8.3 Module Boundaries (Backend Folder Structure)

```
backend/
├── platform/               # Person A
│   ├── auth/               # signup, login, JWT
│   ├── courses/            # course CRUD, enrollment
│   ├── materials/          # upload pipeline, chunking
│   ├── lessons/            # lesson CRUD, range selection
│   └── storage/            # S3 wrapper
├── intelligence/           # Person B
│   ├── llm/                # provider abstraction
│   ├── ingestion/          # PDF/PPT/video text pipeline
│   ├── concepts/           # concept extraction
│   ├── quiz/               # quiz module (generate, regen, score)
│   └── betcha/             # wagering module
├── engagement/             # Person B
│   ├── tempo/              # scheduler, firing
│   ├── duels/              # live duel rooms
│   ├── scoring/            # coin + streak logic
│   └── realtime/           # Socket.IO handlers
├── profile/                # Person A
│   ├── dashboard/          # student + professor dashboards
│   ├── shop/               # shop endpoints
│   ├── inventory/          # owned items
│   └── space/              # placement state
└── voice/                  # Person C (proxy, if needed)
    └── tts.py
```

### 8.4 Realtime Architecture

- Socket.IO namespace `/quiz-room` hosts live quiz sessions (Tempos and duels).
- Each quiz instance creates a room identified by `room_id`.
- Server-sent events: `room:state`, `quiz:question`, `quiz:peer_answered`, `quiz:next`, `quiz:complete`.
- Client-sent events: `room:join`, `quiz:answer`.
- Room state held in Redis (or in-memory dict in dev). State includes: current question index, participants, answer logs.

### 8.5 Scheduled Jobs

APScheduler runs in the FastAPI app with these job types:
- **Tempo fire:** at scheduled datetime, broadcast socket event + push notifications to enrolled students.
- **Nightly streak check:** at 00:00 UTC, evaluate each user's streak based on last activity.
- **Material processing:** triggered on upload; runs async extraction + chunking.
- **Lesson chunk backpopulation:** after material chunks are created, backpopulates `material_chunk_id` on the relevant lessons.

---

## 9. Database Schema

All tables have `id` (bigint primary key), `created_at`, and `updated_at` unless noted.

### users
| Column | Type | Notes |
|---|---|---|
| email | varchar(255) unique | |
| password_hash | varchar(255) | |
| role | enum('student','professor') | |
| display_name | varchar(100) | |
| avatar_config | jsonb | DiceBear config |
| coins | int default 0 | |
| current_streak | int default 0 | |
| longest_streak | int default 0 | |
| last_activity_date | date | |
| streak_freezes | int default 2 | |

### courses
| Column | Type | Notes |
|---|---|---|
| professor_id | FK users | |
| name | varchar(200) | |
| description | text | |
| schedule | jsonb | `{days: [], time: '', tz: ''}` |
| join_code | varchar(8) unique | autogenerated |

### enrollments
| Column | Type | Notes |
|---|---|---|
| user_id | FK users | |
| course_id | FK courses | |

Unique constraint on `(user_id, course_id)`.

### materials
| Column | Type | Notes |
|---|---|---|
| course_id | FK courses | |
| type | enum('pdf','ppt','video') | |
| filename | varchar(255) | |
| s3_key | varchar(500) | |
| processing_status | enum('pending','processing','ready','failed') | |
| metadata | jsonb | pages, duration, etc. |

### material_chunks
| Column | Type | Notes |
|---|---|---|
| material_id | FK materials | |
| chunk_type | enum('page','timestamp') | |
| location_start | int | page num or seconds |
| location_end | int | |
| text | text | |
| embedding | vector(768) nullable | pgvector, optional |

### lessons
| Column | Type | Notes |
|---|---|---|
| course_id | FK courses | |
| title | varchar(200) | |
| week_number | int | |
| sources | jsonb | `[{material_id, start, end}]` |
| material_chunk_id | FK material_chunks | Scheduler → backpopulated after chunks are created |

### concepts
| Column | Type | Notes |
|---|---|---|
| lesson_id | FK lessons | |
| name | varchar(200) | |
| description | text | |

Weightages are not stored on concepts. They are captured in the `QuizGenerationConfig` snapshot on each quiz record, so the same concept can carry different weightages across different quizzes.

### quizzes
| Column | Type | Notes |
|---|---|---|
| type | enum('tempo','practice') | |
| lesson_id | FK lessons nullable | |
| course_id | FK courses | |
| created_by | FK users | |
| config | jsonb | full QuizGenerationConfig snapshot (includes concept weightages + difficulty weights) |
| status | enum('draft','reviewing','published','archived') | |
| scheduled_at | timestamp nullable | for Tempo |
| duration_sec | int | |

### questions
| Column | Type | Notes |
|---|---|---|
| quiz_id | FK quizzes | |
| question_order | int | |
| text | text | |
| choices | jsonb | `[{key, text}]` |
| correct_choice | varchar(10) | |
| concept_id | FK concepts | |
| difficulty | enum('easy','medium','hard') | |
| generation_metadata | jsonb | prompt, model, seed |
| approved | boolean default false | |

### quiz_attempts
| Column | Type | Notes |
|---|---|---|
| quiz_id | FK quizzes | |
| user_id | FK users | |
| room_id | varchar(50) nullable | |
| mode | enum('solo','duel','tempo') | |
| started_at | timestamp | |
| completed_at | timestamp nullable | |
| score_pct | numeric(5,2) nullable | |
| coins_earned | int default 0 | |
| betcha_multiplier | enum('1x','3x','5x') | |
| betcha_resolved | boolean default false | |

### answers
| Column | Type | Notes |
|---|---|---|
| attempt_id | FK quiz_attempts | |
| question_id | FK questions | |
| selected_choice | varchar(10) | |
| is_correct | boolean | |
| time_taken_ms | int | |

### duel_rooms
| Column | Type | Notes |
|---|---|---|
| id | varchar(50) PK | |
| quiz_id | FK quizzes | |
| host_user_id | FK users | |
| status | enum('waiting','active','completed') | |

### shop_items
| Column | Type | Notes |
|---|---|---|
| name | varchar(100) | |
| category | enum('finn_skin','space_item','backdrop','streak_freeze') | |
| asset_url | varchar(500) | |
| price_coins | int | |
| rarity | enum('common','rare','epic') | |

### user_inventory
| Column | Type | Notes |
|---|---|---|
| user_id | FK users | |
| shop_item_id | FK shop_items | |
| acquired_at | timestamp | |
| placement | jsonb nullable | `{shelf, slot}` if placed |

### user_concept_mastery
| Column | Type | Notes |
|---|---|---|
| user_id | FK users | |
| concept_id | FK concepts | |
| attempts | int | |
| correct | int | |
| mastery_score | numeric(5,2) | |

Composite PK on `(user_id, concept_id)`.

### notifications
| Column | Type | Notes |
|---|---|---|
| user_id | FK users | |
| type | varchar(50) | |
| payload | jsonb | |
| read | boolean default false | |

---

## 10. API Surface (OpenAPI Outline)

Base path: `/api/v1`. Auth via Bearer JWT. Full OpenAPI spec auto-generated by FastAPI at `/docs`.

### Auth
- `POST /auth/signup` — body: email, password, display_name, role; returns user + token
- `POST /auth/login` — body: email, password; returns user + token
- `GET /auth/me` — current user profile
- `POST /auth/logout`

### Courses
- `POST /courses` — professor creates course
- `GET /courses` — list courses for current user
- `GET /courses/{id}` — course detail
- `PATCH /courses/{id}` — professor update
- `POST /courses/{id}/enroll` — student joins via code
- `GET /courses/{id}/students` — professor only, roster + stats
- `GET /courses/{id}/dashboard` — role-aware dashboard data

### Materials
- `POST /courses/{id}/materials` — multipart upload
- `GET /courses/{id}/materials` — list materials
- `GET /materials/{id}` — detail + processing status
- `GET /materials/{id}/chunks?start=&end=` — fetch chunks in range
- `DELETE /materials/{id}`

### Lessons
- `POST /courses/{id}/lessons` — create lesson with sources
- `GET /courses/{id}/lessons`
- `GET /lessons/{id}`
- `PATCH /lessons/{id}`

### Concepts & Quiz Generation
- `POST /lessons/{id}/concepts/generate` — trigger LLM extraction
- `GET /lessons/{id}/concepts` — list
- `POST /quizzes/generate` — body: full config (lesson_ids, concept weightages, difficulty weights, num_questions, time_per_question); returns draft quiz
- `GET /quizzes/{id}`
- `PATCH /questions/{id}` — edit question
- `POST /questions/{id}/regenerate` — regen single
- `POST /questions/{id}/approve`
- `POST /quizzes/{id}/publish`

### Tempo
- `POST /tempos` — create and schedule
- `GET /tempos/upcoming` — for current student
- `POST /tempos/{id}/join` — join active
- `POST /tempos/{id}/fire` — dev-mode instant trigger

### Practice & Duels
- `POST /practice-tests` — body: lesson_id, mode, num_questions; returns room_id, quiz_id
- `POST /practice-tests/{room_id}/invite`
- `POST /practice-tests/{room_id}/join`
- `POST /practice-tests/{room_id}/start`

### Quiz Runtime
- `POST /quizzes/{id}/betcha` — body: multiplier
- `POST /quiz-attempts/{id}/answer` — body: question_id, choice, time_taken_ms
- `POST /quiz-attempts/{id}/finalize`
- `GET /quiz-attempts/{id}/results`

### Dashboard
- `GET /dashboard/student`
- `GET /dashboard/professor`
- `GET /dashboard/student/courses/{id}`
- `GET /dashboard/professor/courses/{id}/analytics`

### Shop / Inventory / Space
- `GET /shop/items?category=`
- `POST /shop/purchase` — body: item_id
- `GET /me/inventory`
- `GET /me/space`
- `PUT /me/space` — body: placements
- `PUT /me/avatar` — body: avatar_config
- `GET /users/{id}/space` — read-only share

### Voice
- `POST /voice/tts` — body: text, voice_id, context; returns audio URL (cached) or stream
- `POST /voice/coach/session` — starts Conversational AI session
- `GET /voice/scripts/{context}` — returns script templates

### Notifications
- `GET /notifications`
- `POST /notifications/{id}/read`
- `POST /notifications/push-subscribe`

### Socket Events (namespace `/quiz-room`)
- Client → server: `room:join`, `quiz:answer`
- Server → client: `room:state`, `quiz:question`, `quiz:peer_answered`, `quiz:next`, `quiz:complete`

---

## 11. Frontend Pages & Components

### 11.1 Pages

**Public:**
1. Landing
2. Login
3. Signup (with role selector)

**Shared authed:**
4. Onboarding (first login only) — Finn voice welcome
5. Notifications drawer
6. Settings (profile, avatar, voice prefs)

**Student:**
7. Student Dashboard
8. Course Detail (student view) — stats tile, in-progress Tempo tile, practice test launcher, upcoming/completed events
9. Lesson View — materials list, practice test button per lesson
10. Tempo Quiz Screen — pre-start countdown, Betcha placement, live runner
11. Practice Test Lobby — solo/duel toggle, invite, waiting room
12. Quiz Runner — Finn-hosted, question display, choices, peer progress (duels)
13. Quiz Results — score, concept breakdown, coins, Betcha, share button
14. Coach Session — full-screen Finn, voice UI, live transcript, end button
15. Space — user's 2D scene with items, Finn, board
16. Shop
17. Inventory — owned items, click-to-place
18. Leaderboard (per course)

**Professor:**
19. Professor Dashboard
20. Course Management — students / materials / lessons tabs
21. Create Course modal
22. Upload Material modal with progress
23. Create Lesson — material picker with page/time selector
24. Concept Review — AI concepts, edit names, set weightages
25. Weightage Form — difficulty + concept sliders (sum to 100 validation)
26. Quiz Review — question-by-question accept / edit / regenerate
27. Schedule Tempo — date/time picker
28. Professor Analytics — class concept heatmap

### 11.2 Reusable Components

- `<FinnPresence />` — persistent mascot + voice player
- `<Finn mood isSpeaking />` — 5–6 mood PNGs with CSS animations
- `<StreakFlame count />`
- `<CoinCounter value animate />`
- `<AvatarDisplay config />` — DiceBear wrapper
- `<BetchaSelector onSelect />`
- `<QuestionCard question onAnswer />`
- `<CountdownTimer seconds />`
- `<ConceptHeatmap data />`
- `<SpaceRack slot item />`
- `<EventAccordion event />` — for completed events on course detail

### 11.3 Finn's Mood Assets

Six PNG variants with a consistent character design:
1. **Neutral / Greeting** — default welcoming wave
2. **Thinking** — paw on chin, looking up
3. **Celebrating** — paws up, confetti
4. **Concerned** — head tilt, sympathetic expression
5. **Speaking** — mouth open, animated gesture (swap closed/open for talking animation)
6. **Sleeping** (optional) — curled up, for empty states

Design brief: red fox, cute proportions, warm friendly expression, transparent background, warm color palette matching the UI.

---

## 12. Team Split & Anti-Overlap Rules

### 12.1 Ownership

**Person A — Platform:**
- Auth, Courses, Materials, Lessons, Enrollment
- File upload pipeline → S3
- PDF/PPT text extraction
- Dashboard endpoints
- Shop, Inventory, Space endpoints
- DB migrations (sole owner)
- Docker + Vultr deployment

**Person B — Intelligence & Engagement:**
- LLM provider abstraction + Ollama/Gemini impls
- Concept extraction pipeline
- Quiz Module (generate, regen, score)
- Betcha Module
- Tempo scheduler (APScheduler)
- Duel orchestration (Socket.IO handlers)
- Scoring + coin + streak logic

**Person C — Experience:**
- All React pages and routing
- State (Zustand + TanStack Query)
- Finn presence + voice layer (ElevenLabs TTS + Conversational AI)
- Mascot mood + animation components
- Avatar system (DiceBear integration)
- Space rendering + placement UI
- Shop UI
- Sound effects, confetti, animations
- Socket client handling

### 12.2 Contracts

The **OpenAPI spec is the contract** between backend and frontend. Person A and Person B write Pydantic schemas first; FastAPI auto-generates the spec. Person C generates TypeScript types via `openapi-typescript` and builds against a mock server until the real backend is up.

### 12.3 Anti-overlap rules

1. Person B never writes migrations. Sends schema requests to Person A.
2. Person A never writes LLM-related code.
3. Person C never writes Python.
4. All three commit to separate folders: `backend/platform/`, `backend/intelligence/`, `backend/engagement/`, `frontend/`.
5. Every backend PR must pass `alembic upgrade head` + pytest; every frontend PR must pass `tsc --noEmit` + ESLint.
6. Merge conflicts on shared Pydantic files: the PR's author coordinates directly with the affected owner in under 10 minutes, no exceptions.

---

## 13. Build Plan (24 Hours)

### Hour 0–1 — Foundation (all three together)
- Lock mascot identity, palette, fonts.
- Generate 6 Finn mood PNGs using AI image tool + remove.bg.
- Set up monorepo, Docker Compose (Postgres + Redis + FastAPI + Vite).
- Create initial Alembic migration with all tables.
- Scaffold FastAPI app with healthcheck + OpenAPI at `/docs`.
- Scaffold Vite app with Tailwind, routing, theme tokens.

### Hour 1–6 — Parallel build, core surfaces
- **Person A:** auth, course CRUD, enrollment, material upload → S3, PDF/PPT chunking.
- **Person B:** LLM provider interface + Ollama impl. First end-to-end concept extraction on a sample PDF. Stub quiz generation.
- **Person C:** login/signup, student dashboard (mocked), professor dashboard (mocked), Finn mascot component with all moods + CSS animations, ElevenLabs voice proof-of-concept playing a greeting.

### Hour 6–14 — Critical path: live quiz with Finn voice
- **Person A:** lessons CRUD, dashboard endpoints fully wired, shop + inventory.
- **Person B:** full Quiz Module (generate + regen + score) + Betcha. Socket.IO room orchestration.
- **Person C:** Tempo screen, practice test lobby, quiz runner UI, Finn voice layer streaming questions, Betcha selector, results screen, confetti.

### Hour 14–20 — Polish & fill gaps
- **Person A:** professor analytics heatmap, space placement endpoints.
- **Person B:** scheduled Tempo firing, streak cron, edge case handling.
- **Person C:** Space visual layer, shop UI, inventory, animations, Coach session screen.

### Hour 20–23 — Demo prep
- Seed demo data: 2 sample courses, uploaded materials, pre-generated quizzes, 3 sample students at different streaks.
- Rehearse 3-minute demo at least 5 times.
- Record backup demo video (in case wifi dies).
- Verify every P0 user story works end-to-end.

### Hour 23–24 — Final rehearsal + submission
- Submit on DevPost / CitrusHack platform.
- Final rehearsal.
- Sleep if possible.

---

## 14. Demo Strategy

### 14.1 Target Tracks

Aim for 7 tracks with one build:
- **ElevenLabs** (main sponsor, primary target — voice-hosted quizzes, Coach, reactions)
- **Gemini API** (concept extraction, quiz generation, Coach reasoning)
- **Education** (core domain)
- **Social Impact & Accessibility** (reaches students who disengage, voice helps diverse learners)
- **UI/UX** (polish, Finn personality)
- **.Tech Domain** (deductible.tech)
- **Vultr** (deployment + infrastructure story)

### 14.2 3-Minute Pitch Structure

**Hook (20s):** Every college professor faces the same problem — students stop showing up. Not because the teaching is bad, but because Canvas can't compete with TikTok. We built the fix.

**Competitors (20s):** Name Canvas, Khanmigo, Quizlet, Classcraft briefly; identify the gap: none of them ship retention mechanics that feel like a modern consumer app.

**Demo (100s):** Live.
- Log in as student → Finn voice greets by name → show streak + dashboard
- Click into CS 141 → live Tempo window is open → place 3x Betcha → Finn reads question aloud → answer correctly → confetti, coins, streak up
- Show the Coach button → quick Finn voice conversation → concept explained
- Cut to Space → place a newly-bought item
- Switch to professor view → show concept heatmap → show the AI question review workflow

**Tech (20s):** Gemini for content reasoning, ElevenLabs for Finn, FastAPI on Vultr, fully abstract LLM provider + Quiz Module so we can swap any piece.

**Close (20s):** List target tracks, thank judges, invite questions.

### 14.3 Risk Mitigations for Demo

- Pre-record backup video during hour 22.
- Cache all static Finn voice lines as MP3s so static lines don't hit ElevenLabs during demo.
- Seed demo data thoroughly — do not rely on live AI generation during judging.
- Have a dev-mode "Fire Tempo Now" button so the scheduled-Tempo flow can be triggered on demand.
- Test on wifi at the venue at least once before judging.

---

## 15. Implementation Decisions

- **Single DB = Postgres.** Not Mongo, Dynamo, or MySQL. Single mental model for a 3-person team.
- **Single LLM interface, Ollama for dev, Gemini for demo via env var.** Do not hardcode providers anywhere except in the provider factory.
- **Quiz Module is fully abstract.** Both Tempo and Practice invoke it; neither knows about the other.
- **Concept weightages live in the quiz config snapshot, not on the concept record.** Same concept can carry different weightages in different quizzes.
- **Lesson → material_chunk linkage is backpopulated by the scheduler** after material processing completes.
- **Betcha is placed before the quiz starts and locked at first question reveal.** Never mid-quiz.
- **Tempo scheduling uses APScheduler inside the FastAPI app, not a separate worker.** Add a dev-mode override endpoint for demo.
- **Real-time via python-socketio, not FastAPI WebSockets.** Easier room management.
- **Streak uses UTC date boundaries.** Timezone-accurate streaks are out of scope.
- **Space uses click-to-place, not drag-and-drop.** Saves 4+ hours, demos identically.
- **Video ingestion is mocked.** Whisper integration is wired in the pipeline but returns fixture transcripts during demo.
- **Duel loser receives 20 coins (consolation).** No negative coin balance ever results from a duel.
- **Materials are parsed to chunks at upload time.** Lessons reference chunk ranges rather than storing duplicate content.
- **Questions retain a `generation_metadata` field** so any question can be regenerated with the same config.
- **Frontend uses DiceBear avatars, not a custom-built character editor.** Shop items are DiceBear config options.
- **Finn is 6 static PNGs + CSS animations, not sprite sheets.** Mouth-open/closed swap during voice playback is the talking animation.
- **The professor "approve" step is required.** Unapproved questions cannot be part of a published quiz.

---

## 16. Testing Decisions

For a 24-hour hackathon, exhaustive testing is out of scope, but the following are must-have smoke tests:

- **LLM provider contract test:** a simple integration test that asserts `get_llm().generate_text("hello")` returns a non-empty string. Catches env misconfiguration immediately.
- **Quiz Module generation test:** end-to-end call that generates a quiz from a fixture lesson, validates structure, and scores a fake attempt. Catches regressions in the core engine.
- **Betcha resolution test:** pure-function unit tests for 1x/3x/5x at boundary scores (69%, 70%, 89%, 90%, 100%). Easy to write, catches subtle bugs.
- **Socket room smoke test:** connects two clients to a room, sends answers, asserts both see the same state transitions. Catches real-time bugs before demo.
- **Dashboard endpoint smoke test:** hit as student and professor, assert 200 and expected shape.

Only test **external behavior**, not implementation details. If the LLM provider is swapped, tests should continue to pass because they use the interface.

---

## 17. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| ElevenLabs rate limits during demo | Demo dies silently | Cache all static voice lines; apply for ElevenLabs startup grant before hackathon; visit ElevenLabs booth first for credits |
| Gemini API rate limits | Quiz generation fails | Use Ollama locally for dev, Gemini Flash (generous free tier) for demo; set billing cap at $25 |
| LTI / Canvas integration attempted | Eats 6 hours, fails at hour 20 | Do not build LTI. Pitch as roadmap only. Show mockup screenshot. |
| Scope creep | Ships nothing polished | Cut list is final per this PRD. No revisits. |
| Video transcription delays | Demo freezes on upload | Mock Whisper for hackathon; fixture transcripts |
| Real-time socket bugs in live duel | Demo breaks during head-to-head | Rehearse duel flow 3+ times; have backup video |
| Wifi dies at demo time | Live ElevenLabs calls fail | Pre-recorded demo video; cached static voice lines |
| Merge conflicts on shared schema files | Blocks multiple people | Anti-overlap rules in §12.3; 10-minute coordination rule |
| Coin economy tuning feels off | Feedback from test users | Values in §7.9 are initial; tune during hour 14–20 polish window |

---

## 18. Out of Scope

Explicitly out of scope for this hackathon:

- Canvas / LMS / LTI integration (mockup only in pitch)
- Custom space design with drag-and-drop (replaced with click-to-place)
- Visiting other students' spaces (replaced with shareable PNG profile card)
- Multiple question types beyond MCQ (no fill-in-blank, no matching)
- Diagram generation in summaries
- Professor-set custom events and coin payouts
- Inter-college competition
- Native mobile apps (web only, Web Push for notifications)
- Real Whisper video transcription at demo time (mocked)
- Timezone-aware streak logic (UTC only)
- Full Rival matchmaking with ELO (basic duel invites only)
- Voice cloning of real professors
- Multi-language support (English only)
- Payment / monetization
- Admin panel for system management
- Email verification, password reset flows (minimal auth only)

---

## 19. Further Notes

### 19.1 Why this wins

Every choice in this PRD ladders up to four judge-facing wins:

1. **Cohesive product identity.** Finn is the through-line across every surface. Judges will remember Deductible after they stop judging.
2. **ElevenLabs usage isn't bolted on.** Finn is the interface. Voice is fired dozens of times in the demo. This is the strongest possible ElevenLabs track submission.
3. **Real AI workflow, not a demo.** Professor uploads real PDF → real concepts extracted → real quiz generated → real review flow → real scheduled firing. End-to-end AI content pipeline.
4. **Product maturity.** Abstract modules (LLM provider, Quiz Module, Betcha) signal senior engineering thinking. Judges notice.

### 19.2 Post-hackathon direction

If continued beyond the hackathon, the priorities would be:

- LTI 1.3 integration with Canvas (the "standalone but plugin-ready" architecture pays off here)
- Native mobile apps (Tempo notifications work dramatically better as push)
- RAG-based Coach using pgvector + material chunks
- Whisper video transcription pipeline (already wired, just mocked)
- Professor-facing analytics and intervention tools
- Studies with real professors at UCR (natural pilot partners given proximity)

### 19.3 Attribution

Core psychological mechanics adapted from:

- Duolingo (streak, forgiveness, daily habit formation)
- BeReal (synchronized window, reciprocity gate)
- Chess.com / Pokémon Showdown (on-demand matchmaking, ELO)
- Poker (confidence wagering — Betcha is original to Deductible)

Product name and mascot identity are original to this project.

---

**End of PRD. Version 2.0. Locked. Ship it.**
