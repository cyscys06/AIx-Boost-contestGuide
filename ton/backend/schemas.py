"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel
from typing import Optional, List


# ============================================
# Request Schemas
# ============================================

class SkillInput(BaseModel):
    name: str
    level: int


class UserProfileInput(BaseModel):
    major: Optional[str] = None
    skills: Optional[List[SkillInput]] = None
    goal: Optional[str] = None
    hoursPerWeek: Optional[int] = None
    preferredTeamSize: Optional[str] = None


class AnalysisOptions(BaseModel):
    includeAlternatives: bool = True
    generateChecklist: bool = True


class AssistantContext(BaseModel):
    currentPage: str
    contests: Optional[List[dict]] = None
    recentAction: Optional[str] = None
    type: str = "proactive"


class ReadinessInput(BaseModel):
    userProfile: UserProfileInput
    contest: dict
    currentProgress: Optional[dict] = None


# ============================================
# Response Schemas
# ============================================

class ScoreDetail(BaseModel):
    score: int
    label: str
    reason: str


class AnalysisScores(BaseModel):
    skillMatch: Optional[ScoreDetail] = None
    difficulty: Optional[ScoreDetail] = None
    schedulePressure: Optional[ScoreDetail] = None
    teamFit: Optional[ScoreDetail] = None
    portfolioValue: Optional[ScoreDetail] = None
    readiness: Optional[ScoreDetail] = None


class ChecklistItem(BaseModel):
    text: str
    priority: str = "medium"


class ContestInfo(BaseModel):
    title: Optional[str] = None
    organizer: Optional[str] = None
    category: Optional[str] = None
    deadline: Optional[str] = None
    teamSize: Optional[str] = None
    requirements: Optional[List[str]] = None
    prizes: Optional[List[str]] = None
    description: Optional[str] = None


class AlternativeContest(BaseModel):
    title: str
    reason: str
    deadline: Optional[str] = None


# NEW: Strategic verdict for analysis framing
class StrategicVerdict(BaseModel):
    summary: str  # One-line strategic summary
    fitType: str  # "opportunity" | "risky" | "mismatch"
    confidence: float


# NEW: Hidden expectations inferred from contest
class HiddenExpectation(BaseModel):
    insight: str
    source: str  # "explicit" | "inferred"
    importance: str  # "high" | "medium" | "low"


# NEW: Deal breaker that should prevent participation
class DealBreaker(BaseModel):
    reason: str
    severity: str  # "critical" | "serious"


# NEW: Scenario timeline item
class ScenarioWeek(BaseModel):
    week: str
    tasks: List[str]
    hours: int
    riskLevel: str  # "low" | "medium" | "high"
    riskNote: Optional[str] = None


# NEW: Participation scenario simulation
class ParticipationScenario(BaseModel):
    totalHours: int
    weeksNeeded: int
    userWeeklyHours: int
    feasible: bool
    conclusion: str
    weeks: List[ScenarioWeek]


class AnalysisResult(BaseModel):
    recommendation: str
    scores: AnalysisScores
    strengths: List[str]
    concerns: List[str]
    checklist: Optional[List[ChecklistItem]] = None
    # NEW strategic fields
    strategicVerdict: Optional[StrategicVerdict] = None
    hiddenExpectations: Optional[List[HiddenExpectation]] = None
    opportunities: Optional[List[str]] = None
    warnings: Optional[List[str]] = None
    dealBreakers: Optional[List[DealBreaker]] = None
    scenario: Optional[ParticipationScenario] = None


class ConfidenceInfo(BaseModel):
    overall: float
    infoExtraction: float
    scoreAccuracy: float


class AnalysisData(BaseModel):
    contestInfo: ContestInfo
    analysis: AnalysisResult
    alternatives: Optional[List[AlternativeContest]] = None
    confidence: ConfidenceInfo


class AnalysisResponse(BaseModel):
    success: bool
    data: Optional[AnalysisData] = None
    error: Optional[str] = None
    meta: Optional[dict] = None


class ExtractedInfo(BaseModel):
    title: Optional[str] = None
    organizer: Optional[str] = None
    deadline: Optional[str] = None
    category: Optional[str] = None
    requirements: Optional[str] = None
    description: Optional[str] = None


class ExtractionConfidence(BaseModel):
    title: str = "low"
    deadline: str = "low"
    requirements: str = "low"


class ExtractionData(BaseModel):
    extracted: ExtractedInfo
    confidence: ExtractionConfidence
    rawText: Optional[str] = None


class ExtractionResponse(BaseModel):
    success: bool
    data: Optional[ExtractionData] = None
    error: Optional[str] = None


class AssistantAction(BaseModel):
    label: str
    action: str
    target: Optional[str] = None
    duration: Optional[str] = None


class AssistantMessage(BaseModel):
    message: str
    suggestedActions: List[AssistantAction]
    tone: str = "neutral"


class AssistantResponse(BaseModel):
    success: bool
    data: Optional[AssistantMessage] = None
    error: Optional[str] = None


class ReadinessBreakdown(BaseModel):
    skillReadiness: int
    timeReadiness: int
    progressReadiness: int
    resourceReadiness: int


class ReadinessImprovement(BaseModel):
    action: str
    impact: str


class ReadinessData(BaseModel):
    readinessScore: int
    breakdown: ReadinessBreakdown
    improvements: List[ReadinessImprovement]


class ReadinessResponse(BaseModel):
    success: bool
    data: Optional[ReadinessData] = None
    error: Optional[str] = None
