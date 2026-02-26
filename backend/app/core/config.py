from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    bot_token: str = "PLACEHOLDER_TOKEN"
    database_url: str = "postgresql+asyncpg://postgres:postgres@db:5432/membersly"
    redis_url: str = "redis://redis:6379/0"
    yookassa_shop_id: Optional[str] = "PLACEHOLDER_SHOP_ID"
    yookassa_secret_key: Optional[str] = "PLACEHOLDER_SECRET_KEY"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
