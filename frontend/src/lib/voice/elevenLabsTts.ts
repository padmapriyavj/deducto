import { playBlobUrl } from '@/lib/voice/playback'

/** ElevenLabs `voice_settings.speed` bounds (REST TTS). */
const TTS_SPEED_MIN = 0.25
const TTS_SPEED_MAX = 4

function resolveTtsSpeed(): number {
  const raw = import.meta.env.VITE_ELEVENLABS_TTS_SPEED?.trim()
  const parsed = raw ? Number.parseFloat(raw) : Number.NaN
  if (!Number.isFinite(parsed)) return 1.1
  return Math.min(TTS_SPEED_MAX, Math.max(TTS_SPEED_MIN, parsed))
}

/**
 * ElevenLabs Text-to-Speech (HTTP API).
 * @see https://elevenlabs.io/docs/api-reference/text-to-speech
 */
export async function playElevenLabsTts(
  apiKey: string,
  voiceId: string,
  text: string,
): Promise<void> {
  const id = voiceId.trim()
  if (!id) {
    throw new Error(
      'ElevenLabs voice id is missing. Set VITE_ELEVENLABS_VOICE_ID or remove an empty value from .env.',
    )
  }
  const speed = resolveTtsSpeed()
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(id)}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { speed },
      }),
    },
  )
  if (!res.ok) {
    throw new Error((await res.text()) || 'ElevenLabs TTS request failed.')
  }
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  await playBlobUrl(objectUrl)
}
