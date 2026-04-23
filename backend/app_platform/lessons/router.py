from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from postgrest.exceptions import APIError

from app_platform.auth.dependencies import get_current_user
from database import get_supabase
from models.user import User

from .schemas import CreateLessonRequest, LessonResponse, UpdateLessonRequest

router = APIRouter(prefix="/api/v1", tags=["lessons"])

_LESSON_SELECT = "id,course_id,title,week_number,material_id,created_at,updated_at"
_COURSE_SELECT = "id,professor_id"


def _course_row_or_404(course_id: int) -> dict:
    sb = get_supabase()
    try:
        res = sb.table("courses").select(_COURSE_SELECT).eq("id", course_id).single().execute()
    except APIError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return res.data


def _lesson_row_or_404(lesson_id: int) -> dict:
    sb = get_supabase()
    try:
        res = sb.table("lessons").select(_LESSON_SELECT).eq("id", lesson_id).single().execute()
    except APIError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
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


@router.post("/courses/{course_id}/lessons", response_model=LessonResponse)
def create_lesson(
    course_id: int,
    body: CreateLessonRequest,
    current_user: Annotated[User, Depends(get_current_user)],
) -> LessonResponse:
    if current_user.role != "professor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Professor access required")

    course = _course_row_or_404(course_id)
    if course["professor_id"] != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the course owner can create lessons")

    sb = get_supabase()
    try:
        ins = sb.table("lessons").insert({
            "course_id": course_id,
            "title": body.title,
            "week_number": body.week_number,
            "material_id": None,
        }).execute()
    except APIError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not create lesson",
        ) from e

    if not ins.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Lesson creation failed",
        )

    return LessonResponse.model_validate(ins.data[0])


@router.get("/courses/{course_id}/lessons", response_model=list[LessonResponse])
def list_lessons(
    course_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[LessonResponse]:
    course = _course_row_or_404(course_id)
    if course["professor_id"] != current_user.id and not _user_enrolled(current_user.id, course_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    sb = get_supabase()
    res = (
        sb.table("lessons")
        .select(_LESSON_SELECT)
        .eq("course_id", course_id)
        .order("week_number")
        .execute()
    )
    return [LessonResponse.model_validate(row) for row in (res.data or [])]


@router.get("/lessons/{lesson_id}", response_model=LessonResponse)
def get_lesson(
    lesson_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
) -> LessonResponse:
    lesson = _lesson_row_or_404(lesson_id)
    return LessonResponse.model_validate(lesson)


@router.patch("/lessons/{lesson_id}", response_model=LessonResponse)
def update_lesson(
    lesson_id: int,
    body: UpdateLessonRequest,
    current_user: Annotated[User, Depends(get_current_user)],
) -> LessonResponse:
    if current_user.role != "professor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Professor access required")

    lesson = _lesson_row_or_404(lesson_id)
    course = _course_row_or_404(lesson["course_id"])

    if course["professor_id"] != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the course owner can update lessons")

    data = body.model_dump(exclude_unset=True)
    if not data:
        return LessonResponse.model_validate(lesson)

    sb = get_supabase()
    try:
        upd = sb.table("lessons").update(data).eq("id", lesson_id).execute()
    except APIError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not update lesson",
        ) from e

    if not upd.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not update lesson",
        )

    return LessonResponse.model_validate(upd.data[0])
