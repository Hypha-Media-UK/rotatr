// Database Entity Types
export interface Department {
  id: number
  name: string
  is_24_7: boolean
  default_porters_required: number
  created_at: Date
  updated_at: Date
}

export interface DepartmentSchedule {
  id: number
  department_id: number
  day_of_week: string
  opens_at: string
  closes_at: string
  porters_required: number
}

export interface Porter {
  id: number
  name: string
  shift_type: string
  shift_offset_days: number
  regular_department_id?: number
  is_floor_staff: boolean
  porter_type: 'Porter' | 'Supervisor'
  guaranteed_hours?: number
  created_at: Date
  updated_at: Date
}

export interface PorterContractedHours {
  id: number
  porter_id: number
  day_of_week: string
  start_time: string
  end_time: string
}

export interface Shift {
  id: number
  name: string
  start_time: string
  end_time: string
  shift_type: 'Day' | 'Night'
  shift_ident: 'A' | 'B' | 'C' | 'D'
  days_on: number
  days_off: number
  offset_days: number
  ground_zero: Date
  created_at: Date
  updated_at: Date
}

export interface Absence {
  id: number
  porter_id: number
  start_date: Date
  end_date: Date
  absence_type: 'Annual Leave' | 'Sickness' | 'Appointment'
  start_time?: string
  end_time?: string
  notes?: string
}

export interface TemporaryAssignment {
  id: number
  porter_id: number
  department_id: number
  assignment_date: Date
  start_time: string
  end_time: string
  assignment_type: 'Floor Staff' | 'Relief Cover'
}

export interface ReliefAssignment {
  id: number
  porter_id: number
  department_id?: number
  shift_id?: number
  start_date: Date
  end_date: Date
  assignment_type: 'Department' | 'Shift'
}

export interface StaffingAlert {
  id: number
  department_id: number
  alert_date: Date
  start_time: string
  end_time: string
  required_porters: number
  available_porters: number
  alert_type: 'Low Staff' | 'Critical'
}

// API Request/Response Types
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  errors?: string[]
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateDepartmentRequest {
  name: string
  is_24_7: boolean
  default_porters_required: number
  schedules?: CreateDepartmentScheduleRequest[]
}

export interface CreateDepartmentScheduleRequest {
  day_of_week: string
  opens_at: string
  closes_at: string
  porters_required: number
}

export interface CreatePorterRequest {
  name: string
  shift_type: string
  shift_offset_days: number
  regular_department_id?: number
  is_floor_staff: boolean
  porter_type: 'Porter' | 'Supervisor'
  guaranteed_hours?: number
  contracted_hours?: CreatePorterContractedHoursRequest[]
}

export interface CreatePorterContractedHoursRequest {
  day_of_week: string
  start_time: string
  end_time: string
}

export interface CreateShiftRequest {
  name: string
  start_time: string
  end_time: string
  shift_type: 'Day' | 'Night'
  shift_ident: 'A' | 'B' | 'C' | 'D'
  days_on: number
  days_off: number
  offset_days: number
  ground_zero: string
}

export interface CreateTemporaryAssignmentRequest {
  porter_id: number
  department_id: number
  assignment_date: string
  start_time: string
  end_time: string
  assignment_type: 'Floor Staff' | 'Relief Cover'
}

export interface CreateReliefAssignmentRequest {
  porter_id: number
  department_id?: number
  shift_id?: number
  start_date: string
  end_date: string
  assignment_type: 'Department' | 'Shift'
}

// Business Logic Types
export interface PorterAvailability {
  porter: Porter
  isWorking: boolean
  isAvailable: boolean
  conflictReason?: string
  workingHours: {
    start: string
    end: string
  }
}

export interface DepartmentStaffing {
  department: Department
  date: string
  requiredPorters: number
  availablePorters: PorterAvailability[]
  temporaryAssignments: TemporaryAssignment[]
  staffingLevel: 'Adequate' | 'Low' | 'Critical'
  alerts: StaffingAlert[]
}

export interface DailyStaffingOverview {
  date: string
  dayShift: {
    floorStaff: PorterAvailability[]
    departments: DepartmentStaffing[]
  }
  nightShift: {
    floorStaff: PorterAvailability[]
    departments: DepartmentStaffing[]
  }
  alerts: StaffingAlert[]
}

// Database Connection Types
export interface DatabaseConfig {
  host: string
  port: number
  user: string
  password: string
  database: string
  connectionLimit?: number
  acquireTimeout?: number
  timeout?: number
  ssl?: {
    rejectUnauthorized?: boolean
  }
}

// Utility Types
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'
export type ShiftType = 'Day' | 'Night'
export type ShiftIdent = 'A' | 'B' | 'C' | 'D'
export type PorterType = 'Porter' | 'Supervisor'
export type AbsenceType = 'Annual Leave' | 'Sickness' | 'Appointment'
export type AssignmentType = 'Floor Staff' | 'Relief Cover' | 'Department' | 'Shift'
export type AlertType = 'Low Staff' | 'Critical'
export type StaffingLevel = 'Adequate' | 'Low' | 'Critical'

// Express Request Extensions
declare global {
  namespace Express {
    interface Request {
      user?: any // For future authentication
    }
  }
}
