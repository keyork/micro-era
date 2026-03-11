from typing import Literal
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    openai_api_key: str = ""
    llm_base_url: str = ""          # leave empty to use provider default (OpenAI)
    llm_model: str = "gpt-4o-mini"  # override per provider, e.g. moonshot-v1-8k
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/microera"
    redis_url: str = "redis://localhost:6379"
    cors_origins: str = "http://localhost:3000"
    environment: Literal["development", "production"] = "development"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


settings = Settings()
