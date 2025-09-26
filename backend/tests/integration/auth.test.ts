import request from 'supertest'
import express from 'express'
import authRouter from '../../src/routes/auth'
import { testUtils } from '../setup'

// Create test app
const app = express()
app.use(express.json())
app.use('/api/auth', authRouter)

describe('Authentication Integration Tests', () => {
  beforeEach(async () => {
    await testUtils.cleanupTestData()
  })

  afterEach(async () => {
    await testUtils.cleanupTestData()
  })

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        name: 'Test User'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body).toBeValidApiResponse()
      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe(userData.email)
      expect(response.body.data.user.name).toBe(userData.name)
      expect(response.body.data.token).toBeDefined()
      expect(response.body.data.refreshToken).toBeDefined()
      
      // Password should not be returned
      expect(response.body.data.user.password).toBeUndefined()
    })

    it('should reject registration with weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123', // Too weak
        name: 'Test User'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toContain('Password must be at least 8 characters')
    })

    it('should reject registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'TestPassword123!',
        name: 'Test User'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toContain('email must be a valid email address')
    })

    it('should reject duplicate email registration', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        name: 'Test User'
      }

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      // Duplicate registration
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('already exists')
    })
  })

  describe('User Login', () => {
    beforeEach(async () => {
      // Create test user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
          name: 'Test User'
        })
    })

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPassword123!'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200)

      expect(response.body).toBeValidApiResponse()
      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe(loginData.email)
      expect(response.body.data.token).toBeDefined()
      expect(response.body.data.refreshToken).toBeDefined()
    })

    it('should reject login with invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword123!'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Invalid credentials')
    })

    it('should reject login with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'TestPassword123!'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Invalid credentials')
    })

    it('should apply rate limiting to login attempts', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword123!'
      }

      // Make multiple failed login attempts
      const requests = Array.from({ length: 6 }, () =>
        request(app)
          .post('/api/auth/login')
          .send(loginData)
      )

      const responses = await Promise.all(requests)
      
      // Should get rate limited after 5 attempts
      const rateLimitedResponse = responses[5]
      expect(rateLimitedResponse.status).toBe(429)
    })
  })

  describe('Token Refresh', () => {
    let refreshToken: string

    beforeEach(async () => {
      // Register and login to get refresh token
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
          name: 'Test User'
        })

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        })

      refreshToken = loginResponse.body.data.refreshToken
    })

    it('should refresh token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200)

      expect(response.body).toBeValidApiResponse()
      expect(response.body.success).toBe(true)
      expect(response.body.data.token).toBeDefined()
      expect(response.body.data.refreshToken).toBeDefined()
    })

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Invalid refresh token')
    })
  })

  describe('User Profile', () => {
    let authToken: string

    beforeEach(async () => {
      // Register and login to get auth token
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
          name: 'Test User'
        })

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        })

      authToken = loginResponse.body.data.token
    })

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toBeValidApiResponse()
      expect(response.body.success).toBe(true)
      expect(response.body.data.email).toBe('test@example.com')
      expect(response.body.data.name).toBe('Test User')
    })

    it('should reject profile request without token', async () => {
      await request(app)
        .get('/api/auth/profile')
        .expect(401)
    })

    it('should reject profile request with invalid token', async () => {
      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)
    })

    it('should update user profile', async () => {
      const updateData = {
        name: 'Updated Test User'
      }

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body).toBeValidApiResponse()
      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe(updateData.name)
    })
  })

  describe('Password Change', () => {
    let authToken: string

    beforeEach(async () => {
      // Register and login
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
          name: 'Test User'
        })

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        })

      authToken = loginResponse.body.data.token
    })

    it('should change password with valid current password', async () => {
      const passwordData = {
        currentPassword: 'TestPassword123!',
        newPassword: 'NewTestPassword123!'
      }

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(200)

      expect(response.body).toBeValidApiResponse()
      expect(response.body.success).toBe(true)

      // Verify can login with new password
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'NewTestPassword123!'
        })
        .expect(200)
    })

    it('should reject password change with wrong current password', async () => {
      const passwordData = {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewTestPassword123!'
      }

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Current password is incorrect')
    })

    it('should reject weak new password', async () => {
      const passwordData = {
        currentPassword: 'TestPassword123!',
        newPassword: '123' // Too weak
      }

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toContain('Password must be at least 8 characters')
    })
  })

  describe('Logout', () => {
    let authToken: string
    let refreshToken: string

    beforeEach(async () => {
      // Register and login
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
          name: 'Test User'
        })

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        })

      authToken = loginResponse.body.data.token
      refreshToken = loginResponse.body.data.refreshToken
    })

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toBeValidApiResponse()
      expect(response.body.success).toBe(true)

      // Refresh token should be invalidated
      await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401)
    })
  })
})
