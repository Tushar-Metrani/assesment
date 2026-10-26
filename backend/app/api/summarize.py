from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.config import settings
from app.schemas.clinical import SummarizeResponse
from app.services.summarizer import summarize

router = APIRouter()


class SummarizeRequest(BaseModel):
    transcript: str = Field(min_length=20)


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_endpoint(req: SummarizeRequest):
    try:
        return await summarize(req.transcript)
    except Exception as exc:
        raise HTTPException(502, f"Summarization failed: {exc}")
