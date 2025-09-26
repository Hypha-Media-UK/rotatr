import { Request, Response, NextFunction } from 'express'
import { performance } from 'perf_hooks'

interface MetricsData {
  requests: {
    total: number
    byMethod: Record<string, number>
    byStatus: Record<string, number>
    byRoute: Record<string, number>
  }
  responseTime: {
    total: number
    count: number
    average: number
    min: number
    max: number
    p95: number[]
  }
  errors: {
    total: number
    byType: Record<string, number>
    recent: Array<{
      timestamp: string
      error: string
      route: string
      method: string
    }>
  }
  system: {
    uptime: number
    memory: NodeJS.MemoryUsage
    cpu: number
  }
}

class MetricsCollector {
  private metrics: MetricsData
  private startTime: number
  private responseTimes: number[] = []

  constructor() {
    this.startTime = Date.now()
    this.metrics = {
      requests: {
        total: 0,
        byMethod: {},
        byStatus: {},
        byRoute: {}
      },
      responseTime: {
        total: 0,
        count: 0,
        average: 0,
        min: Infinity,
        max: 0,
        p95: []
      },
      errors: {
        total: 0,
        byType: {},
        recent: []
      },
      system: {
        uptime: 0,
        memory: process.memoryUsage(),
        cpu: 0
      }
    }
  }

  recordRequest(method: string, route: string, statusCode: number, responseTime: number) {
    // Update request counts
    this.metrics.requests.total++
    this.metrics.requests.byMethod[method] = (this.metrics.requests.byMethod[method] || 0) + 1
    this.metrics.requests.byStatus[statusCode] = (this.metrics.requests.byStatus[statusCode] || 0) + 1
    this.metrics.requests.byRoute[route] = (this.metrics.requests.byRoute[route] || 0) + 1

    // Update response time metrics
    this.metrics.responseTime.total += responseTime
    this.metrics.responseTime.count++
    this.metrics.responseTime.average = this.metrics.responseTime.total / this.metrics.responseTime.count
    this.metrics.responseTime.min = Math.min(this.metrics.responseTime.min, responseTime)
    this.metrics.responseTime.max = Math.max(this.metrics.responseTime.max, responseTime)

    // Store response times for percentile calculation
    this.responseTimes.push(responseTime)
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000) // Keep last 1000 measurements
    }

    // Calculate 95th percentile
    if (this.responseTimes.length > 0) {
      const sorted = [...this.responseTimes].sort((a, b) => a - b)
      const index = Math.ceil(sorted.length * 0.95) - 1
      this.metrics.responseTime.p95 = [sorted[index] || 0]
    }
  }

  recordError(error: string, route: string, method: string, type: string = 'unknown') {
    this.metrics.errors.total++
    this.metrics.errors.byType[type] = (this.metrics.errors.byType[type] || 0) + 1
    
    // Keep recent errors (last 100)
    this.metrics.errors.recent.unshift({
      timestamp: new Date().toISOString(),
      error,
      route,
      method
    })
    
    if (this.metrics.errors.recent.length > 100) {
      this.metrics.errors.recent = this.metrics.errors.recent.slice(0, 100)
    }
  }

  updateSystemMetrics() {
    this.metrics.system.uptime = Date.now() - this.startTime
    this.metrics.system.memory = process.memoryUsage()
    
    // Simple CPU usage calculation
    const startUsage = process.cpuUsage()
    setTimeout(() => {
      const endUsage = process.cpuUsage(startUsage)
      this.metrics.system.cpu = (endUsage.user + endUsage.system) / 1000000 // Convert to seconds
    }, 100)
  }

  getMetrics(): MetricsData {
    this.updateSystemMetrics()
    return { ...this.metrics }
  }

  getPrometheusMetrics(): string {
    this.updateSystemMetrics()
    
    const metrics = []
    
    // Request metrics
    metrics.push(`# HELP http_requests_total Total number of HTTP requests`)
    metrics.push(`# TYPE http_requests_total counter`)
    metrics.push(`http_requests_total ${this.metrics.requests.total}`)
    
    // Request by method
    for (const [method, count] of Object.entries(this.metrics.requests.byMethod)) {
      metrics.push(`http_requests_total{method="${method}"} ${count}`)
    }
    
    // Request by status
    for (const [status, count] of Object.entries(this.metrics.requests.byStatus)) {
      metrics.push(`http_requests_total{status="${status}"} ${count}`)
    }
    
    // Response time metrics
    metrics.push(`# HELP http_request_duration_seconds HTTP request duration in seconds`)
    metrics.push(`# TYPE http_request_duration_seconds histogram`)
    metrics.push(`http_request_duration_seconds_sum ${this.metrics.responseTime.total / 1000}`)
    metrics.push(`http_request_duration_seconds_count ${this.metrics.responseTime.count}`)
    
    // Error metrics
    metrics.push(`# HELP http_errors_total Total number of HTTP errors`)
    metrics.push(`# TYPE http_errors_total counter`)
    metrics.push(`http_errors_total ${this.metrics.errors.total}`)
    
    // System metrics
    metrics.push(`# HELP process_uptime_seconds Process uptime in seconds`)
    metrics.push(`# TYPE process_uptime_seconds gauge`)
    metrics.push(`process_uptime_seconds ${this.metrics.system.uptime / 1000}`)
    
    metrics.push(`# HELP process_memory_usage_bytes Process memory usage in bytes`)
    metrics.push(`# TYPE process_memory_usage_bytes gauge`)
    metrics.push(`process_memory_usage_bytes{type="rss"} ${this.metrics.system.memory.rss}`)
    metrics.push(`process_memory_usage_bytes{type="heapTotal"} ${this.metrics.system.memory.heapTotal}`)
    metrics.push(`process_memory_usage_bytes{type="heapUsed"} ${this.metrics.system.memory.heapUsed}`)
    
    return metrics.join('\n')
  }

  reset() {
    this.metrics = {
      requests: {
        total: 0,
        byMethod: {},
        byStatus: {},
        byRoute: {}
      },
      responseTime: {
        total: 0,
        count: 0,
        average: 0,
        min: Infinity,
        max: 0,
        p95: []
      },
      errors: {
        total: 0,
        byType: {},
        recent: []
      },
      system: {
        uptime: 0,
        memory: process.memoryUsage(),
        cpu: 0
      }
    }
    this.responseTimes = []
  }
}

// Global metrics collector instance
export const metricsCollector = new MetricsCollector()

// Middleware to collect metrics
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = performance.now()
  
  // Capture original end method
  const originalEnd = res.end
  
  res.end = function(chunk?: any, encoding?: any) {
    const endTime = performance.now()
    const responseTime = endTime - startTime
    
    // Record metrics
    metricsCollector.recordRequest(
      req.method,
      req.route?.path || req.path,
      res.statusCode,
      responseTime
    )
    
    // Record errors
    if (res.statusCode >= 400) {
      metricsCollector.recordError(
        `HTTP ${res.statusCode}`,
        req.route?.path || req.path,
        req.method,
        res.statusCode >= 500 ? 'server_error' : 'client_error'
      )
    }
    
    // Call original end method
    originalEnd.call(this, chunk, encoding)
  }
  
  next()
}

// Health check middleware
export const healthCheck = (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/health' && req.method === 'GET') {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    }
    
    return res.json({
      success: true,
      data: health,
      message: 'Service is healthy'
    })
  }
  
  next()
}

// Metrics endpoint middleware
export const metricsEndpoint = (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/metrics' && req.method === 'GET') {
    const format = req.query.format as string
    
    if (format === 'prometheus') {
      res.setHeader('Content-Type', 'text/plain')
      return res.send(metricsCollector.getPrometheusMetrics())
    } else {
      return res.json({
        success: true,
        data: metricsCollector.getMetrics(),
        message: 'Metrics retrieved successfully'
      })
    }
  }
  
  next()
}

// Readiness check middleware
export const readinessCheck = (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/ready' && req.method === 'GET') {
    // Check if all dependencies are ready
    const checks = {
      database: true, // This would check actual database connectivity
      cache: true,    // This would check actual cache connectivity
      memory: process.memoryUsage().heapUsed < 500 * 1024 * 1024, // Less than 500MB
      uptime: process.uptime() > 10 // At least 10 seconds uptime
    }
    
    const isReady = Object.values(checks).every(check => check === true)
    
    return res.status(isReady ? 200 : 503).json({
      success: isReady,
      data: {
        ready: isReady,
        checks,
        timestamp: new Date().toISOString()
      },
      message: isReady ? 'Service is ready' : 'Service is not ready'
    })
  }
  
  next()
}

// Liveness check middleware
export const livenessCheck = (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/live' && req.method === 'GET') {
    // Simple liveness check - if we can respond, we're alive
    return res.json({
      success: true,
      data: {
        alive: true,
        timestamp: new Date().toISOString(),
        pid: process.pid
      },
      message: 'Service is alive'
    })
  }
  
  next()
}
