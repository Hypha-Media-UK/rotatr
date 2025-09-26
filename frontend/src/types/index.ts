// Core Entity Types
export interface Department {
  id: number
  name: string
  is_24_7: boolean
  default_porters_required: number
  created_at: string
  updated_at: string
  schedules?: DepartmentSchedule[]
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
  created_at: string
  updated_at: string
  contracted_hours?: PorterContractedHours[]
  absences?: Absence[]
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
  shift_type: 'Day' | 'Night' | 'Relief'
  shift_ident: 'A' | 'B' | 'C' | 'D' | 'R'
  days_on: number
  days_off: number
  offset_days: number
  ground_zero: string
  created_at: string
  updated_at: string
}

export interface Absence {
  id: number
  porter_id: number
  start_date: string
  end_date: string
  absence_type: 'Annual Leave' | 'Sickness' | 'Appointment'
  start_time?: string
  end_time?: string
  notes?: string
}

export interface TemporaryAssignment {
  id: number
  porter_id: number
  department_id: number
  assignment_date: string
  start_time: string
  end_time: string
  assignment_type: 'Floor Staff' | 'Relief Cover'
}

export interface ReliefAssignment {
  id: number
  porter_id: number
  department_id?: number
  shift_id?: number
  start_date: string
  end_date: string
  assignment_type: 'Department' | 'Shift'
}

export interface StaffingAlert {
  id: number
  department_id: number
  alert_date: string
  start_time: string
  end_time: string
  required_porters: number
  available_porters: number
  alert_type: 'Low Staff' | 'Critical'
}

// API Response Types
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

// Form Types
export interface DepartmentForm {
  name: string
  is_24_7: boolean
  default_porters_required: number
  schedules: DepartmentScheduleForm[]
}

export interface DepartmentScheduleForm {
  day_of_week: string
  opens_at: string
  closes_at: string
  porters_required: number
}

export interface PorterForm {
  name: string
  shift_type: string
  shift_offset_days: number
  regular_department_id?: number
  is_floor_staff: boolean
  porter_type: 'Porter' | 'Supervisor'
  guaranteed_hours?: number
  contracted_hours: PorterContractedHoursForm[]
}

export interface PorterContractedHoursForm {
  day_of_week: string
  start_time: string
  end_time: string
}

export interface ShiftForm {
  name: string
  start_time: string
  end_time: string
  shift_type: 'Day' | 'Night' | 'Relief'
  shift_ident: 'A' | 'B' | 'C' | 'D' | 'R'
  days_on: number
  days_off: number
  offset_days: number
  ground_zero: string
}

// UI State Types
export interface DashboardState {
  selectedDate: string
  selectedWeek: number
  departments: Department[]
  porters: Porter[]
  shifts: Shift[]
  staffingAlerts: StaffingAlert[]
  temporaryAssignments: TemporaryAssignment[]
}

export interface ConfigureState {
  activeTab: 'departments' | 'porters' | 'shifts'
  showModal: boolean
  modalType: 'add' | 'edit'
  selectedItem: any
}

// Utility Types
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'

export type ShiftType = 'Day' | 'Night' | 'Relief'

export type ShiftIdent = 'A' | 'B' | 'C' | 'D' | 'R'

export type PorterType = 'Porter' | 'Supervisor'

export type AbsenceType = 'Annual Leave' | 'Sickness' | 'Appointment'

export type AssignmentType = 'Floor Staff' | 'Relief Cover' | 'Department' | 'Shift'

export type AlertType = 'Low Staff' | 'Critical'

// Calculation Types
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
