import { createWriteStream, WriteStream } from 'fs'
import { join } from 'path'

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

interface LogEntry {
  timestamp: string
  level: string
  message: string
  meta?: Record<string, any>
  error?: {
    name: string
    message: string
    stack?: string
  }
  request?: {
    method: string
    url: string
    userAgent?: string
    ip?: string
    userId?: number
  }
  performance?: {
    duration: number
    memory: NodeJS.MemoryUsage
  }
}

class Logger {
  private level: LogLevel
  private logStream?: WriteStream
  private errorStream?: WriteStream

  constructor() {
    this.level = this.getLogLevel()
    this.initializeStreams()
  }

  private getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO'
    switch (level) {
      case 'ERROR': return LogLevel.ERROR
      case 'WARN': return LogLevel.WARN
      case 'INFO': return LogLevel.INFO
      case 'DEBUG': return LogLevel.DEBUG
      default: return LogLevel.INFO
    }
  }

  private initializeStreams() {
    if (process.env.NODE_ENV === 'production') {
      try {
        // Create log directory if it doesn't exist
        const logDir = process.env.LOG_DIR || './logs'
        
        this.logStream = createWriteStream(join(logDir, 'app.log'), { flags: 'a' })
        this.errorStream = createWriteStream(join(logDir, 'error.log'), { flags: 'a' })
      } catch (error) {
        console.error('Failed to initialize log streams:', error)
      }
    }
  }

  private formatLogEntry(entry: LogEntry): string {
    if (process.env.NODE_ENV === 'production') {
      // JSON format for production (easier for log aggregation)
      return JSON.stringify(entry)
    } else {
      // Human-readable format for development
      const timestamp = entry.timestamp
      const level = entry.level.padEnd(5)
      let message = `${timestamp} [${level}] ${entry.message}`
      
      if (entry.meta && Object.keys(entry.meta).length > 0) {
        message += ` | Meta: ${JSON.stringify(entry.meta)}`
      }
      
      if (entry.error) {
        message += ` | Error: ${entry.error.name}: ${entry.error.message}`
        if (entry.error.stack) {
          message += `\n${entry.error.stack}`
        }
      }
      
      if (entry.request) {
        message += ` | Request: ${entry.request.method} ${entry.request.url}`
        if (entry.request.ip) {
          message += ` from ${entry.request.ip}`
        }
      }
      
      if (entry.performance) {
        message += ` | Duration: ${entry.performance.duration}ms`
      }
      
      return message
    }
  }

  private writeLog(entry: LogEntry) {
    const formattedEntry = this.formatLogEntry(entry)
    
    // Always write to console in development
    if (process.env.NODE_ENV !== 'production') {
      const logMethod = entry.level === 'ERROR' ? console.error : console.log
      logMethod(formattedEntry)
    }
    
    // Write to file streams in production
    if (this.logStream && entry.level !== 'ERROR') {
      this.logStream.write(formattedEntry + '\n')
    }
    
    if (this.errorStream && entry.level === 'ERROR') {
      this.errorStream.write(formattedEntry + '\n')
    }
  }

  private log(level: LogLevel, levelName: string, message: string, meta?: Record<string, any>) {
    if (level > this.level) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: levelName,
      message,
      meta
    }

    this.writeLog(entry)
  }

  error(message: string, error?: Error, meta?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      meta
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    }

    this.writeLog(entry)
  }

  warn(message: string, meta?: Record<string, any>) {
    this.log(LogLevel.WARN, 'WARN', message, meta)
  }

  info(message: string, meta?: Record<string, any>) {
    this.log(LogLevel.INFO, 'INFO', message, meta)
  }

  debug(message: string, meta?: Record<string, any>) {
    this.log(LogLevel.DEBUG, 'DEBUG', message, meta)
  }

  // Request logging
  request(method: string, url: string, statusCode: number, duration: number, meta?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: statusCode >= 400 ? 'ERROR' : 'INFO',
      message: `${method} ${url} ${statusCode}`,
      meta,
      request: {
        method,
        url,
        ...meta?.request
      },
      performance: {
        duration,
        memory: process.memoryUsage()
      }
    }

    this.writeLog(entry)
  }

  // Database query logging
  query(query: string, duration: number, meta?: Record<string, any>) {
    if (this.level >= LogLevel.DEBUG) {
      this.debug(`Database query executed in ${duration}ms`, {
        query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
        duration,
        ...meta
      })
    }
  }

  // Cache operation logging
  cache(operation: string, key: string, hit: boolean, duration?: number) {
    if (this.level >= LogLevel.DEBUG) {
      this.debug(`Cache ${operation}: ${hit ? 'HIT' : 'MISS'}`, {
        operation,
        key,
        hit,
        duration
      })
    }
  }

  // Security event logging
  security(event: string, meta?: Record<string, any>) {
    this.warn(`Security event: ${event}`, {
      security: true,
      event,
      ...meta
    })
  }

  // Performance logging
  performance(operation: string, duration: number, meta?: Record<string, any>) {
    const level = duration > 5000 ? 'WARN' : 'INFO'
    this.log(
      level === 'WARN' ? LogLevel.WARN : LogLevel.INFO,
      level,
      `Performance: ${operation} took ${duration}ms`,
      {
        performance: true,
        operation,
        duration,
        ...meta
      }
    )
  }

  // Business logic logging
  business(event: string, meta?: Record<string, any>) {
    this.info(`Business event: ${event}`, {
      business: true,
      event,
      ...meta
    })
  }

  // Cleanup method
  close() {
    if (this.logStream) {
      this.logStream.end()
    }
    if (this.errorStream) {
      this.errorStream.end()
    }
  }
}

// Create global logger instance
export const logger = new Logger()

// Express middleware for request logging
export const requestLogger = (req: any, res: any, next: any) => {
  const startTime = Date.now()
  
  // Capture response end
  const originalEnd = res.end
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - startTime
    
    logger.request(req.method, req.originalUrl, res.statusCode, duration, {
      request: {
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: req.user?.id
      }
    })
    
    originalEnd.call(this, chunk, encoding)
  }
  
  next()
}

// Error logging middleware
export const errorLogger = (error: Error, req: any, res: any, next: any) => {
  logger.error(`Unhandled error in ${req.method} ${req.originalUrl}`, error, {
    request: {
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id,
      body: req.body
    }
  })
  
  next(error)
}

export default logger
