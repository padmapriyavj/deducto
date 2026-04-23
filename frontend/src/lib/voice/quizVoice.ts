/**
 * Finn lines for live quiz flows — call from QuizRunner / socket handlers (PRD §7.6, §8.4).
 * §7.4 Tempo and §7.5 practice (solo + duel) share the same runner; duel lines match
 * the flagship “Finn hosts the duel” showcase.
 */

import { playFinnVoiceLine } from '@/lib/voice/playFinnLine'

export async function speakBeforeTempoAnnouncement(text: string): Promise<void> {
  await playFinnVoiceLine({ trigger: 'before_tempo', text })
}

export async function speakTempoVoicePing(text: string): Promise<void> {
  await playFinnVoiceLine({ trigger: 'tempo_voice_ping', text })
}

export async function speakQuizQuestionRead(text: string): Promise<void> {
  await playFinnVoiceLine({ trigger: 'during_quiz_question_read', text })
}

export async function speakWrongAnswerReframe(text: string): Promise<void> {
  await playFinnVoiceLine({ trigger: 'wrong_answer_reframe', text })
}

export async function speakEndQuizSummary(text: string): Promise<void> {
  await playFinnVoiceLine({ trigger: 'end_quiz_summary', text })
}

export async function speakDuelIntro(text: string): Promise<void> {
  await playFinnVoiceLine({ trigger: 'duel_intro', text })
}

export async function speakDuelQuestionRead(text: string): Promise<void> {
  await playFinnVoiceLine({ trigger: 'duel_question_read', text })
}

export async function speakDuelPeerCommentary(text: string): Promise<void> {
  await playFinnVoiceLine({ trigger: 'duel_peer_commentary', text })
}

export async function speakDuelWinnerCallout(text: string): Promise<void> {
  await playFinnVoiceLine({ trigger: 'duel_winner_callout', text })
}
