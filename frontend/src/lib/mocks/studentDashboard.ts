export type StudentEventMock = {
  id: string
  title: string
  date: string
}

export type StudentCompletedEventMock = {
  id: string
  title: string
  attempted: number
  correct: number
  wrong: number
  concepts: string[]
  coins: number
  betcha: string
}

export type StudentCourseMock = {
  id: string
  name: string
  testsTaken: number
  coinsFromCourse: number
  topWeakConcept: string
  tempoLive: boolean
  upcomingEvents: StudentEventMock[]
  completedEvents: StudentCompletedEventMock[]
}

export type StudentDashboardMock = {
  streakDays: number
  coins: number
  courses: StudentCourseMock[]
}

export const studentDashboardFixture: StudentDashboardMock = {
  streakDays: 7,
  coins: 420,
  courses: [
    {
      id: 'c1',
      name: 'CS 101 — Discrete Structures',
      testsTaken: 5,
      coinsFromCourse: 120,
      topWeakConcept: 'Graph traversals',
      tempoLive: true,
      upcomingEvents: [
        { id: 'e1', title: 'Weekly Tempo', date: 'Tomorrow · 6:00 PM' },
        { id: 'e2', title: 'Practice window', date: 'Fri · All day' },
      ],
      completedEvents: [
        {
          id: 'd1',
          title: 'Tempo · Week 3',
          attempted: 12,
          correct: 9,
          wrong: 3,
          concepts: ['Sets', 'Proofs', 'Induction'],
          coins: 45,
          betcha: 'Won 20 coins (medium wager)',
        },
      ],
    },
    {
      id: 'c2',
      name: 'MATH 10A — Calculus',
      testsTaken: 2,
      coinsFromCourse: 55,
      topWeakConcept: 'Chain rule',
      tempoLive: false,
      upcomingEvents: [{ id: 'e3', title: 'Midterm review Tempo', date: 'Mon · 5:30 PM' }],
      completedEvents: [],
    },
  ],
}
