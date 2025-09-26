<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">
          
          Confirm Assignment
        </h2>
        <button @click="$emit('cancel')" class="close-btn">✕</button>
      </div>

      <div class="modal-content">
        <div class="assignment-details">
          <div class="detail-section">
            <h3 class="section-title">Porter Information</h3>
            <div class="porter-card">
              <div class="porter-avatar">
                <span class="avatar-text">{{ getInitials(staff.porter.name) }}</span>
              </div>
              <div class="porter-info">
                <h4 class="porter-name">{{ staff.porter.name }}</h4>
                <div class="porter-meta">
                  <span class="shift-badge" :class="shiftBadgeClass(staff.porter.shift_type)">
                    {{ staff.porter.shift_type }}
                  </span>
                  <span class="working-hours">
                    {{ formatWorkingHours(staff.workingHours) }}
                  </span>
                </div>
                <div class="availability-status">
                  <span class="status-indicator status-indicator--available"></span>
                  <span class="status-text">Available for assignment</span>
                </div>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h3 class="section-title">Department Information</h3>
            <div class="department-card">
              <div class="department-header">
                <h4 class="department-name">{{ department.name }}</h4>
                <div class="department-type">
                  <span v-if="department.is_24_7" class="type-badge type-badge--24-7">24/7</span>
                  <span v-else class="type-badge type-badge--scheduled">Scheduled</span>
                </div>
              </div>

              <div class="department-metrics">
                <div class="metric">
                  <span class="metric-label">Current Staffing</span>
                  <span class="metric-value">{{ department.available_porters }} / {{ department.required_porters }}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Status</span>
                  <span class="metric-value" :class="staffingStatusClass(department)">
                    {{ department.staffing_level }}
                  </span>
                </div>
                <div class="metric">
                  <span class="metric-label">After Assignment</span>
                  <span class="metric-value improved">
                    {{ department.available_porters + 1 }} / {{ department.required_porters }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h3 class="section-title">Assignment Details</h3>
            <div class="assignment-info">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Date</span>
                  <span class="info-value">{{ formatDate(selectedDate) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Shift</span>
                  <span class="info-value">{{ activeShift }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Start Time</span>
                  <span class="info-value">{{ assignmentStartTime }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">End Time</span>
                  <span class="info-value">{{ assignmentEndTime }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Duration</span>
                  <span class="info-value">{{ getAssignmentDuration() }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Type</span>
                  <span class="info-value">Floor Staff</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="conflicts.length > 0" class="conflicts-section">
            <h3 class="section-title warning">
              
              Assignment Conflicts
            </h3>
            <div class="conflicts-list">
              <div v-for="conflict in conflicts" :key="conflict" class="conflict-item">
                
                <span class="conflict-text">{{ conflict }}</span>
              </div>
            </div>
            <div class="conflict-warning">
              <p>These conflicts may affect the assignment. Please review before proceeding.</p>
            </div>
          </div>

          <div class="impact-analysis">
            <h3 class="section-title">Impact Analysis</h3>
            <div class="impact-grid">
              <div class="impact-item positive">
                
                <div class="impact-content">
                  <span class="impact-title">Improved Staffing</span>
                  <span class="impact-description">
                    Department staffing will improve from {{ department.staffing_level }} to
                    {{ getImprovedStaffingLevel() }}
                  </span>
                </div>
              </div>

              <div class="impact-item">
                
                <div class="impact-content">
                  <span class="impact-title">Time Commitment</span>
                  <span class="impact-description">
                    Porter will be assigned for {{ getAssignmentDuration() }} on {{ formatDate(selectedDate) }}
                  </span>
                </div>
              </div>

              <div class="impact-item">
                <div class="impact-content">
                  <span class="impact-title">Temporary Assignment</span>
                  <span class="impact-description">
                    This is a temporary assignment and can be modified or removed as needed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <div class="footer-info">
          <div class="info-text">
            
            Assignment will be created immediately and can be modified later if needed.
          </div>
        </div>

        <div class="footer-actions">
          <button @click="$emit('cancel')" class="btn btn--secondary">
            Cancel
          </button>
          <button
            @click="handleConfirm"
            class="btn btn--primary"
            :class="{ 'btn--warning': conflicts.length > 0 }"
          >
            {{ conflicts.length > 0 ? 'Assign Despite Conflicts' : 'Confirm Assignment' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Types
interface PorterAvailability {
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

interface Department {
  id: number
  name: string
  is_24_7: boolean
  required_porters: number
  available_porters: number
  staffing_level: 'Adequate' | 'Low' | 'Critical'
}

// Props
interface Props {
  staff: PorterAvailability
  department: Department
  selectedDate: string
  activeShift: string
  conflicts: string[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  confirm: [assignment: any]
  cancel: []
}>()

// Computed properties
const assignmentStartTime = computed(() => {
  // Use the porter's working hours for the assignment
  return props.staff.workingHours.start.substring(0, 5)
})

const assignmentEndTime = computed(() => {
  return props.staff.workingHours.end.substring(0, 5)
})

// Methods
const handleConfirm = () => {
  const assignmentData = {
    porter_id: props.staff.porter.id,
    department_id: props.department.id,
    assignment_date: props.selectedDate,
    start_time: assignmentStartTime.value,
    end_time: assignmentEndTime.value,
    assignment_type: 'Floor Staff'
  }

  emit('confirm', assignmentData)
}

const handleOverlayClick = () => {
  emit('cancel')
}

// Helper methods
const getInitials = (name: string) => {
  return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase()
}

const shiftBadgeClass = (shiftType: string) => {
  if (shiftType.includes('Day')) return 'shift-badge--day'
  if (shiftType.includes('Night')) return 'shift-badge--night'
  return 'shift-badge--relief'
}

const formatWorkingHours = (hours: { start: string; end: string }) => {
  const start = hours.start.substring(0, 5)
  const end = hours.end.substring(0, 5)
  return `${start} - ${end}`
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const staffingStatusClass = (department: Department) => {
  return `staffing-status--${department.staffing_level.toLowerCase()}`
}

const getAssignmentDuration = () => {
  const start = timeToMinutes(assignmentStartTime.value)
  const end = timeToMinutes(assignmentEndTime.value)
  let duration = end - start

  if (duration < 0) {
    duration += 24 * 60 // Handle overnight shifts
  }

  const hours = Math.floor(duration / 60)
  const minutes = duration % 60

  return `${hours}h ${minutes > 0 ? minutes + 'm' : ''}`
}

const timeToMinutes = (timeString: string) => {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}

const getImprovedStaffingLevel = () => {
  const newStaffing = props.department.available_porters + 1
  const required = props.department.required_porters

  if (newStaffing >= required) return 'Adequate'
  if (newStaffing >= required * 0.8) return 'Low'
  return 'Critical'
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-4);
  backdrop-filter: blur(2px);
}

.modal {
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: var(--space-6);
  border-bottom: 1px solid var(--color-neutral-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-neutral-50);
}

.modal-title {
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

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--color-neutral-200);
  color: var(--color-neutral-600);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: var(--color-neutral-300);
  color: var(--color-neutral-800);
}

.modal-content {
  padding: var(--space-6);
  overflow-y: auto;
  flex: 1;
}

.assignment-details {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.detail-section {
  background: var(--color-neutral-50);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  border: 1px solid var(--color-neutral-200);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin: 0 0 var(--space-4) 0;
  color: var(--color-neutral-800);
}

.section-title.warning {
  color: var(--color-warning);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.porter-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3);
  background: white;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-neutral-200);
}

.porter-avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: var(--font-size-lg);
}

.porter-name {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin: 0 0 var(--space-1) 0;
  color: var(--color-neutral-800);
}

.porter-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.shift-badge--day {
  background: hsl(0, 0%, 55%);
  color: hsl(0, 0%, 55%);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: var(--font-size-xs);
}

.shift-badge--night {
  background: hsl(0, 0%, 40%);
  color: hsl(0, 0%, 40%);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: var(--font-size-xs);
}

.working-hours {
  color: var(--color-neutral-600);
  font-size: var(--font-size-sm);
}

.availability-status {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
}

.status-indicator--available {
  color: var(--color-success);
}

.department-card {
  background: white;
  border-radius: var(--radius-md);
  padding: var(--space-3);
  border: 1px solid var(--color-neutral-200);
}

.department-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.department-name {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin: 0;
  color: var(--color-neutral-800);
}

.type-badge--24-7 {
  background: var(--color-primary);
  color: white;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: var(--font-size-xs);
}

.type-badge--scheduled {
  background: var(--color-neutral-200);
  color: var(--color-neutral-700);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: var(--font-size-xs);
}

.department-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--space-3);
}

.metric {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.metric-label {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
}

.metric-value {
  font-weight: 600;
  color: var(--color-neutral-800);
}

.metric-value.improved {
  color: var(--color-success);
}

.staffing-status--adequate {
  color: var(--color-success);
}

.staffing-status--low {
  color: var(--color-warning);
}

.staffing-status--critical {
  color: var(--color-danger);
}

.assignment-info {
  background: white;
  border-radius: var(--radius-md);
  padding: var(--space-3);
  border: 1px solid var(--color-neutral-200);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--space-3);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.info-label {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
}

.info-value {
  font-weight: 600;
  color: var(--color-neutral-800);
}

.conflicts-section {
  background: hsl(0, 0%, 95%);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.conflicts-list {
  margin-bottom: var(--space-3);
}

.conflict-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  background: white;
  border-radius: var(--radius-md);
  margin-bottom: var(--space-2);
  border: 1px solid var(--color-danger);
}

.conflict-icon {
  color: var(--color-danger);
}

.conflict-text {
  color: var(--color-danger);
  font-size: var(--font-size-sm);
}

.conflict-warning {
  padding: var(--space-2);
  background: white;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-danger);
}

.conflict-warning p {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-danger);
}

.impact-analysis {
  background: var(--color-neutral-50);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  border: 1px solid var(--color-neutral-200);
}

.impact-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.impact-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3);
  background: white;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-neutral-200);
}

.impact-item.positive {
  border-left: 4px solid var(--color-success);
}

.impact-icon {
  font-size: var(--font-size-xl);
  margin-top: var(--space-1);
}

.impact-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.impact-title {
  font-weight: 600;
  color: var(--color-neutral-800);
  font-size: var(--font-size-sm);
}

.impact-description {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
  line-height: 1.4;
}

.modal-footer {
  padding: var(--space-6);
  border-top: 1px solid var(--color-neutral-200);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-neutral-50);
}

.footer-info {
  flex: 1;
}

.info-text {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
}

.footer-actions {
  display: flex;
  gap: var(--space-3);
}

.btn--warning {
  background: var(--color-warning);
  border-color: var(--color-warning);
}

.btn--warning:hover {
  background: hsl(0, 0%, 55%);
  border-color: hsl(0, 0%, 55%);
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal {
    margin: var(--space-4);
    max-height: calc(100vh - 2 * var(--space-4));
  }

  .porter-card {
    flex-direction: column;
    text-align: center;
  }

  .department-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }

  .department-metrics,
  .info-grid {
    grid-template-columns: 1fr;
  }

  .modal-footer {
    flex-direction: column;
    gap: var(--space-4);
    align-items: stretch;
  }

  .footer-actions {
    flex-direction: column;
  }
}
</style>
