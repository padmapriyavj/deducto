import secrets
import string
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from postgrest.exceptions import APIError
from app_platform.auth.dependencies import get_current_user
from database import get_supabase
from models.user import User

from .schemas import (
    CourseJoinInfo,
    CourseLeaderboardEntry,
    CourseResponse,
    CreateCourseRequest,
    EnrollRequest,
    StudentResponse,
    UpdateCourseRequest,
)

router = APIRouter(prefix="/api/v1/courses", tags=["courses"])

_JOIN_ALPHABET = string.ascii_uppercase + string.digits

_COURSE_SELECT = (
    "id,professor_id,name,description,schedule,join_code,created_at"
)
_STUDENT_SELECT = "id,email,display_name,avatar_config,coins,current_streak"


def _generate_join_code() -> str:
    return "".join(secrets.choice(_JOIN_ALPHABET) for _ in range(6))


def _course_row_or_404(course_id: int) -> dict:
    sb = get_supabase()
    try:
        res = sb.table("courses").select(_COURSE_SELECT).eq("id", course_id).single().execute()
    except APIError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return res.data


def _user_enrolled(user_id: int, course_id: int) -> bool:
    sb = get_supabase()
    r = (
        sb.table("enrollments")
        .select("id")
        .eq("user_id", user_id)
        .eq("course_id", course_id)
        .limit(1)
        .execute()
    )
    return bool(r.data)


def _is_unique_violation(exc: APIError) -> bool:
    err = str(exc).lower()
    return "duplicate" in err or "unique" in err or "23505" in err


@router.post("/", response_model=CourseResponse)
def create_course(
    body: CreateCourseRequest,
    current_user: Annotated[User, Depends(get_current_user)],
) -> CourseResponse:
    if current_user.role != "professor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Professor access required")

    sb = get_supabase()
    description = body.description
    for _ in range(20):
        join_code = _generate_join_code()
        try:
            ins = sb.table("courses").insert(
                {
                    "professor_id": current_user.id,
                    "name": body.name,
                    "description": description,
                    "schedule": body.schedule,
                    "join_code": join_code,
                }
            ).execute()
            return CourseResponse.model_validate(ins.data[0])
        except APIError as e:
            if _is_unique_violation(e):
                continue
            raise
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Could not allocate a unique join code",
    )


@router.get("/", response_model=list[CourseResponse])
def list_courses(
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[CourseResponse]:
    sb = get_supabase()
    if current_user.role == "professor":
        res = sb.table("courses").select(_COURSE_SELECT).eq("professor_id", current_user.id).execute()
        return [CourseResponse.model_validate(row) for row in (res.data or [])]

    enr = sb.table("enrollments").select("course_id").eq("user_id", current_user.id).execute()
    course_ids = [row["course_id"] for row in (enr.data or [])]
    if not course_ids:
        return []
    res = sb.table("courses").select(_COURSE_SELECT).in_("id", course_ids).execute()
    return [CourseResponse.model_validate(row) for row in (res.data or [])]


@router.get("/{course_id}/join-info", response_model=CourseJoinInfo)
def get_course_join_info(course_id: int) -> CourseJoinInfo:
    """Public: course id and name for shareable join links (no JWT)."""
    course = _course_row_or_404(course_id)
    return CourseJoinInfo(id=course["id"], name=course["name"])


@router.get("/{course_id}", response_model=CourseResponse)
def get_course(
    course_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
) -> CourseResponse:
    course = _course_row_or_404(course_id)
    if course["professor_id"] != current_user.id and not _user_enrolled(current_user.id, course_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return CourseResponse.model_validate(course)


@router.patch("/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: int,
    body: UpdateCourseRequest,
    current_user: Annotated[User, Depends(get_current_user)],
) -> CourseResponse:
    course = _course_row_or_404(course_id)
    if course["professor_id"] != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the course owner can update")

    data = body.model_dump(exclude_unset=True)
    if not data:
        return CourseResponse.model_validate(course)

    sb = get_supabase()
    try:
        upd = sb.table("courses").update(data).eq("id", course_id).execute()
    except APIError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not update course",
        ) from e
    if not upd.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not update course",
        )
    return CourseResponse.model_validate(upd.data[0])


@router.post("/{course_id}/enroll", response_model=CourseResponse)
def enroll_in_course(
    course_id: int,
    body: EnrollRequest,
    current_user: Annotated[User, Depends(get_current_user)],
) -> CourseResponse:
    if current_user.role != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student access required")

    course = _course_row_or_404(course_id)
    if body.join_code.strip().upper() != str(course["join_code"]).strip().upper():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid join code")

    sb = get_supabase()
    try:
        sb.table("enrollments").insert(
            {"user_id": current_user.id, "course_id": course_id}
        ).execute()
    except APIError as e:
        if _is_unique_violation(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Already enrolled in this course",
            ) from e
        raise

    return CourseResponse.model_validate(course)


@router.get("/{course_id}/students", response_model=list[StudentResponse])
def list_course_students(
    course_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[StudentResponse]:
    course = _course_row_or_404(course_id)
    is_professor = course["professor_id"] == current_user.id
    is_enrolled = _user_enrolled(current_user.id, course_id)

    if not is_professor and not is_enrolled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the course owner or enrolled students can view students",
        )

    sb = get_supabase()
    enr = sb.table("enrollments").select("user_id").eq("course_id", course_id).execute()
    user_ids = [row["user_id"] for row in (enr.data or [])]
    if not user_ids:
        return []
    res = sb.table("users").select(_STUDENT_SELECT).in_("id", user_ids).execute()
    return [StudentResponse.model_validate(row) for row in (res.data or [])]


def _get_quiz_ids_for_course(course_id: int) -> list[str]:
    """Get all quiz IDs associated with a course."""
    sb = get_supabase()
    res = sb.table("quizzes").select("id").eq("course_id", course_id).execute()
    return [str(row["id"]) for row in (res.data or [])]


def _get_course_coins_for_user(user_id: int, quiz_ids: list[str]) -> dict[str, int]:
    """Get total coins and tests taken for a user in a specific course."""
    if not quiz_ids:
        return {"course_coins": 0, "tests_taken": 0}
    sb = get_supabase()
    res = (
        sb.table("quiz_attempts")
        .select("id,coins_earned")
        .eq("user_id", int(user_id))
        .in_("quiz_id", quiz_ids)
        .not_.is_("completed_at", "null")
        .execute()
    )
    rows = res.data or []
    tests_taken = len(rows)
    course_coins = sum(int(r.get("coins_earned") or 0) for r in rows)
    return {"course_coins": course_coins, "tests_taken": tests_taken}


@router.get("/{course_id}/leaderboard", response_model=list[CourseLeaderboardEntry])
def get_course_leaderboard(
    course_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[CourseLeaderboardEntry]:
    """Get course leaderboard ranked by coins earned in this course."""
    course = _course_row_or_404(course_id)
    is_professor = course["professor_id"] == current_user.id
    is_enrolled = _user_enrolled(current_user.id, course_id)

    if not is_professor and not is_enrolled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the course owner or enrolled students can view the leaderboard",
        )

    sb = get_supabase()
    enr = sb.table("enrollments").select("user_id").eq("course_id", course_id).execute()
    user_ids = [row["user_id"] for row in (enr.data or [])]
    if not user_ids:
        return []

    users_res = sb.table("users").select(_STUDENT_SELECT).in_("id", user_ids).execute()
    users = {row["id"]: row for row in (users_res.data or [])}

    quiz_ids = _get_quiz_ids_for_course(course_id)

    entries = []
    for user_id in user_ids:
        user = users.get(user_id)
        if not user:
            continue
        stats = _get_course_coins_for_user(user_id, quiz_ids)
        entries.append(
            CourseLeaderboardEntry(
                id=user["id"],
                email=user["email"],
                display_name=user["display_name"],
                avatar_config=user.get("avatar_config") or {},
                course_coins=stats["course_coins"],
                tests_taken=stats["tests_taken"],
            )
        )

    entries.sort(key=lambda e: e.course_coins, reverse=True)
    return entries
