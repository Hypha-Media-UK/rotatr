import { Router, Request, Response } from 'express'
import rateLimit from 'express-rate-limit'
import { AuthService, authenticateToken } from '@/middleware/auth'
import { validateRequired, validateString, validateEmail } from '@/middleware/validation'
import { AppError, asyncHandler } from '@/middleware/errorHandler'
import type { ApiResponse } from '@/types'

const router = Router()

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    data: null,
    message: 'Too many authentication attempts',
    errors: ['Please try again later']
  },
  standardHeaders: true,
  legacyHeaders: false
})

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // More lenient for refresh tokens
  message: {
    success: false,
    data: null,
    message: 'Too many refresh attempts',
    errors: ['Please try again later']
  }
})

// Validation middleware for registration
const validateRegistration = (req: Request, res: Response, next: Function): void => {
  try {
    const { email, password, name, role } = req.body

    validateRequired(email, 'email')
    validateEmail(email, 'email')
    validateRequired(password, 'password')
    validateString(password, 'password', 8, 128) // Minimum 8 characters
    validateRequired(name, 'name')
    validateString(name, 'name', 2, 100)

    if (role && !['admin', 'manager', 'user'].includes(role)) {
      throw new AppError('Invalid role specified', 400)
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
    if (!passwordRegex.test(password)) {
      throw new AppError(
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        400
      )
    }

    next()
  } catch (error) {
    next(error)
  }
}

// Validation middleware for login
const validateLogin = (req: Request, res: Response, next: Function): void => {
  try {
    const { email, password } = req.body

    validateRequired(email, 'email')
    validateEmail(email, 'email')
    validateRequired(password, 'password')

    next()
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', authLimiter, validateRegistration, asyncHandler(async (req: Request, res: Response<ApiResponse<any>>) => {
  const { email, password, name, role } = req.body

  // Create user
  const user = await AuthService.createUser({
    email: email.toLowerCase().trim(),
    password,
    name: name.trim(),
    role: role || 'user'
  })

  // Generate tokens
  const accessToken = AuthService.generateAccessToken(user)
  const refreshToken = AuthService.generateRefreshToken(user.id)

  // Store refresh token
  await AuthService.storeRefreshToken(user.id, refreshToken)

  // Remove password hash from response
  const { password_hash, ...userResponse } = user

  res.status(201).json({
    success: true,
    data: {
      user: userResponse,
      accessToken,
      refreshToken
    },
    message: 'User registered successfully'
  })
}))

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */
router.post('/login', authLimiter, validateLogin, asyncHandler(async (req: Request, res: Response<ApiResponse<any>>) => {
  const { email, password } = req.body

  // Authenticate user
  const authResult = await AuthService.authenticate(
    email.toLowerCase().trim(),
    password
  )

  res.json({
    success: true,
    data: authResult,
    message: 'Login successful'
  })
}))

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', refreshLimiter, asyncHandler(async (req: Request, res: Response<ApiResponse<any>>) => {
  const { refreshToken } = req.body

  if (!refreshToken) {
    throw new AppError('Refresh token required', 400)
  }

  // Refresh tokens
  const tokens = await AuthService.refreshAccessToken(refreshToken)

  res.json({
    success: true,
    data: tokens,
    message: 'Tokens refreshed successfully'
  })
}))

/**
 * POST /api/auth/logout
 * Logout user and revoke refresh token
 */
router.post('/logout', asyncHandler(async (req: Request, res: Response<ApiResponse<any>>) => {
  const { refreshToken } = req.body

  if (refreshToken) {
    await AuthService.revokeRefreshToken(refreshToken)
  }

  res.json({
    success: true,
    data: null,
    message: 'Logout successful'
  })
}))

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticateToken, asyncHandler(async (req: Request, res: Response<ApiResponse<any>>) => {
  if (!req.user) {
    throw new AppError('User not found', 404)
  }

  res.json({
    success: true,
    data: {
      user: req.user
    },
    message: 'User profile retrieved successfully'
  })
}))

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', authenticateToken, asyncHandler(async (req: Request, res: Response<ApiResponse<any>>) => {
  if (!req.user) {
    throw new AppError('User not found', 404)
  }

  const { name } = req.body

  if (name) {
    validateString(name, 'name', 2, 100)
  }

  // Update user profile
  const updateQuery = `
    UPDATE users 
    SET name = COALESCE(?, name), updated_at = NOW()
    WHERE id = ?
  `
  await database.query(updateQuery, [name?.trim(), req.user.id])

  // Get updated user
  const updatedUser = await AuthService.getUserById(req.user.id)
  if (!updatedUser) {
    throw new AppError('Failed to update profile', 500)
  }

  const { password_hash, ...userResponse } = updatedUser

  res.json({
    success: true,
    data: {
      user: userResponse
    },
    message: 'Profile updated successfully'
  })
}))

/**
 * PUT /api/auth/change-password
 * Change user password
 */
router.put('/change-password', authenticateToken, asyncHandler(async (req: Request, res: Response<ApiResponse<any>>) => {
  if (!req.user) {
    throw new AppError('User not found', 404)
  }

  const { currentPassword, newPassword } = req.body

  validateRequired(currentPassword, 'currentPassword')
  validateRequired(newPassword, 'newPassword')
  validateString(newPassword, 'newPassword', 8, 128)

  // Password strength validation
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
  if (!passwordRegex.test(newPassword)) {
    throw new AppError(
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      400
    )
  }

  // Get current user with password hash
  const user = await AuthService.getUserById(req.user.id)
  if (!user) {
    throw new AppError('User not found', 404)
  }

  // Verify current password
  const isValidPassword = await AuthService.verifyPassword(currentPassword, user.password_hash)
  if (!isValidPassword) {
    throw new AppError('Current password is incorrect', 400)
  }

  // Hash new password
  const newPasswordHash = await AuthService.hashPassword(newPassword)

  // Update password
  const updateQuery = `
    UPDATE users 
    SET password_hash = ?, updated_at = NOW()
    WHERE id = ?
  `
  await database.query(updateQuery, [newPasswordHash, req.user.id])

  // Revoke all refresh tokens to force re-login
  const revokeQuery = `DELETE FROM refresh_tokens WHERE user_id = ?`
  await database.query(revokeQuery, [req.user.id])

  res.json({
    success: true,
    data: null,
    message: 'Password changed successfully. Please log in again.'
  })
}))

export default router
