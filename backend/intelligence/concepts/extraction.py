from __future__ import annotations
import json
from typing import Any
from pydantic import BaseModel, Field
from intelligence.llm.openai_compat import (
    build_messages,
    default_llm_model,
    get_openai_client,
    is_gemma_model,
    use_openai_json_schema_mode,
)


class _ConceptOut(BaseModel):
    name: str = Field(max_length=200)
    description: str = Field(default="")


class _ConceptsPayload(BaseModel):
    concepts: list[_ConceptOut]


_CONCEPTS_JSON_SCHEMA: dict[str, Any] = {
    "name": "concepts_extraction",
    "strict": True,
    "schema": {
        "type": "object",
        "properties": {
            "concepts": {
                "type": "array",
                "description": "4–8 learnable concepts from the material (fewer if text is very short).",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "Short concept title, max 200 characters.",
                        },
                        "description": {
                            "type": "string",
                            "description": "1–3 sentences explaining the concept for students.",
                        },
                    },
                    "required": ["name", "description"],
                    "additionalProperties": False,
                },
            }
        },
        "required": ["concepts"],
        "additionalProperties": False,
    },
}

_CONCEPTS_EXAMPLE_BLOCK = """
## Example output shape (structure only — write concepts from the MATERIAL above, not this example)

```json
{
  "concepts": [
    {
      "name": "Asymptotic notation",
      "description": "Big-O describes an upper bound on growth rate of a function as input size increases."
    },
    {
      "name": "Recurrence relations",
      "description": "Equations that define a sequence recursively; used to analyze divide-and-conquer algorithms."
    }
  ]
}
```

Return a single JSON object matching this exact shape. Use "concepts" as the only top-level key.
"""


def _concepts_response_format(*, resolved_model: str) -> dict[str, Any] | None:
    if is_gemma_model(resolved_model):
        return None  # Gemma doesn't support response_format
    if use_openai_json_schema_mode(resolved_model):
        return {"type": "json_schema", "json_schema": _CONCEPTS_JSON_SCHEMA}
    return {"type": "json_object"}


def extract_concepts_from_text(
    *,
    course_name: str,
    lesson_title: str,
    material_text: str,
    model: str | None = None,
) -> list[dict[str, str]]:
    resolved_model = model or default_llm_model()
    system = (
        "You are an expert curriculum analyst. Given course context and instructional text, "
        "extract distinct important concepts students must learn. "
        "Respond with JSON only, matching the provided schema. "
        "Produce 4–8 concepts unless the material is too short (then use fewer). "
        "Names are concise; descriptions are 1–3 sentences, classroom-appropriate."
    )
    user = (
        _CONCEPTS_EXAMPLE_BLOCK
        + "\n---\n"
        f"Course: {course_name}\n"
        f"Lesson title: {lesson_title}\n\n"
        f"Material text:\n{material_text[:95_000]}\n"
    )

    kwargs: dict[str, Any] = {
        "model": resolved_model,
        "temperature": 0.3,
        "messages": build_messages(system, user, model=resolved_model),
    }
    fmt = _concepts_response_format(resolved_model=resolved_model)
    if fmt is not None:
        kwargs["response_format"] = fmt

    resp = get_openai_client().chat.completions.create(**kwargs)
    raw = resp.choices[0].message.content or "{}"

    # Gemma sometimes wraps output in markdown code fences — strip them
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    data = json.loads(raw)
    payload = _ConceptsPayload.model_validate(data)
    out: list[dict[str, str]] = []
    for c in payload.concepts:
        name = c.name.strip()[:200]
        if not name:
            continue
        out.append({"name": name, "description": (c.description or "").strip()})
    if len(out) < 1:
        raise ValueError("Model returned no concepts")
    return out