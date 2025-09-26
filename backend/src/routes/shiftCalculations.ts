// @ts-nocheck
import { Router, Request, Response } from 'express';
import { shiftCalculationService } from '@/services/shiftCalculationService';
import { ApiResponse, PorterAvailability } from '@/types';

const router = Router();

/**
 * GET /api/shift-calculations/porter/:porterId/working-on/:date
 * Check if a specific porter is working on a specific date
 */
router.get('/porter/:porterId/working-on/:date', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const { porterId, date } = req.params;

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!date || !dateRegex.test(date!)) {
      return res.status(400).json({
        success: false,
        data: null,
        errors: ['Invalid date format. Use YYYY-MM-DD']
      });
    }

    // Get porter from database
    const porterQuery = `
      SELECT 
        p.id, p.name, p.shift_type, p.shift_offset_days, p.regular_department_id,
        p.is_floor_staff, p.porter_type, p.guaranteed_hours, p.created_at, p.updated_at,
        d.name as department_name
      FROM porters p
      LEFT JOIN departments d ON p.regular_department_id = d.id
      WHERE p.id = ?
    `;

    const { database } = await import('@/utils/database');
    const porters = await database.query(porterQuery, [porterId]);

    if (porters.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        errors: ['Porter not found']
      });
    }

    const porter = porters[0];
    const isWorking = await shiftCalculationService.isPorterWorkingOnDate(porter, date!);

    return res.json({
      success: true,
      data: {
        porter_id: parseInt(porterId as string),
        porter_name: porter.name,
        date,
        is_working: isWorking,
        shift_type: porter.shift_type,
        shift_offset_days: porter.shift_offset_days
      },
      message: `Porter working status calculated for ${date}`
    });
  } catch (error) {
    console.error('Error checking porter working status:', error);
    return res.status(500).json({
      success: false,
      data: null,
      errors: ['Failed to calculate porter working status']
    });
  }
});

/**
 * GET /api/shift-calculations/porters-working-on/:date
 * Get all porters working on a specific date
 */
router.get('/porters-working-on/:date', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const { date } = req.params;

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!date || !dateRegex.test(date!)) {
      return res.status(400).json({
        success: false,
        data: null,
        errors: ['Invalid date format. Use YYYY-MM-DD']
      });
    }

    const workingPorters = await shiftCalculationService.getPortersWorkingOnDate(date!);

    return res.json({
      success: true,
      data: {
        date,
        total_working: workingPorters.length,
        porters: workingPorters.map(porter => ({
          id: porter.id,
          name: porter.name,
          shift_type: porter.shift_type,
          shift_offset_days: porter.shift_offset_days,
          regular_department_id: porter.regular_department_id,
          department_name: (porter as any).department_name,
          is_floor_staff: porter.is_floor_staff,
          porter_type: porter.porter_type
        }))
      },
      message: `Found ${workingPorters.length} porters working on ${date}`
    });
  } catch (error) {
    console.error('Error getting porters working on date:', error);
    return res.status(500).json({
      success: false,
      data: null,
      errors: ['Failed to get porters working on date']
    });
  }
});

/**
 * GET /api/shift-calculations/availability/:date
 * Get detailed availability information for all porters on a specific date
 */
router.get('/availability/:date', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const { date } = req.params;

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!date || !dateRegex.test(date!)) {
      return res.status(400).json({
        success: false,
        data: null,
        errors: ['Invalid date format. Use YYYY-MM-DD']
      });
    }

    const availabilities = await shiftCalculationService.getAllPorterAvailabilities(date!);

    // Separate into working and not working
    const working = availabilities.filter(a => a.isWorking);
    const notWorking = availabilities.filter(a => !a.isWorking);
    const available = availabilities.filter(a => a.isAvailable);
    const unavailable = availabilities.filter(a => a.isWorking && !a.isAvailable);

    return res.json({
      success: true,
      data: {
        date,
        summary: {
          total_porters: availabilities.length,
          working: working.length,
          not_working: notWorking.length,
          available: available.length,
          unavailable: unavailable.length
        },
        availabilities: availabilities.map(availability => ({
          porter: {
            id: availability.porter.id,
            name: availability.porter.name,
            shift_type: availability.porter.shift_type,
            shift_offset_days: availability.porter.shift_offset_days,
            regular_department_id: availability.porter.regular_department_id,
            department_name: (availability.porter as any).department_name,
            is_floor_staff: availability.porter.is_floor_staff,
            porter_type: availability.porter.porter_type
          },
          is_working: availability.isWorking,
          is_available: availability.isAvailable,
          conflict_reason: availability.conflictReason,
          working_hours: availability.workingHours
        }))
      },
      message: `Porter availability calculated for ${date}`
    });
  } catch (error) {
    console.error('Error getting porter availability:', error);
    return res.status(500).json({
      success: false,
      data: null,
      errors: ['Failed to get porter availability']
    });
  }
});

/**
 * GET /api/shift-calculations/porter/:porterId/next-working-day
 * Get the next working day for a specific porter
 */
router.get('/porter/:porterId/next-working-day', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const { porterId } = req.params;
    const { from_date } = req.query;

    // Default to today if no from_date provided
    const fromDate = (from_date || new Date().toISOString().split('T')[0])!;

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(fromDate as string)) {
      return res.status(400).json({
        success: false,
        data: null,
        errors: ['Invalid from_date format. Use YYYY-MM-DD']
      });
    }

    // Get porter from database
    const porterQuery = `
      SELECT 
        p.id, p.name, p.shift_type, p.shift_offset_days, p.regular_department_id,
        p.is_floor_staff, p.porter_type, p.guaranteed_hours, p.created_at, p.updated_at,
        d.name as department_name
      FROM porters p
      LEFT JOIN departments d ON p.regular_department_id = d.id
      WHERE p.id = ?
    `;

    const { database } = await import('@/utils/database');
    const porters = await database.query(porterQuery, [porterId]);

    if (porters.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        errors: ['Porter not found']
      });
    }

    const porter = porters[0];
    const nextWorkingDay = await shiftCalculationService.getNextWorkingDay(porter, fromDate as string);

    return res.json({
      success: true,
      data: {
        porter_id: parseInt(porterId as string),
        porter_name: porter.name,
        from_date: fromDate,
        next_working_day: nextWorkingDay,
        shift_type: porter.shift_type
      },
      message: nextWorkingDay 
        ? `Next working day found: ${nextWorkingDay}` 
        : 'No working day found in the next 30 days'
    });
  } catch (error) {
    console.error('Error getting next working day:', error);
    return res.status(500).json({
      success: false,
      data: null,
      errors: ['Failed to get next working day']
    });
  }
});

/**
 * GET /api/shift-calculations/porter/:porterId/working-days
 * Get working days for a porter in a date range
 */
router.get('/porter/:porterId/working-days', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const { porterId } = req.params;
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        data: null,
        errors: ['start_date and end_date query parameters are required']
      });
    }

    // Validate date formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(start_date as string) || !dateRegex.test(end_date as string)) {
      return res.status(400).json({
        success: false,
        data: null,
        errors: ['Invalid date format. Use YYYY-MM-DD']
      });
    }

    // Get porter from database
    const porterQuery = `
      SELECT 
        p.id, p.name, p.shift_type, p.shift_offset_days, p.regular_department_id,
        p.is_floor_staff, p.porter_type, p.guaranteed_hours, p.created_at, p.updated_at,
        d.name as department_name
      FROM porters p
      LEFT JOIN departments d ON p.regular_department_id = d.id
      WHERE p.id = ?
    `;

    const { database } = await import('@/utils/database');
    const porters = await database.query(porterQuery, [porterId]);

    if (porters.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        errors: ['Porter not found']
      });
    }

    const porter = porters[0];
    const workingDays = await shiftCalculationService.getWorkingDaysInRange(
      porter, 
      start_date as string, 
      end_date as string
    );

    return res.json({
      success: true,
      data: {
        porter_id: parseInt(porterId as string),
        porter_name: porter.name,
        start_date,
        end_date,
        total_working_days: workingDays.length,
        working_days: workingDays,
        shift_type: porter.shift_type
      },
      message: `Found ${workingDays.length} working days for porter ${porter.name}`
    });
  } catch (error) {
    console.error('Error getting working days in range:', error);
    return res.status(500).json({
      success: false,
      data: null,
      errors: ['Failed to get working days in range']
    });
  }
});

export default router;
