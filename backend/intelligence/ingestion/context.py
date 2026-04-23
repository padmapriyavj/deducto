"""
Assemble instructional text from ``materials`` for LLM prompts (PRD: lesson KB, no material_chunks).

Full text may live in ``metadata`` (e.g. ``full_text``) or top-level columns; one canonical policy here.
"""

from __future__ import annotations

from typing import Any

from postgrest.exceptions import APIError

from intelligence.betcha.client import get_supabase


def extract_text_from_material_row(row: dict[str, Any]) -> str:
    """
    Read stored text from a ``materials`` row.

    Order: top-level ``text``, ``content``, ``excerpt``, ``body``; then ``metadata`` keys
    ``full_text``, ``text``, ``excerpt``, ``preview``, ``sample`` (small weekly uploads).
    """
    for key in ("text", "content", "excerpt", "body"):
        v = row.get(key)
        if isinstance(v, str) and v.strip():
            return v.strip()
    for meta_key in ("metadata", "file_metadata"):
        meta = row.get(meta_key)
        if isinstance(meta, dict):
            for key in ("full_text", "text", "excerpt", "preview", "sample"):
                v = meta.get(key)
                if isinstance(v, str) and v.strip():
                    return v.strip()
    return ""


def _truncate(text: str, max_chars: int) -> tuple[str, bool]:
    if len(text) <= max_chars:
        return text, False
    return text[:max_chars] + "\n\n[truncated]", True


def _material_raw_text(material_id: int) -> str:
    """Unbounded text from DB for one material (internal assembly)."""
    sb = get_supabase()
    try:
        res = sb.table("materials").select("*").eq("id", material_id).single().execute()
    except APIError:
        return ""
    return extract_text_from_material_row(dict(res.data or {}))


def get_text_for_material(material_id: int, max_chars: int = 120_000) -> str:
    """Load LLM context text for a single material row."""
    raw = _material_raw_text(material_id)
    out, _ = _truncate(raw, max_chars)
    return out


def _raw_text_for_lesson_row(lesson: dict[str, Any]) -> str:
    """Unbounded concatenation for one lesson (``material_id`` or ``sources[].material_id``)."""
    parts: list[str] = []
    mid = lesson.get("material_id")
    if mid:
        t = _material_raw_text(int(mid))
        if t.strip():
            parts.append(t.strip())
        return "\n\n".join(parts)

    for src in lesson.get("sources") or []:
        if not isinstance(src, dict):
            continue
        m = src.get("material_id")
        if m is None:
            continue
        t = _material_raw_text(int(m))
        if t.strip():
            parts.append(t.strip())
    return "\n\n".join(parts)


def get_text_for_lesson(lesson_id: int, max_chars: int = 120_000) -> str:
    """Load and truncate LLM context for one lesson."""
    sb = get_supabase()
    try:
        res = sb.table("lessons").select("*").eq("id", lesson_id).single().execute()
    except APIError:
        return ""
    lesson = dict(res.data or {})
    raw = _raw_text_for_lesson_row(lesson)
    out, _ = _truncate(raw, max_chars)
    return out


def assemble_text_for_lesson_ids(lesson_ids: list[int], max_chars: int = 120_000) -> str:
    """
    Concatenate context for multiple lessons (quiz generation).

    Replaces legacy chunk assembly: each lesson resolves to material row text only.
    """
    parts: list[str] = []
    sb = get_supabase()
    for lid in lesson_ids:
        try:
            res = sb.table("lessons").select("*").eq("id", lid).single().execute()
        except APIError:
            continue
        lesson = dict(res.data or {})
        raw = _raw_text_for_lesson_row(lesson)
        if raw.strip():
            parts.append(raw.strip())
    combined = "\n\n---\n\n".join(parts)
    out, _ = _truncate(combined, max_chars)
    return out
