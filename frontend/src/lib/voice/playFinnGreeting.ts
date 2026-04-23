import { DEFAULT_FIRST_LOGIN_GREETING } from '@/lib/voice/prdTriggers'
import { playFinnVoiceLine } from '@/lib/voice/playFinnLine'

/** PRD §7.8 — first login of the day greeting (dashboard POC). */
export function playFinnGreeting(): Promise<void> {
  return playFinnVoiceLine({
    trigger: 'first_login_of_day',
    text: DEFAULT_FIRST_LOGIN_GREETING,
  })
}
