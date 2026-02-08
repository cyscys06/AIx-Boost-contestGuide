"""
Backend constants
"""

# API Settings
API_VERSION = "1.0.0"
API_TITLE = "Contest Guide API"
API_DESCRIPTION = "AI-powered contest recommendation service"

# File Upload Settings
MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024  # 20MB
ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

# OpenAI Default Settings
DEFAULT_OPENAI_MODEL = "gpt-4o"
DEFAULT_OPENAI_MAX_TOKENS = 4096
DEFAULT_OPENAI_TEMPERATURE = 0.7
DEFAULT_API_TIMEOUT_SECONDS = 60

# API Key Validation
MIN_API_KEY_LENGTH = 20
API_KEY_PREFIX = "sk-"

# CORS Settings
DEFAULT_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]
