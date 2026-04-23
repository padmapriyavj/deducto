"""Dashboard API routes."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app_platform.auth.dependencies import get_current_user
from models.user import User

from .schemas import CourseAnalyticsResponse, ProfessorDashboardResponse, StudentDashboardResponse
from .service import (
    build_course_analytics,
    build_professor_dashboard,
    build_student_dashboard,
    get_course_if_owned,
)

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("/student", response_model=StudentDashboardResponse)
def get_student_dashboard(
    current_user: Annotated[User, Depends(get_current_user)],
) -> StudentDashboardResponse:
    """Get dashboard data for the current student."""
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student access required",
        )
    return build_student_dashboard(current_user)


@router.get("/professor", response_model=ProfessorDashboardResponse)
def get_professor_dashboard(
    current_user: Annotated[User, Depends(get_current_user)],
) -> ProfessorDashboardResponse:
    """Get dashboard data for the current professor."""
    if current_user.role != "professor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Professor access required",
        )
    return build_professor_dashboard(current_user)


@router.get("/professor/courses/{course_id}/analytics", response_model=CourseAnalyticsResponse)
def get_course_analytics(
    course_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
) -> CourseAnalyticsResponse:
    """Get detailed analytics for a specific course (roster + concept heatmap)."""
    if current_user.role != "professor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Professor access required",
        )

    course = get_course_if_owned(course_id, current_user.id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or access denied",
        )

    return build_course_analytics(course_id, course)
