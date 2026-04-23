/** Play remote audio (cached MP3/WAV per PRD §14.3). */
export async function playFromUrl(url: string): Promise<void> {
  const audio = new Audio(url)
  audio.crossOrigin = 'anonymous'
  await audio.play()
  await new Promise<void>((resolve, reject) => {
    audio.onended = () => resolve()
    audio.onerror = () => reject(new Error('Could not play audio from URL.'))
  })
}

/** Play in-memory blob as audio (e.g. ElevenLabs MP3). */
export async function playBlobUrl(objectUrl: string): Promise<void> {
  try {
    const audio = new Audio(objectUrl)
    await audio.play()
    await new Promise<void>((resolve, reject) => {
      audio.onended = () => resolve()
      audio.onerror = () => reject(new Error('Could not play synthesized audio.'))
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export function playSpeechFallback(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 0.95
    u.onend = () => resolve()
    u.onerror = () => reject(new Error('Speech synthesis is unavailable.'))
    window.speechSynthesis.speak(u)
  })
}
