"""generate_quiz(config) — draft quiz + questions (PRD §7.6)."""

from __future__ import annotations

import random
from decimal import Decimal
from typing import Any

from intelligence.quiz.chunk_source import load_chunk_text_for_lessons
from intelligence.quiz.openai_client import build_generation_metadata, generate_mcq_batch
from intelligence.quiz.repository import (
    fetch_concepts_for_lessons,
    insert_questions,
    insert_quiz,
    list_questions,
)
from intelligence.quiz.schemas import Difficulty, QuizGenerateRequest, QuizGenerationConfig


def _allocate_slots(config: QuizGenerationConfig, rng: random.Random) -> list[tuple[str, Difficulty]]:
    cids = [str(c.concept_id) for c in config.concepts]
    cw = [float(c.weight) for c in config.concepts]
    s = sum(cw) or 1.0
    cw = [w / s for w in cw]

    de = float(config.difficulty_weights.easy)
    dm = float(config.difficulty_weights.medium)
    dh = float(config.difficulty_weights.hard)
    ds = de + dm + dh or 1.0
    de, dm, dh = de / ds, dm / ds, dh / ds

    diffs: list[Difficulty] = ["easy", "medium", "hard"]
    dw = [de, dm, dh]

    out: list[tuple[str, Difficulty]] = []
    for _ in range(config.num_questions):
        cid = rng.choices(cids, weights=cw, k=1)[0]
        diff = rng.choices(diffs, weights=dw, k=1)[0]
        out.append((cid, diff))
    return out


def _config_to_json(config: QuizGenerationConfig) -> dict[str, Any]:
    return config.model_dump(mode="json")


def generate_quiz(req: QuizGenerateRequest, created_by: int, *, rng_seed: int | None = None) -> dict[str, Any]:
    """
    Create draft quiz row + questions. Returns ``{quiz_id, status, questions}``.
    """
    cfg = req.config
    lesson_ids = cfg.lesson_ids

    concepts_rows = fetch_concepts_for_lessons(lesson_ids)
    allowed = {str(r["id"]) for r in concepts_rows}
    for cw in cfg.concepts:
        if str(cw.concept_id) not in allowed:
            raise ValueError(f"concept_id {cw.concept_id} not found for given lesson_ids")

    concept_specs = [
        {
            "id": str(r["id"]),
            "name": r.get("name") or "",
            "description": r.get("description") or "",
        }
        for r in concepts_rows
        if str(r["id"]) in {str(c.concept_id) for c in cfg.concepts}
    ]
    if not concept_specs:
        raise ValueError("No concepts matched the generation config")

    context = load_chunk_text_for_lessons(lesson_ids)
    if not context.strip():
        context = "(No material text for these lessons; generate from concept names only.)"

    rng = random.Random(rng_seed) if rng_seed is not None else random.Random()
    allocations = _allocate_slots(cfg, rng)
    drafts = generate_mcq_batch(
        context_text=context,
        concept_specs=concept_specs,
        allocations=allocations,
        model="gemma-3-4b-it"
    )

    meta = build_generation_metadata("gemma-3-4b-it", seed=str(rng_seed) if rng_seed is not None else None)
    duration_sec = cfg.num_questions * cfg.time_per_question
    lesson_id = lesson_ids[0]

    quiz_id = insert_quiz(
        course_id=req.course_id,
        created_by=created_by,
        config=_config_to_json(cfg),
        quiz_type=req.quiz_type,
        lesson_id=lesson_id,
        status="draft",
        duration_sec=duration_sec,
    )

    qrows: list[dict[str, Any]] = []
    for i, d in enumerate(drafts):
        qrows.append(
            {
                "question_order": i + 1,
                "text": d.text,
                "choices": [c.model_dump() for c in d.choices],
                "correct_choice": d.correct_choice,
                "concept_id": int(d.concept_id),
                "difficulty": d.difficulty,
                "generation_metadata": meta,
                "approved": False,
            }
        )

    insert_questions(quiz_id, qrows)

    stored = list_questions(quiz_id)
    return {
        "quiz_id": int(quiz_id),
        "status": "draft",
        "questions": stored,
    }
