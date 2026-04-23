export type BetchaMultiplier = 1 | 3 | 5

export type QuizRunMode = 'solo' | 'duel' | 'tempo'

export type MockQuestion = {
  id: string
  prompt: string
  choices: string[]
  correctIndex: number
}

export const mockQuizQuestions: MockQuestion[] = [
  {
    id: 'q1',
    prompt: 'Which of the following best describes a directed graph?',
    choices: [
      'Edges have no direction',
      'Edges point from one vertex to another',
      'Every vertex has the same degree',
      'There are no cycles allowed',
    ],
    correctIndex: 1,
  },
  {
    id: 'q2',
    prompt: 'What is the time complexity of binary search on a sorted array?',
    choices: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
    correctIndex: 1,
  },
  {
    id: 'q3',
    prompt: 'Induction proofs require which two steps?',
    choices: [
      'Base case and inductive step',
      'Hypothesis and conclusion',
      'Lemma and corollary',
      'Premise and contradiction',
    ],
    correctIndex: 0,
  },
]

/** When set, quiz runner calls scoring / Betcha APIs (requires real ``quiz_attempts`` row). */
export type QuizRunApiContext = {
  quizId: string
  attemptId: string
}

/** Socket.IO ``/quiz-room`` session (``room:join`` + server-driven questions). */
export type QuizRealtimeContext = {
  quizId: string
  mode: QuizRunMode
  attemptId?: string
}

export type QuizRunLocationState = {
  mode: QuizRunMode
  betcha: BetchaMultiplier
  lessonId: string
  courseName?: string
  /** Optional server-backed quiz session */
  api?: QuizRunApiContext
  /** Live quiz room (duel / tempo / practice with backend). */
  realtime?: QuizRealtimeContext
}

export type QuizResultsLocationState = {
  mode: QuizRunMode
  betcha: BetchaMultiplier
  correctCount: number
  totalQuestions: number
  coinsEarned: number
  betchaOutcome: string
  /** Server scoring/Betcha failed; coins shown may not match your profile. */
  serverScoringFailed?: boolean
}
