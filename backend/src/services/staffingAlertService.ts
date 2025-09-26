// @ts-nocheck
import { initializeDatabase } from '@/utils/database';
import { shiftCalculationService } from './shiftCalculationService';
import { daysBetween, timeToMinutes, calculateTimeOverlap } from '@/utils/dateHelpers';
import { 
  StaffingAlert, 
  Department, 
  DepartmentStaffing, 
  PorterAvailability,
  DailyStaffingOverview,
  StaffingLevel 
} from '@/types';

export class StaffingAlertService {
  /**
   * Calculate staffing levels for a specific department on a specific date
   */
  async calculateDepartmentStaffing(departmentId: number, date: string): Promise<DepartmentStaffing> {
    // Get department information
    const department = await this.getDepartmentById(departmentId);
    if (!department) {
      throw new Error(`Department with ID ${departmentId} not found`);
    }

    // Get required porters for this date/time
    const requiredPorters = await this.getRequiredPortersForDepartment(department, date);
    
    // Get available porters (working + assigned to this department)
    const availablePorters = await this.getAvailablePortersForDepartment(departmentId, date);
    
    // Get temporary assignments for this department on this date
    const temporaryAssignments = await this.getTemporaryAssignments(departmentId, date);
    
    // Calculate staffing level
    const staffingLevel = this.calculateStaffingLevel(requiredPorters, availablePorters.length);
    
    // Get existing alerts for this department and date
    const alerts = await this.getAlertsForDepartment(departmentId, date);

    return {
      department,
      date,
      requiredPorters,
      availablePorters,
      temporaryAssignments,
      staffingLevel,
      alerts
    };
  }

  /**
   * Generate staffing alerts for low staffing situations
   */
  async generateStaffingAlerts(date: string): Promise<StaffingAlert[]> {
    const alerts: StaffingAlert[] = [];
    
    // Get all departments
    const departments = await this.getAllDepartments();
    
    for (const department of departments) {
      const departmentStaffing = await this.calculateDepartmentStaffing(department.id, date);
      
      // Check if we need to create alerts
      if (departmentStaffing.staffingLevel === 'Low' || departmentStaffing.staffingLevel === 'Critical') {
        const alert = await this.createStaffingAlert(departmentStaffing);
        if (alert) {
          alerts.push(alert);
        }
      }
    }
    
    return alerts;
  }

  /**
   * Get daily staffing overview for all departments
   */
  async getDailyStaffingOverview(date: string): Promise<DailyStaffingOverview> {
    // Get day shift floor staff (working 08:00-20:00)
    const dayFloorStaff = await this.getFloorStaffForShift(date, 'Day');
    
    // Get night shift floor staff (working 20:00-08:00)
    const nightFloorStaff = await this.getFloorStaffForShift(date, 'Night');
    
    // Get department staffing for all departments
    const departments = await this.getAllDepartments();
    const dayDepartments: DepartmentStaffing[] = [];
    const nightDepartments: DepartmentStaffing[] = [];
    
    for (const department of departments) {
      const staffing = await this.calculateDepartmentStaffing(department.id, date);
      
      if (department.is_24_7) {
        // 24/7 departments appear in both shifts
        dayDepartments.push(staffing);
        nightDepartments.push(staffing);
      } else {
        // Non-24/7 departments only appear in day shift
        dayDepartments.push(staffing);
      }
    }
    
    // Get all alerts for this date
    const alerts = await this.getAllAlertsForDate(date);

    return {
      date,
      dayShift: {
        floorStaff: dayFloorStaff,
        departments: dayDepartments
      },
      nightShift: {
        floorStaff: nightFloorStaff,
        departments: nightDepartments
      },
      alerts
    };
  }

  /**
   * Calculate staffing level based on required vs available porters
   */
  private calculateStaffingLevel(required: number, available: number): StaffingLevel {
    const ratio = available / required;
    
    if (ratio >= 1.0) {
      return 'Adequate';
    } else if (ratio >= 0.5) {
      return 'Low';
    } else {
      return 'Critical';
    }
  }

  /**
   * Create a staffing alert for low staffing situations
   */
  private async createStaffingAlert(departmentStaffing: DepartmentStaffing): Promise<StaffingAlert | null> {
    const { department, date, requiredPorters, availablePorters, staffingLevel } = departmentStaffing;
    
    // Determine alert type
    const alertType = staffingLevel === 'Critical' ? 'Critical' : 'Low Staff';
    
    // For 24/7 departments, create alerts for both day and night shifts
    // For non-24/7 departments, create alerts based on their schedules
    const timeSlots = department.is_24_7 
      ? [{ start: '08:00:00', end: '20:00:00' }, { start: '20:00:00', end: '08:00:00' }]
      : await this.getDepartmentTimeSlots(department.id, date);
    
    let alert: StaffingAlert | null = null;
    
    for (const timeSlot of timeSlots) {
      // Check if alert already exists for this time slot
      const existingAlert = await this.getExistingAlert(department.id, date, timeSlot.start);
      
      if (!existingAlert) {
        // Create new alert
        const insertQuery = `
          INSERT INTO staffing_alerts 
          (department_id, alert_date, start_time, end_time, required_porters, available_porters, alert_type)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        const result = await database.query(insertQuery, [
          department.id,
          date,
          timeSlot.start,
          timeSlot.end,
          requiredPorters,
          availablePorters.length,
          alertType
        ]);
        
        alert = {
          id: (result as any).insertId,
          department_id: department.id,
          alert_date: new Date(date),
          start_time: timeSlot.start,
          end_time: timeSlot.end,
          required_porters: requiredPorters,
          available_porters: availablePorters.length,
          alert_type: alertType as 'Low Staff' | 'Critical'
        };
      }
    }
    
    return alert;
  }

  /**
   * Get department by ID
   */
  private async getDepartmentById(id: number): Promise<Department | null> {
    const query = 'SELECT * FROM departments WHERE id = ?';
    const results = await database.query(query, [id]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Get all departments
   */
  private async getAllDepartments(): Promise<Department[]> {
    const query = 'SELECT * FROM departments ORDER BY name';
    return await database.query(query);
  }

  /**
   * Get required porters for a department on a specific date
   */
  private async getRequiredPortersForDepartment(department: Department, date: string): Promise<number> {
    if (department.is_24_7) {
      return department.default_porters_required;
    }
    
    // For non-24/7 departments, check their schedule
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    const scheduleQuery = `
      SELECT porters_required 
      FROM department_schedules 
      WHERE department_id = ? AND day_of_week = ?
    `;
    
    const schedules = await database.query(scheduleQuery, [department.id, dayOfWeek]);
    return schedules.length > 0 ? schedules[0].porters_required : department.default_porters_required;
  }

  /**
   * Get available porters for a department on a specific date
   */
  private async getAvailablePortersForDepartment(departmentId: number, date: string): Promise<PorterAvailability[]> {
    // Get porters assigned to this department
    const porterQuery = `
      SELECT * FROM porters 
      WHERE regular_department_id = ? OR is_floor_staff = 1
    `;
    
    const porters = await database.query(porterQuery, [departmentId]);
    const availablePorters: PorterAvailability[] = [];
    
    for (const porter of porters) {
      const isWorking = await shiftCalculationService.isPorterWorkingOnDate(porter, date);
      
      if (isWorking) {
        // Check if porter has any conflicts (absences, other assignments)
        const availability = await shiftCalculationService.getPorterAvailability(porter, date);
        
        if (availability.isAvailable) {
          availablePorters.push(availability);
        }
      }
    }
    
    return availablePorters;
  }

  /**
   * Get temporary assignments for a department on a specific date
   */
  private async getTemporaryAssignments(departmentId: number, date: string) {
    const query = `
      SELECT ta.*, p.name as porter_name
      FROM temporary_assignments ta
      JOIN porters p ON ta.porter_id = p.id
      WHERE ta.department_id = ? AND ta.assignment_date = ?
    `;
    
    return await database.query(query, [departmentId, date]);
  }

  /**
   * Get alerts for a specific department and date
   */
  private async getAlertsForDepartment(departmentId: number, date: string): Promise<StaffingAlert[]> {
    const query = `
      SELECT * FROM staffing_alerts 
      WHERE department_id = ? AND alert_date = ?
      ORDER BY start_time
    `;
    
    return await database.query(query, [departmentId, date]);
  }

  /**
   * Get all alerts for a specific date
   */
  private async getAllAlertsForDate(date: string): Promise<StaffingAlert[]> {
    const query = `
      SELECT sa.*, d.name as department_name
      FROM staffing_alerts sa
      JOIN departments d ON sa.department_id = d.id
      WHERE sa.alert_date = ?
      ORDER BY sa.alert_type DESC, sa.start_time
    `;
    
    return await database.query(query, [date]);
  }

  /**
   * Get floor staff working on a specific shift
   */
  private async getFloorStaffForShift(date: string, shiftType: 'Day' | 'Night'): Promise<PorterAvailability[]> {
    const porterQuery = `
      SELECT * FROM porters 
      WHERE is_floor_staff = 1 AND shift_type LIKE ?
    `;
    
    const porters = await database.query(porterQuery, [`${shiftType}%`]);
    const floorStaff: PorterAvailability[] = [];
    
    for (const porter of porters) {
      const isWorking = await shiftCalculationService.isPorterWorkingOnDate(porter, date);
      
      if (isWorking) {
        const availability = await shiftCalculationService.getPorterAvailability(porter, date);
        floorStaff.push(availability);
      }
    }
    
    return floorStaff;
  }

  /**
   * Get department time slots for non-24/7 departments
   */
  private async getDepartmentTimeSlots(departmentId: number, date: string) {
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    const query = `
      SELECT opens_at as start, closes_at as end
      FROM department_schedules 
      WHERE department_id = ? AND day_of_week = ?
    `;
    
    const schedules = await database.query(query, [departmentId, dayOfWeek]);
    return schedules.length > 0 ? schedules : [{ start: '08:00:00', end: '17:00:00' }];
  }

  /**
   * Check if alert already exists for a specific time slot
   */
  private async getExistingAlert(departmentId: number, date: string, startTime: string) {
    const query = `
      SELECT * FROM staffing_alerts 
      WHERE department_id = ? AND alert_date = ? AND start_time = ?
    `;
    
    const results = await database.query(query, [departmentId, date, startTime]);
    return results.length > 0 ? results[0] : null;
  }
}

export const staffingAlertService = new StaffingAlertService();
