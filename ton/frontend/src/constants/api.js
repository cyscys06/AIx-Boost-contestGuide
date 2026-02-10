/**
 * API configuration constants
 */

// 개발 환경에서는 프록시 사용, 프로덕션에서는 환경 변수 또는 기본값 사용
const getBaseURL = () => {
  // 환경 변수가 있으면 사용
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  // 개발 환경에서는 프록시 사용 (프록시가 작동하지 않으면 아래 주석 해제)
  if (import.meta.env.DEV) {
    return '/api'
    // 프록시가 작동하지 않는 경우 아래 주석을 해제하고 위 줄을 주석 처리하세요
    // return 'http://localhost:8000'
  }
  // 프로덕션에서는 기본값
  return '/api'
}

export const API_CONFIG = {
  BASE_URL: getBaseURL(),
  DEFAULT_TIMEOUT_MS: 90000, // 90 seconds for AI analysis
  ANALYSIS_TIMEOUT_MS: 120000 // 2 minutes for AI analysis
}

export const API_ENDPOINTS = {
  HEALTH: '/health',
  ANALYZE: '/analyze',
  EXTRACT: '/extract',
  ASSISTANT_SUGGEST: '/assistant/suggest',
  READINESS: '/readiness'
}

export const ERROR_MESSAGES = {
  TIMEOUT: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
  ANALYSIS_TIMEOUT: 'AI 분석 시간이 초과되었습니다. 다시 시도해주세요.',
  ANALYSIS_FAILED: 'Analysis failed',
  EXTRACTION_FAILED: 'Extraction failed'
}
