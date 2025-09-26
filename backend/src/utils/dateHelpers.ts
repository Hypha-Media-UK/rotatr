/**
 * Utility functions for date calculations in the Porter Shift Management System
 */
// @ts-nocheck

/**
 * Calculate the difference in days between two dates
 * @param date1 - First date (YYYY-MM-DD or Date object)
 * @param date2 - Second date (YYYY-MM-DD or Date object)
 * @returns Number of days between the dates (positive if date2 is after date1)
 */
export function daysBetween(date1: string | Date, date2: string | Date): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  const timeDiff = d2.getTime() - d1.getTime();
  return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
}

/**
 * Add days to a date
 * @param date - The base date (YYYY-MM-DD or Date object)
 * @param days - Number of days to add (can be negative)
 * @returns New date as YYYY-MM-DD string
 */
export function addDays(date: string | Date, days: number): string {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Get the current date as YYYY-MM-DD string
 * @returns Current date string
 */
export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Check if a date string is valid (YYYY-MM-DD format)
 * @param dateString - The date string to validate
 * @returns True if valid, false otherwise
 */
export function isValidDate(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Get the day of week for a date (0 = Sunday, 1 = Monday, etc.)
 * @param date - The date (YYYY-MM-DD or Date object)
 * @returns Day of week number (0-6)
 */
export function getDayOfWeek(date: string | Date): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getDay();
}

/**
 * Get the day of week name for a date
 * @param date - The date (YYYY-MM-DD or Date object)
 * @returns Day name (e.g., "Monday", "Tuesday")
 */
export function getDayOfWeekName(date: string | Date): string {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return dayNames[getDayOfWeek(date)];
}

/**
 * Get an array of dates between two dates (inclusive)
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns Array of date strings
 */
export function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}

/**
 * Get the start and end dates of a week containing the given date
 * @param date - The date (YYYY-MM-DD)
 * @param startOfWeek - Day of week to start (0 = Sunday, 1 = Monday)
 * @returns Object with start and end date strings
 */
export function getWeekRange(date: string, startOfWeek: number = 1): { start: string; end: string } {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  
  // Calculate days to subtract to get to start of week
  let daysToStart = dayOfWeek - startOfWeek;
  if (daysToStart < 0) {
    daysToStart += 7;
  }
  
  const startDate = new Date(d);
  startDate.setDate(d.getDate() - daysToStart);
  
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  
  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0]
  };
}

/**
 * Format a date for display
 * @param date - The date (YYYY-MM-DD or Date object)
 * @param format - Format type ('short', 'long', 'iso')
 * @returns Formatted date string
 */
export function formatDate(date: string | Date, format: 'short' | 'long' | 'iso' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString('en-GB'); // DD/MM/YYYY
    case 'long':
      return d.toLocaleDateString('en-GB', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    case 'iso':
      return d.toISOString().split('T')[0];
    default:
      return d.toLocaleDateString('en-GB');
  }
}

/**
 * Convert time string to minutes since midnight
 * @param timeString - Time in HH:MM:SS or HH:MM format
 * @returns Minutes since midnight
 */
export function timeToMinutes(timeString: string): number {
  const parts = timeString.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string
 * @param minutes - Minutes since midnight
 * @returns Time string in HH:MM format
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Calculate overlap between two time periods in minutes
 * @param start1 - Start time of first period (HH:MM:SS)
 * @param end1 - End time of first period (HH:MM:SS)
 * @param start2 - Start time of second period (HH:MM:SS)
 * @param end2 - End time of second period (HH:MM:SS)
 * @returns Overlap in minutes
 */
export function calculateTimeOverlap(start1: string, end1: string, start2: string, end2: string): number {
  const start1Minutes = timeToMinutes(start1);
  const end1Minutes = timeToMinutes(end1);
  const start2Minutes = timeToMinutes(start2);
  const end2Minutes = timeToMinutes(end2);
  
  // Handle overnight shifts (end time is next day)
  const end1Adjusted = end1Minutes < start1Minutes ? end1Minutes + 1440 : end1Minutes;
  const end2Adjusted = end2Minutes < start2Minutes ? end2Minutes + 1440 : end2Minutes;
  
  const overlapStart = Math.max(start1Minutes, start2Minutes);
  const overlapEnd = Math.min(end1Adjusted, end2Adjusted);
  
  return Math.max(0, overlapEnd - overlapStart);
}

/**
 * Check if a time is within a time range
 * @param time - Time to check (HH:MM:SS)
 * @param startTime - Range start time (HH:MM:SS)
 * @param endTime - Range end time (HH:MM:SS)
 * @returns True if time is within range
 */
export function isTimeInRange(time: string, startTime: string, endTime: string): boolean {
  const timeMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  // Handle overnight ranges
  if (endMinutes < startMinutes) {
    // Overnight range (e.g., 22:00 to 06:00)
    return timeMinutes >= startMinutes || timeMinutes <= endMinutes;
  } else {
    // Same day range
    return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
  }
}

/**
 * Get the number of weeks between two dates
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns Number of weeks (rounded up)
 */
export function weeksBetween(startDate: string, endDate: string): number {
  const days = daysBetween(startDate, endDate);
  return Math.ceil(days / 7);
}

/**
 * Get the Monday of the week containing the given date
 * @param date - The date (YYYY-MM-DD)
 * @returns Monday's date as YYYY-MM-DD string
 */
export function getMondayOfWeek(date: string): string {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so 6 days back to Monday
  
  const monday = new Date(d);
  monday.setDate(d.getDate() - daysToMonday);
  
  return monday.toISOString().split('T')[0];
}
