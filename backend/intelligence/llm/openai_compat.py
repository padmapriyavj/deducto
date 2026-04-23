"""Shared LLM client: Gemini by default (via OpenAI-compatible SDK), OpenAI or Ollama as overrides."""

from __future__ import annotations

import os

from openai import OpenAI

_GEMINI_BASE    = "https://generativelanguage.googleapis.com/v1beta/openai"
_OLLAMA_DEFAULT = "http://127.0.0.1:11434/v1"


def get_openai_client() -> OpenAI:
    gemini_key = (os.environ.get("GEMINI_API_KEY") or "").strip()
    openai_key = (os.environ.get("OPENAI_API_KEY") or "").strip()
    base       = (os.environ.get("OPENAI_BASE_URL") or "").strip().rstrip("/")

    if gemini_key and not base:
        return OpenAI(base_url=_GEMINI_BASE, api_key=gemini_key)

    if base:
        return OpenAI(base_url=base, api_key=openai_key or "ollama")

    if openai_key:
        return OpenAI(api_key=openai_key)

    raise RuntimeError(
        "No LLM configured. Set GEMINI_API_KEY, OPENAI_API_KEY, or OPENAI_BASE_URL."
    )


def default_llm_model(fallback: str = "gemma-3-4b-it") -> str:
    m = (os.environ.get("LLM_MODEL") or "").strip()
    return m or fallback


def is_gemma_model() -> bool:
    """Gemma models on Gemini API don't support system prompts or response_format."""
    return "gemma" in default_llm_model().lower()


def use_openai_json_schema_mode() -> bool:
    # Gemma: no response_format support at all
    if is_gemma_model():
        return False

    force = (os.environ.get("LLM_JSON_SCHEMA") or "").strip().lower()
    if force in ("1", "true", "yes", "on"):
        return True
    if force in ("0", "false", "no", "off"):
        return False

    base = (os.environ.get("OPENAI_BASE_URL") or "").strip().lower()
    if base and any(h in base for h in ("localhost", "127.0.0.1", "0.0.0.0")):
        return False

    gemini_key = (os.environ.get("GEMINI_API_KEY") or "").strip()
    openai_key = (os.environ.get("OPENAI_API_KEY") or "").strip()
    if gemini_key or openai_key:
        return True

    return False


def build_messages(system: str, user: str) -> list[dict]:
    """
    Gemma doesn't support system role — merge into user message.
    All other models get proper system + user separation.
    """
    if is_gemma_model():
        return [{"role": "user", "content": f"{system}\n\n{user}"}]
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]