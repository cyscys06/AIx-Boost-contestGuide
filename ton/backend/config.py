"""
Configuration settings for the backend
"""
import os
from dotenv import load_dotenv
from constants import (
    API_VERSION,
    API_TITLE,
    API_DESCRIPTION,
    MAX_IMAGE_SIZE_BYTES,
    ALLOWED_IMAGE_TYPES,
    DEFAULT_OPENAI_MODEL,
    DEFAULT_OPENAI_MAX_TOKENS,
    DEFAULT_OPENAI_TEMPERATURE,
    DEFAULT_API_TIMEOUT_SECONDS,
    MIN_API_KEY_LENGTH,
    API_KEY_PREFIX,
    DEFAULT_CORS_ORIGINS,
)

load_dotenv()

# OpenAI Settings
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", DEFAULT_OPENAI_MODEL)
OPENAI_VISION_MODEL = os.getenv("OPENAI_VISION_MODEL", DEFAULT_OPENAI_MODEL)
OPENAI_MAX_TOKENS = int(os.getenv("OPENAI_MAX_TOKENS", DEFAULT_OPENAI_MAX_TOKENS))
OPENAI_TEMPERATURE = float(os.getenv("OPENAI_TEMPERATURE", DEFAULT_OPENAI_TEMPERATURE))

def is_api_key_valid() -> bool:
    """Check if OpenAI API key is configured and has valid format"""
    if not OPENAI_API_KEY:
        return False
    # Basic format check (sk-... or sk-proj-...)
    has_valid_prefix = OPENAI_API_KEY.startswith(API_KEY_PREFIX)
    has_valid_length = len(OPENAI_API_KEY) > MIN_API_KEY_LENGTH
    return has_valid_prefix and has_valid_length

def get_api_mode() -> str:
    """Return current API mode (real or mock)"""
    return "real" if is_api_key_valid() else "mock"

# CORS Settings
# Add server IP and domain to CORS origins
CORS_ORIGINS = DEFAULT_CORS_ORIGINS + [
    "http://202.31.147.98",
    "http://contest-guide.ac.kr",
    "https://contest-guide.ac.kr",
]

# File Upload Settings
MAX_IMAGE_SIZE = MAX_IMAGE_SIZE_BYTES

# Timeout settings
API_TIMEOUT = int(os.getenv("API_TIMEOUT", DEFAULT_API_TIMEOUT_SECONDS))
