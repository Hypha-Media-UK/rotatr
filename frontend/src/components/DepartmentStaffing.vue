<template>
  <div class="department-staffing">
    <div class="staffing-header">
      <h2 class="staffing-title">
        <span class="title-icon">🏥</span>
        Department Staffing Overview
      </h2>
      
      <div class="shift-toggle">
        <button 
          @click="activeShift = 'day'"
          class="shift-btn"
          :class="{ 'shift-btn--active': activeShift === 'day' }"
        >
          ☀️ Day Shift
        </button>
        <button 
          @click="activeShift = 'night'"
          class="shift-btn"
          :class="{ 'shift-btn--active': activeShift === 'night' }"
        >
          🌙 Night Shift
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="staffing-loading">
      <div class="loading-spinner"></div>
      <p>Loading department staffing...</p>
    </div>

    <div v-else class="departments-grid">
      <div 
        v-for="department in currentShiftDepartments" 
        :key="department.id"
        class="department-card"
        :class="departmentCardClass(department)"
        @click="viewDepartmentDetails(department)"
      >
        <div class="department-header">
          <div class="department-info">
            <h3 class="department-name">{{ department.name }}</h3>
            <div class="department-type">
              <span v-if="department.is_24_7" class="type-badge type-badge--24-7">24/7</span>
              <span v-else class="type-badge type-badge--scheduled">Scheduled</span>
            </div>
          </div>
          
          <div class="staffing-status" :class="staffingStatusClass(department)">
            <span class="status-icon">{{ staffingStatusIcon(department) }}</span>
            {{ staffingStatusText(department) }}
          </div>
        </div>

        <div class="department-content">
          <div class="staffing-metrics">
            <div class="metric">
              <span class="metric-label">Required</span>
              <span class="metric-value">{{ department.required_porters }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Available</span>
              <span class="metric-value available">{{ department.available_porters }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Coverage</span>
              <span class="metric-value" :class="coverageClass(department)">
                {{ calculateCoverage(department) }}%
              </span>
            </div>
          </div>

          <div class="porter-summary">
            <div class="porter-count">
              <span class="count-icon">👥</span>
              {{ department.available_porters }} of {{ department.required_porters }} porters
            </div>
            
            <div v-if="department.floor_staff > 0" class="floor-staff">
              <span class="floor-icon">🏃</span>
              {{ department.floor_staff }} floor staff available
            </div>
          </div>

          <div v-if="department.operating_hours" class="operating-hours">
            <span class="hours-icon">🕐</span>
            {{ department.operating_hours.start }} - {{ department.operating_hours.end }}
          </div>
        </div>

        <div v-if="department.alerts && department.alerts.length > 0" class="department-alerts">
          <div 
            v-for="alert in department.alerts" 
            :key="alert.id"
            class="mini-alert"
            :class="miniAlertClass(alert)"
          >
            {{ alert.alert_type }}: {{ alert.start_time }} - {{ alert.end_time }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="!isLoading" class="staffing-summary">
      <div class="summary-stats">
        <div class="summary-stat">
          <span class="stat-value">{{ totalDepartments }}</span>
          <span class="stat-label">Total Departments</span>
        </div>
        <div class="summary-stat adequate">
          <span class="stat-value">{{ adequateStaffing }}</span>
          <span class="stat-label">Adequate Staffing</span>
        </div>
        <div class="summary-stat warning">
          <span class="stat-value">{{ lowStaffing }}</span>
          <span class="stat-label">Low Staffing</span>
        </div>
        <div class="summary-stat critical">
          <span class="stat-value">{{ criticalStaffing }}</span>
          <span class="stat-label">Critical Staffing</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

// Types
interface Department {
  id: number
  name: string
  is_24_7: boolean
  required_porters: number
  available_porters: number
  floor_staff: number
  staffing_level: 'Adequate' | 'Low' | 'Critical'
  operating_hours?: {
    start: string
    end: string
  }
  alerts?: Array<{
    id: number
    alert_type: string
    start_time: string
    end_time: string
  }>
}

// Props
interface Props {
  selectedDate: string
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

// Emits
const emit = defineEmits<{
  viewDepartment: [departmentId: number]
}>()

// Reactive data
const activeShift = ref<'day' | 'night'>('day')
const dayShiftDepartments = ref<Department[]>([])
const nightShiftDepartments = ref<Department[]>([])

// Computed properties
const currentShiftDepartments = computed(() => {
  return activeShift.value === 'day' ? dayShiftDepartments.value : nightShiftDepartments.value
})

const totalDepartments = computed(() => currentShiftDepartments.value.length)

const adequateStaffing = computed(() => 
  currentShiftDepartments.value.filter(d => d.staffing_level === 'Adequate').length
)

const lowStaffing = computed(() => 
  currentShiftDepartments.value.filter(d => d.staffing_level === 'Low').length
)

const criticalStaffing = computed(() => 
  currentShiftDepartments.value.filter(d => d.staffing_level === 'Critical').length
)

// Methods
const departmentCardClass = (department: Department) => {
  return `department-card--${department.staffing_level.toLowerCase()}`
}

const staffingStatusClass = (department: Department) => {
  return `staffing-status--${department.staffing_level.toLowerCase()}`
}

const staffingStatusIcon = (department: Department) => {
  switch (department.staffing_level) {
    case 'Adequate': return '✅'
    case 'Low': return '⚠️'
    case 'Critical': return '🚨'
    default: return '❓'
  }
}

const staffingStatusText = (department: Department) => {
  return department.staffing_level
}

const calculateCoverage = (department: Department) => {
  if (department.required_porters === 0) return 100
  return Math.round((department.available_porters / department.required_porters) * 100)
}

const coverageClass = (department: Department) => {
  const coverage = calculateCoverage(department)
  if (coverage >= 100) return 'coverage-adequate'
  if (coverage >= 50) return 'coverage-low'
  return 'coverage-critical'
}

const miniAlertClass = (alert: any) => {
  return `mini-alert--${alert.alert_type.toLowerCase().replace(' ', '-')}`
}

const viewDepartmentDetails = (department: Department) => {
  emit('viewDepartment', department.id)
}

const loadDepartmentStaffing = async () => {
  // Mock data for demonstration
  const mockDepartments: Department[] = [
    {
      id: 1,
      name: 'Emergency Department',
      is_24_7: true,
      required_porters: 4,
      available_porters: 2,
      floor_staff: 1,
      staffing_level: 'Low',
      alerts: [
        { id: 1, alert_type: 'Low Staff', start_time: '08:00', end_time: '20:00' }
      ]
    },
    {
      id: 2,
      name: 'Surgery Department',
      is_24_7: false,
      required_porters: 3,
      available_porters: 3,
      floor_staff: 0,
      staffing_level: 'Adequate',
      operating_hours: { start: '07:00', end: '19:00' }
    },
    {
      id: 3,
      name: 'ICU',
      is_24_7: true,
      required_porters: 5,
      available_porters: 1,
      floor_staff: 2,
      staffing_level: 'Critical',
      alerts: [
        { id: 2, alert_type: 'Critical', start_time: '20:00', end_time: '08:00' }
      ]
    },
    {
      id: 4,
      name: 'Radiology',
      is_24_7: false,
      required_porters: 2,
      available_porters: 1,
      floor_staff: 1,
      staffing_level: 'Low',
      operating_hours: { start: '08:00', end: '18:00' }
    },
    {
      id: 5,
      name: 'Cardiology',
      is_24_7: false,
      required_porters: 2,
      available_porters: 2,
      floor_staff: 0,
      staffing_level: 'Adequate',
      operating_hours: { start: '08:00', end: '17:00' }
    },
    {
      id: 6,
      name: 'Maternity',
      is_24_7: true,
      required_porters: 3,
      available_porters: 2,
      floor_staff: 1,
      staffing_level: 'Low'
    }
  ]

  // Simulate different staffing for day/night shifts
  dayShiftDepartments.value = mockDepartments
  nightShiftDepartments.value = mockDepartments.filter(d => d.is_24_7).map(d => ({
    ...d,
    available_porters: Math.max(0, d.available_porters - 1),
    staffing_level: d.available_porters <= 1 ? 'Critical' : 'Low'
  }))
}

// Watchers
watch(() => props.selectedDate, () => {
  loadDepartmentStaffing()
})

// Lifecycle
onMounted(() => {
  loadDepartmentStaffing()
})
</script>

<style scoped>
.department-staffing {
  container-type: inline-size;
}

.staffing-header {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: var(--space-6);
  margin-bottom: var(--space-6);
}

.staffing-title {
  font-size: var(--font-size-xl);
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--color-neutral-800);
}

.title-icon {
  font-size: var(--font-size-2xl);
}

.shift-toggle {
  display: flex;
  background: var(--color-neutral-100);
  border-radius: var(--radius-lg);
  padding: var(--space-1);
}

.shift-btn {
  padding: var(--space-2) var(--space-4);
  border: none;
  background: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  color: var(--color-neutral-600);
}

.shift-btn--active {
  background: white;
  color: var(--color-neutral-800);
  box-shadow: var(--shadow-sm);
}

.staffing-loading {
  padding: var(--space-8);
  text-align: center;
  color: var(--color-neutral-600);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-neutral-200);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--space-4);
}

.departments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.department-card {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-base);
  padding: var(--space-4);
  cursor: pointer;
  transition: all var(--transition-base);
  border-left: 4px solid var(--color-neutral-300);
}

.department-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.department-card--adequate {
  border-left-color: var(--color-success);
}

.department-card--low {
  border-left-color: var(--color-warning);
}

.department-card--critical {
  border-left-color: var(--color-danger);
}

.department-header {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.department-name {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin: 0;
  color: var(--color-neutral-800);
}

.department-type {
  margin-top: var(--space-1);
}

.type-badge {
  font-size: var(--font-size-xs);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-weight: 500;
}

.type-badge--24-7 {
  background: var(--color-primary);
  color: white;
}

.type-badge--scheduled {
  background: var(--color-neutral-200);
  color: var(--color-neutral-700);
}

.staffing-status {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.staffing-status--adequate {
  background: hsl(120, 60%, 90%);
  color: var(--color-success);
}

.staffing-status--low {
  background: hsl(45, 100%, 90%);
  color: hsl(45, 100%, 30%);
}

.staffing-status--critical {
  background: hsl(0, 70%, 90%);
  color: var(--color-danger);
}

.department-content {
  display: grid;
  gap: var(--space-4);
}

.staffing-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}

.metric {
  text-align: center;
  padding: var(--space-3);
  background: var(--color-neutral-50);
  border-radius: var(--radius-md);
}

.metric-label {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-neutral-600);
  margin-bottom: var(--space-1);
}

.metric-value {
  display: block;
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-neutral-800);
}

.metric-value.available {
  color: var(--color-success);
}

.coverage-adequate {
  color: var(--color-success);
}

.coverage-low {
  color: var(--color-warning);
}

.coverage-critical {
  color: var(--color-danger);
}

.porter-summary {
  display: grid;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
}

.porter-count,
.floor-staff {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.operating-hours {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
  padding: var(--space-2);
  background: var(--color-neutral-100);
  border-radius: var(--radius-md);
}

.department-alerts {
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-neutral-200);
}

.mini-alert {
  font-size: var(--font-size-xs);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-1);
}

.mini-alert--critical {
  background: hsl(0, 70%, 95%);
  color: var(--color-danger);
}

.mini-alert--low-staff {
  background: hsl(45, 100%, 95%);
  color: hsl(45, 100%, 30%);
}

.staffing-summary {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-base);
  padding: var(--space-6);
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--space-4);
}

.summary-stat {
  text-align: center;
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  background: var(--color-neutral-50);
}

.summary-stat.adequate {
  background: hsl(120, 60%, 95%);
}

.summary-stat.warning {
  background: hsl(45, 100%, 95%);
}

.summary-stat.critical {
  background: hsl(0, 70%, 95%);
}

.summary-stat .stat-value {
  display: block;
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-neutral-800);
  line-height: 1;
}

.summary-stat .stat-label {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
  margin-top: var(--space-2);
}

/* Responsive Design */
@container (max-width: 768px) {
  .staffing-header {
    grid-template-columns: 1fr;
    text-align: center;
    gap: var(--space-4);
  }
  
  .departments-grid {
    grid-template-columns: 1fr;
  }
  
  .department-header {
    grid-template-columns: 1fr;
    text-align: center;
  }
  
  .staffing-metrics {
    grid-template-columns: 1fr;
  }
  
  .summary-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@container (max-width: 480px) {
  .shift-toggle {
    width: 100%;
  }
  
  .shift-btn {
    flex: 1;
  }
  
  .summary-stats {
    grid-template-columns: 1fr;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
