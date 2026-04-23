"""Supabase persistence for lessons (context fields) and concepts."""

from __future__ import annotations

from typing import Any

from postgrest.exceptions import APIError

from intelligence.betcha.client import get_supabase


def get_lesson(lesson_id: int) -> dict[str, Any] | None:
    sb = get_supabase()
    try:
        res = sb.table("lessons").select("*").eq("id", lesson_id).single().execute()
        return dict(res.data)
    except APIError:
        return None


def update_lesson_context(
    lesson_id: int,
    *,
    course_id: int,
    title: str,
    material_id: int,
) -> None:
    sb = get_supabase()
    sb.table("lessons").update(
        {
            "course_id": course_id,
            "title": title,
            "material_id": material_id,
        }
    ).eq("id", lesson_id).execute()


def get_course_name(course_id: int) -> str:
    sb = get_supabase()
    try:
        res = sb.table("courses").select("name").eq("id", course_id).single().execute()
        return str(res.data.get("name") or "Course")
    except APIError:
        return "Course"


def delete_concepts_for_lesson(lesson_id: int) -> None:
    sb = get_supabase()
    sb.table("concepts").delete().eq("lesson_id", lesson_id).execute()


def insert_concepts(lesson_id: int, items: list[dict[str, str]]) -> list[dict[str, Any]]:
    sb = get_supabase()
    payload = [
        {
            "lesson_id": lesson_id,
            "name": it["name"],
            "description": it.get("description") or "",
        }
        for it in items
    ]
    res = sb.table("concepts").insert(payload).execute()
    return [dict(r) for r in (res.data or [])]


def list_concepts(lesson_id: int) -> list[dict[str, Any]]:
    sb = get_supabase()
    res = (
        sb.table("concepts")
        .select("id,lesson_id,name,description")
        .eq("lesson_id", lesson_id)
        .order("name")
        .execute()
    )
    return [dict(r) for r in (res.data or [])]
