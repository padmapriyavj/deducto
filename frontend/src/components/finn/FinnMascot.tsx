import { motion } from 'framer-motion'

export type FinnMood =
  | 'neutral'
  | 'thinking'
  | 'celebrating'
  | 'concerned'
  | 'speaking'
  | 'sleeping'

type Props = {
  mood: FinnMood
  /** Extra animation when Finn is reading lines aloud */
  isSpeaking?: boolean
  className?: string
  /** Display width/height in CSS pixels (SVGs are square). */
  size?: number
}

function publicMascotUrl(filename: string): string {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
  return `${base}mascot/${filename}`
}

/** Kit the fox artwork in `public/mascot/`. */
function mascotSrc(mood: FinnMood, isSpeaking: boolean): string {
  if (mood !== 'sleeping' && (isSpeaking || mood === 'speaking')) {
    return publicMascotUrl('kit-talking.svg')
  }
  const file: Record<FinnMood, string> = {
    neutral: 'kit-happy.svg',
    thinking: 'kit-thinking.svg',
    celebrating: 'kit-celebrating.svg',
    concerned: 'kit-confused.svg',
    speaking: 'kit-talking.svg',
    sleeping: 'kit-sleeping.svg',
  }
  return publicMascotUrl(file[mood])
}

export function FinnMascot({ mood = "celebrating", isSpeaking = false, className = '', size = 120 }: Props) {
  const src = mascotSrc(mood, isSpeaking)

  return (
    <div
      className={`relative inline-flex flex-col items-center ${className}`}
      aria-label={`Finn the fox, ${mood} mood`}
    >
      <motion.div
        animate={
          mood === 'celebrating'
            ? { y: [0, -4, 0], rotate: [0, -2, 2, 0] }
            : mood === 'sleeping'
              ? { y: [0, 1, 0] }
              : { y: 0, rotate: 0 }
        }
        transition={{
          duration: mood === 'celebrating' ? 0.9 : 3.2,
          repeat: mood === 'celebrating' || mood === 'sleeping' ? Infinity : 0,
          ease: 'easeInOut',
        }}
        className="drop-shadow-md"
      >
        <img
          src={src}
          width={size}
          height={size}
          alt=""
          className="pointer-events-none block select-none"
          decoding="async"
          draggable={false}
        />
      </motion.div>
      {/* <p className="text-foreground/70 mt-1 font-mono text-[0.65rem] uppercase tracking-widest">
        {mood}
      </p> */}
    </div>
  )
}
