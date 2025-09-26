import { Request, Response, NextFunction } from 'express'
import validator from 'validator'
import DOMPurify from 'isomorphic-dompurify'
import { AppError } from './errorHandler'

// Input sanitization
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return input

  // Remove HTML tags and potentially dangerous content
  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  })

  // Trim whitespace
  return sanitized.trim()
}

// SQL injection prevention - escape special characters
export const escapeSqlInput = (input: string): string => {
  if (typeof input !== 'string') return input

  return input
    .replace(/'/g, "''")
    .replace(/;/g, '\\;')
    .replace(/--/g, '\\--')
    .replace(/\/\*/g, '\\/\\*')
    .replace(/\*\//g, '\\*\\/')
}

// Validation helper functions
export const validateRequired = (value: any, fieldName: string): void => {
  if (value === undefined || value === null || value === '') {
    throw new AppError(`${fieldName} is required`, 400)
  }
}

export const validateString = (value: any, fieldName: string, minLength = 1, maxLength = 255): void => {
  validateRequired(value, fieldName)
  if (typeof value !== 'string') {
    throw new AppError(`${fieldName} must be a string`, 400)
  }

  // Sanitize input
  const sanitized = sanitizeInput(value)

  if (sanitized.length < minLength) {
    throw new AppError(`${fieldName} must be at least ${minLength} characters`, 400)
  }
  if (sanitized.length > maxLength) {
    throw new AppError(`${fieldName} must be no more than ${maxLength} characters`, 400)
  }

  // Check for potentially dangerous patterns
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(sanitized)) {
      throw new AppError(`${fieldName} contains invalid content`, 400)
    }
  }
}

export const validateEmail = (value: any, fieldName: string): void => {
  validateRequired(value, fieldName)
  if (typeof value !== 'string') {
    throw new AppError(`${fieldName} must be a string`, 400)
  }

  const sanitized = sanitizeInput(value)
  if (!validator.isEmail(sanitized)) {
    throw new AppError(`${fieldName} must be a valid email address`, 400)
  }

  // Additional email security checks
  if (sanitized.length > 254) {
    throw new AppError(`${fieldName} is too long`, 400)
  }
}

export const validateNumber = (value: any, fieldName: string, min?: number, max?: number): void => {
  validateRequired(value, fieldName)
  const num = Number(value)
  if (isNaN(num)) {
    throw new AppError(`${fieldName} must be a number`, 400)
  }
  if (min !== undefined && num < min) {
    throw new AppError(`${fieldName} must be at least ${min}`, 400)
  }
  if (max !== undefined && num > max) {
    throw new AppError(`${fieldName} must be no more than ${max}`, 400)
  }
}

export const validateBoolean = (value: any, fieldName: string): void => {
  if (value !== true && value !== false && value !== 'true' && value !== 'false') {
    throw new AppError(`${fieldName} must be a boolean`, 400)
  }
}

export const validateEnum = (value: any, fieldName: string, allowedValues: string[]): void => {
  validateRequired(value, fieldName)
  if (!allowedValues.includes(value)) {
    throw new AppError(`${fieldName} must be one of: ${allowedValues.join(', ')}`, 400)
  }
}

export const validateTime = (value: any, fieldName: string): void => {
  validateRequired(value, fieldName)
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  if (!timeRegex.test(value)) {
    throw new AppError(`${fieldName} must be in HH:MM format`, 400)
  }
}

export const validateDate = (value: any, fieldName: string): void => {
  validateRequired(value, fieldName)
  const date = new Date(value)
  if (isNaN(date.getTime())) {
    throw new AppError(`${fieldName} must be a valid date`, 400)
  }
}

export const validateDayOfWeek = (value: any, fieldName: string): void => {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  validateEnum(value, fieldName, daysOfWeek)
}

// Department validation
export const validateDepartment = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { name, is_24_7, default_porters_required, schedules } = req.body

    validateString(name, 'name', 1, 100)
    validateBoolean(is_24_7, 'is_24_7')
    validateNumber(default_porters_required, 'default_porters_required', 1, 50)

    if (schedules && Array.isArray(schedules)) {
      schedules.forEach((schedule: any, index: number) => {
        validateDayOfWeek(schedule.day_of_week, `schedules[${index}].day_of_week`)
        validateTime(schedule.opens_at, `schedules[${index}].opens_at`)
        validateTime(schedule.closes_at, `schedules[${index}].closes_at`)
        validateNumber(schedule.porters_required, `schedules[${index}].porters_required`, 1, 50)
      })
    }

    next()
  } catch (error) {
    next(error)
  }
}

// Porter validation
export const validatePorter = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { 
      name, 
      shift_type, 
      shift_offset_days, 
      regular_department_id,
      is_floor_staff,
      porter_type,
      guaranteed_hours,
      contracted_hours
    } = req.body

    validateString(name, 'name', 1, 100)
    validateString(shift_type, 'shift_type', 1, 50)
    validateNumber(shift_offset_days, 'shift_offset_days', 0, 30)
    
    if (regular_department_id !== undefined && regular_department_id !== null) {
      validateNumber(regular_department_id, 'regular_department_id', 1)
    }
    
    validateBoolean(is_floor_staff, 'is_floor_staff')
    validateEnum(porter_type, 'porter_type', ['Porter', 'Supervisor'])
    
    if (guaranteed_hours !== undefined && guaranteed_hours !== null) {
      validateNumber(guaranteed_hours, 'guaranteed_hours', 0, 168)
    }

    if (contracted_hours && Array.isArray(contracted_hours)) {
      contracted_hours.forEach((hours: any, index: number) => {
        validateDayOfWeek(hours.day_of_week, `contracted_hours[${index}].day_of_week`)
        validateTime(hours.start_time, `contracted_hours[${index}].start_time`)
        validateTime(hours.end_time, `contracted_hours[${index}].end_time`)
      })
    }

    next()
  } catch (error) {
    next(error)
  }
}

// Shift validation
export const validateShift = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { 
      name, 
      start_time, 
      end_time, 
      shift_type, 
      shift_ident, 
      days_on, 
      days_off, 
      offset_days, 
      ground_zero 
    } = req.body

    validateString(name, 'name', 1, 100)
    validateTime(start_time, 'start_time')
    validateTime(end_time, 'end_time')
    validateEnum(shift_type, 'shift_type', ['Day', 'Night'])
    validateEnum(shift_ident, 'shift_ident', ['A', 'B', 'C', 'D'])
    validateNumber(days_on, 'days_on', 1, 30)
    validateNumber(days_off, 'days_off', 0, 30)
    validateNumber(offset_days, 'offset_days', 0, 30)
    validateDate(ground_zero, 'ground_zero')

    next()
  } catch (error) {
    next(error)
  }
}

// Temporary assignment validation
export const validateTemporaryAssignment = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { 
      porter_id, 
      department_id, 
      assignment_date, 
      start_time, 
      end_time, 
      assignment_type 
    } = req.body

    validateNumber(porter_id, 'porter_id', 1)
    validateNumber(department_id, 'department_id', 1)
    validateDate(assignment_date, 'assignment_date')
    validateTime(start_time, 'start_time')
    validateTime(end_time, 'end_time')
    validateEnum(assignment_type, 'assignment_type', ['Floor Staff', 'Relief Cover'])

    next()
  } catch (error) {
    next(error)
  }
}
