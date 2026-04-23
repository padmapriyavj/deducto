export type ProfessorStudentRowMock = {
  id: string
  displayName: string
  summary: string
}

export type ProfessorCourseMock = {
  id: string
  name: string
  enrollment: number
  temposScheduled: number
  classAvgPct: number
  roster: ProfessorStudentRowMock[]
  /** 0–1 mastery per concept label for heatmap demo */
  heatmap: { concept: string; mastery: number }[]
}

export type ProfessorDashboardMock = {
  courses: ProfessorCourseMock[]
}

export const professorDashboardFixture: ProfessorDashboardMock = {
  courses: [
    {
      id: 'pc1',
      name: 'CS 101 — Discrete Structures',
      enrollment: 48,
      temposScheduled: 3,
      classAvgPct: 78,
      roster: [
        { id: 's1', displayName: 'Alex M.', summary: 'Strong on logic; review graphs' },
        { id: 's2', displayName: 'Jordan K.', summary: 'Improving; attends Tempos' },
        { id: 's3', displayName: 'Sam R.', summary: 'At risk on proofs' },
      ],
      heatmap: [
        { concept: 'Sets', mastery: 0.82 },
        { concept: 'Proofs', mastery: 0.61 },
        { concept: 'Graphs', mastery: 0.55 },
        { concept: 'Induction', mastery: 0.7 },
        { concept: 'Combinatorics', mastery: 0.48 },
      ],
    },
    {
      id: 'pc2',
      name: 'MATH 10A — Calculus',
      enrollment: 120,
      temposScheduled: 1,
      classAvgPct: 71,
      roster: [
        { id: 's4', displayName: 'Riley P.', summary: 'Solid on limits' },
        { id: 's5', displayName: 'Casey L.', summary: 'Needs derivatives practice' },
      ],
      heatmap: [
        { concept: 'Limits', mastery: 0.74 },
        { concept: 'Derivatives', mastery: 0.52 },
        { concept: 'Integrals', mastery: 0.58 },
      ],
    },
  ],
}
