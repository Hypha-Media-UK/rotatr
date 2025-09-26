<template>
  <header class="dashboard-header">
    <div class="header-content">
      <div class="header-left">
        <h1 class="dashboard-title">
          Porter Shift Management
        </h1>
        <div class="current-date">
          <span class="date-label">Today:</span>
          <time :datetime="currentDate" class="date-value">
            {{ formattedDate }}
          </time>
        </div>
      </div>

      <div class="header-center">
        <div class="date-navigation">
          <button
            @click="previousDay"
            class="btn btn--secondary btn--small"
            :disabled="isLoading"
          >
            ← Previous
          </button>

          <div class="selected-date">
            <input
              type="date"
              v-model="selectedDate"
              @change="onDateChange"
              class="date-picker"
              :disabled="isLoading"
            />
          </div>

          <button
            @click="nextDay"
            class="btn btn--secondary btn--small"
            :disabled="isLoading"
          >
            Next →
          </button>
        </div>
      </div>

      <div class="header-right">
        <div class="quick-actions">
          <RouterLink
            to="/configure"
            class="btn btn--secondary btn--small"
          >
            Configure
          </RouterLink>

          <button
            @click="refreshData"
            class="btn btn--secondary btn--small"
            :disabled="isLoading"
            :class="{ 'loading': isLoading }"
          >
            <span v-if="!isLoading">Refresh</span>
            <span v-else>Loading...</span>
          </button>

          <button
            @click="generateAlerts"
            class="btn btn--primary btn--small"
            :disabled="isLoading"
          >
            Generate Alerts
          </button>
        </div>

        <div class="system-status">
          <div class="status-indicator" :class="systemStatusClass">
            <span class="status-dot"></span>
            {{ systemStatus }}
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'

// Props
interface Props {
  selectedDate: string
  isLoading?: boolean
  systemStatus?: 'online' | 'offline' | 'warning'
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  systemStatus: 'online'
})

// Emits
const emit = defineEmits<{
  dateChanged: [date: string]
  refresh: []
  generateAlerts: []
}>()

// Reactive data
const currentDate = ref(new Date().toISOString().split('T')[0])
const selectedDate = ref(props.selectedDate)

// Computed properties
const formattedDate = computed(() => {
  const date = new Date(currentDate.value)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const systemStatusClass = computed(() => {
  return `status-indicator--${props.systemStatus}`
})

// Methods
const previousDay = () => {
  const date = new Date(selectedDate.value)
  date.setDate(date.getDate() - 1)
  selectedDate.value = date.toISOString().split('T')[0]
  onDateChange()
}

const nextDay = () => {
  const date = new Date(selectedDate.value)
  date.setDate(date.getDate() + 1)
  selectedDate.value = date.toISOString().split('T')[0]
  onDateChange()
}

const onDateChange = () => {
  emit('dateChanged', selectedDate.value)
}

const refreshData = () => {
  emit('refresh')
}

const generateAlerts = () => {
  emit('generateAlerts')
}

// Lifecycle
onMounted(() => {
  selectedDate.value = props.selectedDate
})
</script>

<style scoped>
.dashboard-header {
  background: white;
  border-bottom: 1px solid var(--color-neutral-200);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--space-4) var(--space-6);
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: var(--space-6);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.dashboard-title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-neutral-800);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: 0;
}

.title-icon {
  font-size: var(--font-size-3xl);
}

.current-date {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
}

.date-label {
  font-weight: 500;
}

.date-value {
  color: var(--color-neutral-800);
  font-weight: 600;
}

.header-center {
  display: flex;
  justify-content: center;
}

.date-navigation {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  background: var(--color-neutral-100);
  padding: var(--space-2);
  border-radius: var(--radius-lg);
}

.date-picker {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: white;
  min-width: 150px;
}

.header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-3);
}

.quick-actions {
  display: flex;
  gap: var(--space-2);
}

.system-status {
  font-size: var(--font-size-xs);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-weight: 500;
}

.status-indicator--online {
  background: hsl(0, 0%, 45%);
  color: var(--color-success);
}

.status-indicator--warning {
  background: hsl(0, 0%, 55%);
  color: hsl(0, 0%, 55%);
}

.status-indicator--offline {
  background: hsl(0, 0%, 30%);
  color: var(--color-danger);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.loading {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Responsive Design */
@container (max-width: 768px) {
  .header-content {
    grid-template-columns: 1fr;
    gap: var(--space-4);
    text-align: center;
  }

  .header-left,
  .header-right {
    align-items: center;
  }

  .dashboard-title {
    font-size: var(--font-size-xl);
  }

  .date-navigation {
    flex-wrap: wrap;
    justify-content: center;
  }
}

@container (max-width: 480px) {
  .quick-actions {
    flex-direction: column;
    width: 100%;
  }

  .date-navigation {
    flex-direction: column;
    gap: var(--space-2);
  }
}
</style>
