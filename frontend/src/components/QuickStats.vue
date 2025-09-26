<template>
  <div class="quick-stats">
    <div class="stats-header">
      <h2 class="stats-title">
        Quick Stats
      </h2>
      <div class="stats-date">{{ formattedDate }}</div>
    </div>

    <div v-if="isLoading" class="stats-loading">
      <div class="loading-spinner"></div>
      <p>Loading statistics...</p>
    </div>

    <div v-else class="stats-grid">
      <div class="stat-card stat-card--primary">
        <div class="stat-content">
          <div class="stat-value">{{ totalPorters }}</div>
          <div class="stat-label">Total Porters</div>
        </div>
      </div>

      <div class="stat-card stat-card--success">
        <div class="stat-content">
          <div class="stat-value">{{ workingPorters }}</div>
          <div class="stat-label">Working Today</div>
        </div>
      </div>

      <div class="stat-card stat-card--info">
        <div class="stat-content">
          <div class="stat-value">{{ totalDepartments }}</div>
          <div class="stat-label">Departments</div>
        </div>
      </div>

      <div class="stat-card stat-card--warning">
        <div class="stat-content">
          <div class="stat-value">{{ lowStaffDepartments }}</div>
          <div class="stat-label">Low Staffing</div>
        </div>
      </div>

      <div class="stat-card stat-card--danger">
        <div class="stat-content">
          <div class="stat-value">{{ criticalAlerts }}</div>
          <div class="stat-label">Critical Alerts</div>
        </div>
      </div>

      <div class="stat-card stat-card--neutral">
        <div class="stat-content">
          <div class="stat-value">{{ tempAssignments }}</div>
          <div class="stat-label">Temp Assignments</div>
        </div>
      </div>
    </div>

    <div v-if="!isLoading" class="stats-summary">
      <div class="coverage-indicator">
        <div class="coverage-label">Overall Coverage</div>
        <div class="coverage-bar">
          <div
            class="coverage-fill"
            :style="{ width: `${overallCoverage}%` }"
            :class="coverageClass"
          ></div>
        </div>
        <div class="coverage-percentage">{{ overallCoverage }}%</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

// Props
interface Props {
  selectedDate: string
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

// Reactive data
const totalPorters = ref(19)
const workingPorters = ref(14)
const totalDepartments = ref(6)
const lowStaffDepartments = ref(3)
const criticalAlerts = ref(6)
const tempAssignments = ref(3)

// Computed properties
const formattedDate = computed(() => {
  const date = new Date(props.selectedDate)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
})

const overallCoverage = computed(() => {
  if (totalDepartments.value === 0) return 100
  const adequateDepartments = totalDepartments.value - lowStaffDepartments.value
  return Math.round((adequateDepartments / totalDepartments.value) * 100)
})

const coverageClass = computed(() => {
  const coverage = overallCoverage.value
  if (coverage >= 80) return 'coverage-good'
  if (coverage >= 60) return 'coverage-fair'
  return 'coverage-poor'
})

// Methods
const loadStats = async () => {
  // This would typically fetch from the API
  // For now, we'll use mock data that updates based on the selected date

  // Simulate different stats for different dates
  const dayOfWeek = new Date(props.selectedDate).getDay()

  // Weekend typically has fewer staff
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    workingPorters.value = 10
    lowStaffDepartments.value = 4
    criticalAlerts.value = 8
  } else {
    workingPorters.value = 14
    lowStaffDepartments.value = 3
    criticalAlerts.value = 6
  }
}

// Watchers
watch(() => props.selectedDate, () => {
  loadStats()
})

// Lifecycle
onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.quick-stats {
  container-type: inline-size;
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-base);
  overflow: hidden;
}

.stats-header {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: white;
  padding: var(--space-4) var(--space-6);
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: var(--space-4);
}

.stats-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.title-icon {
  font-size: var(--font-size-xl);
}

.stats-date {
  font-size: var(--font-size-sm);
  opacity: 0.9;
  font-weight: 500;
}

.stats-loading {
  padding: var(--space-8);
  text-align: center;
  color: var(--color-neutral-600);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 2px solid var(--color-neutral-200);
  border-top: 2px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--space-3);
}

.stats-grid {
  padding: var(--space-6);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-4);
}

.stat-card {
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  transition: transform var(--transition-fast);
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-card--primary {
  background: linear-gradient(135deg, hsl(0, 0%, 95%), hsl(0, 0%, 90%));
  border-left: 4px solid var(--color-primary);
}

.stat-card--success {
  background: linear-gradient(135deg, hsl(0, 0%, 93%), hsl(0, 0%, 88%));
  border-left: 4px solid var(--color-success);
}

.stat-card--info {
  background: linear-gradient(135deg, hsl(0, 0%, 91%), hsl(0, 0%, 86%));
  border-left: 4px solid hsl(0, 0%, 50%);
}

.stat-card--warning {
  background: linear-gradient(135deg, hsl(0, 0%, 89%), hsl(0, 0%, 84%));
  border-left: 4px solid var(--color-warning);
}

.stat-card--danger {
  background: linear-gradient(135deg, hsl(0, 0%, 87%), hsl(0, 0%, 82%));
  border-left: 4px solid var(--color-danger);
}

.stat-card--neutral {
  background: linear-gradient(135deg, var(--color-neutral-100), var(--color-neutral-200));
  border-left: 4px solid var(--color-neutral-500);
}

.stat-icon {
  font-size: var(--font-size-2xl);
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-neutral-800);
  line-height: 1;
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--color-neutral-600);
  margin-top: var(--space-1);
  font-weight: 500;
}

.stats-summary {
  padding: var(--space-6);
  border-top: 1px solid var(--color-neutral-200);
  background: var(--color-neutral-50);
}

.coverage-indicator {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-4);
}

.coverage-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-neutral-700);
}

.coverage-bar {
  height: 8px;
  background: var(--color-neutral-200);
  border-radius: var(--radius-full);
  overflow: hidden;
  position: relative;
}

.coverage-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width var(--transition-base);
}

.coverage-fill.coverage-good {
  background: linear-gradient(90deg, var(--color-success), hsl(0, 0%, 40%));
}

.coverage-fill.coverage-fair {
  background: linear-gradient(90deg, var(--color-warning), hsl(0, 0%, 50%));
}

.coverage-fill.coverage-poor {
  background: linear-gradient(90deg, var(--color-danger), hsl(0, 0%, 30%));
}

.coverage-percentage {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-neutral-700);
  min-width: 40px;
  text-align: right;
}

/* Responsive Design */
@container (max-width: 600px) {
  .stats-header {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-3);
  }

  .stat-card {
    flex-direction: column;
    text-align: center;
    gap: var(--space-2);
  }

  .coverage-indicator {
    grid-template-columns: 1fr;
    gap: var(--space-2);
    text-align: center;
  }
}

@container (max-width: 400px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
