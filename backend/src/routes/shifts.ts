import { Router, Request, Response } from 'express';
import { database } from '@/utils/database';
import { validateShift } from '@/middleware/validation';
import { ApiResponse, Shift } from '@/types';

const router = Router();

// GET /api/shifts - Get all shifts
router.get('/', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const query = `
      SELECT
        id, name, start_time, end_time, shift_type, shift_ident,
        days_on, days_off, offset_days, ground_zero, created_at, updated_at
      FROM shifts
      ORDER BY name
    `;

    const shifts = await database.query(query);

    return res.json({
      success: true,
      data: shifts,
      message: 'Shifts retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching shifts:', error);
    return res.status(500).json({
      success: false,
      data: null,
      errors: ['Failed to fetch shifts']
    });
  }
});



export default router;
