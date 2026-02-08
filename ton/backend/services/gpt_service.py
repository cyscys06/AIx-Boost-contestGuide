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

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize OpenAI client (only if API key is valid)
_client = None
if is_api_key_valid():
    _client = OpenAI(api_key=OPENAI_API_KEY, timeout=API_TIMEOUT)
    logger.info(f"OpenAI client initialized with model: {OPENAI_MODEL}")
else:
    logger.warning("OpenAI API key not configured - using mock responses")


# ============================================
# PROMPT TEMPLATES
# ============================================

SYSTEM_PROMPT_ANALYZE = """당신은 공모전 추천 전문가 AI입니다.
사용자 프로필과 공모전 정보를 분석하여 적합도를 평가하고 전략적 조언을 제공합니다.

## 분석 기준
1. skillMatch (기술 적합도): 사용자 기술과 공모전 요구사항 일치도 (0-100)
2. difficulty (난이도): 공모전 예상 난이도 (0-100, 높을수록 어려움)
3. schedulePressure (일정 압박): 마감까지 시간 대비 작업량 (0-100, 높을수록 촉박)
4. teamFit (참가 형태 적합도): 개인/팀 선호도 일치 (0-100)
5. portfolioValue (포트폴리오 가치): 참가 시 포트폴리오 가치 (0-100)
6. readiness (준비도): 현재 참가 준비 정도 (0-100)

## 응답 형식
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트를 추가하지 마세요.

```json
{
  "contestInfo": {
    "title": "공모전 제목",
    "organizer": "주최 기관",
    "category": "AI/ML|개발|디자인|창업/비즈니스|데이터|일반 중 하나",
    "deadline": "YYYY-MM-DD 형식 또는 null",
    "teamSize": "참가 인원 정보",
    "requirements": ["요구사항1", "요구사항2"],
    "prizes": ["시상 내역1", "시상 내역2"],
    "description": "공모전 설명 요약"
  },
  "strategicVerdict": {
    "summary": "1-2문장의 핵심 전략 요약",
    "fitType": "opportunity|risky|mismatch 중 하나",
    "confidence": 0.0-1.0 사이 숫자
  },
  "scores": {
    "skillMatch": {"score": 0-100, "label": "높음|보통|낮음", "reason": "이유"},
    "difficulty": {"score": 0-100, "label": "높음|보통|낮음", "reason": "이유"},
    "schedulePressure": {"score": 0-100, "label": "높음|보통|낮음", "reason": "이유"},
    "teamFit": {"score": 0-100, "label": "높음|보통|낮음", "reason": "이유"},
    "portfolioValue": {"score": 0-100, "label": "높음|보통|낮음", "reason": "이유"},
    "readiness": {"score": 0-100, "label": "높음|보통|낮음", "reason": "이유"}
  },
  "recommendation": "사용자에게 맞춤화된 추천 메시지 (2-3문장)",
  "opportunities": ["기회 요소1", "기회 요소2"],
  "warnings": ["주의사항1", "주의사항2"],
  "hiddenExpectations": [
    {"insight": "숨겨진 기대사항", "source": "explicit|inferred", "importance": "high|medium|low"}
  ],
  "dealBreakers": [
    {"reason": "참가 불가 사유", "severity": "critical|serious"}
  ],
  "checklist": [
    {"text": "준비 항목", "priority": "high|medium|low"}
  ],
  "scenario": {
    "totalHours": 예상시간(숫자),
    "weeksNeeded": 필요주수(숫자),
    "feasible": true|false,
    "conclusion": "결론 메시지"
  }
}
```

불확실한 정보는 최선의 추론을 하되, 추론임을 명시하세요."""

SYSTEM_PROMPT_EXTRACT = """공모전 포스터 이미지에서 정보를 추출합니다.

반드시 아래 JSON 형식으로만 응답하세요:
```json
{
  "title": "공모전 제목 또는 null",
  "organizer": "주최 기관 또는 null",
  "deadline": "YYYY-MM-DD 형식 또는 null",
  "category": "AI/ML|개발|디자인|창업/비즈니스|데이터|일반 중 하나",
  "requirements": "참가 자격/요건 텍스트 또는 null",
  "description": "공모전 설명 또는 null",
  "rawText": "이미지에서 인식된 전체 텍스트",
  "confidence": {
    "title": "high|medium|low",
    "deadline": "high|medium|low",
    "requirements": "high|medium|low"
  }
}
```

보이는 텍스트만 추출하고, 불명확한 정보는 null로 표시하세요."""


# ============================================
# HELPER FUNCTIONS
# ============================================

def build_user_message(profile: UserProfileInput, contest_text: str) -> str:
    """Build user message for GPT from profile and contest info"""
    
    skills_text = ", ".join([s.name for s in profile.skills]) if profile.skills else "없음"
    
    return f"""## 사용자 프로필
- 전공: {profile.major or '미입력'}
- 기술 스택: {skills_text}
- 목표: {profile.goal or '미입력'}
- 주간 가용 시간: {profile.hoursPerWeek or 10}시간
- 선호 참가 형태: {profile.preferredTeamSize or '무관'}

## 공모전 정보
{contest_text}

위 정보를 바탕으로 분석해주세요."""


def parse_gpt_response(response_text: str) -> dict:
    """Parse GPT response and extract JSON"""
    
    # Try to find JSON in response
    try:
        # First, try direct parse
        return json.loads(response_text)
    except json.JSONDecodeError:
        pass
    
    # Try to extract JSON from markdown code block
    if "```json" in response_text:
        start = response_text.find("```json") + 7
        end = response_text.find("```", start)
        if end > start:
            try:
                return json.loads(response_text[start:end].strip())
            except json.JSONDecodeError:
                pass
    
    # Try to find JSON object
    start = response_text.find("{")
    end = response_text.rfind("}") + 1
    if start >= 0 and end > start:
        try:
            return json.loads(response_text[start:end])
        except json.JSONDecodeError:
            pass
    
    raise ValueError("Could not parse JSON from GPT response")


def get_label_from_score(score: int, inverted: bool = False) -> str:
    """Convert score to label"""
    effective = 100 - score if inverted else score
    if effective >= 70:
        return "높음"
    elif effective >= 40:
        return "보통"
    return "낮음"


# ============================================
# REAL GPT API FUNCTIONS
# ============================================

async def call_gpt_api(
    messages: List[dict],
    use_vision: bool = False,
    max_retries: int = 2
) -> Optional[str]:
    """
    Call OpenAI API with retry logic
    
    Args:
        messages: List of message dicts
        use_vision: Whether to use vision model
        max_retries: Number of retries on failure
    
    Returns:
        Response text or None on failure
    """
    if not _client:
        return None
    
    model = OPENAI_VISION_MODEL if use_vision else OPENAI_MODEL
    
    for attempt in range(max_retries + 1):
        try:
            # GPT-5.2 and newer models require max_completion_tokens instead of max_tokens
            response = _client.chat.completions.create(
                model=model,
                messages=messages,
                max_completion_tokens=OPENAI_MAX_TOKENS,
                temperature=OPENAI_TEMPERATURE,
                response_format={"type": "json_object"}
            )
            return response.choices[0].message.content
            
        except RateLimitError as e:
            logger.warning(f"Rate limit hit (attempt {attempt + 1}): {e}")
            if attempt < max_retries:
                import asyncio
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
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


async def analyze_with_gpt(
    profile: UserProfileInput,
    contest_text: str,
    image_base64: Optional[str] = None,
    options: dict = None
) -> AnalysisData:
    """
    Analyze contest using real GPT API
    """
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT_ANALYZE}
    ]
    
    user_content = build_user_message(profile, contest_text)
    
    if image_base64:
        messages.append({
            "role": "user",
            "content": [
                {"type": "text", "text": user_content},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{image_base64}",
                        "detail": "high"
                    }
                }
            ]
        })
        response_text = await call_gpt_api(messages, use_vision=True)
    else:
        messages.append({"role": "user", "content": user_content})
        response_text = await call_gpt_api(messages, use_vision=False)
    
    if not response_text:
        raise Exception("Failed to get response from GPT API")
    
    # Parse response
    data = parse_gpt_response(response_text)
    
    # Build response objects
    contest_info = ContestInfo(
        title=data.get("contestInfo", {}).get("title", "분석된 공모전"),
        organizer=data.get("contestInfo", {}).get("organizer"),
        category=data.get("contestInfo", {}).get("category", "일반"),
        deadline=data.get("contestInfo", {}).get("deadline"),
        teamSize=data.get("contestInfo", {}).get("teamSize"),
        requirements=data.get("contestInfo", {}).get("requirements", []),
        prizes=data.get("contestInfo", {}).get("prizes", []),
        description=data.get("contestInfo", {}).get("description")
    )
    
    scores_data = data.get("scores", {})
    scores = AnalysisScores(
        skillMatch=ScoreDetail(**scores_data.get("skillMatch", {"score": 50, "label": "보통", "reason": "분석 중"})),
        difficulty=ScoreDetail(**scores_data.get("difficulty", {"score": 50, "label": "보통", "reason": "분석 중"})),
        schedulePressure=ScoreDetail(**scores_data.get("schedulePressure", {"score": 50, "label": "보통", "reason": "분석 중"})),
        teamFit=ScoreDetail(**scores_data.get("teamFit", {"score": 50, "label": "보통", "reason": "분석 중"})),
        portfolioValue=ScoreDetail(**scores_data.get("portfolioValue", {"score": 50, "label": "보통", "reason": "분석 중"})),
        readiness=ScoreDetail(**scores_data.get("readiness", {"score": 50, "label": "보통", "reason": "분석 중"}))
    )
    
    verdict_data = data.get("strategicVerdict", {})
    strategic_verdict = StrategicVerdict(
        summary=verdict_data.get("summary", "분석 완료"),
        fitType=verdict_data.get("fitType", "risky"),
        confidence=verdict_data.get("confidence", 0.7)
    )
    
    hidden_expectations = [
        HiddenExpectation(**exp) 
        for exp in data.get("hiddenExpectations", [])[:3]
    ] if data.get("hiddenExpectations") else None
    
    deal_breakers = [
        DealBreaker(**db) 
        for db in data.get("dealBreakers", [])
    ] if data.get("dealBreakers") else None
    
    checklist = [
        ChecklistItem(**item) 
        for item in data.get("checklist", [])[:10]
    ] if options and options.get("generateChecklist") and data.get("checklist") else None
    
    scenario_data = data.get("scenario", {})
    scenario = ParticipationScenario(
        totalHours=scenario_data.get("totalHours", 80),
        weeksNeeded=scenario_data.get("weeksNeeded", 4),
        userWeeklyHours=profile.hoursPerWeek or 10,
        feasible=scenario_data.get("feasible", True),
        conclusion=scenario_data.get("conclusion", "참가 가능"),
        weeks=[]  # Simplified for now
    ) if scenario_data else None
    
    return AnalysisData(
        contestInfo=contest_info,
        analysis=AnalysisResult(
            recommendation=data.get("recommendation", "분석 결과를 확인하세요."),
            scores=scores,
            strengths=data.get("opportunities", [])[:3],
            concerns=data.get("warnings", [])[:3],
            checklist=checklist,
            strategicVerdict=strategic_verdict,
            hiddenExpectations=hidden_expectations,
            opportunities=data.get("opportunities", []),
            warnings=data.get("warnings", []),
            dealBreakers=deal_breakers,
            scenario=scenario
        ),
        alternatives=None,
        confidence=ConfidenceInfo(
            overall=strategic_verdict.confidence,
            infoExtraction=0.85 if contest_text else 0.70,
            scoreAccuracy=0.80
        )
    )


async def extract_with_gpt(image_base64: str) -> Tuple[ExtractedInfo, ExtractionConfidence, str]:
    """
    Extract contest info from image using GPT Vision
    """
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT_EXTRACT},
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "이 공모전 포스터에서 정보를 추출해주세요."},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{image_base64}",
                        "detail": "high"
                    }
                }
            ]
        }
    ]
    
    response_text = await call_gpt_api(messages, use_vision=True)
    
    if not response_text:
        raise Exception("Failed to get response from GPT Vision API")
    
    data = parse_gpt_response(response_text)
    
    extracted = ExtractedInfo(
        title=data.get("title"),
        organizer=data.get("organizer"),
        deadline=data.get("deadline"),
        category=data.get("category", "일반"),
        requirements=data.get("requirements"),
        description=data.get("description")
    )
    
    conf_data = data.get("confidence", {})
    confidence = ExtractionConfidence(
        title=conf_data.get("title", "medium"),
        deadline=conf_data.get("deadline", "low"),
        requirements=conf_data.get("requirements", "low")
    )
    
    raw_text = data.get("rawText", "")
    
    return extracted, confidence, raw_text


# ============================================
# MOCK DATA GENERATORS (Fallback)
# ============================================

def generate_mock_contest_info(contest_text: str) -> ContestInfo:
    """Generate mock contest info from text input"""
    keywords = contest_text.lower() if contest_text else ""
    
    category = "일반"
    if any(word in keywords for word in ["ai", "인공지능", "머신러닝", "딥러닝"]):
        category = "AI/ML"
    elif any(word in keywords for word in ["디자인", "ux", "ui"]):
        category = "디자인"
    elif any(word in keywords for word in ["창업", "스타트업", "비즈니스"]):
        category = "창업/비즈니스"
    elif any(word in keywords for word in ["웹", "앱", "개발", "프로그래밍"]):
        category = "개발"
    elif any(word in keywords for word in ["데이터", "분석", "빅데이터"]):
        category = "데이터"
    
    deadline = datetime.now() + timedelta(days=random.randint(14, 56))
    
    return ContestInfo(
        title="2026 " + (category if category != "일반" else "혁신") + " 공모전",
        organizer="한국공모전협회",
        category=category,
        deadline=deadline.strftime("%Y-%m-%d"),
        teamSize="1-3명",
        requirements=["대학생 이상", "관련 분야 관심자"],
        prizes=["대상 500만원", "최우수상 300만원", "우수상 100만원"],
        description=contest_text[:200] if contest_text else "공모전 설명"
    )


def generate_mock_scores(profile: UserProfileInput, contest_info: ContestInfo) -> AnalysisScores:
    """Generate mock analysis scores"""
    skill_count = len(profile.skills) if profile.skills else 0
    base_skill_score = min(60 + skill_count * 10, 95)
    skill_score = max(0, min(100, base_skill_score + random.randint(-10, 10)))
    
    difficulty_base = {"AI/ML": 75, "개발": 65, "디자인": 55, "창업/비즈니스": 60, "데이터": 70, "일반": 50}
    difficulty_score = max(0, min(100, difficulty_base.get(contest_info.category, 50) + random.randint(-10, 10)))
    
    if contest_info.deadline:
        try:
            deadline = datetime.strptime(contest_info.deadline, "%Y-%m-%d")
            days_left = (deadline - datetime.now()).days
            pressure_score = 90 if days_left < 14 else 60 if days_left < 30 else 30
            pressure_score = max(0, min(100, pressure_score + random.randint(-10, 10)))
        except:
            pressure_score = 50
    else:
        pressure_score = 50
    
    team_pref = profile.preferredTeamSize or "any"
    team_score = 90 if team_pref == "solo" else 85
    team_score = max(0, min(100, team_score + random.randint(-10, 10)))
    
    portfolio_base = {"AI/ML": 85, "개발": 80, "디자인": 75, "창업/비즈니스": 70, "데이터": 80, "일반": 60}
    portfolio_score = max(0, min(100, portfolio_base.get(contest_info.category, 60) + random.randint(-10, 10)))
    
    readiness = int((skill_score * 0.3 + (100 - difficulty_score) * 0.2 + 
                     (100 - pressure_score) * 0.2 + team_score * 0.15 + portfolio_score * 0.15))
    
    return AnalysisScores(
        skillMatch=ScoreDetail(score=skill_score, label=get_label_from_score(skill_score), reason=f"보유 기술 {skill_count}개"),
        difficulty=ScoreDetail(score=difficulty_score, label=get_label_from_score(difficulty_score, True), reason=f"{contest_info.category} 분야"),
        schedulePressure=ScoreDetail(score=pressure_score, label=get_label_from_score(pressure_score, True), reason="마감 일정 기준"),
        teamFit=ScoreDetail(score=team_score, label=get_label_from_score(team_score), reason=f"참가 형태: {contest_info.teamSize}"),
        portfolioValue=ScoreDetail(score=portfolio_score, label=get_label_from_score(portfolio_score), reason=f"{contest_info.category} 분야 가치"),
        readiness=ScoreDetail(score=readiness, label=get_label_from_score(readiness), reason="종합 평가")
    )


def generate_mock_analysis(profile: UserProfileInput, contest_text: str, options: dict = None) -> AnalysisData:
    """Generate complete mock analysis"""
    contest_info = generate_mock_contest_info(contest_text)
    scores = generate_mock_scores(profile, contest_info)
    
    readiness = scores.readiness.score
    skill_match = scores.skillMatch.score
    pressure = scores.schedulePressure.score
    
    if readiness < 40 or (skill_match < 40 and pressure > 70):
        fit_type = "mismatch"
        summary = f"현재 상황에서 이 {contest_info.category} 공모전 참가는 권장하지 않습니다."
    elif readiness < 60 or pressure > 60:
        fit_type = "risky"
        summary = f"이 공모전은 기회가 될 수 있지만, 주의가 필요합니다."
    else:
        fit_type = "opportunity"
        summary = f"회원님의 역량과 이 공모전이 잘 맞습니다. 적극 추천합니다."
    
    strategic_verdict = StrategicVerdict(summary=summary, fitType=fit_type, confidence=0.75)
    
    skill_names = [s.name for s in profile.skills] if profile.skills else []
    recommendation = f"회원님의 {', '.join(skill_names[:3]) if skill_names else '관련'} 경험이 이 공모전에 적합합니다."
    
    opportunities = ["실전 경험 축적 기회", "포트폴리오 강화"]
    warnings = ["꾸준한 진행 점검 필요"]
    
    if scores.schedulePressure.score >= 60:
        warnings.append("일정 관리에 주의")
    
    hidden_expectations = [
        HiddenExpectation(insight="실제 적용 가능성이 중요할 수 있음", source="inferred", importance="high")
    ]
    
    user_weekly_hours = profile.hoursPerWeek or 10
    total_hours = 80
    weeks_needed = max(1, total_hours // user_weekly_hours)
    
    scenario = ParticipationScenario(
        totalHours=total_hours,
        weeksNeeded=weeks_needed,
        userWeeklyHours=user_weekly_hours,
        feasible=True,
        conclusion=f"주 {user_weekly_hours}시간 투자로 {weeks_needed}주 내 완료 가능",
        weeks=[]
    )
    
    checklist = [
        ChecklistItem(text="참가 신청서 작성", priority="high"),
        ChecklistItem(text="공모전 규정 확인", priority="high"),
        ChecklistItem(text="팀 구성 (필요시)", priority="medium"),
    ] if options and options.get("generateChecklist") else None
    
    return AnalysisData(
        contestInfo=contest_info,
        analysis=AnalysisResult(
            recommendation=recommendation,
            scores=scores,
            strengths=opportunities,
            concerns=warnings,
            checklist=checklist,
            strategicVerdict=strategic_verdict,
            hiddenExpectations=hidden_expectations,
            opportunities=opportunities,
            warnings=warnings,
            dealBreakers=None,
            scenario=scenario
        ),
        alternatives=None,
        confidence=ConfidenceInfo(overall=0.70, infoExtraction=0.65, scoreAccuracy=0.70)
    )


# ============================================
# MAIN SERVICE FUNCTIONS
# ============================================

async def analyze_contest(
    profile: UserProfileInput,
    contest_text: str,
    image_base64: Optional[str] = None,
    options: dict = None
) -> AnalysisData:
    """
    Analyze a contest and generate recommendations.
    Uses real GPT API if available, falls back to mock data otherwise.
    """
    mode = get_api_mode()
    logger.info(f"Analyzing contest in {mode} mode")
    
    if mode == "real":
        try:
            return await analyze_with_gpt(profile, contest_text, image_base64, options)
        except Exception as e:
            logger.error(f"GPT API failed, falling back to mock: {e}")
            # Fall back to mock on error
    
    # Mock mode or fallback
    return generate_mock_analysis(profile, contest_text, options)


async def extract_from_image(image_base64: str) -> Tuple[ExtractedInfo, ExtractionConfidence, str]:
    """
    Extract contest information from image.
    Uses GPT Vision if available, returns mock data otherwise.
    """
    mode = get_api_mode()
    logger.info(f"Extracting from image in {mode} mode")
    
    if mode == "real":
        try:
            return await extract_with_gpt(image_base64)
        except Exception as e:
            logger.error(f"GPT Vision failed, falling back to mock: {e}")
    
    # Mock extraction
    extracted = ExtractedInfo(
        title="[이미지 분석] 공모전",
        organizer="추출된 주최기관",
        deadline=(datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
        category="일반",
        requirements="이미지에서 추출된 참가 자격",
        description="이미지 분석 기능은 API 키 설정 후 사용 가능합니다."
    )
    
    confidence = ExtractionConfidence(title="low", deadline="low", requirements="low")
    raw_text = "[Mock] API 키 설정 후 실제 텍스트가 추출됩니다."
    
    return extracted, confidence, raw_text


async def generate_assistant_message(context: dict) -> AssistantMessage:
    """Generate contextual assistant message"""
    contests = context.get("contests", [])
    current_page = context.get("currentPage", "dashboard")
    msg_type = context.get("type", "proactive")
    
    if msg_type == "deadline_warning" and contests:
        contest = contests[0]
        return AssistantMessage(
            message=f"{contest.get('title', '공모전')} 마감이 다가오고 있어요. 준비 상황을 확인해볼까요?",
            suggestedActions=[
                AssistantAction(label="확인하기", action="navigate", target="/contests"),
                AssistantAction(label="나중에", action="dismiss")
            ],
            tone="warning"
        )
    
    if current_page == "analyze":
        return AssistantMessage(
            message="포스터 이미지를 업로드하면 자동으로 정보를 추출해드려요!",
            suggestedActions=[
                AssistantAction(label="이미지 업로드", action="focus", target="imageUpload")
            ],
            tone="helpful"
        )
    
    return AssistantMessage(
        message="새로운 공모전을 찾아볼까요?",
        suggestedActions=[
            AssistantAction(label="분석하기", action="navigate", target="/analyze")
        ],
        tone="encouraging"
    )


async def calculate_readiness(
    profile: UserProfileInput,
    contest: dict,
    progress: dict = None
) -> ReadinessData:
    """Calculate contest readiness score"""
    skill_count = len(profile.skills) if profile.skills else 0
    skill_readiness = min(50 + skill_count * 15, 95)
    
    hours = profile.hoursPerWeek or 10
    time_readiness = min(40 + hours * 3, 90)
    
    if progress:
        done = progress.get("checklistDone", 0)
        total = progress.get("checklistTotal", 1)
        progress_readiness = int((done / max(total, 1)) * 100)
    else:
        progress_readiness = 30
    
    resource_readiness = 80
    
    overall = int(
        skill_readiness * 0.35 +
        time_readiness * 0.25 +
        progress_readiness * 0.25 +
        resource_readiness * 0.15
    )
    
    improvements = []
    if progress_readiness < 50:
        improvements.append(ReadinessImprovement(action="체크리스트 항목 완료하기", impact="+15점"))
    if skill_readiness < 70:
        improvements.append(ReadinessImprovement(action="관련 기술 학습/복습", impact="+10점"))
    if time_readiness < 60:
        improvements.append(ReadinessImprovement(action="주간 투자 시간 늘리기", impact="+10점"))
    
    return ReadinessData(
        readinessScore=overall,
        breakdown=ReadinessBreakdown(
            skillReadiness=skill_readiness,
            timeReadiness=time_readiness,
            progressReadiness=progress_readiness,
            resourceReadiness=resource_readiness
        ),
        improvements=improvements
    )
