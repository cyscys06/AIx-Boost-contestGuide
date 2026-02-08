/**
 * API configuration constants
 */

export const API_CONFIG = {
  BASE_URL: '/api',
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
