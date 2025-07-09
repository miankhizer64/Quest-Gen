from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    qdrant_host: str = Field(..., env="QDRANT_HOST")
    qdrant_api_key: str = Field(..., env="QDRANT_API_KEY")
    openai_api_key: str = Field(..., env="OPENAI_API_KEY")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
