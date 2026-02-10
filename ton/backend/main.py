"""
Contest Guide API - FastAPI Backend

AI-powered contest recommendation and analysis service.
"""

import json
import base64
import time
from typing import Optional

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from config import (
    API_VERSION, 
    API_TITLE, 
    API_DESCRIPTION, 
    CORS_ORIGINS,
    MAX_IMAGE_SIZE,
    ALLOWED_IMAGE_TYPES,
    OPENAI_MODEL,
    get_api_mode,
    is_api_key_valid
)
from schemas import (
    UserProfileInput,
    AnalysisResponse,
    ExtractionResponse,
    ExtractionData,
    AssistantContext,
    AssistantResponse,
    ReadinessInput,
    ReadinessResponse,
)
from services.gpt_service import (
    analyze_contest,
    extract_from_image,
    generate_assistant_message,
    calculate_readiness,
)


# ============================================
# APP CONFIGURATION
# ============================================

app = FastAPI(
    title=API_TITLE,
    description=API_DESCRIPTION,
    version=API_VERSION,
    root_path="/api"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# HEALTH CHECK
# ============================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": API_VERSION,
        "service": "contest-guide-api",
        "aiMode": get_api_mode(),
        "model": OPENAI_MODEL if is_api_key_valid() else "mock"
    }


# ============================================
# CONTEST ANALYSIS
# ============================================

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    user_profile: str = Form(...),
    contest_text: str = Form(""),
    contest_image: Optional[UploadFile] = File(None),
    options: str = Form("{}")
):
    """
    Analyze a contest and generate personalized recommendations.
    
    Args:
        user_profile: JSON string of user profile
        contest_text: Contest description text
        contest_image: Optional poster image
        options: JSON string of analysis options
    
    Returns:
        AnalysisResponse with recommendations and scores
    """
    start_time = time.time()
    
    # Parse user profile
    try:
        profile_data = json.loads(user_profile)
        # 빈 객체나 None 값 처리
        if not profile_data:
            profile_data = {}
        profile = UserProfileInput(**profile_data)
    except json.JSONDecodeError as e:
        return AnalysisResponse(
            success=False,
            error=f"Invalid user profile JSON format: {str(e)}"
        )
    except Exception as e:
        import traceback
        print(f"User profile parsing error: {traceback.format_exc()}")
        return AnalysisResponse(
            success=False,
            error=f"Invalid user profile format: {str(e)}"
        )
    
    # Parse options
    try:
        opts = json.loads(options)
    except:
        opts = {}
    
    # Process image if provided
    image_base64 = None
    if contest_image:
        # Validate file type
        if contest_image.content_type not in ALLOWED_IMAGE_TYPES:
            return AnalysisResponse(
                success=False,
                error=f"Invalid image type. Allowed: {', '.join(ALLOWED_IMAGE_TYPES)}"
            )
        
        # Read and encode image
        try:
            content = await contest_image.read()
            if len(content) > MAX_IMAGE_SIZE:
                return AnalysisResponse(
                    success=False,
                    error=f"Image too large. Maximum size: {MAX_IMAGE_SIZE // (1024*1024)}MB"
                )
            image_base64 = base64.b64encode(content).decode('utf-8')
        except Exception as e:
            return AnalysisResponse(
                success=False,
                error=f"Failed to process image: {str(e)}"
            )
    
    # Validate input
    if not contest_text and not image_base64:
        return AnalysisResponse(
            success=False,
            error="Please provide contest text or image"
        )
    
    # Perform analysis
    try:
        result = await analyze_contest(
            profile=profile,
            contest_text=contest_text,
            image_base64=image_base64,
            options=opts
        )
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return AnalysisResponse(
            success=True,
            data=result,
            meta={
                "processingTime": processing_time,
                "modelUsed": OPENAI_MODEL if is_api_key_valid() else "mock",
                "aiMode": get_api_mode()
            }
        )
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Analysis error: {error_details}")  # 서버 콘솔에 상세 오류 출력
        return AnalysisResponse(
            success=False,
            error=f"Analysis failed: {str(e)}"
        )


# ============================================
# IMAGE EXTRACTION
# ============================================

@app.post("/extract", response_model=ExtractionResponse)
async def extract(
    image: UploadFile = File(...)
):
    """
    Extract contest information from an image.
    
    Args:
        image: Contest poster image
    
    Returns:
        ExtractionResponse with extracted data
    """
    
    # Validate file type
    if image.content_type not in ALLOWED_IMAGE_TYPES:
        return ExtractionResponse(
            success=False,
            error=f"Invalid image type. Allowed: {', '.join(ALLOWED_IMAGE_TYPES)}"
        )
    
    try:
        content = await image.read()
        if len(content) > MAX_IMAGE_SIZE:
            return ExtractionResponse(
                success=False,
                error=f"Image too large. Maximum size: {MAX_IMAGE_SIZE // (1024*1024)}MB"
            )
        
        image_base64 = base64.b64encode(content).decode('utf-8')
        
        extracted, confidence, raw_text = await extract_from_image(image_base64)
        
        return ExtractionResponse(
            success=True,
            data=ExtractionData(
                extracted=extracted,
                confidence=confidence,
                rawText=raw_text
            )
        )
    except Exception as e:
        return ExtractionResponse(
            success=False,
            error=f"Extraction failed: {str(e)}"
        )


# ============================================
# ASSISTANT
# ============================================

@app.post("/assistant/suggest", response_model=AssistantResponse)
async def assistant_suggest(context: AssistantContext):
    """
    Generate contextual assistant suggestions.
    
    Args:
        context: Current app context
    
    Returns:
        AssistantResponse with message and actions
    """
    
    try:
        message = await generate_assistant_message(context.model_dump())
        
        return AssistantResponse(
            success=True,
            data=message
        )
    except Exception as e:
        return AssistantResponse(
            success=False,
            error=f"Failed to generate suggestion: {str(e)}"
        )


# ============================================
# READINESS
# ============================================

@app.post("/readiness", response_model=ReadinessResponse)
async def readiness(input_data: ReadinessInput):
    """
    Calculate contest readiness score.
    
    Args:
        input_data: Profile, contest, and progress data
    
    Returns:
        ReadinessResponse with score and improvements
    """
    
    try:
        result = await calculate_readiness(
            profile=input_data.userProfile,
            contest=input_data.contest,
            progress=input_data.currentProgress
        )
        
        return ReadinessResponse(
            success=True,
            data=result
        )
    except Exception as e:
        return ReadinessResponse(
            success=False,
            error=f"Calculation failed: {str(e)}"
        )


# ============================================
# RUN SERVER
# ============================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
