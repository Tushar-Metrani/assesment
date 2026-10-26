import asyncio
import json

from fastapi import APIRouter, WebSocket

from app.config import settings
from app.services.session import Session

router = APIRouter()


@router.websocket("/ws/session")
async def session_ws(ws: WebSocket):
    await ws.accept()
    session = Session(ws, ws.app.state.transcriber)
    worker = asyncio.create_task(session.worker())
    meta = None  # segment.meta waiting for its binary frame

    try:
        model = settings.groq_asr_model
        await ws.send_json({"type": "session.ready", "model": model})
        while True:
            msg = await ws.receive()
            if msg["type"] == "websocket.disconnect":
                break

            if msg.get("bytes") is not None:  # audio frame
                if meta is None:
                    await ws.send_json({"type": "error", "message": "audio without segment.meta"})
                    continue
                session.queue.put_nowait((meta, msg["bytes"]))
                meta = None
                continue

            data = json.loads(msg["text"])
            kind = data.get("type")
            if kind == "segment.meta":
                meta = data
            elif kind == "context.reset":
                session.context = ""
            elif kind == "context.set":
                session.context = data.get("text", "")
            elif kind == "session.end":
                await session.queue.join()
                await ws.send_json({"type": "session.drained"})
            elif kind == "ping":
                await ws.send_json({"type": "pong"})
    finally:
        worker.cancel()