import { Request, Response, NextFunction } from 'express'
import rateLimit from 'express-rate-limit'
import slowDown from 'express-slow-down'
import { initializeDatabase } from '@/utils/database'
import { AppError } from './errorHandler'
import type { ApiResponse } from '@/types'

// Rate limiting configurations
export const createRateLimit = (options: {
  windowMs: number
  max: number
  message?: string
  skipSuccessfulRequests?: boolean
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      success: false,
      data: null,
      message: options.message || 'Too many requests',
      errors: ['Rate limit exceeded']
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    // Store rate limit data in database for distributed systems
    store: {
      incr: async (key: string) => {
        const now = new Date()
        const windowStart = new Date(Math.floor(now.getTime() / options.windowMs) * options.windowMs)
        
        const query = `
          INSERT INTO rate_limits (identifier, endpoint, requests_count, window_start)
          VALUES (?, ?, 1, ?)
          ON DUPLICATE KEY UPDATE 
            requests_count = requests_count + 1,
            updated_at = NOW()
        `
        
        const database = await initializeDatabase()
        await database.query(query, [key, 'api', windowStart])

        // Get current count
        const countQuery = `
          SELECT requests_count
          FROM rate_limits
          WHERE identifier = ? AND endpoint = ? AND window_start = ?
        `
        const result = await database.query<{ requests_count: number }>(countQuery, [key, 'api', windowStart])
        
        return {
          totalHits: result[0]?.requests_count || 1,
          resetTime: new Date(windowStart.getTime() + options.windowMs)
        }
      },
      decrement: async (key: string) => {
        // Optional: implement decrement logic
      },
      resetKey: async (key: string) => {
        const database = await initializeDatabase()
        const query = `DELETE FROM rate_limits WHERE identifier = ?`
        await database.query(query, [key])
      }
    }
  })
}

// General API rate limiting
export const generalRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'Too many requests from this IP'
})

// Strict rate limiting for sensitive endpoints
export const strictRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
  message: 'Too many attempts, please try again later'
})

// Speed limiting (slow down responses)
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per windowMs without delay
  delayMs: 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
})

// Request size limiting middleware
export const requestSizeLimit = (maxSize: number = 10 * 1024 * 1024) => { // 10MB default
  return (req: Request, res: Response<ApiResponse<null>>, next: NextFunction): void => {
    const contentLength = parseInt(req.get('content-length') || '0', 10)

    if (contentLength > maxSize) {
      res.status(413).json({
        success: false,
        data: null,
        message: 'Request entity too large',
        errors: [`Maximum request size is ${maxSize} bytes`]
      })
      return
    }

    next()
  }
}

// IP whitelist/blacklist middleware
export const ipFilter = (options: {
  whitelist?: string[]
  blacklist?: string[]
}) => {
  return (req: Request, res: Response<ApiResponse<null>>, next: NextFunction): void => {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress

    if (options.blacklist && clientIP && options.blacklist.includes(clientIP)) {
      res.status(403).json({
        success: false,
        data: null,
        message: 'Access denied',
        errors: ['IP address is blocked']
      })
      return
    }

    if (options.whitelist && clientIP && !options.whitelist.includes(clientIP)) {
      res.status(403).json({
        success: false,
        data: null,
        message: 'Access denied',
        errors: ['IP address not whitelisted']
      })
      return
    }

    next()
  }
}

// Request validation middleware
export const validateRequestHeaders = (req: Request, res: Response<ApiResponse<null>>, next: NextFunction): void => {
  // Check for required headers
  const userAgent = req.get('user-agent')
  if (!userAgent || userAgent.length < 3) {
    res.status(400).json({
      success: false,
      data: null,
      message: 'Invalid request',
      errors: ['User-Agent header is required']
    })
    return
  }

  // Check for suspicious headers
  const suspiciousHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-cluster-client-ip'
  ]

  for (const header of suspiciousHeaders) {
    const value = req.get(header)
    if (value && value.includes('..')) {
      res.status(400).json({
        success: false,
        data: null,
        message: 'Invalid request',
        errors: ['Suspicious header detected']
      })
      return
    }
  }

  next()
}

// Content Security Policy middleware
export const contentSecurityPolicy = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '))

  next()
}

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY')
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff')
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block')
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  
  next()
}

// Request logging for security monitoring
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now()
  
  // Log suspicious patterns
  const suspiciousPatterns = [
    /\.\./,
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /union.*select/i,
    /drop.*table/i,
    /insert.*into/i,
    /delete.*from/i
  ]

  const requestData = JSON.stringify({
    url: req.url,
    method: req.method,
    body: req.body,
    query: req.query,
    headers: req.headers
  })

  let isSuspicious = false
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestData)) {
      isSuspicious = true
      break
    }
  }

  if (isSuspicious) {
    console.warn('🚨 Suspicious request detected:', {
      ip: req.ip,
      method: req.method,
      url: req.url,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString()
    })
  }

  // Continue with request
  res.on('finish', () => {
    const duration = Date.now() - startTime
    
    // Log slow requests
    if (duration > 5000) {
      console.warn('🐌 Slow request detected:', {
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        statusCode: res.statusCode
      })
    }
  })

  next()
}

// Audit logging middleware
export const auditLogger = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.json

    res.json = function(data: any) {
      // Log the action after successful response
      if (res.statusCode < 400) {
        setImmediate(async () => {
          try {
            const auditData = {
              user_id: req.user?.id || null,
              action,
              resource_type: req.route?.path || req.path,
              resource_id: req.params.id ? parseInt(req.params.id) : null,
              old_values: null,
              new_values: req.method === 'POST' || req.method === 'PUT' ? req.body : null,
              ip_address: req.ip,
              user_agent: req.get('user-agent')
            }

            const query = `
              INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_values, new_values, ip_address, user_agent)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `

            const database = await initializeDatabase()
            await database.query(query, [
              auditData.user_id,
              auditData.action,
              auditData.resource_type,
              auditData.resource_id,
              auditData.old_values ? JSON.stringify(auditData.old_values) : null,
              auditData.new_values ? JSON.stringify(auditData.new_values) : null,
              auditData.ip_address,
              auditData.user_agent
            ])
          } catch (error) {
            console.error('Failed to log audit entry:', error)
          }
        })
      }

      return originalSend.call(this, data)
    }

    next()
  }
}
