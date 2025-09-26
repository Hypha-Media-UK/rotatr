// @ts-nocheck
import { database } from '@/utils/database';
import { daysBetween } from '@/utils/dateHelpers';
import { Porter, Shift, PorterAvailability } from '@/types';

/**
 * Service for calculating porter availability based on shift cycles and offsets
 */
export class ShiftCalculationService {
  
  /**
   * Calculate if a porter is working on a specific date based on their shift cycle
   * @param porter - The porter to check
   * @param targetDate - The date to check (YYYY-MM-DD format)
   * @returns Promise<boolean> - True if the porter is working on that date
   */
  async isPorterWorkingOnDate(porter: Porter, targetDate: string): Promise<boolean> {
    try {
      // Get the shift pattern for this porter's shift type
      const shift = await this.getShiftByType(porter.shift_type);
      if (!shift) {
        console.warn(`No shift pattern found for porter ${porter.name} with shift type: ${porter.shift_type}`);
        return false;
      }

      // Calculate days since ground zero using helper function
      const daysSinceGroundZero = daysBetween(shift.ground_zero, targetDate);

      // Apply the porter's individual offset
      const adjustedDays = daysSinceGroundZero - porter.shift_offset_days;

      // Calculate position in the shift cycle
      const cycleLength = shift.days_on + shift.days_off;
      const cyclePosition = adjustedDays % cycleLength;

      // Porter is working if they're within the "days on" period of their cycle
      // Handle negative cycle positions (before their cycle starts)
      if (cyclePosition < 0) {
        const normalizedPosition = cyclePosition + cycleLength;
        return normalizedPosition >= 0 && normalizedPosition < shift.days_on;
      }

      return cyclePosition >= 0 && cyclePosition < shift.days_on;
    } catch (error) {
      console.error('Error calculating porter availability:', error);
      return false;
    }
  }

  /**
   * Get shift pattern by shift type (e.g., "Day A", "Night B")
   * @param shiftType - The shift type string
   * @returns Promise<Shift | null> - The matching shift pattern or null
   */
  async getShiftByType(shiftType: string): Promise<Shift | null> {
    try {
      // Parse shift type (e.g., "Day A" -> type="Day", ident="A")
      const parts = shiftType.trim().split(' ');
      if (parts.length !== 2) {
        console.warn(`Invalid shift type format: ${shiftType}. Expected format: "Day A" or "Night B"`);
        return null;
      }

      const [type, ident] = parts;
      
      const query = `
        SELECT 
          id, name, start_time, end_time, shift_type, shift_ident,
          days_on, days_off, offset_days, ground_zero, created_at, updated_at
        FROM shifts 
        WHERE shift_type = ? AND shift_ident = ?
      `;

      const shifts = await database.query<Shift>(query, [type, ident]);
      return shifts.length > 0 ? shifts[0] : null;
    } catch (error) {
      console.error('Error fetching shift by type:', error);
      return null;
    }
  }

  /**
   * Get all porters working on a specific date
   * @param targetDate - The date to check (YYYY-MM-DD format)
   * @returns Promise<Porter[]> - Array of porters working on that date
   */
  async getPortersWorkingOnDate(targetDate: string): Promise<Porter[]> {
    try {
      // Get all porters
      const query = `
        SELECT 
          p.id, p.name, p.shift_type, p.shift_offset_days, p.regular_department_id,
          p.is_floor_staff, p.porter_type, p.guaranteed_hours, p.created_at, p.updated_at,
          d.name as department_name
        FROM porters p
        LEFT JOIN departments d ON p.regular_department_id = d.id
        ORDER BY p.name
      `;

      const allPorters = await database.query<Porter>(query);
      const workingPorters: Porter[] = [];

      // Check each porter's availability
      for (const porter of allPorters) {
        const isWorking = await this.isPorterWorkingOnDate(porter, targetDate);
        if (isWorking) {
          workingPorters.push(porter);
        }
      }

      return workingPorters;
    } catch (error) {
      console.error('Error getting porters working on date:', error);
      return [];
    }
  }

  /**
   * Get porter availability with detailed information
   * @param porter - The porter to check
   * @param targetDate - The date to check (YYYY-MM-DD format)
   * @returns Promise<PorterAvailability> - Detailed availability information
   */
  async getPorterAvailability(porter: Porter, targetDate: string): Promise<PorterAvailability> {
    try {
      const isWorking = await this.isPorterWorkingOnDate(porter, targetDate);
      const shift = await this.getShiftByType(porter.shift_type);

      // Check for absences on this date
      const absenceQuery = `
        SELECT id, absence_type, start_time, end_time, notes
        FROM absences 
        WHERE porter_id = ? 
        AND start_date <= ? 
        AND end_date >= ?
      `;

      const absences = await database.query(absenceQuery, [porter.id, targetDate, targetDate]);
      const hasAbsence = absences.length > 0;

      let conflictReason: string | undefined;
      if (hasAbsence) {
        const absence = absences[0];
        conflictReason = `${absence.absence_type}${absence.notes ? ` - ${absence.notes}` : ''}`;
      }

      return {
        porter,
        isWorking,
        isAvailable: isWorking && !hasAbsence,
        conflictReason,
        workingHours: {
          start: shift?.start_time || '00:00:00',
          end: shift?.end_time || '00:00:00'
        }
      };
    } catch (error) {
      console.error('Error getting porter availability:', error);
      return {
        porter,
        isWorking: false,
        isAvailable: false,
        conflictReason: 'Error calculating availability',
        workingHours: {
          start: '00:00:00',
          end: '00:00:00'
        }
      };
    }
  }

  /**
   * Get all porter availabilities for a specific date
   * @param targetDate - The date to check (YYYY-MM-DD format)
   * @returns Promise<PorterAvailability[]> - Array of porter availabilities
   */
  async getAllPorterAvailabilities(targetDate: string): Promise<PorterAvailability[]> {
    try {
      // Get all porters
      const query = `
        SELECT 
          p.id, p.name, p.shift_type, p.shift_offset_days, p.regular_department_id,
          p.is_floor_staff, p.porter_type, p.guaranteed_hours, p.created_at, p.updated_at,
          d.name as department_name
        FROM porters p
        LEFT JOIN departments d ON p.regular_department_id = d.id
        ORDER BY p.name
      `;

      const allPorters = await database.query<Porter>(query);
      const availabilities: PorterAvailability[] = [];

      // Get availability for each porter
      for (const porter of allPorters) {
        const availability = await this.getPorterAvailability(porter, targetDate);
        availabilities.push(availability);
      }

      return availabilities;
    } catch (error) {
      console.error('Error getting all porter availabilities:', error);
      return [];
    }
  }

  /**
   * Calculate the next working day for a porter
   * @param porter - The porter to check
   * @param fromDate - The date to start checking from (YYYY-MM-DD format)
   * @param maxDaysToCheck - Maximum number of days to check ahead (default: 30)
   * @returns Promise<string | null> - The next working date or null if none found
   */
  async getNextWorkingDay(porter: Porter, fromDate: string, maxDaysToCheck: number = 30): Promise<string | null> {
    try {
      const startDate = new Date(fromDate);
      
      for (let i = 1; i <= maxDaysToCheck; i++) {
        const checkDate = new Date(startDate);
        checkDate.setDate(startDate.getDate() + i);
        const checkDateStr = checkDate.toISOString().split('T')[0];
        
        const isWorking = await this.isPorterWorkingOnDate(porter, checkDateStr);
        if (isWorking) {
          return checkDateStr;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error calculating next working day:', error);
      return null;
    }
  }

  /**
   * Get porter's working days for a date range
   * @param porter - The porter to check
   * @param startDate - Start date (YYYY-MM-DD format)
   * @param endDate - End date (YYYY-MM-DD format)
   * @returns Promise<string[]> - Array of working dates
   */
  async getWorkingDaysInRange(porter: Porter, startDate: string, endDate: string): Promise<string[]> {
    try {
      const workingDays: string[] = [];
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        const isWorking = await this.isPorterWorkingOnDate(porter, dateStr);
        if (isWorking) {
          workingDays.push(dateStr);
        }
      }
      
      return workingDays;
    } catch (error) {
      console.error('Error getting working days in range:', error);
      return [];
    }
  }
}

// Export singleton instance
export const shiftCalculationService = new ShiftCalculationService();
