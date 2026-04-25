"""Shared LLM client: Gemini by default (via OpenAI-compatible SDK), OpenAI or Ollama as overrides."""

from __future__ import annotations

import os

from openai import OpenAI

_GEMINI_BASE    = "https://generativelanguage.googleapis.com/v1beta/openai"
_OLLAMA_DEFAULT = "http://127.0.0.1:11434/v1"


def _normalize_openai_base_url(base: str) -> str:
    """Groq's OpenAI-compatible root must end with ``/openai/v1`` (not ``/openai`` only).

    If ``OPENAI_BASE_URL`` is ``https://api.groq.com/openai``, the SDK would POST to
    ``/openai/chat/completions`` and Groq returns 404 ``unknown_url``; the correct
    path is ``/openai/v1/chat/completions`` — see https://console.groq.com/docs/
    """
    b = base.strip().rstrip("/")
    if not b:
        return b
    lower = b.lower()
    if "api.groq.com" in lower and lower.endswith("/openai"):
        return f"{b}/v1"
    return b


def _auth_key_for_openai_base(base: str) -> str:
    """Groq and OpenAI use different API keys. Prefer the env that matches the host."""
    o = (os.environ.get("OPENAI_API_KEY") or "").strip()
    g = (os.environ.get("GROQ_API_KEY") or "").strip()
    if "api.groq.com" in base.lower():
        return g or o
    return o


def get_openai_client() -> OpenAI:
    gemini_key = (os.environ.get("GEMINI_API_KEY") or "").strip()
    openai_key = (os.environ.get("OPENAI_API_KEY") or "").strip()
    base_raw   = (os.environ.get("OPENAI_BASE_URL") or "").strip()
    base       = _normalize_openai_base_url(base_raw) if base_raw else ""

    if gemini_key and not base:
        return OpenAI(base_url=_GEMINI_BASE, api_key=gemini_key)

    if base:
        key = _auth_key_for_openai_base(base)
        is_groq = "api.groq.com" in base.lower()
        groq_key = (os.environ.get("GROQ_API_KEY") or "").strip()
        if is_groq and not key:
            raise RuntimeError(
                "OPENAI_BASE_URL points to Groq. Set GROQ_API_KEY to your gsk_ key from "
                "https://console.groq.com/keys (or set OPENAI_API_KEY to that same Groq key). "
                "An OpenAI sk- key is not valid on api.groq.com."
            )
        if is_groq and key and not groq_key and openai_key.startswith("sk-"):
            raise RuntimeError(
                "OPENAI_BASE_URL is Groq but OPENAI_API_KEY looks like an OpenAI key (sk-...). "
                "Add GROQ_API_KEY=gsk_... from https://console.groq.com/keys (you can keep your OpenAI key for other use)."
            )
        return OpenAI(base_url=base, api_key=key or "ollama")

    if openai_key:
        return OpenAI(api_key=openai_key)

    raise RuntimeError(
        "No LLM configured. Set GEMINI_API_KEY, OPENAI_API_KEY, GROQ_API_KEY, or OPENAI_BASE_URL."
    )


def default_llm_model(fallback: str = "gemma-3-4b-it") -> str:
    m = (os.environ.get("LLM_MODEL") or "").strip()
    return m or fallback


def is_gemma_model(resolved: str | None = None) -> bool:
    """Gemma on Gemini has no `system` role and no `response_format`.

    When `resolved` is the model name for *this* request, pass it. Call sites should
    use the same name as ``LLM_MODEL``/``default_llm_model()`` so Gemma vs non-Gemma
    matches the API (e.g. Groq + ``llama-3.3-70b-versatile`` vs Gemini + ``gemma-``).
    """
    name = (resolved or default_llm_model() or "").strip().lower()
    return "gemma" in name


def use_openai_json_schema_mode(model: str | None = None) -> bool:
    # Gemma: no response_format support at all
    if is_gemma_model(model):
        return False

    base = (os.environ.get("OPENAI_BASE_URL") or "").strip().lower()
    # Groq: json_schema is only for a small set of models; most return 400 for it.
    # Callers then use {"type": "json_object"} instead. See
    # https://console.groq.com/docs/structured-outputs#supported-models
    if "api.groq.com" in base:
        return False

    force = (os.environ.get("LLM_JSON_SCHEMA") or "").strip().lower()
    if force in ("1", "true", "yes", "on"):
        return True
    if force in ("0", "false", "no", "off"):
        return False

    if base and any(h in base for h in ("localhost", "127.0.0.1", "0.0.0.0")):
        return False

    gemini_key = (os.environ.get("GEMINI_API_KEY") or "").strip()
    openai_key = (os.environ.get("OPENAI_API_KEY") or "").strip()
    if gemini_key or openai_key:
        return True

    return False


def build_messages(system: str, user: str, *, model: str | None = None) -> list[dict]:
    """
    Gemma doesn't support system role — merge into user message.
    All other models get proper system + user separation.
    """
    if is_gemma_model(model):
        return [{"role": "user", "content": f"{system}\n\n{user}"}]
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]