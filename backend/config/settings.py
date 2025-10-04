import logging
import os
from enum import Enum

import utils.logging_config  # noqa: F401  # side-effect import to configure logging

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

class EnvironmentEnum(str, Enum):
    PRODUCTION = "PRODUCTION"
    DEVELOPMENT = "DEVELOPMENT"

    def docs_available(self) -> bool:
        show_docs_environments = {EnvironmentEnum.DEVELOPMENT}
        return self in show_docs_environments



class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    gemini_api_key: str

    environment: EnvironmentEnum = EnvironmentEnum.DEVELOPMENT
    debug: bool = False

    title: str = "Finance Compass Api"
    version: str = "1.0.0"
    contact_name: str = "gangusy"
    contact_email: str = "gangusy@hack.xd"

    cors_allow_credentials: bool = False
    cors_allow_origins: list[str] = []
    cors_allow_methods: list[str] = []
    cors_allow_headers: list[str] = []

    @model_validator(mode="after")
    def setup_dynamic_settings(self) -> "Settings":
        if self.debug:
            self.cors_allow_origins = ["*"]
            self.cors_allow_methods = ["*"]
            self.cors_allow_headers = ["*"]
        return self

    model_config = SettingsConfigDict(env_file=".env")

try:
    load_dotenv()
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        logger.error("GEMINI_API_KEY environment variable not found")
        raise ValueError("GEMINI_API_KEY environment variable must be set")
    else:
        settings = Settings(gemini_api_key=gemini_key)
        logger.info("Settings loaded successfully")

except Exception as e:
    logger.error(f"Failed to load settings: {str(e)}")
    raise

