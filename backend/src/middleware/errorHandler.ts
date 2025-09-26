import { Request, Response, NextFunction } from 'express'
import type { ApiResponse } from '@/types'

export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode: number = 500) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response<ApiResponse<null>>,
  next: NextFunction
): void => {
  let statusCode = 500
  let message = 'Internal Server Error'
  let errors: string[] = []

  // Handle different error types
  if (error instanceof AppError) {
    statusCode = error.statusCode
    message = error.message
  } else if (error.name === 'ValidationError') {
    statusCode = 400
    message = 'Validation Error'
    errors = [error.message]
  } else if (error.name === 'CastError') {
    statusCode = 400
    message = 'Invalid ID format'
  } else if (error.message.includes('ER_DUP_ENTRY')) {
    statusCode = 409
    message = 'Duplicate entry'
  } else if (error.message.includes('ER_NO_REFERENCED_ROW')) {
    statusCode = 400
    message = 'Referenced record does not exist'
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error)
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    data: null,
    message,
    errors: errors.length > 0 ? errors : [message]
  })
}

export const notFoundHandler = (
  req: Request,
  res: Response<ApiResponse<null>>,
  next: NextFunction
): void => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404)
  next(error)
}

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
