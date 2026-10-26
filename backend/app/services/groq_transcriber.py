import asyncio
import io
import itertools
import wave

from groq import AsyncGroq, RateLimitError

from app.config import settings

MAX_ATTEMPTS = 4


def pcm_to_wav(pcm: bytes) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(16000)
        w.writeframes(pcm)
    return buf.getvalue()


class GroqTranscriber:
    """Hosted Whisper via the async Groq SDK, with round-robin keys and retry on 429."""

    def __init__(self):
        keys = settings.asr_keys
        if not keys:
            raise RuntimeError("Set GROQ_ASR_API_KEYS or GROQ_API_KEY")
        # max_retries=0: we do our own retry/rotation, so the SDK must not
        # retry the same rate-limited key before we can switch.
        self.clients = [AsyncGroq(api_key=k, max_retries=0, timeout=30) for k in keys]
        self._cycle = itertools.cycle(self.clients)

    async def transcribe(self, pcm: bytes, prompt: str | None = None) -> dict:
        wav = pcm_to_wav(pcm)
        params = {
            "model": settings.groq_asr_model,
            "language": settings.whisper_language,
            "response_format": "verbose_json",
            "temperature": 0,
        }
        if prompt:
            params["prompt"] = prompt

        for attempt in range(MAX_ATTEMPTS):
            try:
                response = await next(self._cycle).audio.transcriptions.create(
                    file=("chunk.wav", wav), **params
                )
            except RateLimitError as exc:
                # try the next key straight away; wait only after a full lap
                if (attempt + 1) % len(self.clients) == 0:
                    retry_after = exc.response.headers.get("retry-after")
                    await asyncio.sleep(min(float(retry_after or 1), 5))
                continue

            body = response.model_dump()  # includes "segments" (not a declared field)
            segs = body.get("segments") or []
            return {
                "text": (body.get("text") or "").strip(),
                "avg_logprob": (sum(s["avg_logprob"] for s in segs) / len(segs)) if segs else 0.0,
                "no_speech_prob": max((s["no_speech_prob"] for s in segs), default=0.0),
            }

        raise RuntimeError("Groq rate limit reached on all keys")