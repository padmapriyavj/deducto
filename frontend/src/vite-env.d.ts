/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  /**
   * HTTP(S) origin for Socket.IO when it differs from `VITE_API_BASE_URL` (no trailing slash).
   * Defaults to `VITE_API_BASE_URL` for `/quiz-room` (PRD §8.4).
   */
  readonly VITE_WS_BASE_URL?: string
  /** Optional override when generating types from a running FastAPI instance. */
  readonly VITE_OPENAPI_URL?: string
  /** Force mock auth even when `VITE_API_BASE_URL` is set. */
  readonly VITE_AUTH_MOCK?: string

  /** ElevenLabs TTS (PRD §8.1). Prefer proxy in production; browser key is dev/hackathon only. */
  readonly VITE_ELEVENLABS_API_KEY?: string
  readonly VITE_ELEVENLABS_VOICE_ID?: string
  /** TTS playback speed (default 1.1). ElevenLabs allows roughly 0.25–4. */
  readonly VITE_ELEVENLABS_TTS_SPEED?: string
  /** Conversational AI agent id for Coach (PRD §7.8). */
  readonly VITE_ELEVENLABS_AGENT_ID?: string

  /**
   * Cached audio URLs (PRD §14.3) — optional per Finn line; skip API when set.
   * `VITE_FINN_GREETING_AUDIO_URL` remains supported for first-login / greeting.
   */
  readonly VITE_FINN_GREETING_AUDIO_URL?: string
  readonly VITE_VOICE_CACHE_FIRST_LOGIN_URL?: string
  readonly VITE_VOICE_CACHE_BEFORE_TEMPO_URL?: string
  readonly VITE_VOICE_CACHE_TEMPO_PING_URL?: string
  readonly VITE_VOICE_CACHE_END_QUIZ_URL?: string
  readonly VITE_VOICE_CACHE_DUEL_INTRO_URL?: string
  /** Optional static clip; ignores dynamic question text when set (demo only). */
  readonly VITE_VOICE_CACHE_QUIZ_QUESTION_READ_URL?: string
  readonly VITE_VOICE_CACHE_WRONG_ANSWER_REFRAME_URL?: string
  readonly VITE_VOICE_CACHE_DUEL_QUESTION_READ_URL?: string
  readonly VITE_VOICE_CACHE_DUEL_PEER_COMMENTARY_URL?: string
  readonly VITE_VOICE_CACHE_DUEL_WINNER_CALLOUT_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
