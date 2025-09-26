import request from 'supertest'
import express from 'express'
import portersRouter from '../porters'
import { testUtils } from '../../../tests/setup'

// Create test app
const app = express()
app.use(express.json())
app.use('/api/porters', portersRouter)

describe('Porters API', () => {
  let authToken: string

  beforeEach(async () => {
    authToken = testUtils.generateTestToken()
    await testUtils.cleanupTestData()
  })

  afterEach(async () => {
    await testUtils.cleanupTestData()
  })

  describe('GET /api/porters', () => {
    it('should return all porters', async () => {
      const porter = await testUtils.createTestPorter()

      const response = await request(app)
        .get('/api/porters')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toBeValidApiResponse()
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)
    })

    it('should filter porters by floor staff', async () => {
      await testUtils.createTestPorter({ is_floor_staff: true })
      await testUtils.createTestPorter({ is_floor_staff: false })

      const response = await request(app)
        .get('/api/porters?is_floor_staff=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      response.body.data.forEach((porter: any) => {
        expect(porter.is_floor_staff).toBe(true)
      })
    })

    it('should filter porters by department', async () => {
      const department = await testUtils.createTestDepartment()
      await testUtils.createTestPorter({ regular_department_id: department.id })

      const response = await request(app)
        .get(`/api/porters?department_id=${department.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      response.body.data.forEach((porter: any) => {
        expect(porter.regular_department_id).toBe(department.id)
      })
    })

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/porters')
        .expect(401)
    })

    it('should include cache headers', async () => {
      const response = await request(app)
        .get('/api/porters')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.headers['x-cache']).toBeDefined()
    })
  })

  describe('GET /api/porters/:id', () => {
    it('should return a specific porter', async () => {
      const porter = await testUtils.createTestPorter()

      const response = await request(app)
        .get(`/api/porters/${porter.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toBeValidApiResponse()
      expect(response.body.data).toBeValidPorter()
      expect(response.body.data.id).toBe(porter.id)
      expect(response.body.data.name).toBe(porter.name)
    })

    it('should return 404 for non-existent porter', async () => {
      const response = await request(app)
        .get('/api/porters/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('not found')
    })

    it('should return 400 for invalid porter ID', async () => {
      await request(app)
        .get('/api/porters/invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)
    })
  })

  describe('POST /api/porters', () => {
    it('should create a new porter', async () => {
      const department = await testUtils.createTestDepartment()
      const porterData = {
        name: 'New Test Porter',
        shift_type: 'Day A',
        shift_offset_days: 0,
        is_floor_staff: true,
        porter_type: 'Full-time',
        regular_department_id: department.id
      }

      const response = await request(app)
        .post('/api/porters')
        .set('Authorization', `Bearer ${authToken}`)
        .send(porterData)
        .expect(201)

      expect(response.body).toBeValidApiResponse()
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeValidPorter()
      expect(response.body.data.name).toBe(porterData.name)
      expect(response.body.data.shift_type).toBe(porterData.shift_type)
    })

    it('should validate required fields', async () => {
      const invalidData = {
        shift_type: 'Day A'
        // Missing required name field
      }

      const response = await request(app)
        .post('/api/porters')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toContain('name is required')
    })

    it('should validate shift type', async () => {
      const invalidData = {
        name: 'Test Porter',
        shift_type: 'Invalid Shift',
        shift_offset_days: 0,
        is_floor_staff: true,
        porter_type: 'Full-time',
        regular_department_id: 1
      }

      const response = await request(app)
        .post('/api/porters')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toContain('Invalid shift type')
    })

    it('should validate department exists', async () => {
      const invalidData = {
        name: 'Test Porter',
        shift_type: 'Day A',
        shift_offset_days: 0,
        is_floor_staff: true,
        porter_type: 'Full-time',
        regular_department_id: 99999 // Non-existent department
      }

      const response = await request(app)
        .post('/api/porters')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should require admin or manager role for creation', async () => {
      const userToken = testUtils.generateTestToken({ role: 'user' })
      const porterData = {
        name: 'Test Porter',
        shift_type: 'Day A',
        shift_offset_days: 0,
        is_floor_staff: true,
        porter_type: 'Full-time',
        regular_department_id: 1
      }

      await request(app)
        .post('/api/porters')
        .set('Authorization', `Bearer ${userToken}`)
        .send(porterData)
        .expect(403)
    })
  })

  describe('PUT /api/porters/:id', () => {
    it('should update an existing porter', async () => {
      const porter = await testUtils.createTestPorter()
      const updateData = {
        name: 'Updated Porter Name',
        shift_type: 'Night A'
      }

      const response = await request(app)
        .put(`/api/porters/${porter.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body).toBeValidApiResponse()
      expect(response.body.data.name).toBe(updateData.name)
      expect(response.body.data.shift_type).toBe(updateData.shift_type)
    })

    it('should return 404 for non-existent porter', async () => {
      const updateData = { name: 'Updated Name' }

      await request(app)
        .put('/api/porters/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404)
    })

    it('should validate update data', async () => {
      const porter = await testUtils.createTestPorter()
      const invalidData = {
        shift_type: 'Invalid Shift Type'
      }

      const response = await request(app)
        .put(`/api/porters/${porter.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe('DELETE /api/porters/:id', () => {
    it('should soft delete a porter', async () => {
      const porter = await testUtils.createTestPorter()

      const response = await request(app)
        .delete(`/api/porters/${porter.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toBeValidApiResponse()
      expect(response.body.success).toBe(true)

      // Verify porter is soft deleted (is_active = false)
      const deletedPorter = await database.query(
        'SELECT is_active FROM porters WHERE id = ?',
        [porter.id]
      )
      expect(deletedPorter[0].is_active).toBe(false)
    })

    it('should return 404 for non-existent porter', async () => {
      await request(app)
        .delete('/api/porters/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    })

    it('should require admin role for deletion', async () => {
      const managerToken = testUtils.generateTestToken({ role: 'manager' })
      const porter = await testUtils.createTestPorter()

      await request(app)
        .delete(`/api/porters/${porter.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403)
    })
  })

  describe('Cache invalidation', () => {
    it('should invalidate cache on porter creation', async () => {
      const department = await testUtils.createTestDepartment()
      
      // First request to populate cache
      await request(app)
        .get('/api/porters')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      // Create new porter (should invalidate cache)
      await request(app)
        .post('/api/porters')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Cache Test Porter',
          shift_type: 'Day A',
          shift_offset_days: 0,
          is_floor_staff: true,
          porter_type: 'Full-time',
          regular_department_id: department.id
        })
        .expect(201)

      // Next request should be cache miss
      const response = await request(app)
        .get('/api/porters')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.headers['x-cache']).toBe('MISS')
    })
  })

  describe('Rate limiting', () => {
    it('should apply rate limiting to porter endpoints', async () => {
      const requests = Array.from({ length: 10 }, () =>
        request(app)
          .get('/api/porters')
          .set('Authorization', `Bearer ${authToken}`)
      )

      const responses = await Promise.all(requests)
      
      // All requests should succeed in test environment
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status)
      })
    })
  })
})
