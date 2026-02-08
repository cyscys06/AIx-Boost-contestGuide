/**
 * Date formatting and calculation helper functions
 */

import { DATE_FORMATS, DAYS_LABELS } from '../constants/date'
import { TIME_CONSTANTS, SCHEDULE_THRESHOLDS } from '../constants/schedule'

/**
 * Format date to short format (month day)
 */
export function formatDate(date) {
  return date.toLocaleDateString(DATE_FORMATS.LOCALE, DATE_FORMATS.MONTH_SHORT)
}

/**
 * Format day name (weekday short)
 */
export function formatDayName(date) {
  return date.toLocaleDateString(DATE_FORMATS.LOCALE, DATE_FORMATS.WEEKDAY_SHORT)
}

/**
 * Check if date is today
 */
export function isToday(date, today = new Date()) {
  return date.toDateString() === today.toDateString()
}

/**
 * Calculate days left until deadline
 */
export function getDaysLeft(deadline, today = new Date()) {
  const days = Math.ceil((new Date(deadline) - today) / TIME_CONSTANTS.MILLISECONDS_PER_DAY)
  
  if (days < 0) return DAYS_LABELS.EXPIRED
  if (days === 0) return DAYS_LABELS.TODAY
  return `${DAYS_LABELS.DAYS_PREFIX}${days}`
}

/**
 * Check if deadline is urgent (within threshold days)
 */
export function isUrgentDeadline(deadline, today = new Date()) {
  const daysLeft = Math.ceil((new Date(deadline) - today) / TIME_CONSTANTS.MILLISECONDS_PER_DAY)
  return daysLeft >= 0 && daysLeft <= SCHEDULE_THRESHOLDS.URGENT_DAYS
}
