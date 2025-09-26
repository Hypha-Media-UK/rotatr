import { Request, Response, NextFunction } from 'express'
import { cache } from '@/utils/cache'
import type { ApiResponse } from '@/types'

interface CacheOptions {
  ttl?: number // Time to live in seconds
  keyGenerator?: (req: Request) => string
  condition?: (req: Request, res: Response) => boolean
  invalidatePatterns?: string[]
}

/**
 * Cache middleware for API responses
 */
export const cacheMiddleware = (options: CacheOptions = {}) => {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = (req) => `api:${req.method}:${req.originalUrl}`,
    condition = (req, res) => req.method === 'GET' && res.statusCode === 200,
    invalidatePatterns = []
  } = options

  return async (req: Request, res: Response<ApiResponse<any>>, next: NextFunction) => {
    // Skip caching for non-GET requests initially
    if (req.method !== 'GET') {
      // For POST/PUT/DELETE, invalidate related cache entries
      if (invalidatePatterns.length > 0) {
        res.on('finish', async () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            for (const pattern of invalidatePatterns) {
              await cache.delPattern(pattern)
            }
          }
        })
      }
      return next()
    }

    const cacheKey = keyGenerator(req)

    try {
      // Try to get from cache
      const cachedResponse = await cache.get<ApiResponse<any>>(cacheKey)
      
      if (cachedResponse) {
        // Add cache headers
        res.setHeader('X-Cache', 'HIT')
        res.setHeader('X-Cache-Key', cacheKey)
        return res.json(cachedResponse)
      }

      // Cache miss - continue to route handler
      res.setHeader('X-Cache', 'MISS')
      res.setHeader('X-Cache-Key', cacheKey)

      // Intercept the response to cache it
      const originalJson = res.json
      res.json = function(data: ApiResponse<any>) {
        // Only cache successful responses
        if (condition(req, res) && data.success) {
          setImmediate(async () => {
            await cache.set(cacheKey, data, ttl)
          })
        }
        return originalJson.call(this, data)
      }

      next()
    } catch (error) {
      console.error('Cache middleware error:', error)
      next()
    }
  }
}

/**
 * Cache invalidation middleware
 */
export const invalidateCache = (patterns: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        for (const pattern of patterns) {
          await cache.delPattern(pattern)
        }
      }
    })
    next()
  }
}

/**
 * Specific cache configurations for different endpoints
 */

// Porter-related caching
export const porterCache = cacheMiddleware({
  ttl: 600, // 10 minutes
  keyGenerator: (req) => `porters:${req.originalUrl}:${JSON.stringify(req.query)}`,
  invalidatePatterns: ['porters:*', 'assignments:*', 'availability:*']
})

// Department-related caching
export const departmentCache = cacheMiddleware({
  ttl: 1800, // 30 minutes (departments change less frequently)
  keyGenerator: (req) => `departments:${req.originalUrl}:${JSON.stringify(req.query)}`,
  invalidatePatterns: ['departments:*', 'assignments:*', 'staffing:*']
})

// Shift-related caching
export const shiftCache = cacheMiddleware({
  ttl: 3600, // 1 hour (shifts change infrequently)
  keyGenerator: (req) => `shifts:${req.originalUrl}:${JSON.stringify(req.query)}`,
  invalidatePatterns: ['shifts:*', 'assignments:*', 'availability:*']
})

// Assignment-related caching
export const assignmentCache = cacheMiddleware({
  ttl: 300, // 5 minutes (assignments change frequently)
  keyGenerator: (req) => `assignments:${req.originalUrl}:${JSON.stringify(req.query)}`,
  invalidatePatterns: ['assignments:*', 'availability:*', 'staffing:*']
})

// Availability calculation caching (expensive operations)
export const availabilityCache = cacheMiddleware({
  ttl: 900, // 15 minutes
  keyGenerator: (req) => `availability:${req.originalUrl}:${JSON.stringify(req.query)}`,
  invalidatePatterns: ['availability:*']
})

// Staffing alerts caching
export const staffingCache = cacheMiddleware({
  ttl: 180, // 3 minutes (critical data, shorter cache)
  keyGenerator: (req) => `staffing:${req.originalUrl}:${JSON.stringify(req.query)}`,
  invalidatePatterns: ['staffing:*']
})

/**
 * Cache warming functions
 */
export const warmCache = {
  async porters() {
    console.log('🔥 Warming porter cache...')
    // Pre-load common porter queries
    const commonQueries = [
      '/api/porters',
      '/api/porters?is_floor_staff=true',
      '/api/porters?is_floor_staff=false'
    ]
    
    // This would typically make internal API calls to warm the cache
    // For now, we'll just log the intention
    for (const query of commonQueries) {
      console.log(`  - Warming: ${query}`)
    }
  },

  async departments() {
    console.log('🔥 Warming department cache...')
    // Pre-load department data
  },

  async shifts() {
    console.log('🔥 Warming shift cache...')
    // Pre-load shift patterns
  },

  async all() {
    await Promise.all([
      this.porters(),
      this.departments(),
      this.shifts()
    ])
    console.log('✅ Cache warming completed')
  }
}

/**
 * Cache statistics middleware
 */
export const cacheStats = async (req: Request, res: Response<ApiResponse<any>>, next: NextFunction) => {
  if (req.path === '/cache/stats' && req.method === 'GET') {
    try {
      const stats = await cache.getStats()
      return res.json({
        success: true,
        data: stats,
        message: 'Cache statistics retrieved successfully'
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve cache statistics',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      })
    }
  }
  next()
}

/**
 * Cache health check
 */
export const cacheHealthCheck = async (req: Request, res: Response<ApiResponse<any>>, next: NextFunction) => {
  if (req.path === '/cache/health' && req.method === 'GET') {
    try {
      const testKey = 'health:test'
      const testValue = { timestamp: Date.now() }
      
      // Test write
      await cache.set(testKey, testValue, 10)
      
      // Test read
      const retrieved = await cache.get(testKey)
      
      // Test delete
      await cache.del(testKey)
      
      const isHealthy = retrieved && retrieved.timestamp === testValue.timestamp
      
      return res.json({
        success: true,
        data: {
          healthy: isHealthy,
          timestamp: new Date().toISOString()
        },
        message: isHealthy ? 'Cache is healthy' : 'Cache health check failed'
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: { healthy: false },
        message: 'Cache health check failed',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      })
    }
  }
  next()
}

/**
 * Manual cache invalidation endpoint
 */
export const cacheInvalidation = async (req: Request, res: Response<ApiResponse<any>>, next: NextFunction) => {
  if (req.path === '/cache/invalidate' && req.method === 'POST') {
    try {
      const { patterns } = req.body as { patterns: string[] }
      
      if (!patterns || !Array.isArray(patterns)) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'Invalid request',
          errors: ['patterns array is required']
        })
      }

      let totalInvalidated = 0
      for (const pattern of patterns) {
        const count = await cache.delPattern(pattern)
        totalInvalidated += count
      }

      return res.json({
        success: true,
        data: {
          patterns,
          invalidatedKeys: totalInvalidated
        },
        message: `Invalidated ${totalInvalidated} cache entries`
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: null,
        message: 'Cache invalidation failed',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      })
    }
  }
  next()
}
