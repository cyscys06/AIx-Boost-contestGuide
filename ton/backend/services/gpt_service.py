"""
GPT Service - Handles all OpenAI API interactions

This module provides:
- Real GPT API integration when API key is available
- Mock responses as fallback when API key is missing
- Structured JSON response parsing
- Error handling and retry logic
"""

import json
import logging
from typing import Optional, List, Tuple
from datetime import datetime, timedelta
import random

from openai import OpenAI, APIError, APITimeoutError, RateLimitError

from config import (
    OPENAI_API_KEY,
    OPENAI_MODEL,
    OPENAI_VISION_MODEL,
    OPENAI_MAX_TOKENS,
    OPENAI_TEMPERATURE,
    API_TIMEOUT,
    is_api_key_valid,
    get_api_mode
)
from schemas import (
    UserProfileInput,
    AnalysisData,
    AnalysisResult,
    AnalysisScores,
    ScoreDetail,
    ContestInfo,
    ChecklistItem,
    AlternativeContest,
    ConfidenceInfo,
    ExtractedInfo,
    ExtractionConfidence,
    AssistantMessage,
    AssistantAction,
    ReadinessData,
    ReadinessBreakdown,
    ReadinessImprovement,
    StrategicVerdict,
    HiddenExpectation,
    DealBreaker,
    ParticipationScenario,
    ScenarioWeek,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_client = None
if is_api_key_valid():
    _client = OpenAI(api_key=OPENAI_API_KEY, timeout=API_TIMEOUT)
    logger.info(f"OpenAI client initialized with model: {OPENAI_MODEL}")
else:
    logger.warning("OpenAI API key not configured - using mock responses")


# ============================================
# PROMPTS
# ============================================

SYSTEM_PROMPT_ANALYZE = """당신은 공모전 추천 전문가 AI입니다.
사용자 프로필과 공모전 정보를 분석하여 적합도를 평가하고 전략적 조언을 제공합니다.

반드시 JSON만 출력하세요.
설명, 코드블럭, 마크다운을 절대 포함하지 마세요.
JSON 앞뒤에 어떤 문자도 넣지 마세요.

응답 형식:
{
  "contestInfo": {...},
  "strategicVerdict": {...},
  "scores": {...},
  "recommendation": "...",
  "opportunities": [],
  "warnings": [],
  "hiddenExpectations": [],
  "dealBreakers": [],
  "checklist": [],
  "scenario": {...}
}
"""


# ============================================
# HELPER
# ============================================

def parse_gpt_response(response_text: str) -> dict:
    try:
        return json.loads(response_text)
    except:
        pass

    if "```json" in response_text:
        start = response_text.find("```json") + 7
        end = response_text.find("```", start)
        if end > start:
            return json.loads(response_text[start:end].strip())

    start = response_text.find("{")
    end = response_text.rfind("}") + 1
    return json.loads(response_text[start:end])


# ============================================
# GPT CALL
# ============================================

async def call_gpt_api(
    messages: List[dict],
    use_vision: bool = False,
    max_retries: int = 2
) -> Optional[str]:

    if not _client:
        return None

    model = OPENAI_VISION_MODEL if use_vision else OPENAI_MODEL

    for attempt in range(max_retries + 1):
        try:
            response = _client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=OPENAI_MAX_TOKENS,
                temperature=OPENAI_TEMPERATURE,
            )

            choice = response.choices[0]

            logger.info(f"GPT finish_reason: {choice.finish_reason}")

            text = choice.message.content if choice.message else None

            if not text:
                logger.error("Empty GPT response received")
                return None

            return text

        except RateLimitError as e:
            logger.warning(f"Rate limit hit (attempt {attempt + 1}): {e}")
            if attempt < max_retries:
                import asyncio
                await asyncio.sleep(2 ** attempt)
            continue

        except APITimeoutError as e:
            logger.warning(f"API timeout (attempt {attempt + 1}): {e}")
            if attempt < max_retries:
                continue
            raise

        except APIError as e:
            logger.error(f"API error: {e}")
            raise

        except Exception as e:
            logger.error(f"Unexpected error calling GPT API: {e}")
            raise

    return None
