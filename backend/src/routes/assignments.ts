import { Router, Request, Response } from 'express';
import { initializeDatabase } from '@/utils/database';
// import { validateTemporaryAssignment } from '@/middleware/validation';
import { ApiResponse } from '@/types';

const router = Router();

// GET /api/assignments - Get temporary assignments with optional date filtering
router.get('/', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const { date, department_id, porter_id } = req.query;

    let query = `
      SELECT
        ta.id,
        ta.porter_id,
        ta.department_id,
        ta.assignment_date,
        ta.start_time,
        ta.end_time,
        ta.assignment_type,
        ta.created_at,
        ta.updated_at,
        p.name as porter_name,
        d.name as department_name
      FROM temporary_assignments ta
      JOIN porters p ON ta.porter_id = p.id
      JOIN departments d ON ta.department_id = d.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (date) {
      query += ' AND ta.assignment_date = ?';
      params.push(date);
    }

    if (department_id) {
      query += ' AND ta.department_id = ?';
      params.push(department_id);
    }

    if (porter_id) {
      query += ' AND ta.porter_id = ?';
      params.push(porter_id);
    }

    query += ' ORDER BY ta.assignment_date DESC, ta.start_time';

    const database = await initializeDatabase();
    const assignments = await database.query(query, params);

    return res.json({
      success: true,
      data: assignments,
      message: 'Assignments retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return res.status(500).json({
      success: false,
      data: null,
      errors: ['Failed to fetch assignments']
    });
  }
});

// POST /api/assignments - Create new temporary assignment
router.post('/', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const {
      porter_id,
      department_id,
      assignment_date,
      start_time,
      end_time,
      assignment_type
    } = req.body;

    const query = `
      INSERT INTO temporary_assignments (
        porter_id, department_id, assignment_date, start_time, end_time, assignment_type
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const database = await initializeDatabase();
    const result = await database.query(query, [
      porter_id, department_id, assignment_date, start_time, end_time, assignment_type
    ]);

    const insertId = (result as any).insertId;

    // Fetch the created assignment with relations
    const selectQuery = `
      SELECT
        ta.id, ta.porter_id, ta.department_id, ta.assignment_date,
        ta.start_time, ta.end_time, ta.assignment_type, ta.created_at, ta.updated_at,
        p.name as porter_name, d.name as department_name
      FROM temporary_assignments ta
      JOIN porters p ON ta.porter_id = p.id
      JOIN departments d ON ta.department_id = d.id
      WHERE ta.id = ?
    `;

    const [assignment] = await database.query(selectQuery, [insertId]);

    return res.status(201).json({
      success: true,
      data: assignment,
      message: 'Assignment created successfully'
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    return res.status(500).json({
      success: false,
      data: null,
      errors: ['Failed to create assignment']
    });
  }
});

export default router;
