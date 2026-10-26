import asyncio
import time

from fastapi import WebSocket

from app.services.groq_transcriber import GroqTranscriber

CONTEXT_CHARS = 200
LOW_CONFIDENCE_LOGPROB = -1.0
NO_SPEECH_LIMIT = 0.6


class Session:
    """Per-connection state: a FIFO queue, one worker, and prompt carry-over."""

    def __init__(self, ws: WebSocket, transcriber: GroqTranscriber):
        self.ws = ws
        self.transcriber = transcriber
        self.queue: asyncio.Queue = asyncio.Queue()
        self.context = ""  # tail of confirmed transcript

    def prompt(self) -> str:
        return f"{self.context[-CONTEXT_CHARS:]}".strip()

    async def worker(self):
        while True:
            meta, pcm = await self.queue.get()
            try:
                await self._process(meta, pcm)
            finally:
                self.queue.task_done()

    async def _process(self, meta: dict, pcm: bytes):
        start = time.perf_counter()
        try:
            result = await self.transcriber.transcribe(pcm, self.prompt())
        except Exception as exc:
            await self.ws.send_json({
                "type": "segment.error",
                "segment_id": meta.get("segment_id"),
                "message": str(exc),
            })
            return

        text, logprob, no_speech = (
            result["text"], result["avg_logprob"], result["no_speech_prob"]
        )
        if not text:
            status = "empty"
        elif no_speech > NO_SPEECH_LIMIT and logprob < LOW_CONFIDENCE_LOGPROB:
            status = "filtered"  # likely hallucination on noise
            text = ""
        else:
            status = "ok"
            self.context += " " + text

        await self.ws.send_json({
            "type": "transcript.segment",
            "segment_id": meta.get("segment_id"),
            "seq": meta.get("seq"),
            "text": text,
            "status": status,
            "low_confidence": logprob is not None and logprob < LOW_CONFIDENCE_LOGPROB,
            "processing_ms": int((time.perf_counter() - start) * 1000),
        })