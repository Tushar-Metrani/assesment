from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # LLM (summaries)
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"

    # ASR (hosted Whisper on Groq)
    groq_asr_model: str = "whisper-large-v3-turbo"
    groq_asr_api_keys: str = ""  # comma separated; falls back to GROQ_API_KEY
    whisper_language: str = "en"

    cors_origin: str = "http://localhost:5173"

    @property
    def asr_keys(self) -> list[str]:
        keys = [k.strip() for k in self.groq_asr_api_keys.split(",") if k.strip()]
        return keys or ([self.groq_api_key] if self.groq_api_key else [])


settings = Settings()