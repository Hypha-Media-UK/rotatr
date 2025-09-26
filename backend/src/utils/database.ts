import mysql from 'mysql2/promise'
import fs from 'fs/promises'
import type { DatabaseConfig } from '@/types'

// Helper function to read secrets from files
const readSecret = async (secretPath: string): Promise<string> => {
  try {
    const content = await fs.readFile(secretPath, 'utf8')
    return content.trim()
  } catch (error) {
    console.warn(`Failed to read secret from ${secretPath}:`, error)
    return ''
  }
}

class Database {
  private pool: mysql.Pool | null = null
  private config: DatabaseConfig

  constructor(config: DatabaseConfig) {
    this.config = config
  }

  async connect(): Promise<void> {
    try {
      this.pool = mysql.createPool({
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password,
        database: this.config.database,
        waitForConnections: true,
        connectionLimit: this.config.connectionLimit || 10,
        queueLimit: 0,
        charset: 'utf8mb4',
        timezone: '+00:00'
      })

      // Test the connection
      const connection = await this.pool.getConnection()
      await connection.ping()
      connection.release()
      
      console.log('✅ Database connected successfully')
    } catch (error) {
      console.error('❌ Database connection failed:', error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end()
      this.pool = null
      console.log('📦 Database connection closed')
    }
  }

  getPool(): mysql.Pool {
    if (!this.pool) {
      throw new Error('Database not connected. Call connect() first.')
    }
    return this.pool
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const pool = this.getPool()
    try {
      const [rows] = await pool.execute(sql, params)
      return rows as T[]
    } catch (error) {
      console.error('Database query error:', error)
      console.error('SQL:', sql)
      console.error('Params:', params)
      throw error
    }
  }

  async queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    const results = await this.query<T>(sql, params)
    return results.length > 0 ? results[0]! : null
  }

  async insert(sql: string, params?: any[]): Promise<number> {
    const pool = this.getPool()
    try {
      const [result] = await pool.execute(sql, params)
      const insertResult = result as mysql.ResultSetHeader
      return insertResult.insertId
    } catch (error) {
      console.error('Database insert error:', error)
      console.error('SQL:', sql)
      console.error('Params:', params)
      throw error
    }
  }

  async update(sql: string, params?: any[]): Promise<number> {
    const pool = this.getPool()
    try {
      const [result] = await pool.execute(sql, params)
      const updateResult = result as mysql.ResultSetHeader
      return updateResult.affectedRows
    } catch (error) {
      console.error('Database update error:', error)
      console.error('SQL:', sql)
      console.error('Params:', params)
      throw error
    }
  }

  async delete(sql: string, params?: any[]): Promise<number> {
    const pool = this.getPool()
    try {
      const [result] = await pool.execute(sql, params)
      const deleteResult = result as mysql.ResultSetHeader
      return deleteResult.affectedRows
    } catch (error) {
      console.error('Database delete error:', error)
      console.error('SQL:', sql)
      console.error('Params:', params)
      throw error
    }
  }

  async transaction<T>(callback: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> {
    const pool = this.getPool()
    const connection = await pool.getConnection()
    
    try {
      await connection.beginTransaction()
      const result = await callback(connection)
      await connection.commit()
      return result
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }
}

// Create database instance with secure configuration
const createDatabaseConfig = async (): Promise<DatabaseConfig> => {
  let password = process.env.DB_PASSWORD || 'rotatr_pass_2024'

  // Try to read password from secrets file
  if (process.env.DB_PASSWORD_FILE) {
    const secretPassword = await readSecret(process.env.DB_PASSWORD_FILE)
    if (secretPassword) {
      password = secretPassword
    }
  }

  const config: DatabaseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'rotatr_user',
    password,
    database: process.env.DB_NAME || 'rotatr_db',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
    acquireTimeout: 60000,
    timeout: 60000
  }

  // Add SSL configuration if enabled
  if (process.env.DB_SSL === 'true') {
    config.ssl = {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
    }
  }

  return config
}

// Initialize database with async configuration
let databaseInstance: Database | undefined

const initializeDatabase = async (): Promise<Database> => {
  if (!databaseInstance) {
    const config = await createDatabaseConfig()
    databaseInstance = new Database(config)
  }
  return databaseInstance
}

// Export both named and default exports for compatibility
export { initializeDatabase }
export default initializeDatabase

// Also export a singleton instance for backward compatibility
export const database = {
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const db = await initializeDatabase();
    return db.query<T>(sql, params);
  },
  async queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    const db = await initializeDatabase();
    return db.queryOne<T>(sql, params);
  },
  async insert(sql: string, params?: any[]): Promise<number> {
    const db = await initializeDatabase();
    return db.insert(sql, params);
  },
  async update(sql: string, params?: any[]): Promise<number> {
    const db = await initializeDatabase();
    return db.update(sql, params);
  },
  async delete(sql: string, params?: any[]): Promise<number> {
    const db = await initializeDatabase();
    return db.delete(sql, params);
  },
  async connect(): Promise<void> {
    const db = await initializeDatabase();
    return db.connect();
  },
  async disconnect(): Promise<void> {
    const db = await initializeDatabase();
    return db.disconnect();
  }
}
