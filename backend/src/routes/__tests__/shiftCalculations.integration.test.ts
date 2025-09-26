import request from 'supertest';
import express from 'express';
import shiftCalculationsRouter from '../shiftCalculations';
import { initializeDatabase } from '@/utils/database';

// Mock the database
jest.mock('@/utils/database');
const mockInitializeDatabase = initializeDatabase as jest.MockedFunction<typeof initializeDatabase>;

describe('Shift Calculations API Integration Tests', () => {
  let app: express.Application;
  let mockDatabase: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/shift-calculations', shiftCalculationsRouter);

    mockDatabase = {
      query: jest.fn(),
      queryOne: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };
    mockInitializeDatabase.mockResolvedValue(mockDatabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/shift-calculations/porter/:porterId/working-on/:date', () => {
    it('should return porter working status for valid request', async () => {
      const mockPorter = {
        id: 1,
        name: 'John Smith',
        shift_type: 'Day A',
        shift_offset_days: 0,
        regular_department_id: 1,
        is_floor_staff: false,
        porter_type: 'Porter',
        department_name: 'Emergency Department'
      };

      const mockShift = {
        id: 1,
        name: 'Day Shift A',
        start_time: '08:00:00',
        end_time: '20:00:00',
        shift_type: 'Day',
        shift_ident: 'A',
        days_on: 4,
        days_off: 4,
        offset_days: 0,
        ground_zero: new Date('2024-01-01')
      };

      mockDatabase.query
        .mockResolvedValueOnce([mockPorter]) // Porter query
        .mockResolvedValueOnce([mockShift]); // Shift query

      const response = await request(app)
        .get('/api/shift-calculations/porter/1/working-on/2024-01-01')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.porter_id).toBe(1);
      expect(response.body.data.porter_name).toBe('John Smith');
      expect(response.body.data.date).toBe('2024-01-01');
      expect(typeof response.body.data.is_working).toBe('boolean');
    });

    it('should return 400 for missing porter ID', async () => {
      const response = await request(app)
        .get('/api/shift-calculations/porter//working-on/2024-01-01')
        .expect(404); // Express returns 404 for missing route params
    });

    it('should return 400 for missing date', async () => {
      const response = await request(app)
        .get('/api/shift-calculations/porter/1/working-on/')
        .expect(404); // Express returns 404 for missing route params
    });

    it('should return 400 for invalid date format', async () => {
      const response = await request(app)
        .get('/api/shift-calculations/porter/1/working-on/invalid-date')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Invalid date format. Use YYYY-MM-DD');
    });

    it('should return 404 for non-existent porter', async () => {
      mockDatabase.query.mockResolvedValueOnce([]); // No porter found

      const response = await request(app)
        .get('/api/shift-calculations/porter/999/working-on/2024-01-01')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Porter not found');
    });

    it('should handle relief porters correctly', async () => {
      const mockReliefPorter = {
        id: 2,
        name: 'Alex Rodriguez',
        shift_type: 'Relief',
        shift_offset_days: 0,
        regular_department_id: null,
        is_floor_staff: false,
        porter_type: 'Porter',
        guaranteed_hours: 37.5,
        department_name: null
      };

      mockDatabase.query
        .mockResolvedValueOnce([mockReliefPorter]) // Porter query
        .mockResolvedValueOnce([]) // No relief assignments
        .mockResolvedValueOnce([]) // No temporary assignments
        .mockResolvedValueOnce([{ id: 1 }]); // Has contracted hours

      const response = await request(app)
        .get('/api/shift-calculations/porter/2/working-on/2024-01-01')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.porter_id).toBe(2);
      expect(response.body.data.is_working).toBe(true);
    });
  });

  describe('GET /api/shift-calculations/porters-working-on/:date', () => {
    it('should return all working porters for valid date', async () => {
      const mockPorters = [
        {
          id: 1,
          name: 'John Smith',
          shift_type: 'Day A',
          shift_offset_days: 0,
          regular_department_id: 1,
          is_floor_staff: false,
          porter_type: 'Porter',
          department_name: 'Emergency Department'
        },
        {
          id: 2,
          name: 'Jane Doe',
          shift_type: 'Day A',
          shift_offset_days: 0,
          regular_department_id: 2,
          is_floor_staff: false,
          porter_type: 'Porter',
          department_name: 'Surgery Department'
        }
      ];

      const mockShift = {
        id: 1,
        name: 'Day Shift A',
        start_time: '08:00:00',
        end_time: '20:00:00',
        shift_type: 'Day',
        shift_ident: 'A',
        days_on: 4,
        days_off: 4,
        offset_days: 0,
        ground_zero: new Date('2024-01-01')
      };

      mockDatabase.query
        .mockResolvedValueOnce(mockPorters) // All porters query
        .mockResolvedValue([mockShift]); // Shift queries for each porter

      const response = await request(app)
        .get('/api/shift-calculations/porters-working-on/2024-01-01')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.date).toBe('2024-01-01');
      expect(Array.isArray(response.body.data.porters)).toBe(true);
      expect(typeof response.body.data.total_working).toBe('number');
    });

    it('should return 400 for invalid date format', async () => {
      const response = await request(app)
        .get('/api/shift-calculations/porters-working-on/invalid-date')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Invalid date format. Use YYYY-MM-DD');
    });
  });

  describe('GET /api/shift-calculations/availability/:date', () => {
    it('should return porter availability for valid date', async () => {
      const mockPorters = [
        {
          id: 1,
          name: 'John Smith',
          shift_type: 'Day A',
          shift_offset_days: 0,
          regular_department_id: 1,
          is_floor_staff: false,
          porter_type: 'Porter',
          department_name: 'Emergency Department'
        }
      ];

      const mockShift = {
        id: 1,
        name: 'Day Shift A',
        start_time: '08:00:00',
        end_time: '20:00:00',
        shift_type: 'Day',
        shift_ident: 'A',
        days_on: 4,
        days_off: 4,
        offset_days: 0,
        ground_zero: new Date('2024-01-01')
      };

      mockDatabase.query
        .mockResolvedValueOnce(mockPorters) // All porters query
        .mockResolvedValueOnce([mockShift]) // Shift query
        .mockResolvedValueOnce([]); // No absences

      const response = await request(app)
        .get('/api/shift-calculations/availability/2024-01-01')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.date).toBe('2024-01-01');
      expect(response.body.data.summary).toBeDefined();
      expect(Array.isArray(response.body.data.availabilities)).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockDatabase.query.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/shift-calculations/porter/1/working-on/2024-01-01')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Failed to calculate porter working status');
    });
  });
});
