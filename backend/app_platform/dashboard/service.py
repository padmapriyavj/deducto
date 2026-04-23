"""Business logic for dashboard endpoints.

Data model (Deductible-PRD §9): ``quizzes``, ``quiz_attempts``, ``answers``, ``questions``,
``concepts``, ``lessons``, ``user_concept_mastery``. Tempos are ``quizzes.type == 'tempo'``
with optional ``scheduled_at`` / ``duration_sec``.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from database import get_supabase
from models.user import User

from .schemas import (
    CompletedEvent,
    ConceptMasteryCell,
    CourseAnalyticsResponse,
    ProfessorCourseOverview,
    ProfessorDashboardResponse,
    ProfessorUserInfo,
    StudentAnalytics,
    StudentCourseStats,
    StudentDashboardResponse,
    StudentUserInfo,
    UpcomingEvent,
)

_COURSE_SELECT = "id,name"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _quiz_ids_for_course(sb: Any, course_id: int) -> list[int]:
    """All quiz primary keys for a course (practice + tempo)."""
    res = sb.table("quizzes").select("id").eq("course_id", int(course_id)).execute()
    return [int(row["id"]) for row in (res.data or [])]


def _concept_ids_for_course(sb: Any, course_id: int) -> list[str]:
    """Concept ids linked to this course via lessons (for mastery / weak-concept)."""
    lessons_res = sb.table("lessons").select("id").eq("course_id", int(course_id)).execute()
    lesson_ids = [row["id"] for row in (lessons_res.data or [])]
    if not lesson_ids:
        return []
    concepts_res = sb.table("concepts").select("id").in_("lesson_id", lesson_ids).execute()
    return [str(c["id"]) for c in (concepts_res.data or [])]


def _lesson_title(sb: Any, lesson_id: Any) -> str | None:
    if lesson_id is None:
        return None
    lr = sb.table("lessons").select("title").eq("id", int(lesson_id)).limit(1).execute()
    if lr.data:
        return str(lr.data[0].get("title") or "").strip() or None
    return None


def _tempo_title_for_quiz(sb: Any, quiz_row: dict[str, Any]) -> str:
    """Human-readable label for a tempo row."""
    lid = quiz_row.get("lesson_id")
    if lid is not None:
        t = _lesson_title(sb, lid)
        if t:
            return f"Tempo · {t}"
    return f"Tempo quiz {quiz_row.get('id')}"


def _quiz_display_title(sb: Any, quiz_row: dict[str, Any]) -> str:
    """Title for completed-event / history rows."""
    qtype = str(quiz_row.get("type") or "practice")
    lid = quiz_row.get("lesson_id")
    if lid is not None:
        t = _lesson_title(sb, lid)
        if t:
            if qtype == "tempo":
                return f"Tempo · {t}"
            return f"Practice · {t}"
    return f"Quiz {quiz_row.get('id')}"


def _get_enrolled_courses(user_id: int) -> list[dict[str, Any]]:
    """Get courses the student is enrolled in."""
    sb = get_supabase()
    enr = sb.table("enrollments").select("course_id").eq("user_id", user_id).execute()
    course_ids = [row["course_id"] for row in (enr.data or [])]
    if not course_ids:
        return []
    res = sb.table("courses").select(_COURSE_SELECT).in_("id", course_ids).execute()
    return list(res.data or [])


def _get_course_stats(user_id: int, course_id: int) -> dict[str, Any]:
    """
    Aggregate quiz stats for a student in a course.

    ``tests_taken``: completed attempts (``quiz_attempts.completed_at`` set).
    ``coins_earned``: sum of ``coins_earned`` on those attempts (PRD §9 ``quiz_attempts``).
    """
    sb = get_supabase()
    quiz_ids = _quiz_ids_for_course(sb, course_id)
    if not quiz_ids:
        return {"tests_taken": 0, "coins_earned": 0}

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
    coins_earned = sum(int(r.get("coins_earned") or 0) for r in rows)
    return {"tests_taken": tests_taken, "coins_earned": coins_earned}


def _get_top_weak_concept(user_id: int, course_id: int) -> str | None:
    """
    Lowest ``mastery_score`` in ``user_concept_mastery`` among concepts belonging to this course.
    """
    sb = get_supabase()
    cids = _concept_ids_for_course(sb, course_id)
    if not cids:
        return None

    res = (
        sb.table("user_concept_mastery")
        .select("concept_id,mastery_score")
        .eq("user_id", int(user_id))
        .in_("concept_id", cids)
        .execute()
    )
    rows = res.data or []
    if not rows:
        return None

    def score(row: dict[str, Any]) -> float:
        raw = row.get("mastery_score")
        if raw is None:
            return 0.0
        try:
            return float(raw)
        except (TypeError, ValueError):
            return 0.0

    weakest = min(rows, key=score)
    cid = weakest.get("concept_id")
    if cid is None:
        return None
    cres = sb.table("concepts").select("name").eq("id", cid).limit(1).execute()
    if cres.data:
        name = str(cres.data[0].get("name") or "").strip()
        return name or None
    return None


def _get_active_tempo(course_id: int) -> dict[str, Any] | None:
    """
    A **joinable** published Tempo for this course: no start time, or ``scheduled_at`` has passed
    (same idea as ``list_joinable_tempos``). Used for “live” indicators on the student dashboard.
    """
    sb = get_supabase()
    now = _now_iso()
    res = (
        sb.table("quizzes")
        .select("id,course_id,scheduled_at,duration_sec,lesson_id,config")
        .eq("course_id", int(course_id))
        .eq("type", "tempo")
        .eq("status", "published")
        .execute()
    )
    candidates: list[dict[str, Any]] = []
    for r in res.data or []:
        sat = r.get("scheduled_at")
        if sat is None or str(sat).strip() == "":
            candidates.append(r)
        elif str(sat) <= now:
            candidates.append(r)
    if not candidates:
        return None
    candidates.sort(key=lambda x: str(x.get("scheduled_at") or ""), reverse=True)
    q = candidates[0]
    qid = int(q["id"])
    return {
        "quiz_id": qid,
        "title": _tempo_title_for_quiz(sb, q),
        "scheduled_at": q.get("scheduled_at"),
        "duration_sec": q.get("duration_sec"),
    }


def _get_upcoming_events(user_id: int, course_id: int) -> list[UpcomingEvent]:
    """
    Published Tempos for this course with ``scheduled_at`` strictly in the future (UTC string compare).
    ``user_id`` reserved for future filtering (e.g. notifications); not used yet.
    """
    _ = user_id
    sb = get_supabase()
    now = _now_iso()
    res = (
        sb.table("quizzes")
        .select("id,scheduled_at,lesson_id")
        .eq("course_id", int(course_id))
        .eq("type", "tempo")
        .eq("status", "published")
        .execute()
    )
    rows = [r for r in (res.data or []) if r.get("scheduled_at") and str(r["scheduled_at"]) > now]
    rows.sort(key=lambda x: str(x.get("scheduled_at") or ""))
    out: list[UpcomingEvent] = []
    for r in rows[:25]:
        title = _tempo_title_for_quiz(sb, r)
        date = str(r["scheduled_at"])
        out.append(UpcomingEvent(id=str(r["id"]), title=title, date=date))
    return out


def _get_completed_events(user_id: int, course_id: int) -> list[CompletedEvent]:
    """
    Recent completed attempts for this student in this course, with per-attempt stats from ``answers``
    and concept names from ``questions`` → ``concepts``.
    """
    sb = get_supabase()
    quiz_ids = _quiz_ids_for_course(sb, course_id)
    if not quiz_ids:
        return []

    att_res = (
        sb.table("quiz_attempts")
        .select("id,quiz_id,completed_at,coins_earned,betcha_multiplier")
        .eq("user_id", int(user_id))
        .in_("quiz_id", quiz_ids)
        .not_.is_("completed_at", "null")
        .order("completed_at", desc=True)
        .limit(50)
        .execute()
    )
    attempts = att_res.data or []
    if not attempts:
        return []

    attempt_ids = [int(a["id"]) for a in attempts]
    ans_res = (
        sb.table("answers")
        .select("attempt_id,question_id,is_correct")
        .in_("attempt_id", attempt_ids)
        .execute()
    )
    answers_by_attempt: dict[int, list[dict[str, Any]]] = {}
    for row in ans_res.data or []:
        aid = int(row["attempt_id"])
        answers_by_attempt.setdefault(aid, []).append(row)

    qids: set[int] = set()
    for rows in answers_by_attempt.values():
        for row in rows:
            qids.add(int(row["question_id"]))

    q_to_concept_name: dict[int, str] = {}
    if qids:
        qres = sb.table("questions").select("id,concept_id").in_("id", list(qids)).execute()
        concept_ids: set[int] = set()
        for q in qres.data or []:
            cid = q.get("concept_id")
            if cid is not None and cid != "":
                concept_ids.add(int(cid))
        id_to_name: dict[int, str] = {}
        if concept_ids:
            cres = sb.table("concepts").select("id,name").in_("id", list(concept_ids)).execute()
            for c in cres.data or []:
                id_to_name[int(c["id"])] = str(c.get("name") or "").strip()
        for q in qres.data or []:
            qid = int(q["id"])
            cid = q.get("concept_id")
            if cid is not None and cid != "":
                q_to_concept_name[qid] = id_to_name.get(int(cid), "")
            else:
                q_to_concept_name[qid] = ""

    qz_res = sb.table("quizzes").select("id,lesson_id,type").in_("id", quiz_ids).execute()
    quiz_titles: dict[int, str] = {}
    for qz in qz_res.data or []:
        quiz_titles[int(qz["id"])] = _quiz_display_title(sb, dict(qz))

    events: list[CompletedEvent] = []
    for att in attempts:
        aid = int(att["id"])
        qid_quiz = int(att["quiz_id"])
        rows = answers_by_attempt.get(aid, [])
        attempted = len(rows)
        correct = sum(1 for r in rows if r.get("is_correct") is True)
        wrong = max(0, attempted - correct)
        concepts_set: set[str] = set()
        for r in rows:
            qid = int(r["question_id"])
            name = q_to_concept_name.get(qid, "").strip()
            if name:
                concepts_set.add(name)
        concepts = sorted(concepts_set)
        coins = int(att.get("coins_earned") or 0)
        raw_betcha = att.get("betcha_multiplier")
        betcha = str(raw_betcha) if raw_betcha is not None else None
        title = quiz_titles.get(qid_quiz, f"Quiz {qid_quiz}")
        events.append(
            CompletedEvent(
                id=str(aid),
                title=title,
                attempted=attempted,
                correct=correct,
                wrong=wrong,
                concepts=concepts,
                coins=coins,
                betcha=betcha,
            )
        )
    return events


def build_student_dashboard(user: User) -> StudentDashboardResponse:
    """Build the full student dashboard response."""
    user_info = StudentUserInfo(
        id=user.id,
        display_name=user.display_name,
        coins=user.coins,
        current_streak=user.current_streak,
        avatar_config=user.avatar_config,
    )

    courses = _get_enrolled_courses(user.id)
    course_stats_list: list[StudentCourseStats] = []

    for course in courses:
        course_id = course["id"]
        stats = _get_course_stats(user.id, course_id)

        course_stats = StudentCourseStats(
            id=course_id,
            name=course["name"],
            tests_taken=stats["tests_taken"],
            coins_earned=stats["coins_earned"],
            top_weak_concept=_get_top_weak_concept(user.id, course_id),
            active_tempo=_get_active_tempo(course_id),
            upcoming_events=_get_upcoming_events(user.id, course_id),
            completed_events=_get_completed_events(user.id, course_id),
        )
        course_stats_list.append(course_stats)

    return StudentDashboardResponse(user=user_info, courses=course_stats_list)


# =============================================================================
# Professor Dashboard
# =============================================================================


def _get_professor_courses(professor_id: int) -> list[dict[str, Any]]:
    """Get courses owned by this professor."""
    sb = get_supabase()
    res = sb.table("courses").select("id,name").eq("professor_id", professor_id).execute()
    return list(res.data or [])


def _get_enrollment_count(course_id: int) -> int:
    """Get count of enrolled students for a course."""
    sb = get_supabase()
    res = sb.table("enrollments").select("id", count="exact").eq("course_id", course_id).execute()
    return res.count or 0


def _get_tempos_scheduled(course_id: int) -> int:
    """Count published Tempos for this course (``type=tempo``, ``status=published``)."""
    sb = get_supabase()
    res = (
        sb.table("quizzes")
        .select("id", count="exact")
        .eq("course_id", int(course_id))
        .eq("type", "tempo")
        .eq("status", "published")
        .execute()
    )
    return res.count or 0


def _get_class_avg_score(course_id: int) -> float | None:
    """Average ``score_pct`` across completed attempts for quizzes in this course."""
    sb = get_supabase()
    quizzes_res = sb.table("quizzes").select("id").eq("course_id", int(course_id)).execute()
    quiz_ids = [row["id"] for row in (quizzes_res.data or [])]
    if not quiz_ids:
        return None

    attempts_res = (
        sb.table("quiz_attempts")
        .select("score_pct")
        .in_("quiz_id", quiz_ids)
        .not_.is_("score_pct", "null")
        .execute()
    )
    scores: list[float] = []
    for row in attempts_res.data or []:
        raw = row.get("score_pct")
        if raw is None:
            continue
        try:
            scores.append(float(raw))
        except (TypeError, ValueError):
            continue
    if not scores:
        return None
    return round(sum(scores) / len(scores), 2)


def build_professor_dashboard(user: User) -> ProfessorDashboardResponse:
    """Build the full professor dashboard response."""
    user_info = ProfessorUserInfo(
        id=user.id,
        display_name=user.display_name,
        email=user.email,
    )

    courses = _get_professor_courses(user.id)
    course_overviews: list[ProfessorCourseOverview] = []

    for course in courses:
        course_id = course["id"]
        overview = ProfessorCourseOverview(
            id=course_id,
            name=course["name"],
            enrollment_count=_get_enrollment_count(course_id),
            tempos_scheduled=_get_tempos_scheduled(course_id),
            class_avg_score=_get_class_avg_score(course_id),
        )
        course_overviews.append(overview)

    return ProfessorDashboardResponse(user=user_info, courses=course_overviews)


# =============================================================================
# Professor Course Analytics
# =============================================================================


def _get_enrolled_students(course_id: int) -> list[dict[str, Any]]:
    """Get enrolled students with their basic info."""
    sb = get_supabase()
    enr_res = sb.table("enrollments").select("user_id").eq("course_id", course_id).execute()
    user_ids = [row["user_id"] for row in (enr_res.data or [])]
    if not user_ids:
        return []

    users_res = (
        sb.table("users")
        .select("id,display_name,email,avatar_config,coins,current_streak")
        .in_("id", user_ids)
        .execute()
    )
    return list(users_res.data or [])


def _get_student_quiz_stats(student_id: int, course_id: int) -> dict[str, Any]:
    """Get quiz stats for a student in a specific course."""
    sb = get_supabase()

    quizzes_res = sb.table("quizzes").select("id").eq("course_id", int(course_id)).execute()
    quiz_ids = [row["id"] for row in (quizzes_res.data or [])]
    if not quiz_ids:
        return {"quizzes_taken": 0, "avg_score": None, "last_activity": None}

    attempts_res = (
        sb.table("quiz_attempts")
        .select("score_pct,completed_at")
        .eq("user_id", int(student_id))
        .in_("quiz_id", quiz_ids)
        .not_.is_("completed_at", "null")
        .order("completed_at", desc=True)
        .execute()
    )
    attempts = attempts_res.data or []
    if not attempts:
        return {"quizzes_taken": 0, "avg_score": None, "last_activity": None}

    scores: list[float] = []
    for a in attempts:
        raw = a.get("score_pct")
        if raw is None:
            continue
        try:
            scores.append(float(raw))
        except (TypeError, ValueError):
            continue
    avg_score = round(sum(scores) / len(scores), 2) if scores else None
    last_activity = attempts[0].get("completed_at") if attempts else None

    return {
        "quizzes_taken": len(attempts),
        "avg_score": avg_score,
        "last_activity": last_activity,
    }


def _get_course_concepts(course_id: int) -> list[dict[str, Any]]:
    """Get all concepts for a course via lessons."""
    sb = get_supabase()

    lessons_res = sb.table("lessons").select("id").eq("course_id", course_id).execute()
    lesson_ids = [str(row["id"]) for row in (lessons_res.data or [])]
    if not lesson_ids:
        return []

    concepts_res = (
        sb.table("concepts")
        .select("id,name,lesson_id")
        .in_("lesson_id", lesson_ids)
        .execute()
    )
    return list(concepts_res.data or [])


def _get_concept_heatmap(
    student_ids: list[int],
    concept_ids: list[str],
    concept_names: dict[str, str],
) -> list[ConceptMasteryCell]:
    """Get concept mastery data for all students and concepts."""
    if not student_ids or not concept_ids:
        return []

    sb = get_supabase()
    heatmap_cells: list[ConceptMasteryCell] = []

    mastery_res = (
        sb.table("user_concept_mastery")
        .select("user_id,concept_id,mastery_score")
        .in_("user_id", [str(sid) for sid in student_ids])
        .in_("concept_id", concept_ids)
        .execute()
    )

    for row in mastery_res.data or []:
        concept_id = str(row["concept_id"])
        cell = ConceptMasteryCell(
            student_id=int(row["user_id"])
            if isinstance(row["user_id"], str) and str(row["user_id"]).isdigit()
            else row["user_id"],
            concept_id=concept_id,
            concept_name=concept_names.get(concept_id, "Unknown"),
            mastery_score=float(row.get("mastery_score", 0)),
        )
        heatmap_cells.append(cell)

    return heatmap_cells


def get_course_if_owned(course_id: int, professor_id: int) -> dict[str, Any] | None:
    """Get course if owned by professor, else None."""
    sb = get_supabase()
    res = (
        sb.table("courses")
        .select("id,name,professor_id")
        .eq("id", course_id)
        .limit(1)
        .execute()
    )
    if not res.data or len(res.data) == 0:
        return None
    course = res.data[0]
    if course.get("professor_id") != professor_id:
        return None
    return dict(course)


def build_course_analytics(course_id: int, course: dict[str, Any]) -> CourseAnalyticsResponse:
    """Build course analytics response with roster and concept heatmap."""
    students = _get_enrolled_students(course_id)

    roster: list[StudentAnalytics] = []
    for student in students:
        student_id = student["id"]
        stats = _get_student_quiz_stats(student_id, course_id)
        analytics = StudentAnalytics(
            id=student_id,
            display_name=student["display_name"],
            email=student["email"],
            avatar_config=student.get("avatar_config") or {},
            coins=student.get("coins", 0),
            current_streak=student.get("current_streak", 0),
            quizzes_taken=stats["quizzes_taken"],
            avg_score=stats["avg_score"],
            last_activity=stats["last_activity"],
        )
        roster.append(analytics)

    concepts = _get_course_concepts(course_id)
    concept_ids = [str(c["id"]) for c in concepts]
    concept_names = {str(c["id"]): str(c.get("name") or "") for c in concepts}
    student_ids = [int(s["id"]) for s in students]

    heatmap = _get_concept_heatmap(student_ids, concept_ids, concept_names)

    return CourseAnalyticsResponse(
        course_id=course_id,
        course_name=course["name"],
        roster=roster,
        concept_heatmap=heatmap,
    )
