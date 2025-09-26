import type { ApiResponse, PaginatedResponse } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
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

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  // Paginated requests
  async getPaginated<T>(
    endpoint: string,
    params: { page?: number; limit?: number } = {}
  ): Promise<ApiResponse<PaginatedResponse<T>>> {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.append('page', params.page.toString())
    if (params.limit) searchParams.append('limit', params.limit.toString())
    
    const url = searchParams.toString() ? `${endpoint}?${searchParams}` : endpoint
    return this.request<PaginatedResponse<T>>(url, { method: 'GET' })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)

// Specific API endpoints
export const departmentApi = {
  getAll: () => apiClient.get('/departments'),
  getById: (id: number) => apiClient.get(`/departments/${id}`),
  create: (data: any) => apiClient.post('/departments', data),
  update: (id: number, data: any) => apiClient.put(`/departments/${id}`, data),
  delete: (id: number) => apiClient.delete(`/departments/${id}`),
}

export const porterApi = {
  getAll: () => apiClient.get('/porters'),
  getById: (id: number) => apiClient.get(`/porters/${id}`),
  create: (data: any) => apiClient.post('/porters', data),
  update: (id: number, data: any) => apiClient.put(`/porters/${id}`, data),
  delete: (id: number) => apiClient.delete(`/porters/${id}`),
  getAvailability: (id: number, date: string) => 
    apiClient.get(`/porters/${id}/availability/${date}`),
}

export const shiftApi = {
  getAll: () => apiClient.get('/shifts'),
  getById: (id: number) => apiClient.get(`/shifts/${id}`),
  create: (data: any) => apiClient.post('/shifts', data),
  update: (id: number, data: any) => apiClient.put(`/shifts/${id}`, data),
  delete: (id: number) => apiClient.delete(`/shifts/${id}`),
}

export const staffingApi = {
  getDailyOverview: (date: string) => apiClient.get(`/staffing/${date}`),
  getAlerts: (date: string) => apiClient.get(`/staffing/alerts/${date}`),
  getWeeklyOverview: (startDate: string) => apiClient.get(`/staffing/week/${startDate}`),
}

export const assignmentApi = {
  getTemporary: (date: string) => apiClient.get(`/assignments/temporary/${date}`),
  createTemporary: (data: any) => apiClient.post('/assignments/temporary', data),
  updateTemporary: (id: number, data: any) => apiClient.put(`/assignments/temporary/${id}`, data),
  deleteTemporary: (id: number) => apiClient.delete(`/assignments/temporary/${id}`),
  
  getRelief: () => apiClient.get('/assignments/relief'),
  createRelief: (data: any) => apiClient.post('/assignments/relief', data),
  updateRelief: (id: number, data: any) => apiClient.put(`/assignments/relief/${id}`, data),
  deleteRelief: (id: number) => apiClient.delete(`/assignments/relief/${id}`),
}

export const exportApi = {
  exportSchedule: (startDate: string, endDate: string, format: 'csv' | 'excel' = 'csv') =>
    apiClient.get(`/export/schedule?start=${startDate}&end=${endDate}&format=${format}`),
  exportDepartmentStaffing: (departmentId: number, startDate: string, endDate: string) =>
    apiClient.get(`/export/department/${departmentId}?start=${startDate}&end=${endDate}`),
}
