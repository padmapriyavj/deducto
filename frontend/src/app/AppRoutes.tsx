import { Route, Routes } from 'react-router'

import { RequireAuth } from '@/components/auth/RequireAuth'
import { AppShell } from '@/components/layout/AppShell'
import { ConceptReviewPage } from '@/routes/ConceptReviewPage'
import { CreateLessonPage } from '@/routes/CreateLessonPage'
import { DuelVoicePreviewPage } from '@/routes/DuelVoicePreviewPage'
import { JoinCoursePage } from '@/routes/JoinCoursePage'
import { LeaderboardPage } from '@/routes/LeaderboardPage'
import { LessonViewPage } from '@/routes/LessonViewPage'
import { NotFoundPage } from '@/routes/NotFoundPage'
import { PublicSpacePage } from '@/routes/PublicSpacePage'
import { QuizReviewPage } from '@/routes/QuizReviewPage'
import { RootRedirect } from '@/routes/RootRedirect'
import { LoginPage } from '@/routes/LoginPage'
import { PracticeHubPage } from '@/routes/PracticeHubPage'
import { PracticeLobbyPage } from '@/routes/PracticeLobbyPage'
import { ProfessorCoursePage } from '@/routes/ProfessorCoursePage'
import { ProfessorDashboardPage } from '@/routes/ProfessorDashboardPage'
import { QuizResultsPage } from '@/routes/QuizResultsPage'
import { QuizRunnerPage } from '@/routes/QuizRunnerPage'
import { SettingsPage } from '@/routes/SettingsPage'
import { SignupPage } from '@/routes/SignupPage'
import { StudentCoursePage } from '@/routes/StudentCoursePage'
import { StudentDashboardPage } from '@/routes/StudentDashboardPage'
import { StudentShopPage } from '@/routes/StudentShopPage'
import { StudentSpacePage } from '@/routes/StudentSpacePage'
import { TempoScreenPage } from '@/routes/TempoScreenPage'
import { WeightageFormPage } from '@/routes/WeightageFormPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<RootRedirect />} />
        <Route path="join/:courseId" element={<JoinCoursePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route path="space/:userId" element={<PublicSpacePage />} />

        <Route element={<RequireAuth allowedRoles={['student', 'professor']} />}>
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route element={<RequireAuth allowedRoles={['student']} />}>
          <Route path="student" element={<StudentDashboardPage />} />
          <Route path="student/course/:courseId" element={<StudentCoursePage />} />
          <Route path="student/course/:courseId/lesson/:lessonId" element={<LessonViewPage />} />
          <Route path="student/course/:courseId/leaderboard" element={<LeaderboardPage />} />
          <Route path="student/shop" element={<StudentShopPage />} />
          <Route path="student/space" element={<StudentSpacePage />} />
          <Route path="student/practice" element={<PracticeHubPage />} />
          <Route path="student/practice/lobby/:courseId" element={<PracticeLobbyPage />} />
          <Route path="student/quiz/:roomId/results" element={<QuizResultsPage />} />
          <Route path="student/quiz/:roomId" element={<QuizRunnerPage />} />
          <Route path="student/tempo/:instanceId" element={<TempoScreenPage />} />
          <Route path="student/practice/duel-voice-preview" element={<DuelVoicePreviewPage />} />
        </Route>

        <Route element={<RequireAuth allowedRoles={['professor']} />}>
          <Route path="professor" element={<ProfessorDashboardPage />} />
          <Route path="professor/course/:courseId" element={<ProfessorCoursePage />} />
          <Route path="professor/course/:courseId/lessons/new" element={<CreateLessonPage />} />
          <Route path="professor/lesson/:lessonId/concepts" element={<ConceptReviewPage />} />
          <Route path="professor/lesson/:lessonId/weightage" element={<WeightageFormPage />} />
          <Route path="professor/quiz/:quizId/review" element={<QuizReviewPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
