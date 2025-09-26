import { config } from 'dotenv'
import { initializeDatabase, database } from '@/utils/database'
import { cache } from '@/utils/cache'

// Load test environment variables
config({ path: '.env.test' })

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test'

  // Initialize test database connection
  try {
    const db = await initializeDatabase()
    await db.connect()
    console.log('✅ Test database connected')
  } catch (error) {
    console.error('❌ Test database connection failed:', error)
  }

  // Initialize test cache connection
  try {
    await cache.connect()
    console.log('✅ Test cache connected')
  } catch (error) {
    console.warn('⚠️ Test cache connection failed, tests will run without cache')
  }
})

// Global test teardown
afterAll(async () => {
  // Clean up database connection
  try {
    await database.disconnect()
    console.log('📦 Test database disconnected')
  } catch (error) {
    console.error('❌ Test database disconnect failed:', error)
  }

  // Clean up cache connection
  try {
    await cache.disconnect()
    console.log('📦 Test cache disconnected')
  } catch (error) {
    console.error('❌ Test cache disconnect failed:', error)
  }
})

// Clean up between tests
beforeEach(async () => {
  // Clear cache before each test
  try {
    await cache.delPattern('test:*')
  } catch (error) {
    // Ignore cache errors in tests
  }
})

// Test utilities
export const testUtils = {
  // Create test porter
  createTestPorter: async (overrides: Partial<any> = {}) => {
    const defaultPorter = {
      name: 'Test Porter',
      shift_type: 'Day A',
      shift_offset_days: 0,
      is_floor_staff: true,
      porter_type: 'Full-time',
      regular_department_id: 1,
      is_active: true
    }
    
    const porter = { ...defaultPorter, ...overrides }
    
    const query = `
      INSERT INTO porters (name, shift_type, shift_offset_days, is_floor_staff, porter_type, regular_department_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    
    const result = await database.query(query, [
      porter.name,
      porter.shift_type,
      porter.shift_offset_days,
      porter.is_floor_staff,
      porter.porter_type,
      porter.regular_department_id,
      porter.is_active
    ])
    
    return { id: result.insertId, ...porter }
  },
  
  // Create test department
  createTestDepartment: async (overrides: Partial<any> = {}) => {
    const defaultDepartment = {
      name: 'Test Department',
      is_24_7: false,
      default_porters_required: 2
    }
    
    const department = { ...defaultDepartment, ...overrides }
    
    const query = `
      INSERT INTO departments (name, is_24_7, default_porters_required)
      VALUES (?, ?, ?)
    `
    
    const result = await database.query(query, [
      department.name,
      department.is_24_7,
      department.default_porters_required
    ])
    
    return { id: result.insertId, ...department }
  },
  
  // Create test assignment
  createTestAssignment: async (overrides: Partial<any> = {}) => {
    const defaultAssignment = {
      porter_id: 1,
      department_id: 1,
      assignment_date: new Date().toISOString().split('T')[0],
      start_time: '07:00:00',
      end_time: '19:00:00',
      assignment_type: 'Temporary'
    }
    
    const assignment = { ...defaultAssignment, ...overrides }
    
    const query = `
      INSERT INTO temporary_assignments (porter_id, department_id, assignment_date, start_time, end_time, assignment_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    
    const result = await database.query(query, [
      assignment.porter_id,
      assignment.department_id,
      assignment.assignment_date,
      assignment.start_time,
      assignment.end_time,
      assignment.assignment_type
    ])
    
    return { id: result.insertId, ...assignment }
  },
  
  // Clean up test data
  cleanupTestData: async () => {
    // Clean up in reverse order of dependencies
    await database.query('DELETE FROM temporary_assignments WHERE porter_id > 1000 OR department_id > 1000')
    await database.query('DELETE FROM porters WHERE id > 1000')
    await database.query('DELETE FROM departments WHERE id > 1000')
    await database.query('DELETE FROM users WHERE email LIKE "%test%"')
  },
  
  // Generate test JWT token
  generateTestToken: (payload: any = {}) => {
    const jwt = require('jsonwebtoken')
    const defaultPayload = {
      id: 1,
      email: 'test@example.com',
      role: 'user'
    }
    
    return jwt.sign(
      { ...defaultPayload, ...payload },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    )
  },
  
  // Mock request object
  mockRequest: (overrides: any = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    user: { id: 1, email: 'test@example.com', role: 'user' },
    ...overrides
  }),
  
  // Mock response object
  mockResponse: () => {
    const res: any = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    res.setHeader = jest.fn().mockReturnValue(res)
    res.on = jest.fn().mockReturnValue(res)
    return res
  },
  
  // Wait for async operations
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
}

// Global test matchers
expect.extend({
  toBeValidApiResponse(received) {
    const pass = received && 
                 typeof received.success === 'boolean' &&
                 received.hasOwnProperty('data') &&
                 typeof received.message === 'string'
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid API response`,
        pass: true
      }
    } else {
      return {
        message: () => `expected ${received} to be a valid API response with success, data, and message properties`,
        pass: false
      }
    }
  },
  
  toBeValidPorter(received) {
    const pass = received &&
                 typeof received.id === 'number' &&
                 typeof received.name === 'string' &&
                 typeof received.shift_type === 'string' &&
                 typeof received.is_floor_staff === 'boolean'
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid porter`,
        pass: true
      }
    } else {
      return {
        message: () => `expected ${received} to be a valid porter with required properties`,
        pass: false
      }
    }
  }
})

// Declare custom matchers for TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidApiResponse(): R
      toBeValidPorter(): R
    }
  }
}
