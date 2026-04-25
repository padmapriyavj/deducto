"""MCQ generation — supports Gemma (Gemini API), cloud OpenAI, and local Ollama."""

from __future__ import annotations
import json
from typing import Any
from intelligence.llm.openai_compat import (
    build_messages,
    default_llm_model,
    get_openai_client,
    is_gemma_model,
    use_openai_json_schema_mode,
)
from intelligence.quiz.schemas import ChoiceItem, Difficulty, QuestionDraft


def _question_item_schema() -> dict[str, Any]:
    return {
        "type": "object",
        "properties": {
            "text": {"type": "string", "description": "The question stem shown to the student."},
            "choices": {
                "type": "array",
                "description": "Exactly four options with keys A, B, C, D.",
                "minItems": 4,
                "maxItems": 4,
                "items": {
                    "type": "object",
                    "properties": {
                        "key": {"type": "string", "enum": ["A", "B", "C", "D"]},
                        "text": {"type": "string"},
                    },
                    "required": ["key", "text"],
                    "additionalProperties": False,
                },
            },
            "correct_choice": {"type": "string", "enum": ["A", "B", "C", "D"]},
            "concept_id": {"type": "string"},
            "difficulty": {"type": "string", "enum": ["easy", "medium", "hard"]},
        },
        "required": ["text", "choices", "correct_choice", "concept_id", "difficulty"],
        "additionalProperties": False,
    }


def _quiz_questions_json_schema(num_questions: int) -> dict[str, Any]:
    if num_questions < 1:
        raise ValueError("num_questions must be >= 1")
    return {
        "name": "quiz_mcq_batch",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "questions": {
                    "type": "array",
                    "description": f"Exactly {num_questions} questions.",
                    "minItems": num_questions,
                    "maxItems": num_questions,
                    "items": _question_item_schema(),
                }
            },
            "required": ["questions"],
            "additionalProperties": False,
        },
    }


_QUIZ_EXAMPLE_BLOCK = """
## Example output shape (structure only — questions must follow YOUR required sequence below)

```json
{
  "questions": [
    {
      "text": "What is the time complexity of binary search on a sorted array of n elements?",
      "choices": [
        {"key": "A", "text": "O(n)"},
        {"key": "B", "text": "O(log n)"},
        {"key": "C", "text": "O(n log n)"},
        {"key": "D", "text": "O(1)"}
      ],
      "correct_choice": "B",
      "concept_id": "42",
      "difficulty": "medium"
    }
  ]
}
```

Rules:
- Top-level key must be exactly `"questions"` (array).
- Each question has exactly four choices with keys A, B, C, D.
- `correct_choice` must equal one of the choice keys.
- `concept_id` must be the string form of the concept id from the assignment line.
- `difficulty` must be exactly "easy", "medium", or "hard".
"""


def _parse_raw(raw: str) -> Any:
    """Strip markdown code fences Gemma sometimes wraps around JSON."""
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


def generate_mcq_batch(
    *,
    context_text: str,
    concept_specs: list[dict[str, Any]],
    allocations: list[tuple[str, Difficulty]],
    model: str | None = None,
    temperature: float = 0.4,
    extra_user_instructions: str | None = None,
) -> list[QuestionDraft]:
    n = len(allocations)
    resolved_model = model or default_llm_model()
    spec_lines = "\n".join(
        f"- {c['id']}: {c['name']} — {c.get('description') or ''}" for c in concept_specs
    )
    alloc_lines = "\n".join(
        f"{i + 1}. concept_id={cid} difficulty={diff}" for i, (cid, diff) in enumerate(allocations)
    )

    system = (
        "You write multiple-choice questions for university courses. "
        "Follow the JSON schema exactly. Each question must align with the concept_id and difficulty "
        "given for that line number. Ground stems in the course material context when possible."
    )
    user = (
        _QUIZ_EXAMPLE_BLOCK
        + "\n---\n"
        f"Course material context (may be truncated):\n{context_text[:80_000]}\n\n"
        f"Concepts:\n{spec_lines}\n\n"
        f"Required question sequence — produce EXACTLY {n} questions in this order:\n"
        f"{alloc_lines}\n"
    )
    if extra_user_instructions:
        user += extra_user_instructions

    kwargs: dict[str, Any] = {
        "model": resolved_model,
        "temperature": temperature,
        "messages": build_messages(system, user, model=resolved_model),
    }

    # Gemma doesn't support response_format — rely on prompt instructions only
    if not is_gemma_model(resolved_model):
        if use_openai_json_schema_mode(resolved_model):
            kwargs["response_format"] = {
                "type": "json_schema",
                "json_schema": _quiz_questions_json_schema(n),
            }
        else:
            kwargs["response_format"] = {"type": "json_object"}

    try:
        resp = get_openai_client().chat.completions.create(**kwargs)
    except Exception as e:
        raise RuntimeError(f"LLM request failed: {e}") from e
    raw = resp.choices[0].message.content or "{}"
    try:
        data = _parse_raw(raw)
    except (json.JSONDecodeError, TypeError) as e:
        raise RuntimeError("Model did not return valid JSON for questions") from e
    arr = data.get("questions")
    if not isinstance(arr, list) or len(arr) != n:
        raise ValueError(
            f"Model returned wrong number of questions (expected {n}, "
            f"got {len(arr) if isinstance(arr, list) else 'invalid'})"
        )

    out: list[QuestionDraft] = []
    for i, item in enumerate(arr):
        cid_req, diff_req = allocations[i]
        chs = item.get("choices") or []
        choices = [
            ChoiceItem(key=str(c["key"]).strip().upper()[:1], text=str(c["text"])) for c in chs
        ]
        cc = str(item.get("correct_choice", "A")).strip().upper()[:1]
        out.append(
            QuestionDraft(
                text=str(item["text"]),
                choices=choices,
                correct_choice=cc,
                concept_id=int(cid_req),
                difficulty=diff_req,
            )
        )
        keys = {c.key for c in out[-1].choices}
        if keys != {"A", "B", "C", "D"}:
            raise ValueError("Each question must have choices A–D")
        if out[-1].correct_choice not in keys:
            raise ValueError("correct_choice must match a choice key")
    return out


def regenerate_single_mcq(
    *,
    context_text: str,
    concept_specs: list[dict[str, Any]],
    concept_id: str,
    difficulty: Difficulty,
    model: str | None = None,
    previous_question_text: str | None = None,
) -> QuestionDraft:
    extra: str | None = None
    if previous_question_text and previous_question_text.strip():
        prev = previous_question_text.strip()[:4000]
        extra = (
            "\n\n--- REGENERATION ---\n"
            "The professor asked to replace the question below. Write a NEW question "
            "for the same concept_id and difficulty. Must be substantially different.\n\n"
            f"Previous question (do not repeat):\n{prev}\n"
        )
    return generate_mcq_batch(
        context_text=context_text,
        concept_specs=concept_specs,
        allocations=[(concept_id, difficulty)],
        model=model,
        temperature=0.7,
        extra_user_instructions=extra,
    )[0]


def build_generation_metadata(model: str, seed: str | None = None) -> dict[str, Any]:
    return {"model": model, "prompt_version": "quiz_v2_structured", "seed": seed}