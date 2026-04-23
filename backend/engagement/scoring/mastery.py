"""Optional PRD §9 user_concept_mastery updates after a scored attempt."""

from __future__ import annotations

from typing import Any

from postgrest.exceptions import APIError

from intelligence.betcha.client import get_supabase


def apply_mastery_for_attempt(
    user_id: int,
    concept_results: list[tuple[int, bool]],
) -> None:
    """
    Upsert ``user_concept_mastery`` for each concept seen on this attempt.

    ``concept_results`` is (concept_id, answered_correctly). Idempotent merge: increment attempts,
    increment correct when true; recompute mastery_score as correct/attempts * 100.
    """
    if not concept_results:
        return

    sb = get_supabase()
    uid_pk = int(user_id)
    for concept_id, ok in concept_results:
        cid = int(concept_id)
        prev_a = 0
        prev_c = 0
        had_existing = False
        try:
            ex = (
                sb.table("user_concept_mastery")
                .select("attempts,correct")
                .eq("user_id", uid_pk)
                .eq("concept_id", int(cid))
                .limit(1)
                .execute()
            )
            if ex.data and len(ex.data) > 0:
                had_existing = True
                prev_a = int(ex.data[0].get("attempts") or 0)
                prev_c = int(ex.data[0].get("correct") or 0)
        except APIError:
            continue

        attempts = prev_a + 1
        correct = prev_c + (1 if ok else 0)
        mastery_score = round(100.0 * correct / attempts, 2) if attempts else 0.0

        row: dict[str, Any] = {
            "user_id": uid_pk,
            "concept_id": cid,
            "attempts": attempts,
            "correct": correct,
            "mastery_score": mastery_score,
        }

        try:
            if had_existing:
                sb.table("user_concept_mastery").update(
                    {"attempts": attempts, "correct": correct, "mastery_score": mastery_score}
                ).eq("user_id", uid_pk).eq("concept_id", cid).execute()
            else:
                sb.table("user_concept_mastery").insert(row).execute()
        except APIError:
            continue
