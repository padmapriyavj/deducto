/**
 * Finn voice — PRD alignment (Deductible-PRD.md)
 *
 * §7.8 Finn the Coach (Voice AI) — trigger moments:
 * - First login of the day: warm greeting with streak reference
 * - Before a Tempo: announcement
 * - During Tempo / practice: reads each question; reacts to answers
 * - After a wrong answer: gentle reframe
 * - End of quiz: voice summary with concept breakdown
 * - On-demand Coach: ElevenLabs Conversational AI (see coachSession.ts)
 *
 * §7.4 Tempo — Finn voice ping + reads questions in session.
 * §7.5 Practice / duel — primary ElevenLabs showcase; Finn hosts entire live duel
 *   (intro, questions, peer commentary, winner).
 *
 * §14.3 Demo mitigations — prefer cached MP3 URLs (see voiceCache.ts) for
 * static lines during judging; ElevenLabs TTS when cache/API appropriate.
 */

/** Stable ids for cache lookup and analytics (not shown to users). */
export type FinnVoiceTrigger =
  | 'first_login_of_day'
  | 'before_tempo'
  | 'tempo_voice_ping'
  | 'during_quiz_question_read'
  | 'wrong_answer_reframe'
  | 'end_quiz_summary'
  | 'duel_intro'
  | 'duel_question_read'
  | 'duel_peer_commentary'
  | 'duel_winner_callout'

export const DEFAULT_FIRST_LOGIN_GREETING =
  "Hey there, I'm Finn! Welcome to Deducto. Whenever you're ready, we'll learn together — one small step at a time."
