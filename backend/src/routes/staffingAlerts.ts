import { Router, Request, Response } from 'express';
import { staffingAlertService } from '@/services/staffingAlertService';
import { ApiResponse, StaffingAlert, DepartmentStaffing, DailyStaffingOverview } from '@/types';

const router = Router();

/**
 * GET /api/staffing-alerts/department/:departmentId/date/:date
 * Get staffing information for a specific department on a specific date
 */
router.get('/department/:departmentId/date/:date', async (req: Request, res: Response) => {
  try {
    const { departmentId: departmentIdParam, date } = req.params;

    // Validate required parameters
    if (!departmentIdParam || !date) {
      return res.status(400).json({
        success: false,
        data: null,
        errors: ['Department ID and date are required']
      });
    }

    const departmentId = parseInt(departmentIdParam);

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        data: null,
        errors: ['Invalid date format. Use YYYY-MM-DD']
      });
    }

    if (isNaN(departmentId)) {
      return res.status(400).json({
        success: false,
        data: null,
        errors: ['Invalid department ID']
      });
    }

    const departmentStaffing = await staffingAlertService.calculateDepartmentStaffing(departmentId, date);

    return res.json({
      success: true,
      data: departmentStaffing,
      message: `Staffing information for department ${departmentStaffing.department.name} on ${date}`
    });
  } catch (error) {
    console.error('Error getting department staffing:', error);
    return res.status(500).json({
      success: false,
      data: null,
      errors: ['Error calculating department staffing']
    });
  }
});

/**
 * GET /api/staffing-alerts/daily-overview/:date
 * Get complete daily staffing overview for all departments
 */
router.get('/daily-overview/:date', async (req: Request, res: Response) => {
  try {
    const date = req.params.date!;

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!date || !dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        data: null,
        errors: ['Invalid date format. Use YYYY-MM-DD']
      });
    }

    const dailyOverview = await staffingAlertService.getDailyStaffingOverview(date);

    return res.json({
      success: true,
      data: dailyOverview,
      message: `Daily staffing overview for ${date}`
    });
  } catch (error) {
    console.error('Error getting daily staffing overview:', error);
    return res.status(500).json({
      success: false,
      data: null,
      errors: ['Error getting daily staffing overview']
    });
  }
});

/**
 * POST /api/staffing-alerts/generate/:date
 * Generate staffing alerts for a specific date
 */
router.post('/generate/:date', async (req: Request, res: Response) => {
  try {
    const date = req.params.date!;

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!date || !dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        data: null,
        errors: ['Invalid date format. Use YYYY-MM-DD']
      });
    }

    const alerts = await staffingAlertService.generateStaffingAlerts(date);

    return res.json({
      success: true,
      data: {
        date,
        alerts_generated: alerts.length,
        alerts
      },
      message: `Generated ${alerts.length} staffing alerts for ${date}`
    });
  } catch (error) {
    console.error('Error generating staffing alerts:', error);
    return res.status(500).json({
      success: false,
      data: null,
      errors: ['Error generating staffing alerts']
    });
  }
});

/**
 * GET /api/staffing-alerts/alerts/:date
 * Get all staffing alerts for a specific date
 */
router.get('/alerts/:date', async (req: Request, res: Response) => {
  try {
    const date = req.params.date!;

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!date || !dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        data: null,
        errors: ['Invalid date format. Use YYYY-MM-DD']
      });
    }

    // Get all alerts for this date
    const alertsQuery = `
      SELECT sa.*, d.name as department_name
      FROM staffing_alerts sa
      JOIN departments d ON sa.department_id = d.id
      WHERE sa.alert_date = ?
      ORDER BY sa.alert_type DESC, sa.start_time, d.name
    `;

    const { database } = await import('@/utils/database');
    const alerts = await database.query(alertsQuery, [date]);

    return res.json({
      success: true,
      data: {
        date,
        total_alerts: alerts.length,
        critical_alerts: alerts.filter((a: any) => a.alert_type === 'Critical').length,
        low_staff_alerts: alerts.filter((a: any) => a.alert_type === 'Low Staff').length,
        alerts
      },
      message: `Found ${alerts.length} staffing alerts for ${date}`
    });
  } catch (error) {
    console.error('Error getting staffing alerts:', error);
    return res.status(500).json({
      success: false,
      data: null,
      errors: ['Error getting staffing alerts']
    });
  }
});

/**
 * DELETE /api/staffing-alerts/alerts/:alertId
 * Delete a specific staffing alert
 */
router.delete('/alerts/:alertId', async (req: Request, res: Response) => {
  try {
    const alertId = parseInt(req.params.alertId!);

    if (isNaN(alertId)) {
      return res.status(400).json({
        success: false,
        data: null,
        errors: ['Invalid alert ID']
      });
    }

    const { database } = await import('@/utils/database');
    
    // Check if alert exists
    const checkQuery = 'SELECT id FROM staffing_alerts WHERE id = ?';
    const existing = await database.query(checkQuery, [alertId]);
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        errors: ['Staffing alert not found']
      });
    }

    // Delete the alert
    const deleteQuery = 'DELETE FROM staffing_alerts WHERE id = ?';
    await database.query(deleteQuery, [alertId]);

    return res.json({
      success: true,
      data: { deleted_alert_id: alertId },
      message: 'Staffing alert deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting staffing alert:', error);
    return res.status(500).json({
      success: false,
      data: null,
      errors: ['Error deleting staffing alert']
    });
  }
});

/**
 * GET /api/staffing-alerts/summary/:date
 * Get staffing summary statistics for a specific date
 */
router.get('/summary/:date', async (req: Request, res: Response) => {
  try {
    const date = req.params.date!;

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!date || !dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        data: null,
        errors: ['Invalid date format. Use YYYY-MM-DD']
      });
    }

    const { database } = await import('@/utils/database');
    
    // Get summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(DISTINCT d.id) as total_departments,
        COUNT(DISTINCT CASE WHEN sa.alert_type = 'Critical' THEN sa.department_id END) as critical_departments,
        COUNT(DISTINCT CASE WHEN sa.alert_type = 'Low Staff' THEN sa.department_id END) as low_staff_departments,
        COUNT(CASE WHEN sa.alert_type = 'Critical' THEN 1 END) as total_critical_alerts,
        COUNT(CASE WHEN sa.alert_type = 'Low Staff' THEN 1 END) as total_low_staff_alerts
      FROM departments d
      LEFT JOIN staffing_alerts sa ON d.id = sa.department_id AND sa.alert_date = ?
    `;

    const summary = await database.query(summaryQuery, [date]);
    const stats = summary[0];

    return res.json({
      success: true,
      data: {
        date,
        total_departments: stats.total_departments,
        departments_with_adequate_staffing: stats.total_departments - stats.critical_departments - stats.low_staff_departments,
        departments_with_low_staffing: stats.low_staff_departments,
        departments_with_critical_staffing: stats.critical_departments,
        total_alerts: stats.total_critical_alerts + stats.total_low_staff_alerts,
        critical_alerts: stats.total_critical_alerts,
        low_staff_alerts: stats.total_low_staff_alerts
      },
      message: `Staffing summary for ${date}`
    });
  } catch (error) {
    console.error('Error getting staffing summary:', error);
    return res.status(500).json({
      success: false,
      data: null,
      errors: ['Error getting staffing summary']
    });
  }
});

export default router;
