import type { DayOfWeek } from '@/types'

/**
 * Date utility functions for the Porter Shift Management System
 */

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday', 
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
]

/**
 * Format a date to YYYY-MM-DD string
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Parse a date string to Date object
 */
export function parseDate(dateString: string): Date {
  return new Date(dateString + 'T00:00:00')
}

/**
 * Get the current date as YYYY-MM-DD string
 */
export function getCurrentDate(): string {
  return formatDate(new Date())
}

/**
 * Get the day of week name for a given date
 */
export function getDayOfWeek(date: Date): DayOfWeek {
  const dayIndex = date.getDay()
  // JavaScript getDay() returns 0 for Sunday, we want Monday = 0
  const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1
  return DAYS_OF_WEEK[adjustedIndex]
}

/**
 * Calculate the number of days between two dates
 */
export function daysBetween(startDate: Date, endDate: Date): number {
  const timeDiff = endDate.getTime() - startDate.getTime()
  return Math.floor(timeDiff / (1000 * 60 * 60 * 24))
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Get the start of the week (Monday) for a given date
 */
export function getWeekStart(date: Date): Date {
  const dayOfWeek = date.getDay()
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Monday = 1
  return addDays(date, diff)
}

/**
 * Get an array of dates for a week starting from Monday
 */
export function getWeekDates(startDate: Date): Date[] {
  const weekStart = getWeekStart(startDate)
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

/**
 * Get dates for multiple weeks starting from a given date
 */
export function getMultipleWeeks(startDate: Date, weekCount: number): Date[][] {
  const weeks: Date[][] = []
  let currentWeekStart = getWeekStart(startDate)
  
  for (let i = 0; i < weekCount; i++) {
    weeks.push(getWeekDates(currentWeekStart))
    currentWeekStart = addDays(currentWeekStart, 7)
  }
  
  return weeks
}

/**
 * Format time string to HH:MM format
 */
export function formatTime(timeString: string): string {
  if (!timeString) return ''
  
  // Handle both HH:MM and HH:MM:SS formats
  const parts = timeString.split(':')
  return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`
}

/**
 * Parse time string to minutes since midnight
 */
export function timeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Convert minutes since midnight to time string
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Check if a time range overlaps with another time range
 */
export function timeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const start1Minutes = timeToMinutes(start1)
  const end1Minutes = timeToMinutes(end1)
  const start2Minutes = timeToMinutes(start2)
  const end2Minutes = timeToMinutes(end2)
  
  // Handle overnight shifts (end time is next day)
  const end1Adjusted = end1Minutes < start1Minutes ? end1Minutes + 1440 : end1Minutes
  const end2Adjusted = end2Minutes < start2Minutes ? end2Minutes + 1440 : end2Minutes
  
  return start1Minutes < end2Adjusted && start2Minutes < end1Adjusted
}

/**
 * Calculate overlap duration between two time ranges in minutes
 */
export function calculateOverlapMinutes(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): number {
  if (!timeRangesOverlap(start1, end1, start2, end2)) {
    return 0
  }
  
  const start1Minutes = timeToMinutes(start1)
  const end1Minutes = timeToMinutes(end1)
  const start2Minutes = timeToMinutes(start2)
  const end2Minutes = timeToMinutes(end2)
  
  // Handle overnight shifts
  const end1Adjusted = end1Minutes < start1Minutes ? end1Minutes + 1440 : end1Minutes
  const end2Adjusted = end2Minutes < start2Minutes ? end2Minutes + 1440 : end2Minutes
  
  const overlapStart = Math.max(start1Minutes, start2Minutes)
  const overlapEnd = Math.min(end1Adjusted, end2Adjusted)
  
  return Math.max(0, overlapEnd - overlapStart)
}

/**
 * Check if a date falls within a date range (inclusive)
 */
export function isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
  const dateTime = date.getTime()
  return dateTime >= startDate.getTime() && dateTime <= endDate.getTime()
}

/**
 * Get a human-readable relative date string
 */
export function getRelativeDateString(date: Date): string {
  const today = new Date()
  const diffDays = daysBetween(today, date)
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`
  
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
}

/**
 * Format a date for display in the UI
 */
export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

/**
 * Format a date for display in tables (shorter format)
 */
export function formatTableDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
}
