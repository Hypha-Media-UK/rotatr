import { Router, Request, Response } from 'express';
import { initializeDatabase } from '@/utils/database';
// import { validateDepartment } from '@/middleware/validation';
import { ApiResponse, Department, DepartmentSchedule } from '@/types';

const router = Router();

// GET /api/departments - Get all departments with schedules
router.get('/', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const query = `
      SELECT
        d.id,
        d.name,
        d.is_24_7,
        d.default_porters_required,
        d.created_at,
        d.updated_at,
        ds.id as schedule_id,
        ds.day_of_week,
        ds.opens_at,
        ds.closes_at,
        ds.porters_required
      FROM departments d
      LEFT JOIN department_schedules ds ON d.id = ds.department_id
      ORDER BY d.name, ds.day_of_week
    `;

    const database = await initializeDatabase();
    const rows = await database.query(query);

    // Group schedules by department
    const departmentMap = new Map<number, any>();

    rows.forEach((row: any) => {
      if (!departmentMap.has(row.id)) {
        departmentMap.set(row.id, {
          id: row.id,
          name: row.name,
          is_24_7: Boolean(row.is_24_7),
          default_porters_required: row.default_porters_required,
          created_at: row.created_at,
          updated_at: row.updated_at,
          schedules: []
        });
      }

      if (row.schedule_id) {
        departmentMap.get(row.id)!.schedules.push({
          id: row.schedule_id,
          department_id: row.id,
          day_of_week: row.day_of_week,
          opens_at: row.opens_at,
          closes_at: row.closes_at,
          porters_required: row.porters_required
        });
      }
    });

    const departments = Array.from(departmentMap.values());

    return res.json({
      success: true,
      data: departments,
      message: 'Departments retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return res.status(500).json({
      success: false,
      data: null,
      errors: ['Failed to fetch departments']
    });
  }
});

// GET /api/departments/:id - Get department by ID
router.get('/:id', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        d.id,
        d.name,
        d.is_24_7,
        d.default_porters_required,
        d.created_at,
        d.updated_at,
        ds.id as schedule_id,
        ds.day_of_week,
        ds.opens_at,
        ds.closes_at,
        ds.porters_required
      FROM departments d
      LEFT JOIN department_schedules ds ON d.id = ds.department_id
      WHERE d.id = ?
      ORDER BY ds.day_of_week
    `;

    const database = await initializeDatabase();
    const rows = await database.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        errors: ['Department not found']
      });
    }

    const department: any = {
      id: rows[0].id,
      name: rows[0].name,
      is_24_7: Boolean(rows[0].is_24_7),
      default_porters_required: rows[0].default_porters_required,
      created_at: rows[0].created_at,
      updated_at: rows[0].updated_at,
      schedules: []
    };

    rows.forEach((row: any) => {
      if (row.schedule_id) {
        department.schedules.push({
          id: row.schedule_id,
          department_id: row.id,
          day_of_week: row.day_of_week,
          opens_at: row.opens_at,
          closes_at: row.closes_at,
          porters_required: row.porters_required
        });
      }
    });

    return res.json({
      success: true,
      data: department,
      message: 'Department retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching department:', error);
    return res.status(500).json({
      success: false,
      data: null,
      errors: ['Failed to fetch department']
    });
  }
});

// POST /api/departments - Create new department
router.post('/', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const { name, is_24_7, default_porters_required, schedules } = req.body;

    const database = await initializeDatabase();
    // Start transaction
    await database.query('START TRANSACTION');

    try {
      // Insert department
      const deptQuery = `
        INSERT INTO departments (name, is_24_7, default_porters_required)
        VALUES (?, ?, ?)
      `;

      const result = await database.query(deptQuery, [name, is_24_7, default_porters_required]);
      const departmentId = (result as any).insertId;

      // Insert schedules if provided and not 24/7
      if (!is_24_7 && schedules && Array.isArray(schedules)) {
        const scheduleQuery = `
          INSERT INTO department_schedules (department_id, day_of_week, opens_at, closes_at, porters_required)
          VALUES (?, ?, ?, ?, ?)
        `;

        for (const schedule of schedules) {
          await database.query(scheduleQuery, [
            departmentId,
            schedule.day_of_week,
            schedule.opens_at,
            schedule.closes_at,
            schedule.porters_required
          ]);
        }
      }

      await database.query('COMMIT');

      // Fetch the created department with schedules
      const selectQuery = `
        SELECT
          d.id, d.name, d.is_24_7, d.default_porters_required, d.created_at, d.updated_at,
          ds.id as schedule_id, ds.day_of_week, ds.opens_at, ds.closes_at, ds.porters_required
        FROM departments d
        LEFT JOIN department_schedules ds ON d.id = ds.department_id
        WHERE d.id = ?
      `;

      const rows = await database.query(selectQuery, [departmentId]);

      const department: any = {
        id: rows[0].id,
        name: rows[0].name,
        is_24_7: Boolean(rows[0].is_24_7),
        default_porters_required: rows[0].default_porters_required,
        created_at: rows[0].created_at,
        updated_at: rows[0].updated_at,
        schedules: []
      };

      rows.forEach((row: any) => {
        if (row.schedule_id) {
          department.schedules.push({
            id: row.schedule_id,
            department_id: row.id,
            day_of_week: row.day_of_week,
            opens_at: row.opens_at,
            closes_at: row.closes_at,
            porters_required: row.porters_required
          });
        }
      });

      return res.status(201).json({
        success: true,
        data: department,
        message: 'Department created successfully'
      });
    } catch (error) {
      await database.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error creating department:', error);
    return res.status(500).json({
      success: false,
      data: null,
      errors: ['Failed to create department']
    });
  }
});

// PUT /api/departments/:id - Update department
router.put('/:id', async (req: Request, res: Response<ApiResponse<any>>) => {
  console.log('=== PUT DEPARTMENT REQUEST ===');
  console.log('Params:', req.params);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  try {
    const { id } = req.params;
    const { name, is_24_7, default_porters_required, schedules } = req.body;

    // Validate required fields
    if (!name || typeof is_24_7 !== 'boolean' || !default_porters_required) {
      return res.status(400).json({
        success: false,
        data: null,
        errors: ['Missing required fields: name, is_24_7, default_porters_required']
      });
    }

    const database = await initializeDatabase();

    // Start transaction
    await database.query('START TRANSACTION');

    try {
      // Update department
      const updateQuery = `
        UPDATE departments
        SET name = ?, is_24_7 = ?, default_porters_required = ?, updated_at = NOW()
        WHERE id = ?
      `;

      const result = await database.query(updateQuery, [name, is_24_7, default_porters_required, id]);

      if ((result as any).affectedRows === 0) {
        await database.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          data: null,
          errors: ['Department not found']
        });
      }

      // Delete existing schedules
      await database.query('DELETE FROM department_schedules WHERE department_id = ?', [id]);

      // Insert new schedules if provided and not 24/7
      if (!is_24_7 && schedules && Array.isArray(schedules)) {
        const scheduleQuery = `
          INSERT INTO department_schedules (department_id, day_of_week, opens_at, closes_at, porters_required)
          VALUES (?, ?, ?, ?, ?)
        `;

        for (const schedule of schedules) {
          await database.query(scheduleQuery, [
            id,
            schedule.day_of_week,
            schedule.opens_at,
            schedule.closes_at,
            schedule.porters_required
          ]);
        }
      }

      await database.query('COMMIT');

      // Fetch the updated department with schedules
      const selectQuery = `
        SELECT
          d.id, d.name, d.is_24_7, d.default_porters_required, d.created_at, d.updated_at,
          ds.id as schedule_id, ds.day_of_week, ds.opens_at, ds.closes_at, ds.porters_required
        FROM departments d
        LEFT JOIN department_schedules ds ON d.id = ds.department_id
        WHERE d.id = ?
        ORDER BY ds.day_of_week
      `;

      const rows = await database.query(selectQuery, [id]);

      const department: any = {
        id: rows[0].id,
        name: rows[0].name,
        is_24_7: Boolean(rows[0].is_24_7),
        default_porters_required: rows[0].default_porters_required,
        created_at: rows[0].created_at,
        updated_at: rows[0].updated_at,
        schedules: []
      };

      rows.forEach((row: any) => {
        if (row.schedule_id) {
          department.schedules.push({
            id: row.schedule_id,
            department_id: row.id,
            day_of_week: row.day_of_week,
            opens_at: row.opens_at,
            closes_at: row.closes_at,
            porters_required: row.porters_required
          });
        }
      });

      return res.json({
        success: true,
        data: department,
        message: 'Department updated successfully'
      });
    } catch (error) {
      await database.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating department:', error);
    return res.status(500).json({
      success: false,
      data: null,
      errors: ['Failed to update department']
    });
  }
});

// DELETE /api/departments/:id - Delete department
router.delete('/:id', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const { id } = req.params;

    const database = await initializeDatabase();

    // Start transaction
    await database.query('START TRANSACTION');

    try {
      // Check if department exists
      const checkQuery = 'SELECT id FROM departments WHERE id = ?';
      const existing = await database.query(checkQuery, [id]);

      if (existing.length === 0) {
        await database.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          data: null,
          errors: ['Department not found']
        });
      }

      // Delete schedules first (foreign key constraint)
      await database.query('DELETE FROM department_schedules WHERE department_id = ?', [id]);

      // Delete department
      await database.query('DELETE FROM departments WHERE id = ?', [id]);

      await database.query('COMMIT');

      return res.json({
        success: true,
        data: null,
        message: 'Department deleted successfully'
      });
    } catch (error) {
      await database.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error deleting department:', error);
    return res.status(500).json({
      success: false,
      data: null,
      errors: ['Failed to delete department']
    });
  }
});

export default router;
