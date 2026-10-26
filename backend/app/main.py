from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import health, summarize, ws
from app.config import settings
from app.services.groq_transcriber import GroqTranscriber


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.transcriber = GroqTranscriber()
    yield


app = FastAPI(title="Clinical Scribe API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origin],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(ws.router)
app.include_router(summarize.router)