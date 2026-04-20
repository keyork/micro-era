import json

from openai import APIConnectionError, APIError, APITimeoutError, AsyncOpenAI


def _strip_markdown(text: str) -> str:
    """Remove possible markdown code fences from LLM output."""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
    if text.endswith("```"):
        text = text.rsplit("```", 1)[0]
    return text.strip()


def make_client(api_key: str, base_url: str = "") -> AsyncOpenAI:
    """Build an AsyncOpenAI client. Pass base_url to use Moonshot/etc."""
    if not api_key:
        raise RuntimeError("LLM API key is missing. Set OPENAI_API_KEY before starting the backend.")

    kwargs: dict = {"api_key": api_key}
    if base_url:
        kwargs["base_url"] = base_url
    return AsyncOpenAI(**kwargs)


async def call_llm(client: AsyncOpenAI, model: str, system: str, user: str) -> dict | list:
    """Unified LLM call (OpenAI Chat Completions). Returns parsed JSON.
    Retries once on JSON parse failure."""
    for attempt in range(2):
        try:
            response = await client.chat.completions.create(
                model=model,
                max_tokens=2000,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
            )
        except APITimeoutError as exc:
            raise RuntimeError("LLM request timed out. Check your network or model endpoint and try again.") from exc
        except APIConnectionError as exc:
            raise RuntimeError("LLM connection failed. Verify OPENAI_API_KEY, LLM_BASE_URL, and outbound network access.") from exc
        except APIError as exc:
            message = getattr(exc, "message", None) or str(exc)
            raise RuntimeError(f"LLM request failed: {message}") from exc

        text = _strip_markdown(response.choices[0].message.content or "")
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            if attempt == 1:
                raise ValueError(f"LLM returned non-JSON after 2 attempts: {text[:200]}")
    raise RuntimeError("unreachable")
