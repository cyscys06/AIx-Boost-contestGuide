/**
 * Schedule generation constants
 */

// Default task phases for schedule generation
export const DEFAULT_PHASES = [
  { id: 'research', label: '리서치', icon: '', defaultRatio: 0.15, priority: 'must' },
  { id: 'ideation', label: '아이디어 구상', icon: '', defaultRatio: 0.15, priority: 'must' },
  { id: 'production', label: '제작/개발', icon: '', defaultRatio: 0.45, priority: 'must' },
  { id: 'polish', label: '다듬기', icon: '', defaultRatio: 0.15, priority: 'nice' },
  { id: 'submission', label: '제출 준비', icon: '', defaultRatio: 0.10, priority: 'must' }
]

// Short timeline phases (for timelines less than 14 days)
export const SHORT_TIMELINE_PHASES = [
  { id: 'research', label: '리서치·아이디어', ratio: 0.35, priority: 'must' },
  { id: 'production', label: '제작·다듬기', ratio: 0.50, priority: 'must' },
  { id: 'submission', label: '제출 준비', ratio: 0.15, priority: 'must' }
]

// Schedule generation thresholds
export const SCHEDULE_THRESHOLDS = {
  SHORT_TIMELINE_DAYS: 14,
  HIGH_SCHEDULE_PRESSURE: 70,
  MEDIUM_SCHEDULE_PRESSURE: 50,
  HIGH_DIFFICULTY: 70,
  SUBMISSION_PRESSURE_THRESHOLD: 60,
  URGENT_DAYS: 7,
  MEDIUM_URGENCY_DAYS: 14
}

// Buffer days based on schedule pressure
export const BUFFER_DAYS = {
  HIGH: 2,    // schedulePressure >= 70
  MEDIUM: 3,  // schedulePressure >= 50
  LOW: 4      // schedulePressure < 50
}

// Feasibility ratio thresholds
export const FEASIBILITY_THRESHOLDS = {
  COMFORTABLE: 1.3,
  ACHIEVABLE: 1.0,
  TIGHT: 0.7
}

// Phase status order
export const PHASE_STATUS_ORDER = ['pending', 'in_progress', 'completed']

// Progress calculation
export const PROGRESS_BEHIND_THRESHOLD = 0.8

// Urgency levels
export const URGENCY_LEVELS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
}

// Time constants
export const TIME_CONSTANTS = {
  MILLISECONDS_PER_DAY: 24 * 60 * 60 * 1000,
  DAYS_PER_WEEK: 7,
  MINIMUM_WORK_DAYS: 1
}

// Default values
export const DEFAULT_VALUES = {
  ESTIMATED_HOURS: 40,
  DIFFICULTY_SCORE: 50,
  SCHEDULE_PRESSURE_SCORE: 50,
  CATEGORY: '일반',
  PRIORITY: 'medium',
  MIN_HOURS_INCREMENT: 0.5,
  MIN_HOURS: 0.5
}
