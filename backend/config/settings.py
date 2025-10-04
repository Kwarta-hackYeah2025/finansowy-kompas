import logging
import os
from pydantic_settings import BaseSettings, SettingsConfigDict
import utils.logging_config  # noqa: F401  # side-effect import to configure logging
from dotenv import load_dotenv

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    gemini_api_key: str
    model_config = SettingsConfigDict(env_prefix="")


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
