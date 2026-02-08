/**
 * Schedule generation logic
 */

import {
  DEFAULT_PHASES,
  SHORT_TIMELINE_PHASES,
  TIME_CONSTANTS,
  DEFAULT_VALUES
} from '../constants/schedule'
import {
  calculateBufferDays,
  calculateWorkDays,
  isShortTimeline,
  calculatePhaseRatio,
  calculateFeasibilityVerdict,
  generateWarnings
} from './scheduleHelpers'

/**
 * Generate schedule phases based on timeline and contest data
 */
export function generatePhases({
  workDays,
  totalEstimatedHours,
  difficulty,
  category,
  schedulePressure
}) {
  const phasesToUse = isShortTimeline(workDays) ? SHORT_TIMELINE_PHASES : DEFAULT_PHASES

  // Calculate adjusted ratios
  const adjustedRatios = phasesToUse.map(phase => {
    const defaultRatio = phase.ratio !== undefined ? phase.ratio : (phase.defaultRatio ?? 0.2)
    return calculatePhaseRatio(phase.id, defaultRatio, difficulty, category, schedulePressure)
  })

  // Normalize ratios
  const totalRatio = adjustedRatios.reduce((a, b) => a + b, 0)
  const normalizedRatios = adjustedRatios.map(r => r / totalRatio)

  // Generate phases with dates
  const today = new Date(startDate)
  today.setHours(0, 0, 0, 0)
  let cursor = 0
  const phases = phasesToUse.map((phase, index) => {
    const ratio = normalizedRatios[index]
    const isLast = index === phasesToUse.length - 1
    const phaseDays = isLast
      ? Math.max(TIME_CONSTANTS.MINIMUM_WORK_DAYS, workDays - cursor)
      : Math.max(TIME_CONSTANTS.MINIMUM_WORK_DAYS, Math.round(workDays * ratio))

    const phaseStart = new Date(today.getTime() + cursor * TIME_CONSTANTS.MILLISECONDS_PER_DAY)
    cursor += phaseDays
    const phaseEnd = new Date(today.getTime() + Math.min(cursor, workDays) * TIME_CONSTANTS.MILLISECONDS_PER_DAY)

    const phaseHours = Math.round(totalEstimatedHours * ratio)

    return {
      id: phase.id,
      label: phase.label,
      icon: phase.icon || '',
      estimatedHours: phaseHours,
      startDate: phaseStart.toISOString().split('T')[0],
      endDate: phaseEnd.toISOString().split('T')[0],
      status: index === 0 ? 'in_progress' : 'pending',
      priority: phase.priority || 'must',
      tasks: []
    }
  })

  return phases
}

/**
 * Generate weekly plan based on phases and days remaining
 */
export function generateWeeklyPlan(phases, daysRemaining, totalEstimatedHours) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weeksRemaining = Math.ceil(daysRemaining / TIME_CONSTANTS.DAYS_PER_WEEK)
  const weeklyPlan = []

  for (let i = 0; i < weeksRemaining; i++) {
    const weekStart = new Date(today.getTime() + (i * TIME_CONSTANTS.DAYS_PER_WEEK * TIME_CONSTANTS.MILLISECONDS_PER_DAY))
    const weekEnd = new Date(weekStart.getTime() + (TIME_CONSTANTS.DAYS_PER_WEEK * TIME_CONSTANTS.MILLISECONDS_PER_DAY))

    const weekPhases = phases.filter(phase => {
      const phaseStart = new Date(phase.startDate)
      const phaseEnd = new Date(phase.endDate)
      return phaseStart < weekEnd && phaseEnd >= weekStart
    })

    weeklyPlan.push({
      weekNumber: i + 1,
      weekStart: weekStart.toISOString().split('T')[0],
      focus: weekPhases.map(p => p.label).join(' + '),
      phases: weekPhases.map(p => p.id),
      targetHours: Math.round(totalEstimatedHours / weeksRemaining)
    })
  }

  return weeklyPlan
}

/**
 * Create schedule object
 */
export function createSchedule({
  totalEstimatedHours,
  availableHours,
  phases,
  daysRemaining,
  weeklyPlan
}) {
  const feasibilityRatio = availableHours / totalEstimatedHours
  const verdict = calculateFeasibilityVerdict(feasibilityRatio)
  const warnings = generateWarnings(daysRemaining, totalEstimatedHours, feasibilityRatio)

  return {
    generatedAt: new Date().toISOString(),
    totalEstimatedHours,
    minimumHours: totalEstimatedHours,
    availableHours,
    feasibility: {
      score: Math.round(feasibilityRatio * 100),
      verdict,
      bufferHours: availableHours - totalEstimatedHours
    },
    phases,
    weeklyPlan,
    warnings
  }
}

/**
 * Extract schedule generation parameters from contest
 */
export function extractScheduleParams(contest) {
  const analysis = contest.analysis || {}
  const scores = analysis.scores || {}

  return {
    totalEstimatedHours: analysis.estimatedHours || analysis.scenario?.totalHours || DEFAULT_VALUES.ESTIMATED_HOURS,
    difficulty: scores.difficulty?.score ?? DEFAULT_VALUES.DIFFICULTY_SCORE,
    schedulePressure: scores.schedulePressure?.score ?? DEFAULT_VALUES.SCHEDULE_PRESSURE_SCORE,
    category: contest.info?.category || DEFAULT_VALUES.CATEGORY
  }
}
