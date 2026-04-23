/**
 * Mirrors backend ``engagement.realtime.protocol`` payloads (Socket.IO ``/quiz-room``).
 */

export type RoomMode = 'practice' | 'tempo' | 'duel'
export type RoomStatus = 'waiting' | 'active' | 'completed'

export type RoomJoinPayload = {
  room_id: string
  quiz_id: string
  mode: RoomMode
  attempt_id?: string | null
  display_name?: string | null
}

export type QuizStartPayload = { room_id: string }

export type QuizAnswerPayload = {
  question_id: string
  selected_choice: string
  time_taken_ms: number
}

export type RoomLeavePayload = { room_id: string }

export type ParticipantView = { user_id: string; display_name: string }

export type RoomStatePayload = {
  room_id: string
  quiz_id: string
  mode: RoomMode
  status: RoomStatus
  participants: ParticipantView[]
  current_question_index: number | null
  total_questions: number
  started_at?: string | null
  time_limit_sec?: number | null
  time_remaining_ms?: number | null
}

export type RoomErrorPayload = { code: string; message: string; detail?: Record<string, unknown> | null }

export type QuestionPublic = {
  question_id: string
  question_index: number
  total_questions: number
  text: string
  choices: { key?: string; text?: string }[]
  question_order: number
}

export type QuizQuestionPayload = { room_id: string; question: QuestionPublic }

export type QuizPeerAnsweredPayload = {
  room_id: string
  question_index: number
  peer_user_id: string
}

export type QuizNextPayload = {
  room_id: string
  previous_index: number | null
  next_index: number
}

export type QuizCompleteSummary = {
  correct_count: number
  total_questions: number
  score_pct: number
}

export type QuizCompletePayload = {
  room_id: string
  quiz_id: string
  attempt_id?: string | null
  mode: RoomMode
  summary: QuizCompleteSummary
  hint?: string
}

export type TempoFirePayload = {
  quiz_id: string
  course_id: string
  scheduled_at?: string | null
}
