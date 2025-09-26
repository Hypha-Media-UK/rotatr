import { Router, Request, Response } from 'express';
import { initializeDatabase } from '@/utils/database';
// import { validatePorter } from '@/middleware/validation';
// import { porterCache, invalidateCache } from '@/middleware/caching';
import { ApiResponse, Porter } from '@/types';

const router = Router();

// GET /api/porters - Get all porters
router.get('/', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const query = `
      SELECT
        p.id,
        p.name,
        p.shift_type,
        p.shift_offset_days,
        p.regular_department_id,
        p.is_floor_staff,
        p.porter_type,
        p.guaranteed_hours,
        p.created_at,
        p.updated_at,
        d.name as department_name
      FROM porters p
      LEFT JOIN departments d ON p.regular_department_id = d.id
      ORDER BY p.name
    `;

    const database = await initializeDatabase();
    const porters = await database.query(query);

    return res.json({
      success: true,
      data: porters,
      message: 'Porters retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching porters:', error);
    return res.status(500).json({
      success: false,
      data: null,
      errors: ['Failed to fetch porters']
    });
  }
});

// POST /api/porters - Create new porter
router.post('/', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const {
      name,
      shift_type,
      shift_offset_days = 0,
      regular_department_id,
      is_floor_staff = false,
      porter_type = 'Porter',
      guaranteed_hours
    } = req.body;

    const query = `
      INSERT INTO porters (
        name, shift_type, shift_offset_days, regular_department_id,
        is_floor_staff, porter_type, guaranteed_hours
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const database = await initializeDatabase();
    const result = await database.query(query, [
      name, shift_type, shift_offset_days, regular_department_id,
      is_floor_staff, porter_type, guaranteed_hours
    ]);

    const porterId = (result as any).insertId;

    // Fetch the created porter
    const selectQuery = `
      SELECT
        p.id, p.name, p.shift_type, p.shift_offset_days, p.regular_department_id,
        p.is_floor_staff, p.porter_type, p.guaranteed_hours, p.created_at, p.updated_at,
        d.name as department_name
      FROM porters p
      LEFT JOIN departments d ON p.regular_department_id = d.id
      WHERE p.id = ?
    `;

    const [porter] = await database.query(selectQuery, [porterId]);

    return res.status(201).json({
      success: true,
      data: porter,
      message: 'Porter created successfully'
    });
  } catch (error) {
    console.error('Error creating porter:', error);
    return res.status(500).json({
      success: false,
      data: null,
      errors: ['Failed to create porter']
    });
  }
});

export default router;
