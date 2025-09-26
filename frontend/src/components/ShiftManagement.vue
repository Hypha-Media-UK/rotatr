<template>
  <div class="shift-management">
    <div class="management-header">
      <h2 class="section-title">
        
        Shift Management
      </h2>

      <div class="header-actions">
        <div class="view-controls">
          <button
            @click="viewMode = 'grid'"
            class="view-btn"
            :class="{ 'view-btn--active': viewMode === 'grid' }"
          >
            Grid View
          </button>
          <button
            @click="viewMode = 'timeline'"
            class="view-btn"
            :class="{ 'view-btn--active': viewMode === 'timeline' }"
          >
            📅 Timeline
          </button>
        </div>

        <button
          @click="refreshShifts"
          class="btn btn--secondary"
          :disabled="isLoading"
        >
          <span v-if="!isLoading">Refresh</span>
          <span v-else>Loading...</span>
        </button>

        <button
          @click="openCreateModal"
          class="btn btn--primary"
        >
          <span>Add Shift</span>
        </button>
      </div>
    </div>

    <div class="shift-overview">
      <div class="overview-stats">
        <div class="stat-card">
          <span class="stat-value">{{ shifts.length }}</span>
          <span class="stat-label">Total Shifts</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ dayShifts.length }}</span>
          <span class="stat-label">Day Shifts</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ nightShifts.length }}</span>
          <span class="stat-label">Night Shifts</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ assignedPorters }}</span>
          <span class="stat-label">Assigned Porters</span>
        </div>
      </div>

      <div class="ground-zero-info">
        <div class="ground-zero-card">
          <h3 class="ground-zero-title">
            
            Ground Zero System
          </h3>
          <div class="ground-zero-details">
            <div class="ground-zero-item">
              <span class="label">Reference Date:</span>
              <span class="value">January 1, 2024</span>
            </div>
            <div class="ground-zero-item">
              <span class="label">Days Since:</span>
              <span class="value">{{ daysSinceGroundZero }} days</span>
            </div>
            <div class="ground-zero-item">
              <span class="label">Current Cycle:</span>
              <span class="value">Day {{ (daysSinceGroundZero % 8) + 1 }} of 8</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isLoading && shifts.length === 0" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading shifts...</p>
    </div>

    <div v-else-if="shifts.length === 0" class="empty-state">
      <div class="empty-icon"></div>
      <h3>No Shifts Configured</h3>
      <p>Create your first shift pattern to get started</p>
      <button @click="openCreateModal" class="btn btn--primary">
        Create Shift
      </button>
    </div>

    <div v-else class="shift-content">
      <!-- Grid View -->
      <div v-if="viewMode === 'grid'" class="shifts-grid">
        <div
          v-for="shift in shifts"
          :key="shift.id"
          class="shift-card"
          :class="shiftCardClass(shift)"
        >
          <div class="card-header">
            <div class="shift-info">
              <h3 class="shift-name">{{ shift.name }}</h3>
              <div class="shift-meta">
                <span class="shift-badge" :class="shiftTypeBadgeClass(shift.shift_type)">
                  {{ shift.shift_type }} {{ shift.shift_ident }}
                </span>
                <span class="shift-hours">{{ formatShiftHours(shift) }}</span>
              </div>
            </div>

            <div class="card-actions">
              <button
                @click="viewShiftDetails(shift)"
                class="action-btn action-btn--view"
                title="View Details"
              >
                👁️
              </button>
              <button
                @click="editShift(shift)"
                class="action-btn action-btn--edit"
                title="Edit Shift"
              >
                
              </button>
              <button
                @click="deleteShift(shift)"
                class="action-btn action-btn--delete"
                title="Delete Shift"
              >
                🗑️
              </button>
            </div>
          </div>

          <div class="card-content">
            <div class="shift-pattern">
              <h4 class="pattern-title">Shift Pattern</h4>
              <div class="pattern-details">
                <div class="pattern-item">
                  <span class="pattern-label">Cycle:</span>
                  <span class="pattern-value">{{ shift.days_on }} on / {{ shift.days_off }} off</span>
                </div>
                <div class="pattern-item">
                  <span class="pattern-label">Offset:</span>
                  <span class="pattern-value">{{ shift.offset_days }} days</span>
                </div>
                <div class="pattern-item">
                  <span class="pattern-label">Ground Zero:</span>
                  <span class="pattern-value">{{ formatDate(shift.ground_zero) }}</span>
                </div>
              </div>
            </div>

            <div class="porter-assignments">
              <h4 class="assignments-title">Porter Assignments</h4>
              <div class="assignments-summary">
                <div class="assignment-stat">
                  <span class="stat-number">{{ getShiftPorterCount(shift) }}</span>
                  <span class="stat-text">Assigned Porters</span>
                </div>
                <div class="assignment-departments">
                  <span class="departments-label">Departments:</span>
                  <div class="departments-list">
                    <span
                      v-for="dept in getShiftDepartments(shift)"
                      :key="dept"
                      class="department-tag"
                    >
                      {{ dept }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="shift-preview">
              <h4 class="preview-title">Next 7 Days</h4>
              <div class="preview-calendar">
                <div
                  v-for="day in getShiftPreview(shift)"
                  :key="day.date"
                  class="preview-day"
                  :class="{ 'preview-day--active': day.active }"
                >
                  <span class="day-name">{{ day.name }}</span>
                  <span class="day-date">{{ day.date }}</span>
                  <span class="day-status">{{ day.active ? '●' : '○' }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <div class="shift-stats">
              <div class="stat">
                <span class="stat-label">Created</span>
                <span class="stat-value">{{ formatDate(shift.created_at) }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Updated</span>
                <span class="stat-value">{{ formatDate(shift.updated_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline View -->
      <div v-if="viewMode === 'timeline'" class="shifts-timeline">
        <div class="timeline-header">
          <h3 class="timeline-title">Shift Timeline - Next 14 Days</h3>
          <div class="timeline-legend">
            <div class="legend-item">
              <span class="legend-dot legend-dot--day"></span>
              <span>Day Shifts</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot legend-dot--night"></span>
              <span>Night Shifts</span>
            </div>
          </div>
        </div>

        <div class="timeline-grid">
          <div class="timeline-dates">
            <div
              v-for="date in timelineDates"
              :key="date.date"
              class="timeline-date"
              :class="{ 'timeline-date--today': date.isToday }"
            >
              <span class="date-day">{{ date.dayName }}</span>
              <span class="date-number">{{ date.dayNumber }}</span>
              <span class="date-month">{{ date.month }}</span>
            </div>
          </div>

          <div class="timeline-shifts">
            <div
              v-for="shift in shifts"
              :key="shift.id"
              class="timeline-shift"
            >
              <div class="shift-label">
                <span class="shift-name">{{ shift.name }}</span>
                <span class="shift-time">{{ formatShiftHours(shift) }}</span>
              </div>
              <div class="shift-timeline">
                <div
                  v-for="date in timelineDates"
                  :key="date.date"
                  class="timeline-cell"
                  :class="{
                    'timeline-cell--active': isShiftActiveOnDate(shift, date.date),
                    'timeline-cell--day': shift.shift_type === 'Day',
                    'timeline-cell--night': shift.shift_type === 'Night'
                  }"
                >
                  <span v-if="isShiftActiveOnDate(shift, date.date)" class="cell-indicator">●</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Shift Modal -->
    <ShiftModal
      v-if="showModal"
      :shift="selectedShift"
      :is-editing="isEditing"
      @save="handleSaveShift"
      @cancel="closeModal"
    />

    <!-- Shift Details Modal -->
    <ShiftDetailsModal
      v-if="showDetailsModal"
      :shift="selectedShift"
      :porter-assignments="getShiftPorterAssignments(selectedShift)"
      @close="closeDetailsModal"
      @edit="editShiftFromDetails"
    />

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      v-if="showDeleteModal"
      title="Delete Shift"
      :message="`Are you sure you want to delete ${shiftToDelete?.name}? This will affect ${getShiftPorterCount(shiftToDelete)} assigned porters.`"
      confirm-text="Delete"
      confirm-variant="danger"
      @confirm="handleDeleteConfirm"
      @cancel="closeDeleteModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import ConfirmModal from './ConfirmModal.vue'
import api from '../services/api'

import ShiftModal from './ShiftModal.vue'
import ShiftDetailsModal from './ShiftDetailsModal.vue'

// Types
interface Shift {
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

interface Porter {
  id: number
  name: string
  shift_type: string
  department_name: string
}

// Emits
const emit = defineEmits<{
  shiftUpdated: []
}>()

// Reactive data
const shifts = ref<Shift[]>([])
const porters = ref<Porter[]>([])
const isLoading = ref(false)
const viewMode = ref<'grid' | 'timeline'>('grid')
const showModal = ref(false)
const showDetailsModal = ref(false)
const showDeleteModal = ref(false)
const selectedShift = ref<Shift | null>(null)
const shiftToDelete = ref<Shift | null>(null)
const isEditing = ref(false)

// Computed properties
const dayShifts = computed(() =>
  shifts.value.filter(s => s.shift_type === 'Day')
)

const nightShifts = computed(() =>
  shifts.value.filter(s => s.shift_type === 'Night')
)

const assignedPorters = computed(() =>
  porters.value.filter(p => p.shift_type !== 'Relief').length
)

const daysSinceGroundZero = computed(() => {
  const groundZero = new Date('2024-01-01')
  const today = new Date()
  const diffTime = today.getTime() - groundZero.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
})

const timelineDates = computed(() => {
  const dates = []
  const today = new Date()

  for (let i = 0; i < 14; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)

    dates.push({
      date: date.toISOString().split('T')[0],
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      isToday: i === 0
    })
  }

  return dates
})

// Methods
const refreshShifts = async () => {
  isLoading.value = true
  try {
    const [shiftData, porterData] = await Promise.all([
      api.getShifts(),
      api.getPorters()
    ])
    shifts.value = shiftData
    porters.value = porterData
  } catch (error) {
    console.error('Failed to load shifts:', error)
  } finally {
    isLoading.value = false
  }
}

const openCreateModal = () => {
  selectedShift.value = null
  isEditing.value = false
  showModal.value = true
}

const editShift = (shift: Shift) => {
  selectedShift.value = { ...shift }
  isEditing.value = true
  showModal.value = true
}

const viewShiftDetails = (shift: Shift) => {
  selectedShift.value = shift
  showDetailsModal.value = true
}

const deleteShift = (shift: Shift) => {
  shiftToDelete.value = shift
  showDeleteModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedShift.value = null
  isEditing.value = false
}

const closeDetailsModal = () => {
  showDetailsModal.value = false
  selectedShift.value = null
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  shiftToDelete.value = null
}

const editShiftFromDetails = () => {
  closeDetailsModal()
  if (selectedShift.value) {
    editShift(selectedShift.value)
  }
}

const handleSaveShift = async (shiftData: any) => {
  try {
    if (isEditing.value && selectedShift.value?.id) {
      // Update existing shift
      await api.updateShift(selectedShift.value.id, shiftData)
    } else {
      // Create new shift
      await api.createShift(shiftData)
    }

    // Refresh the list
    await refreshShifts()

    // Close modal
    closeModal()

    // Emit update event
    emit('shiftUpdated')
  } catch (error) {
    console.error('Failed to save shift:', error)
    // In a real app, you'd show an error message to the user
  }
}

const handleDeleteConfirm = async () => {
  if (!shiftToDelete.value) return

  try {
    // Call the API to delete the shift
    await api.deleteShift(shiftToDelete.value.id)

    // Refresh the list
    await refreshShifts()

    // Close modal
    closeDeleteModal()

    // Emit update event
    emit('shiftUpdated')
  } catch (error) {
    console.error('Failed to delete shift:', error)
    // In a real app, you'd show an error message to the user
  }
}

// Utility methods
const shiftCardClass = (shift: Shift) => {
  return `shift-card--${shift.shift_type.toLowerCase()}`
}

const shiftTypeBadgeClass = (shiftType: string) => {
  return `shift-badge--${shiftType.toLowerCase()}`
}

const formatShiftHours = (shift: Shift) => {
  const start = shift.start_time.substring(0, 5)
  const end = shift.end_time.substring(0, 5)
  return `${start} - ${end}`
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const getShiftPorterCount = (shift: Shift | null) => {
  if (!shift) return 0
  return porters.value.filter(p => p.shift_type === `${shift.shift_type} ${shift.shift_ident}`).length
}

const getShiftDepartments = (shift: Shift) => {
  const shiftPorters = porters.value.filter(p => p.shift_type === `${shift.shift_type} ${shift.shift_ident}`)
  const departments = [...new Set(shiftPorters.map(p => p.department_name).filter(Boolean))]
  return departments.slice(0, 3) // Show max 3 departments
}

const getShiftPorterAssignments = (shift: Shift | null) => {
  if (!shift) return []
  return porters.value.filter(p => p.shift_type === `${shift.shift_type} ${shift.shift_ident}`)
}

const getShiftPreview = (shift: Shift) => {
  const preview = []
  const today = new Date()

  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)

    const active = isShiftActiveOnDate(shift, date.toISOString().split('T')[0])

    preview.push({
      name: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      active
    })
  }

  return preview
}

const isShiftActiveOnDate = (shift: Shift, dateString: string) => {
  const groundZero = new Date(shift.ground_zero)
  const targetDate = new Date(dateString)

  const daysSinceGroundZero = Math.floor((targetDate.getTime() - groundZero.getTime()) / (1000 * 60 * 60 * 24))
  const adjustedDays = daysSinceGroundZero - shift.offset_days
  const cycleLength = shift.days_on + shift.days_off
  const cyclePosition = adjustedDays % cycleLength

  if (cyclePosition < 0) {
    const normalizedPosition = cyclePosition + cycleLength
    return normalizedPosition >= 0 && normalizedPosition < shift.days_on
  }

  return cyclePosition >= 0 && cyclePosition < shift.days_on
}

// Lifecycle
onMounted(() => {
  refreshShifts()
})
</script>

<style scoped>
.shift-management {
  container-type: inline-size;
}

.management-header {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: var(--space-6);
  margin-bottom: var(--space-6);
}

.section-title {
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

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.view-controls {
  display: flex;
  background: var(--color-neutral-100);
  border-radius: var(--radius-lg);
  padding: var(--space-1);
}

.view-btn {
  padding: var(--space-2) var(--space-3);
  border: none;
  border-radius: var(--radius-md);
  background: none;
  color: var(--color-neutral-600);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.view-btn--active {
  background: white;
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.shift-overview {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-6);
  margin-bottom: var(--space-8);
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}

.stat-card {
  text-align: center;
  padding: var(--space-4);
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-base);
}

.stat-value {
  display: block;
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-neutral-800);
  line-height: 1;
}

.stat-label {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-neutral-600);
  margin-top: var(--space-1);
}

.ground-zero-card {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-base);
  padding: var(--space-4);
  border-left: 4px solid var(--color-primary);
}

.ground-zero-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin: 0 0 var(--space-3) 0;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-neutral-800);
}

.ground-zero-icon {
  font-size: var(--font-size-xl);
}

.ground-zero-details {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.ground-zero-item {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-sm);
}

.ground-zero-item .label {
  color: var(--color-neutral-600);
}

.ground-zero-item .value {
  color: var(--color-neutral-800);
  font-weight: 600;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12);
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
  margin-bottom: var(--space-4);
}

.empty-icon {
  font-size: var(--font-size-4xl);
  margin-bottom: var(--space-4);
}

.shifts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: var(--space-6);
}

.shift-card {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-base);
  overflow: hidden;
  transition: all var(--transition-base);
  border-left: 4px solid var(--color-neutral-300);
}

.shift-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.shift-card--day {
  border-left-color: hsl(0, 0%, 50%);
}

.shift-card--night {
  border-left-color: hsl(0, 0%, 40%);
}

.card-header {
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-neutral-200);
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: var(--space-4);
}

.shift-name {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin: 0 0 var(--space-1) 0;
  color: var(--color-neutral-800);
}

.shift-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.shift-badge {
  font-size: var(--font-size-xs);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-weight: 600;
}

.shift-badge--day {
  background: hsl(0, 0%, 90%);
  color: hsl(0, 0%, 30%);
}

.shift-badge--night {
  background: hsl(0, 0%, 85%);
  color: hsl(0, 0%, 25%);
}

.shift-hours {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
}

.card-actions {
  display: flex;
  gap: var(--space-1);
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
}

.action-btn--view {
  background: hsl(0, 0%, 95%);
  color: hsl(0, 0%, 40%);
}

.action-btn--view:hover {
  background: hsl(0, 0%, 90%);
}

.action-btn--edit {
  background: hsl(0, 0%, 93%);
  color: var(--color-primary);
}

.action-btn--edit:hover {
  background: hsl(0, 0%, 88%);
}

.action-btn--delete {
  background: hsl(0, 0%, 91%);
  color: var(--color-danger);
}

.action-btn--delete:hover {
  background: hsl(0, 0%, 86%);
}

.card-content {
  padding: var(--space-4);
}

.shift-pattern,
.porter-assignments,
.shift-preview {
  margin-bottom: var(--space-4);
}

.pattern-title,
.assignments-title,
.preview-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-neutral-700);
  margin: 0 0 var(--space-2) 0;
}

.pattern-details {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.pattern-item {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-sm);
}

.pattern-label {
  color: var(--color-neutral-600);
}

.pattern-value {
  color: var(--color-neutral-800);
  font-weight: 500;
}

.assignments-summary {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.assignment-stat {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.stat-number {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-primary);
}

.stat-text {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
}

.assignment-departments {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.departments-label {
  font-size: var(--font-size-xs);
  color: var(--color-neutral-600);
}

.departments-list {
  display: flex;
  gap: var(--space-1);
  flex-wrap: wrap;
}

.department-tag {
  font-size: var(--font-size-xs);
  padding: var(--space-1) var(--space-2);
  background: var(--color-neutral-100);
  border-radius: var(--radius-full);
  color: var(--color-neutral-700);
}

.preview-calendar {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--space-1);
}

.preview-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  background: var(--color-neutral-100);
  font-size: var(--font-size-xs);
  text-align: center;
}

.preview-day--active {
  background: hsl(0, 0%, 95%);
  color: var(--color-success);
}

.day-name {
  font-weight: 600;
  margin-bottom: var(--space-1);
}

.day-date {
  margin-bottom: var(--space-1);
}

.day-status {
  font-size: var(--font-size-sm);
}

.card-footer {
  padding: var(--space-4);
  background: var(--color-neutral-50);
  border-top: 1px solid var(--color-neutral-200);
}

.shift-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.stat {
  text-align: center;
}

.stat .stat-label {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-neutral-600);
  margin-bottom: var(--space-1);
}

.stat .stat-value {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-neutral-800);
}

/* Timeline View Styles */
.shifts-timeline {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-base);
  overflow: hidden;
}

.timeline-header {
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-neutral-200);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timeline-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin: 0;
  color: var(--color-neutral-800);
}

.timeline-legend {
  display: flex;
  gap: var(--space-4);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: var(--radius-full);
}

.legend-dot--day {
  background: hsl(0, 0%, 50%);
}

.legend-dot--night {
  background: hsl(0, 0%, 40%);
}

.timeline-grid {
  padding: var(--space-4);
}

.timeline-dates {
  display: grid;
  grid-template-columns: 200px repeat(14, 1fr);
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-neutral-200);
}

.timeline-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  text-align: center;
}

.timeline-date--today {
  background: var(--color-primary);
  color: white;
  font-weight: 700;
}

.date-day {
  font-weight: 600;
  margin-bottom: var(--space-1);
}

.date-number {
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-1);
}

.date-month {
  color: var(--color-neutral-600);
}

.timeline-date--today .date-month {
  color: rgba(255, 255, 255, 0.8);
}

.timeline-shifts {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.timeline-shift {
  display: grid;
  grid-template-columns: 200px repeat(14, 1fr);
  gap: var(--space-2);
  align-items: center;
}

.shift-label {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-2);
}

.shift-name {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-neutral-800);
}

.shift-time {
  font-size: var(--font-size-xs);
  color: var(--color-neutral-600);
}

.shift-timeline {
  display: contents;
}

.timeline-cell {
  height: 32px;
  border-radius: var(--radius-sm);
  background: var(--color-neutral-100);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.timeline-cell--active {
  background: var(--color-success);
  color: white;
}

.timeline-cell--day.timeline-cell--active {
  background: hsl(0, 0%, 50%);
}

.timeline-cell--night.timeline-cell--active {
  background: hsl(0, 0%, 40%);
}

.cell-indicator {
  font-size: var(--font-size-lg);
}

/* Responsive Design */
@container (max-width: 768px) {
  .management-header {
    grid-template-columns: 1fr;
    gap: var(--space-4);
    text-align: center;
  }

  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .shift-overview {
    grid-template-columns: 1fr;
  }

  .overview-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .shifts-grid {
    grid-template-columns: 1fr;
  }

  .timeline-grid {
    overflow-x: auto;
  }

  .timeline-dates,
  .timeline-shift {
    min-width: 800px;
  }
}

@container (max-width: 480px) {
  .overview-stats {
    grid-template-columns: 1fr;
  }

  .view-controls {
    flex-direction: column;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
