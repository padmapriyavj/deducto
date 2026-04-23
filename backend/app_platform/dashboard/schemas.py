"""Pydantic schemas for dashboard endpoints."""

from typing import Any

from pydantic import BaseModel


# =============================================================================
# Student Dashboard Schemas
# =============================================================================


class StudentUserInfo(BaseModel):
    """User info subset for dashboard."""

    model_config = {"from_attributes": True}

    id: int
    display_name: str
    coins: int
    current_streak: int
    avatar_config: dict[str, Any]


class UpcomingEvent(BaseModel):
    """Upcoming quiz/tempo event."""

    id: str
    title: str
    date: str


class CompletedEvent(BaseModel):
    """Completed quiz with stats."""

    id: str
    title: str
    attempted: int
    correct: int
    wrong: int
    concepts: list[str]
    coins: int
    betcha: str | None


class StudentCourseStats(BaseModel):
    """Per-course stats for student dashboard."""

    id: int
    name: str
    tests_taken: int
    coins_earned: int
    top_weak_concept: str | None
    active_tempo: dict[str, Any] | None
    upcoming_events: list[UpcomingEvent]
    completed_events: list[CompletedEvent]


class StudentDashboardResponse(BaseModel):
    """Full student dashboard response."""

    user: StudentUserInfo
    courses: list[StudentCourseStats]


# =============================================================================
# Professor Dashboard Schemas
# =============================================================================


class ProfessorUserInfo(BaseModel):
    """User info subset for professor dashboard."""

    model_config = {"from_attributes": True}

    id: int
    display_name: str
    email: str


class ProfessorCourseOverview(BaseModel):
    """Per-course overview stats for professor dashboard."""

    id: int
    name: str
    enrollment_count: int
    tempos_scheduled: int
    class_avg_score: float | None


class ProfessorDashboardResponse(BaseModel):
    """Full professor dashboard response."""

    user: ProfessorUserInfo
    courses: list[ProfessorCourseOverview]


# =============================================================================
# Professor Course Analytics Schemas
# =============================================================================


class StudentAnalytics(BaseModel):
    """Per-student analytics for a course."""

    model_config = {"from_attributes": True}

    id: int
    display_name: str
    email: str
    avatar_config: dict[str, Any]
    coins: int
    current_streak: int
    quizzes_taken: int
    avg_score: float | None
    last_activity: str | None


class ConceptMasteryCell(BaseModel):
    """Single cell in concept heatmap: student x concept."""

    student_id: int
    concept_id: str
    concept_name: str
    mastery_score: float


class CourseAnalyticsResponse(BaseModel):
    """Full course analytics response for professor."""

    course_id: int
    course_name: str
    roster: list[StudentAnalytics]
    concept_heatmap: list[ConceptMasteryCell]
