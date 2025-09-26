import { Router, Request, Response } from 'express';
import { shiftCalculationService } from '@/services/shiftCalculationService';
import { database } from '@/utils/database';

const router = Router();

/**
 * GET /api/test-shift-calculations/porter/:porterId/working-on/:date
 * Simple test endpoint to check if a porter is working on a date
 */
router.get('/porter/:porterId/working-on/:date', async (req: Request, res: Response) => {
  try {
    const porterId = req.params.porterId!;
    const date = req.params.date!;

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

    const porters = await database.query(porterQuery, [porterId]);

    if (porters.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Porter not found'
      });
    }

    const porter = porters[0];
    const isWorking = await shiftCalculationService.isPorterWorkingOnDate(porter, date!);

    return res.json({
      success: true,
      data: {
        porter_id: parseInt(porterId),
        porter_name: porter.name,
        shift_type: porter.shift_type,
        shift_offset_days: porter.shift_offset_days,
        date: date,
        is_working: isWorking
      },
      message: `Porter ${porter.name} is ${isWorking ? 'working' : 'not working'} on ${date}`
    });
  } catch (error) {
    console.error('Error testing shift calculation:', error);
    return res.status(500).json({
      success: false,
      message: 'Error testing shift calculation',
      error: (error as Error).message
    });
  }
});

/**
 * GET /api/test-shift-calculations/working-porters/:date
 * Get all porters working on a specific date
 */
router.get('/working-porters/:date', async (req: Request, res: Response) => {
  try {
    const date = req.params.date!;

    const workingPorters = await shiftCalculationService.getPortersWorkingOnDate(date);

    return res.json({
      success: true,
      data: {
        date: date,
        total_working: workingPorters.length,
        porters: workingPorters.map(porter => ({
          id: porter.id,
          name: porter.name,
          shift_type: porter.shift_type,
          shift_offset_days: porter.shift_offset_days,
          department_name: (porter as any).department_name
        }))
      },
      message: `Found ${workingPorters.length} porters working on ${date}`
    });
  } catch (error) {
    console.error('Error getting working porters:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting working porters',
      error: (error as Error).message
    });
  }
});

export default router;
