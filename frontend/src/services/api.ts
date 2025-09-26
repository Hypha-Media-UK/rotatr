// API Service for Porter Shift Management System
const API_BASE_URL = 'http://localhost:3001/api'

// Types
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface Department {
  id: number
  name: string
  is_24_7: boolean
  default_porters_required: number
}

export interface Porter {
  id: number
  first_name: string
  last_name: string
  shift_type: string
  shift_offset_days: number
  department_id: number
  department_name: string
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
  ground_zero: string
  created_at: string
  updated_at: string
}

export interface TemporaryAssignment {
  id: number
  porter_id: number
  department_id: number
  assignment_date: string
  start_time: string
  end_time: string
  assignment_type: 'Floor Staff' | 'Relief Cover'
  porter_name: string
  department_name: string
  created_at: string
  updated_at: string
}

export interface PorterAvailability {
  porter: {
    id: number
    name: string
    shift_type: string
    shift_offset_days: number
    regular_department_id: number
    is_floor_staff: boolean
    porter_type: string
    department_name?: string
  }
  isWorking: boolean
  isAvailable: boolean
  conflictReason?: string
  workingHours: {
    start: string
    end: string
  }
}

export interface StaffingAlert {
  id: number
  department_id: number
  department_name: string
  alert_date: string
  start_time: string
  end_time: string
  required_porters: number
  available_porters: number
  alert_type: 'Low Staff' | 'Critical'
}

export interface DepartmentStaffing {
  department_id: number
  department_name: string
  required_porters: number
  available_porters: number
  floor_staff: number
  staffing_level: 'Adequate' | 'Low' | 'Critical'
}

export interface DailyStaffingOverview {
  date: string
  day_shift_floor_staff: number
  night_shift_floor_staff: number
  day_shift_departments: number
  night_shift_departments: number
  total_alerts: number
}

// API Client Class
class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`${this.baseUrl.replace('/api', '')}/health`)
    return response.json()
  }

  // Department APIs
  async getDepartments(): Promise<ApiResponse<Department[]>> {
    return this.request<Department[]>('/departments')
  }

  async getDepartment(id: number): Promise<ApiResponse<Department>> {
    return this.request<Department>(`/departments/${id}`)
  }

  async createDepartment(department: Omit<Department, 'id'>): Promise<ApiResponse<Department>> {
    return this.request<Department>('/departments', {
      method: 'POST',
      body: JSON.stringify(department),
    })
  }

  async updateDepartment(id: number, department: Partial<Department>): Promise<ApiResponse<Department>> {
    return this.request<Department>(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(department),
    })
  }

  async deleteDepartment(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/departments/${id}`, {
      method: 'DELETE',
    })
  }

  async createPorter(porter: Omit<Porter, 'id'>): Promise<ApiResponse<Porter>> {
    return this.request<Porter>('/porters', {
      method: 'POST',
      body: JSON.stringify(porter),
    })
  }

  async updatePorter(id: number, porter: Partial<Porter>): Promise<ApiResponse<Porter>> {
    return this.request<Porter>(`/porters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(porter),
    })
  }

  async deletePorter(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/porters/${id}`, {
      method: 'DELETE',
    })
  }

  async getShifts(): Promise<ApiResponse<Shift[]>> {
    return this.request<Shift[]>('/shifts')
  }

  async createShift(shift: Omit<Shift, 'id'>): Promise<ApiResponse<Shift>> {
    return this.request<Shift>('/shifts', {
      method: 'POST',
      body: JSON.stringify(shift),
    })
  }

  async updateShift(id: number, shift: Partial<Shift>): Promise<ApiResponse<Shift>> {
    return this.request<Shift>(`/shifts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(shift),
    })
  }

  async deleteShift(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/shifts/${id}`, {
      method: 'DELETE',
    })
  }

  async getTemporaryAssignments(date?: string, departmentId?: number, porterId?: number): Promise<ApiResponse<TemporaryAssignment[]>> {
    const params = new URLSearchParams()
    if (date) params.append('date', date)
    if (departmentId) params.append('department_id', departmentId.toString())
    if (porterId) params.append('porter_id', porterId.toString())

    const queryString = params.toString()
    const url = `/assignments${queryString ? `?${queryString}` : ''}`

    return this.request<TemporaryAssignment[]>(url)
  }

  async createTemporaryAssignment(assignment: Omit<TemporaryAssignment, 'id'>): Promise<ApiResponse<TemporaryAssignment>> {
    return this.request<TemporaryAssignment>('/assignments', {
      method: 'POST',
      body: JSON.stringify(assignment),
    })
  }

  async deleteTemporaryAssignment(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/assignments/${id}`, {
      method: 'DELETE',
    })
  }

  async getPorterAvailability(date: string, shiftType?: string): Promise<ApiResponse<PorterAvailability[]>> {
    const params = new URLSearchParams()
    params.append('date', date)
    if (shiftType) params.append('shift_type', shiftType)

    const queryString = params.toString()
    return this.request<PorterAvailability[]>(`/porter-availability?${queryString}`)
  }

  // Porter APIs
  async getPorters(): Promise<ApiResponse<Porter[]>> {
    return this.request<Porter[]>('/porters')
  }

  // Staffing Alert APIs
  async getStaffingAlerts(date: string): Promise<ApiResponse<StaffingAlert[]>> {
    return this.request<StaffingAlert[]>(`/staffing-alerts/alerts/${date}`)
  }

  async generateStaffingAlerts(date: string): Promise<ApiResponse<StaffingAlert[]>> {
    return this.request<StaffingAlert[]>(`/staffing-alerts/generate/${date}`, {
      method: 'POST',
    })
  }

  async getDailyStaffingOverview(date: string): Promise<ApiResponse<DailyStaffingOverview>> {
    return this.request<DailyStaffingOverview>(`/staffing-alerts/daily-overview/${date}`)
  }

  async getDepartmentStaffing(
    departmentId: number,
    date: string
  ): Promise<ApiResponse<DepartmentStaffing>> {
    return this.request<DepartmentStaffing>(
      `/staffing-alerts/department/${departmentId}/date/${date}`
    )
  }

  async resolveAlert(alertId: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/staffing-alerts/alerts/${alertId}`, {
      method: 'DELETE',
    })
  }

  // Shift Calculation APIs (when routes are enabled)
  async getPorterShiftCalculation(
    porterId: number,
    date: string
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/shift-calculations/porter/${porterId}/date/${date}`)
  }

  async getDepartmentAvailability(
    departmentId: number,
    date: string
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/shift-calculations/department/${departmentId}/date/${date}`)
  }
}

// Create and export API client instance
export const apiClient = new ApiClient()

// Utility functions for API calls
export const api = {
  // Health check
  async checkHealth() {
    try {
      const health = await apiClient.healthCheck()
      return health.status === 'healthy' ? 'online' : 'warning'
    } catch (error) {
      return 'offline'
    }
  },

  // Get all departments
  async getDepartments() {
    try {
      const response = await apiClient.getDepartments()
      return response.success ? response.data : []
    } catch (error) {
      console.error('Failed to fetch departments:', error)
      return []
    }
  },

  // Create a new department
  async createDepartment(department: Omit<Department, 'id'>) {
    try {
      const response = await apiClient.createDepartment(department)
      return response.success ? response.data : null
    } catch (error) {
      console.error('Failed to create department:', error)
      throw error
    }
  },

  // Update an existing department
  async updateDepartment(id: number, department: Partial<Department>) {
    try {
      const response = await apiClient.updateDepartment(id, department)
      return response.success ? response.data : null
    } catch (error) {
      console.error('Failed to update department:', error)
      throw error
    }
  },

  // Delete a department
  async deleteDepartment(id: number) {
    try {
      const response = await apiClient.deleteDepartment(id)
      return response.success
    } catch (error) {
      console.error('Failed to delete department:', error)
      throw error
    }
  },

  // Create a new porter
  async createPorter(porter: Omit<Porter, 'id'>) {
    try {
      const response = await apiClient.createPorter(porter)
      return response.success ? response.data : null
    } catch (error) {
      console.error('Failed to create porter:', error)
      throw error
    }
  },

  // Update an existing porter
  async updatePorter(id: number, porter: Partial<Porter>) {
    try {
      const response = await apiClient.updatePorter(id, porter)
      return response.success ? response.data : null
    } catch (error) {
      console.error('Failed to update porter:', error)
      throw error
    }
  },

  // Delete a porter
  async deletePorter(id: number) {
    try {
      const response = await apiClient.deletePorter(id)
      return response.success
    } catch (error) {
      console.error('Failed to delete porter:', error)
      throw error
    }
  },

  // Get all shifts
  async getShifts() {
    try {
      const response = await apiClient.getShifts()
      return response.success ? response.data : []
    } catch (error) {
      console.error('Failed to fetch shifts:', error)
      return []
    }
  },

  // Create a new shift
  async createShift(shift: Omit<Shift, 'id'>) {
    try {
      const response = await apiClient.createShift(shift)
      return response.success ? response.data : null
    } catch (error) {
      console.error('Failed to create shift:', error)
      throw error
    }
  },

  // Update an existing shift
  async updateShift(id: number, shift: Partial<Shift>) {
    try {
      const response = await apiClient.updateShift(id, shift)
      return response.success ? response.data : null
    } catch (error) {
      console.error('Failed to update shift:', error)
      throw error
    }
  },

  // Delete a shift
  async deleteShift(id: number) {
    try {
      const response = await apiClient.deleteShift(id)
      return response.success
    } catch (error) {
      console.error('Failed to delete shift:', error)
      throw error
    }
  },

  // Get temporary assignments
  async getTemporaryAssignments(date?: string, departmentId?: number, porterId?: number) {
    try {
      const response = await apiClient.getTemporaryAssignments(date, departmentId, porterId)
      return response.success ? response.data : []
    } catch (error) {
      console.error('Failed to fetch temporary assignments:', error)
      return []
    }
  },

  // Create a new temporary assignment
  async createTemporaryAssignment(assignment: Omit<TemporaryAssignment, 'id'>) {
    try {
      const response = await apiClient.createTemporaryAssignment(assignment)
      return response.success ? response.data : null
    } catch (error) {
      console.error('Failed to create temporary assignment:', error)
      throw error
    }
  },

  // Delete a temporary assignment
  async deleteTemporaryAssignment(id: number) {
    try {
      const response = await apiClient.deleteTemporaryAssignment(id)
      return response.success
    } catch (error) {
      console.error('Failed to delete temporary assignment:', error)
      throw error
    }
  },

  // Get porter availability for a specific date
  async getPorterAvailability(date: string, shiftType?: string) {
    try {
      const response = await apiClient.getPorterAvailability(date, shiftType)
      return response.success ? response.data : []
    } catch (error) {
      console.error('Failed to fetch porter availability:', error)
      return []
    }
  },

  // Get all porters
  async getPorters() {
    try {
      const response = await apiClient.getPorters()
      return response.success ? response.data : []
    } catch (error) {
      console.error('Failed to fetch porters:', error)
      return []
    }
  },

  // Get staffing alerts for a date
  async getStaffingAlerts(date: string) {
    try {
      const response = await apiClient.getStaffingAlerts(date)
      return response.success ? response.data : []
    } catch (error) {
      console.error('Failed to fetch staffing alerts:', error)
      return []
    }
  },

  // Generate staffing alerts for a date
  async generateStaffingAlerts(date: string) {
    try {
      const response = await apiClient.generateStaffingAlerts(date)
      return response.success ? response.data : []
    } catch (error) {
      console.error('Failed to generate staffing alerts:', error)
      throw error
    }
  },

  // Get daily staffing overview
  async getDailyStaffingOverview(date: string) {
    try {
      const response = await apiClient.getDailyStaffingOverview(date)
      return response.success ? response.data : null
    } catch (error) {
      console.error('Failed to fetch daily staffing overview:', error)
      return null
    }
  },

  // Get department staffing for a specific date
  async getDepartmentStaffing(departmentId: number, date: string) {
    try {
      const response = await apiClient.getDepartmentStaffing(departmentId, date)
      return response.success ? response.data : null
    } catch (error) {
      console.error('Failed to fetch department staffing:', error)
      return null
    }
  },

  // Resolve an alert
  async resolveAlert(alertId: number) {
    try {
      const response = await apiClient.resolveAlert(alertId)
      return response.success
    } catch (error) {
      console.error('Failed to resolve alert:', error)
      return false
    }
  },
}

export default api
