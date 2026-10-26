from groq import AsyncGroq
from pydantic import ValidationError

from app.config import settings
from app.prompts.summarize import SYSTEM_PROMPT, user_message
from app.schemas.clinical import SummarizeResponse


async def summarize(transcript: str) -> SummarizeResponse:
    client = AsyncGroq(api_key=settings.groq_api_key)
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_message(transcript)},
    ]

    for _ in range(2):  # first try + one retry
        response = await client.chat.completions.create(
            model=settings.groq_model,
            messages=messages,
            temperature=0,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content
        try:
            return SummarizeResponse.model_validate_json(raw)
        except ValidationError as exc:
            messages += [
                {"role": "assistant", "content": raw},
                {"role": "user", "content": f"That JSON was invalid:\n{exc}\nReturn the corrected JSON only."},
            ]

    raise ValueError("LLM output did not match the schema after one retry")
