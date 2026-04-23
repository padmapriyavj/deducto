"""Orchestration: update lesson context, load text, extract, persist concepts."""

from __future__ import annotations

from intelligence.concepts.extraction import extract_concepts_from_text
from intelligence.concepts.repository import (
    delete_concepts_for_lesson,
    get_course_name,
    get_lesson,
    insert_concepts,
    list_concepts,
    update_lesson_context,
)
from intelligence.ingestion.context import get_text_for_lesson, get_text_for_material


def generate_concepts_for_lesson(lesson_id: int) -> list[dict]:
    lesson = get_lesson(lesson_id)
    if lesson is None:
        raise ValueError("Lesson not found")

    course_id = lesson.get("course_id")
    material_id = lesson.get("material_id")
    title = str(lesson.get("title") or "")

    if course_id is None:
        raise ValueError("Lesson has no course_id")
    if material_id is None:
        raise ValueError("Lesson has no material; attach a material before generating concepts")

    update_lesson_context(
        lesson_id,
        course_id=int(course_id),
        title=title,
        material_id=int(material_id),
    )

    lesson = get_lesson(lesson_id)
    if lesson is None:
        raise ValueError("Lesson not found after update")

    course_name = get_course_name(int(lesson["course_id"]))
    lesson_title = str(lesson.get("title") or "")

    text = get_text_for_material(int(lesson["material_id"]))
    if not text.strip():
        text = get_text_for_lesson(lesson_id)
    if not text.strip():
        raise ValueError(
            "No text on this material or lesson (materials row / metadata empty). "
            "Store content in materials (e.g. metadata.full_text) before generating concepts."
        )

    extracted = extract_concepts_from_text(
        course_name=course_name,
        lesson_title=lesson_title,
        material_text=text,
    )

    delete_concepts_for_lesson(lesson_id)
    stored = insert_concepts(lesson_id, extracted)
    return stored


def list_concepts_for_lesson(lesson_id: int) -> list[dict]:
    if get_lesson(lesson_id) is None:
        raise ValueError("Lesson not found")
    return list_concepts(lesson_id)
