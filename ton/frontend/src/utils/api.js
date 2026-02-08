/**
 * API utility functions for backend communication
 */

import { API_CONFIG, API_ENDPOINTS, ERROR_MESSAGES } from '../constants/api'

/**
 * Create AbortController with timeout
 */
function createTimeoutController(ms = API_CONFIG.DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), ms)
  return { controller, timeoutId }
}

/**
 * Generic fetch wrapper with error handling and timeout
 */
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`
  const timeout = options.timeout || API_CONFIG.DEFAULT_TIMEOUT_MS
  const { controller, timeoutId } = createTimeoutController(timeout)
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    signal: controller.signal,
    ...options
  }
  
  try {
    const response = await fetch(url, config)
    clearTimeout(timeoutId)
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`)
    }
    
    return data
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error.name === 'AbortError') {
      throw new Error(ERROR_MESSAGES.TIMEOUT)
    }
    
    console.error(`API Error [${endpoint}]:`, error)
    throw error
  }
}

/**
 * Health check
 */
export async function checkHealth() {
  return fetchAPI(API_ENDPOINTS.HEALTH)
}

/**
 * Analyze a contest
 * @param {Object} params
 * @param {Object} params.userProfile - User profile data
 * @param {Object} params.contest - Contest info (text and/or image)
 * @param {Object} params.options - Analysis options
 */
export async function analyzeContest({ userProfile, contest, options = {} }) {
  const formData = new FormData()
  const { controller, timeoutId } = createTimeoutController(API_CONFIG.ANALYSIS_TIMEOUT_MS)
  
  formData.append('user_profile', JSON.stringify(userProfile || {}))
  formData.append('contest_text', contest.text || '')
  
  if (contest.image) {
    formData.append('contest_image', contest.image)
  }
  
  formData.append('options', JSON.stringify(options))
  
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.ANALYZE}`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    const data = await response.json()
    
    if (!response.ok || !data.success) {
      throw new Error(data.error || ERROR_MESSAGES.ANALYSIS_FAILED)
    }
    
    // Log AI mode info for debugging
    if (data.meta) {
      console.log(`AI Analysis completed - Mode: ${data.meta.aiMode}, Model: ${data.meta.modelUsed}, Time: ${data.meta.processingTime}ms`)
    }
    
    return data
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error.name === 'AbortError') {
      throw new Error(ERROR_MESSAGES.ANALYSIS_TIMEOUT)
    }
    
    throw error
  }
}

/**
 * Extract info from image only
 */
export async function extractFromImage(imageFile) {
  const formData = new FormData()
  formData.append('image', imageFile)
  
  const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.EXTRACT}`, {
    method: 'POST',
    body: formData
  })
  
  const data = await response.json()
  
  if (!response.ok || !data.success) {
    throw new Error(data.error || ERROR_MESSAGES.EXTRACTION_FAILED)
  }
  
  return data
}

/**
 * Get assistant suggestion
 */
export async function getAssistantSuggestion(context) {
  return fetchAPI(API_ENDPOINTS.ASSISTANT_SUGGEST, {
    method: 'POST',
    body: JSON.stringify(context)
  })
}

/**
 * Calculate readiness score
 */
export async function calculateReadiness({ userProfile, contest, currentProgress }) {
  return fetchAPI(API_ENDPOINTS.READINESS, {
    method: 'POST',
    body: JSON.stringify({ userProfile, contest, currentProgress })
  })
}
