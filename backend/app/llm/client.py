import json

from anthropic import AsyncAnthropic

MODEL = "claude-sonnet-4-20250514"


def _strip_markdown(text: str) -> str:
    """Remove possible markdown code fences from LLM output."""
    text = text.strip()
    if text.startswith("```"):
        # drop first line (```json or ```)
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
    if text.endswith("```"):
        text = text.rsplit("```", 1)[0]
    return text.strip()


async def call_llm(client: AsyncAnthropic, system: str, user: str) -> dict | list:
    """Unified LLM call. Returns parsed JSON (dict or list).
    Retries once on JSON parse failure."""
    for attempt in range(2):
        response = await client.messages.create(
            model=MODEL,
            max_tokens=2000,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        text = _strip_markdown(response.content[0].text)
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            if attempt == 1:
                raise ValueError(f"LLM returned non-JSON after 2 attempts: {text[:200]}")
    # unreachable, satisfies type checker
    raise RuntimeError("unreachable")
