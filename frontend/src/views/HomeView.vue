<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DashboardHeader from '../components/DashboardHeader.vue'
import QuickStats from '../components/QuickStats.vue'
import StaffingAlerts from '../components/StaffingAlerts.vue'
import DepartmentStaffing from '../components/DepartmentStaffing.vue'
import TemporaryAssignments from '../components/TemporaryAssignments.vue'
import api from '../services/api'

// Reactive data
const selectedDate = ref(new Date().toISOString().split('T')[0])
const isLoading = ref(false)
const systemStatus = ref<'online' | 'offline' | 'warning'>('online')

// Methods
const handleDateChanged = (date: string) => {
  selectedDate.value = date
  refreshData()
}

const refreshData = async () => {
  isLoading.value = true
  try {
    // Simulate API calls
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Check system status
    await checkSystemStatus()
  } catch (error) {
    console.error('Error refreshing data:', error)
    systemStatus.value = 'offline'
  } finally {
    isLoading.value = false
  }
}

const generateAlerts = async () => {
  isLoading.value = true
  try {
    await api.generateStaffingAlerts(selectedDate.value)
    console.log('Alerts generated for', selectedDate.value)
    // Refresh data to show new alerts
    await refreshData()
  } catch (error) {
    console.error('Error generating alerts:', error)
  } finally {
    isLoading.value = false
  }
}

const checkSystemStatus = async () => {
  try {
    const status = await api.checkHealth()
    systemStatus.value = status
  } catch (error) {
    systemStatus.value = 'offline'
  }
}

const handleViewDepartment = (departmentId: number) => {
  console.log('View department details:', departmentId)
  // This would navigate to department details or open a modal
}

const handleResolveAlert = async (alertId: number) => {
  try {
    const success = await api.resolveAlert(alertId)
    if (success) {
      console.log('Alert resolved:', alertId)
      // Refresh data to update the UI
      await refreshData()
    }
  } catch (error) {
    console.error('Error resolving alert:', error)
  }
}

const handleRefreshAlerts = () => {
  console.log('Refresh alerts')
  refreshData()
}

const handleExportAlerts = () => {
  console.log('Export alerts')
  // This would generate and download a report
}

const handleAssignmentCreated = (assignment: any) => {
  console.log('Assignment created:', assignment)
  // Refresh data to show updated staffing
  refreshData()
}

const handleAssignmentRemoved = (assignmentId: number) => {
  console.log('Assignment removed:', assignmentId)
  // Refresh data to show updated staffing
  refreshData()
}

// Lifecycle
onMounted(() => {
  refreshData()

  // Set up periodic refresh every 5 minutes
  setInterval(() => {
    if (!isLoading.value) {
      checkSystemStatus()
    }
  }, 5 * 60 * 1000)
})
</script>

<template>
  <div class="dashboard">
    <DashboardHeader
      :selected-date="selectedDate"
      :is-loading="isLoading"
      :system-status="systemStatus"
      @date-changed="handleDateChanged"
      @refresh="refreshData"
      @generate-alerts="generateAlerts"
    />

    <main class="dashboard-main">
      <div class="dashboard-grid">
        <section class="stats-section">
          <QuickStats
            :selected-date="selectedDate"
            :is-loading="isLoading"
          />
        </section>

        <section class="alerts-section">
          <StaffingAlerts
            :selected-date="selectedDate"
            :is-loading="isLoading"
            @view-department="handleViewDepartment"
            @resolve-alert="handleResolveAlert"
            @refresh-alerts="handleRefreshAlerts"
            @export-alerts="handleExportAlerts"
          />
        </section>

        <section class="staffing-section">
          <DepartmentStaffing
            :selected-date="selectedDate"
            :is-loading="isLoading"
            @view-department="handleViewDepartment"
          />
        </section>

        <section class="assignments-section">
          <TemporaryAssignments
            :selected-date="selectedDate"
            @assignment-created="handleAssignmentCreated"
            @assignment-removed="handleAssignmentRemoved"
          />
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: var(--color-neutral-50);
  container-type: inline-size;
}

.dashboard-main {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--space-6);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto 1fr auto;
  gap: var(--space-6);
  align-items: start;
  grid-template-areas:
    "stats stats"
    "alerts staffing"
    "assignments assignments";
}

.stats-section {
  grid-area: stats;
  container-type: inline-size;
}

.alerts-section {
  grid-area: alerts;
  container-type: inline-size;
}

.staffing-section {
  grid-area: staffing;
  container-type: inline-size;
}

.assignments-section {
  grid-area: assignments;
  container-type: inline-size;
}

/* Responsive Design */
@container (max-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
    grid-template-areas:
      "stats"
      "alerts"
      "staffing";
    gap: var(--space-4);
  }

  .dashboard-main {
    padding: var(--space-4);
  }
}

@container (max-width: 768px) {
  .dashboard-main {
    padding: var(--space-3);
  }

  .dashboard-grid {
    gap: var(--space-3);
  }
}
</style>
