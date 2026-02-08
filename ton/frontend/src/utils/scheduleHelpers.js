/**
 * Schedule generation helper functions
 */

import {
  SCHEDULE_THRESHOLDS,
  BUFFER_DAYS,
  FEASIBILITY_THRESHOLDS,
  TIME_CONSTANTS,
  DEFAULT_VALUES
} from '../constants/schedule'

/**
 * Calculate buffer days based on schedule pressure
 */
export function calculateBufferDays(schedulePressure) {
  if (schedulePressure >= SCHEDULE_THRESHOLDS.HIGH_SCHEDULE_PRESSURE) {
    return BUFFER_DAYS.HIGH
  }
  if (schedulePressure >= SCHEDULE_THRESHOLDS.MEDIUM_SCHEDULE_PRESSURE) {
    return BUFFER_DAYS.MEDIUM
  }
  return BUFFER_DAYS.LOW
}

/**
 * Calculate work days remaining (excluding buffer)
 */
export function calculateWorkDays(daysRemaining, bufferDays) {
  return Math.max(TIME_CONSTANTS.MINIMUM_WORK_DAYS, daysRemaining - bufferDays)
}

/**
 * Check if timeline is short (less than threshold)
 */
export function isShortTimeline(workDays) {
  return workDays < SCHEDULE_THRESHOLDS.SHORT_TIMELINE_DAYS
}

/**
 * Calculate phase ratio adjustment based on category and difficulty
 */
export function calculatePhaseRatio(phaseId, defaultRatio, difficulty, category, schedulePressure) {
  let ratio = defaultRatio

  if (phaseId === 'research' || phaseId === 'ideation') {
    if (difficulty >= SCHEDULE_THRESHOLDS.HIGH_DIFFICULTY) ratio *= 1.2
    if (category === '디자인') ratio *= 1.1
  }

  if (phaseId === 'production') {
    if (category === '개발' || category === 'AI/ML') ratio *= 1.1
    if (schedulePressure >= SCHEDULE_THRESHOLDS.HIGH_SCHEDULE_PRESSURE) ratio *= 0.95
  }

  if (phaseId === 'polish') {
    if (category === '디자인') ratio *= 1.3
  }

  if (phaseId === 'submission') {
    if (schedulePressure >= SCHEDULE_THRESHOLDS.SUBMISSION_PRESSURE_THRESHOLD) ratio *= 1.2
  }

  return ratio
}

/**
 * Calculate feasibility verdict based on ratio
 */
export function calculateFeasibilityVerdict(feasibilityRatio) {
  if (feasibilityRatio >= FEASIBILITY_THRESHOLDS.COMFORTABLE) {
    return { level: 'comfortable', message: '여유있게 완수 가능해요', color: 'success' }
  }
  if (feasibilityRatio >= FEASIBILITY_THRESHOLDS.ACHIEVABLE) {
    return { level: 'achievable', message: '계획대로 하면 완수 가능해요', color: 'success' }
  }
  if (feasibilityRatio >= FEASIBILITY_THRESHOLDS.TIGHT) {
    return { level: 'tight', message: '핵심만 집중하면 가능해요', color: 'warning' }
  }
  return { level: 'risky', message: '일정이 빠듯해요. 우선순위를 정해주세요', color: 'danger' }
}

/**
 * Generate warnings based on timeline and feasibility
 */
export function generateWarnings(daysRemaining, totalEstimatedHours, feasibilityRatio) {
  const warnings = []

  const isShortTimeline = daysRemaining < SCHEDULE_THRESHOLDS.SHORT_TIMELINE_DAYS
  const hasHighHours = totalEstimatedHours > 30
  const hasInsufficientTime = feasibilityRatio < FEASIBILITY_THRESHOLDS.TIGHT

  if (isShortTimeline && hasHighHours) {
    warnings.push({
      type: 'short_timeline',
      message: '남은 기간이 2주 미만이에요. 집중적인 작업이 필요해요.'
    })
  }

  if (hasInsufficientTime) {
    warnings.push({
      type: 'insufficient_time',
      message: '가용 시간이 부족해요. 필수 항목에만 집중하세요.'
    })
  }

  return warnings
}

/**
 * Calculate urgency level based on days left
 */
export function calculateUrgency(daysLeft) {
  if (daysLeft <= SCHEDULE_THRESHOLDS.URGENT_DAYS) return 'high'
  if (daysLeft <= SCHEDULE_THRESHOLDS.MEDIUM_URGENCY_DAYS) return 'medium'
  return 'low'
}
