import Redis from 'ioredis'

interface CacheConfig {
  host: string
  port: number
  password?: string
  db: number
  keyPrefix: string
  maxRetriesPerRequest: number
}

class CacheService {
  private redis: Redis | null = null
  private config: CacheConfig
  private isConnected = false

  constructor(config: CacheConfig) {
    this.config = config
  }

  async connect(): Promise<void> {
    try {
      this.redis = new Redis({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        db: this.config.db,
        keyPrefix: this.config.keyPrefix,
        maxRetriesPerRequest: this.config.maxRetriesPerRequest,
        lazyConnect: true,
        reconnectOnError: (err) => {
          const targetError = 'READONLY'
          return err.message.includes(targetError)
        }
      })

      // Test connection
      await this.redis.ping()
      this.isConnected = true
      
      console.log('✅ Redis cache connected successfully')
    } catch (error) {
      console.warn('⚠️ Redis cache connection failed, falling back to memory cache:', error)
      this.redis = null
      this.isConnected = false
    }
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit()
      this.redis = null
      this.isConnected = false
      console.log('📦 Redis cache connection closed')
    }
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.redis || !this.isConnected) {
      return null
    }

    try {
      const value = await this.redis.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key: string, value: any, ttlSeconds = 3600): Promise<boolean> {
    if (!this.redis || !this.isConnected) {
      return false
    }

    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('Cache set error:', error)
      return false
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<boolean> {
    if (!this.redis || !this.isConnected) {
      return false
    }

    try {
      await this.redis.del(key)
      return true
    } catch (error) {
      console.error('Cache delete error:', error)
      return false
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async delPattern(pattern: string): Promise<number> {
    if (!this.redis || !this.isConnected) {
      return 0
    }

    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length > 0) {
        return await this.redis.del(...keys)
      }
      return 0
    } catch (error) {
      console.error('Cache delete pattern error:', error)
      return 0
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.redis || !this.isConnected) {
      return false
    }

    try {
      const result = await this.redis.exists(key)
      return result === 1
    } catch (error) {
      console.error('Cache exists error:', error)
      return false
    }
  }

  /**
   * Set TTL for existing key
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    if (!this.redis || !this.isConnected) {
      return false
    }

    try {
      const result = await this.redis.expire(key, ttlSeconds)
      return result === 1
    } catch (error) {
      console.error('Cache expire error:', error)
      return false
    }
  }

  /**
   * Get multiple values at once
   */
  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    if (!this.redis || !this.isConnected || keys.length === 0) {
      return keys.map(() => null)
    }

    try {
      const values = await this.redis.mget(...keys)
      return values.map(value => value ? JSON.parse(value) : null)
    } catch (error) {
      console.error('Cache mget error:', error)
      return keys.map(() => null)
    }
  }

  /**
   * Set multiple values at once
   */
  async mset(keyValuePairs: Record<string, any>, ttlSeconds = 3600): Promise<boolean> {
    if (!this.redis || !this.isConnected) {
      return false
    }

    try {
      const pipeline = this.redis.pipeline()
      
      for (const [key, value] of Object.entries(keyValuePairs)) {
        pipeline.setex(key, ttlSeconds, JSON.stringify(value))
      }
      
      await pipeline.exec()
      return true
    } catch (error) {
      console.error('Cache mset error:', error)
      return false
    }
  }

  /**
   * Increment numeric value
   */
  async incr(key: string): Promise<number> {
    if (!this.redis || !this.isConnected) {
      return 0
    }

    try {
      return await this.redis.incr(key)
    } catch (error) {
      console.error('Cache incr error:', error)
      return 0
    }
  }

  /**
   * Cache with automatic refresh
   */
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttlSeconds = 3600
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // Fetch fresh data
    const freshData = await fetchFunction()
    
    // Cache the result
    await this.set(key, freshData, ttlSeconds)
    
    return freshData
  }

  /**
   * Cache with background refresh
   */
  async getWithBackgroundRefresh<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttlSeconds = 3600,
    refreshThresholdSeconds = 300
  ): Promise<T> {
    const cached = await this.get<T>(key)
    
    if (cached !== null) {
      // Check if we should refresh in background
      const ttl = await this.redis?.ttl(key)
      if (ttl && ttl < refreshThresholdSeconds) {
        // Refresh in background
        setImmediate(async () => {
          try {
            const freshData = await fetchFunction()
            await this.set(key, freshData, ttlSeconds)
          } catch (error) {
            console.error('Background refresh error:', error)
          }
        })
      }
      
      return cached
    }

    // No cached data, fetch synchronously
    const freshData = await fetchFunction()
    await this.set(key, freshData, ttlSeconds)
    return freshData
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean
    memory: string
    keys: number
    hits: number
    misses: number
  }> {
    if (!this.redis || !this.isConnected) {
      return {
        connected: false,
        memory: '0',
        keys: 0,
        hits: 0,
        misses: 0
      }
    }

    try {
      const info = await this.redis.info('memory')
      const keyspace = await this.redis.info('keyspace')
      const stats = await this.redis.info('stats')
      
      // Parse memory usage
      const memoryMatch = info.match(/used_memory_human:(.+)/)
      const memory = memoryMatch ? memoryMatch[1]!.trim() : '0'
      
      // Parse key count
      const keysMatch = keyspace.match(/keys=(\d+)/)
      const keys = keysMatch ? parseInt(keysMatch[1]!) : 0
      
      // Parse hit/miss stats
      const hitsMatch = stats.match(/keyspace_hits:(\d+)/)
      const missesMatch = stats.match(/keyspace_misses:(\d+)/)
      const hits = hitsMatch ? parseInt(hitsMatch[1]!) : 0
      const misses = missesMatch ? parseInt(missesMatch[1]!) : 0
      
      return {
        connected: true,
        memory,
        keys,
        hits,
        misses
      }
    } catch (error) {
      console.error('Cache stats error:', error)
      return {
        connected: false,
        memory: '0',
        keys: 0,
        hits: 0,
        misses: 0
      }
    }
  }
}

// Create cache instance
const cacheConfig: CacheConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'rotatr:',
  maxRetriesPerRequest: 3
}

export const cache = new CacheService(cacheConfig)
export default cache
