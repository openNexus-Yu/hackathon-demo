"""Configuration module using Pydantic Settings."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # GitHub OAuth
    github_client_id: str = ""
    github_client_secret: str = ""
    github_redirect_uri: str = "http://localhost:5173/auth/callback"

    # Matrix
    matrix_homeserver_url: str = "http://localhost:8008"
    matrix_server_name: str = "localhost"
    matrix_registration_shared_secret: str = ""

    # CORS
    cors_origin: str = "http://localhost:5173"

    # Database
    database_url: str = "postgresql+asyncpg://opensrc:opensrc_dev_password@localhost:5432/opensrc_platform"

    # AI/LLM
    openai_api_base: str = "https://api.deepseek.com"
    openai_api_key: str = ""
    openai_model: str = "deepseek-chat"

    # Web Search
    web_search_api_key: str = ""
    web_search_cx: str = ""

    # Server
    port: int = 3000

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
