import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { database } from '@/utils/database'
import { AppError } from './errorHandler'
import type { ApiResponse } from '@/types'

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number
        email: string
        role: 'admin' | 'manager' | 'user'
        name: string
      }
    }
  }
}

interface JWTPayload {
  userId: number
  email: string
  role: 'admin' | 'manager' | 'user'
  iat: number
  exp: number
}

interface User {
  id: number
  email: string
  password_hash: string
  role: 'admin' | 'manager' | 'user'
  name: string
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'
  private static readonly REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
  private static readonly SALT_ROUNDS = 12

  /**
   * Hash password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS)
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  /**
   * Generate JWT access token
   */
  static generateAccessToken(user: Pick<User, 'id' | 'email' | 'role'>): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    )
  }

  /**
   * Generate JWT refresh token
   */
  static generateRefreshToken(userId: number): string {
    return jwt.sign(
      { userId },
      this.JWT_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRES_IN }
    )
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET) as JWTPayload
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Token expired', 401)
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid token', 401)
      }
      throw new AppError('Token verification failed', 401)
    }
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT id, email, password_hash, role, name, is_active, created_at, updated_at
      FROM users 
      WHERE email = ? AND is_active = true
    `
    const users = await database.query<User>(query, [email])
    return users.length > 0 ? users[0]! : null
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: number): Promise<User | null> {
    const query = `
      SELECT id, email, password_hash, role, name, is_active, created_at, updated_at
      FROM users 
      WHERE id = ? AND is_active = true
    `
    const users = await database.query<User>(query, [id])
    return users.length > 0 ? users[0]! : null
  }

  /**
   * Create new user
   */
  static async createUser(userData: {
    email: string
    password: string
    name: string
    role?: 'admin' | 'manager' | 'user'
  }): Promise<User> {
    const { email, password, name, role = 'user' } = userData

    // Check if user already exists
    const existingUser = await this.getUserByEmail(email)
    if (existingUser) {
      throw new AppError('User with this email already exists', 409)
    }

    // Hash password
    const passwordHash = await this.hashPassword(password)

    // Insert user
    const query = `
      INSERT INTO users (email, password_hash, name, role, is_active)
      VALUES (?, ?, ?, ?, true)
    `
    const userId = await database.insert(query, [email, passwordHash, name, role])

    // Return created user
    const user = await this.getUserById(userId)
    if (!user) {
      throw new AppError('Failed to create user', 500)
    }

    return user
  }

  /**
   * Authenticate user with email and password
   */
  static async authenticate(email: string, password: string): Promise<{
    user: Omit<User, 'password_hash'>
    accessToken: string
    refreshToken: string
  }> {
    // Get user by email
    const user = await this.getUserByEmail(email)
    if (!user) {
      throw new AppError('Invalid credentials', 401)
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(password, user.password_hash)
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401)
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user)
    const refreshToken = this.generateRefreshToken(user.id)

    // Store refresh token in database
    await this.storeRefreshToken(user.id, refreshToken)

    // Return user without password hash
    const { password_hash, ...userWithoutPassword } = user
    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken
    }
  }

  /**
   * Store refresh token in database
   */
  static async storeRefreshToken(userId: number, refreshToken: string): Promise<void> {
    const query = `
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))
      ON DUPLICATE KEY UPDATE 
        token = VALUES(token),
        expires_at = VALUES(expires_at),
        updated_at = NOW()
    `
    await database.query(query, [userId, refreshToken])
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string
    refreshToken: string
  }> {
    // Verify refresh token
    const payload = this.verifyToken(refreshToken)

    // Check if refresh token exists in database
    const query = `
      SELECT user_id FROM refresh_tokens 
      WHERE token = ? AND expires_at > NOW()
    `
    const tokens = await database.query<{ user_id: number }>(query, [refreshToken])
    if (tokens.length === 0) {
      throw new AppError('Invalid refresh token', 401)
    }

    // Get user
    const user = await this.getUserById(payload.userId)
    if (!user) {
      throw new AppError('User not found', 401)
    }

    // Generate new tokens
    const newAccessToken = this.generateAccessToken(user)
    const newRefreshToken = this.generateRefreshToken(user.id)

    // Store new refresh token
    await this.storeRefreshToken(user.id, newRefreshToken)

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    }
  }

  /**
   * Revoke refresh token (logout)
   */
  static async revokeRefreshToken(refreshToken: string): Promise<void> {
    const query = `DELETE FROM refresh_tokens WHERE token = ?`
    await database.query(query, [refreshToken])
  }
}

/**
 * Middleware to authenticate requests
 */
export const authenticateToken = async (
  req: Request,
  res: Response<ApiResponse<null>>,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Access token required',
        errors: ['No token provided']
      })
    }

    // Verify token
    const payload = AuthService.verifyToken(token)

    // Get user details
    const user = await AuthService.getUserById(payload.userId)
    if (!user) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Invalid token',
        errors: ['User not found']
      })
    }

    // Add user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    }

    next()
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        data: null,
        message: error.message,
        errors: [error.message]
      })
    }

    return res.status(401).json({
      success: false,
      data: null,
      message: 'Authentication failed',
      errors: ['Invalid token']
    })
  }
}

/**
 * Middleware to authorize based on user roles
 */
export const authorizeRoles = (...roles: Array<'admin' | 'manager' | 'user'>) => {
  return (req: Request, res: Response<ApiResponse<null>>, next: NextFunction): void => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Authentication required',
        errors: ['No user found in request']
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Insufficient permissions',
        errors: [`Required roles: ${roles.join(', ')}`]
      })
    }

    next()
  }
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      const payload = AuthService.verifyToken(token)
      const user = await AuthService.getUserById(payload.userId)
      
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name
        }
      }
    }
  } catch (error) {
    // Ignore authentication errors for optional auth
  }

  next()
}
