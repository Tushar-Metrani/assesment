from fastapi.testclient import TestClient

from app.main import app
from app.services import transcriber


def test_health(monkeypatch):
    monkeypatch.setattr(transcriber, "WhisperModel", lambda *a, **k: object())
    with TestClient(app) as client:
        assert client.get("/health").json() == {"status": "ok"}