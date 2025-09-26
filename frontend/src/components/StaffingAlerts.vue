<template>
  <div class="staffing-alerts">
    <div class="alerts-header">
      <h2 class="alerts-title">
        Staffing Alerts
      </h2>

      <div class="alerts-summary">
        <div class="summary-stat">
          <span class="stat-value">{{ totalAlerts }}</span>
          <span class="stat-label">Total Alerts</span>
        </div>
        <div class="summary-stat critical">
          <span class="stat-value">{{ criticalAlerts }}</span>
          <span class="stat-label">Critical</span>
        </div>
        <div class="summary-stat warning">
          <span class="stat-value">{{ lowStaffAlerts }}</span>
          <span class="stat-label">Low Staff</span>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="alerts-loading">
      <div class="loading-spinner"></div>
      <p>Loading staffing alerts...</p>
    </div>

    <div v-else-if="alerts.length === 0" class="no-alerts">
      <div class="no-alerts-icon"></div>
      <h3>No Staffing Alerts</h3>
      <p>All departments have adequate staffing for {{ selectedDate }}</p>
    </div>

    <div v-else class="alerts-list">
      <div
        v-for="alert in sortedAlerts"
        :key="alert.id"
        class="alert-card"
        :class="alertCardClass(alert)"
      >
        <div class="alert-header">
          <div class="alert-department">
            <h3 class="department-name">{{ alert.department_name }}</h3>
            <div class="alert-time">
              {{ formatTime(alert.start_time) }} - {{ formatTime(alert.end_time) }}
            </div>
          </div>

          <div class="alert-badge" :class="alertBadgeClass(alert)">
            
            {{ alert.alert_type }}
          </div>
        </div>

        <div class="alert-content">
          <div class="staffing-numbers">
            <div class="staffing-stat">
              <span class="stat-label">Required</span>
              <span class="stat-value required">{{ alert.required_porters }}</span>
            </div>
            <div class="staffing-stat">
              <span class="stat-label">Available</span>
              <span class="stat-value available">{{ alert.available_porters }}</span>
            </div>
            <div class="staffing-stat">
              <span class="stat-label">Shortage</span>
              <span class="stat-value shortage">{{ alert.required_porters - alert.available_porters }}</span>
            </div>
          </div>

          <div class="alert-actions">
            <button
              @click="viewDepartmentDetails(alert)"
              class="btn btn--secondary btn--small"
            >
              View Details
            </button>
            <button
              @click="resolveAlert(alert)"
              class="btn btn--primary btn--small"
            >
              Mark Resolved
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="alerts.length > 0" class="alerts-footer">
      <div class="bulk-actions">
        <button
          @click="refreshAlerts"
          class="btn btn--secondary"
          :disabled="isLoading"
        >
          Refresh Alerts
        </button>

        <button
          @click="exportAlerts"
          class="btn btn--secondary"
          :disabled="isLoading"
        >
          Export Report
        </button>
      </div>

      <div class="last-updated">
        Last updated: {{ lastUpdated }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

// Types
interface StaffingAlert {
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
  resolveAlert: [alertId: number]
  refreshAlerts: []
  exportAlerts: []
}>()

// Reactive data
const alerts = ref<StaffingAlert[]>([])
const lastUpdated = ref<string>('')

// Computed properties
const totalAlerts = computed(() => alerts.value.length)

const criticalAlerts = computed(() =>
  alerts.value.filter(alert => alert.alert_type === 'Critical').length
)

const lowStaffAlerts = computed(() =>
  alerts.value.filter(alert => alert.alert_type === 'Low Staff').length
)

const sortedAlerts = computed(() => {
  return [...alerts.value].sort((a, b) => {
    // Sort by alert type (Critical first), then by department name
    if (a.alert_type !== b.alert_type) {
      return a.alert_type === 'Critical' ? -1 : 1
    }
    return a.department_name.localeCompare(b.department_name)
  })
})

// Methods
const alertCardClass = (alert: StaffingAlert) => {
  return `alert-card--${alert.alert_type.toLowerCase().replace(' ', '-')}`
}

const alertBadgeClass = (alert: StaffingAlert) => {
  return `alert-badge--${alert.alert_type.toLowerCase().replace(' ', '-')}`
}

const alertIcon = (alert: StaffingAlert) => {
  return alert.alert_type === 'Critical' ? '🔴' : '🟡'
}

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${displayHour}:${minutes} ${ampm}`
}

const viewDepartmentDetails = (alert: StaffingAlert) => {
  emit('viewDepartment', alert.department_id)
}

const resolveAlert = (alert: StaffingAlert) => {
  emit('resolveAlert', alert.id)
}

const refreshAlerts = () => {
  emit('refreshAlerts')
}

const exportAlerts = () => {
  emit('exportAlerts')
}

const loadAlerts = async () => {
  // This would typically fetch from the API
  // For now, we'll use mock data
  alerts.value = [
    {
      id: 1,
      department_id: 1,
      department_name: 'Emergency Department',
      alert_date: props.selectedDate,
      start_time: '20:00:00',
      end_time: '08:00:00',
      required_porters: 4,
      available_porters: 0,
      alert_type: 'Critical'
    },
    {
      id: 2,
      department_id: 3,
      department_name: 'ICU',
      alert_date: props.selectedDate,
      start_time: '20:00:00',
      end_time: '08:00:00',
      required_porters: 5,
      available_porters: 0,
      alert_type: 'Critical'
    },
    {
      id: 3,
      department_id: 4,
      department_name: 'Radiology',
      alert_date: props.selectedDate,
      start_time: '08:00:00',
      end_time: '18:00:00',
      required_porters: 2,
      available_porters: 1,
      alert_type: 'Low Staff'
    }
  ]

  lastUpdated.value = new Date().toLocaleTimeString()
}

// Watchers
watch(() => props.selectedDate, () => {
  loadAlerts()
})

// Lifecycle
onMounted(() => {
  loadAlerts()
})
</script>

<style scoped>
.staffing-alerts {
  container-type: inline-size;
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-base);
  overflow: hidden;
}

.alerts-header {
  background: linear-gradient(135deg, var(--color-danger), hsl(0, 0%, 30%));
  color: white;
  padding: var(--space-6);
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: var(--space-6);
}

.alerts-title {
  font-size: var(--font-size-xl);
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.title-icon {
  font-size: var(--font-size-2xl);
}

.alerts-summary {
  display: flex;
  gap: var(--space-4);
}

.summary-stat {
  text-align: center;
  padding: var(--space-3);
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  min-width: 80px;
}

.summary-stat.critical {
  background: rgba(255, 255, 255, 0.2);
}

.summary-stat.warning {
  background: rgba(255, 193, 7, 0.2);
}

.stat-value {
  display: block;
  font-size: var(--font-size-2xl);
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  display: block;
  font-size: var(--font-size-xs);
  opacity: 0.9;
  margin-top: var(--space-1);
}

.alerts-loading {
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-alerts {
  padding: var(--space-8);
  text-align: center;
  color: var(--color-neutral-600);
}

.no-alerts-icon {
  font-size: var(--font-size-4xl);
  margin-bottom: var(--space-4);
}

.alerts-list {
  padding: var(--space-6);
  display: grid;
  gap: var(--space-4);
}

.alert-card {
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  transition: all var(--transition-base);
}

.alert-card--critical {
  border-left: 4px solid var(--color-danger);
  background: hsl(0, 0%, 98%);
}

.alert-card--low-staff {
  border-left: 4px solid var(--color-warning);
  background: hsl(0, 0%, 96%);
}

.alert-card:hover {
  box-shadow: var(--shadow-md);
}

.alert-header {
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

.alert-time {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
  margin-top: var(--space-1);
}

.alert-badge {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.alert-badge--critical {
  background: hsl(0, 0%, 90%);
  color: var(--color-danger);
}

.alert-badge--low-staff {
  background: hsl(0, 0%, 85%);
  color: hsl(0, 0%, 30%);
}

.alert-content {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: var(--space-4);
}

.staffing-numbers {
  display: flex;
  gap: var(--space-6);
}

.staffing-stat {
  text-align: center;
}

.staffing-stat .stat-label {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-neutral-600);
  margin-bottom: var(--space-1);
}

.staffing-stat .stat-value {
  display: block;
  font-size: var(--font-size-xl);
  font-weight: 700;
}

.stat-value.required {
  color: var(--color-neutral-700);
}

.stat-value.available {
  color: var(--color-success);
}

.stat-value.shortage {
  color: var(--color-danger);
}

.alert-actions {
  display: flex;
  gap: var(--space-2);
}

.alerts-footer {
  padding: var(--space-6);
  border-top: 1px solid var(--color-neutral-200);
  background: var(--color-neutral-50);
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: var(--space-4);
}

.bulk-actions {
  display: flex;
  gap: var(--space-3);
}

.last-updated {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
}

/* Responsive Design */
@container (max-width: 768px) {
  .alerts-header {
    grid-template-columns: 1fr;
    text-align: center;
    gap: var(--space-4);
  }

  .alerts-summary {
    justify-content: center;
  }

  .alert-header,
  .alert-content {
    grid-template-columns: 1fr;
    gap: var(--space-3);
  }

  .staffing-numbers {
    justify-content: space-around;
  }

  .alerts-footer {
    grid-template-columns: 1fr;
    text-align: center;
  }
}

@container (max-width: 480px) {
  .alerts-summary {
    flex-direction: column;
    gap: var(--space-2);
  }

  .summary-stat {
    min-width: auto;
  }

  .alert-actions {
    flex-direction: column;
  }

  .bulk-actions {
    flex-direction: column;
  }
}
</style>
