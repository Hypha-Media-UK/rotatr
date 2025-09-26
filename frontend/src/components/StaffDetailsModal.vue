<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <div class="staff-header">
          <div class="staff-avatar">
            <span class="avatar-text">{{ getInitials(staff.porter.name) }}</span>
          </div>
          <div class="staff-title">
            <h2 class="staff-name">{{ staff.porter.name }}</h2>
            <div class="staff-meta">
              <span class="shift-badge" :class="shiftBadgeClass(staff.porter.shift_type)">
                {{ staff.porter.shift_type }}
              </span>
              <span class="porter-type">{{ staff.porter.porter_type }}</span>
            </div>
          </div>
        </div>

        <button @click="$emit('close')" class="close-btn">✕</button>
      </div>

      <div class="modal-content">
        <div class="details-grid">
          <div class="details-section">
            <h3 class="section-title">
              Porter Information
            </h3>

            <div class="detail-items">
              <div class="detail-item">
                <span class="detail-label">Full Name</span>
                <span class="detail-value">{{ staff.porter.name }}</span>
              </div>

              <div class="detail-item">
                <span class="detail-label">Porter Type</span>
                <span class="detail-value">{{ staff.porter.porter_type }}</span>
              </div>

              <div class="detail-item">
                <span class="detail-label">Floor Staff</span>
                <span class="detail-value">
                  <span class="status-badge" :class="{ 'status-badge--yes': staff.porter.is_floor_staff }">
                    {{ staff.porter.is_floor_staff ? 'Yes' : 'No' }}
                  </span>
                </span>
              </div>

              <div class="detail-item">
                <span class="detail-label">Regular Department</span>
                <span class="detail-value">{{ staff.porter.department_name || 'None (Floor Staff)' }}</span>
              </div>
            </div>
          </div>

          <div class="details-section">
            <h3 class="section-title">
              
              Shift Information
            </h3>

            <div class="detail-items">
              <div class="detail-item">
                <span class="detail-label">Shift Type</span>
                <span class="detail-value">
                  <span class="shift-badge" :class="shiftBadgeClass(staff.porter.shift_type)">
                    {{ staff.porter.shift_type }}
                  </span>
                </span>
              </div>

              <div class="detail-item">
                <span class="detail-label">Working Hours</span>
                <span class="detail-value">{{ formatWorkingHours(staff.workingHours) }}</span>
              </div>

              <div class="detail-item">
                <span class="detail-label">Shift Offset</span>
                <span class="detail-value">{{ staff.porter.shift_offset_days }} days</span>
              </div>

              <div class="detail-item">
                <span class="detail-label">Working Today</span>
                <span class="detail-value">
                  <span class="status-indicator" :class="workingStatusClass()">
                    {{ workingStatusIcon() }}
                  </span>
                  {{ staff.isWorking ? 'Yes' : 'No' }}
                </span>
              </div>
            </div>
          </div>

          <div class="details-section">
            <h3 class="section-title">
              
              Availability Status
            </h3>

            <div class="availability-card">
              <div class="availability-header">
                <span class="availability-icon" :class="availabilityClass()">
                  {{ availabilityIcon() }}
                </span>
                <span class="availability-text">{{ availabilityText() }}</span>
              </div>

              <div v-if="staff.conflictReason" class="conflict-details">
                <h4 class="conflict-title">Conflict Details</h4>
                <p class="conflict-reason">{{ staff.conflictReason }}</p>
              </div>

              <div v-else-if="staff.isAvailable" class="available-details">
                <p class="available-text">
                  Porter is available for temporary assignments during their working hours.
                </p>
              </div>

              <div v-else class="unavailable-details">
                <p class="unavailable-text">
                  Porter is not working today and cannot be assigned.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="schedule-section">
          <h3 class="section-title">
            
            Schedule Preview - Next 14 Days
          </h3>

          <div class="schedule-calendar">
            <div class="calendar-grid">
              <div
                v-for="day in schedulePreview"
                :key="day.date"
                class="calendar-day"
                :class="{
                  'calendar-day--working': day.working,
                  'calendar-day--today': day.isToday,
                  'calendar-day--weekend': day.isWeekend
                }"
              >
                <span class="day-name">{{ day.dayName }}</span>
                <span class="day-date">{{ day.dayNumber }}</span>
                <span class="day-month">{{ day.month }}</span>
                <span class="day-status">
                  {{ day.working ? '●' : '○' }}
                </span>
                <span v-if="day.isToday" class="today-indicator">TODAY</span>
              </div>
            </div>

            <div class="calendar-legend">
              <div class="legend-item">
                <span class="legend-indicator legend-indicator--working"></span>
                <span class="legend-text">Working Day</span>
              </div>
              <div class="legend-item">
                <span class="legend-indicator legend-indicator--off"></span>
                <span class="legend-text">Day Off</span>
              </div>
              <div class="legend-item">
                <span class="legend-indicator legend-indicator--today"></span>
                <span class="legend-text">Today</span>
              </div>
            </div>
          </div>
        </div>

        <div class="assignments-section">
          <h3 class="section-title">
            
            Current Assignments for {{ formatDate(selectedDate) }}
          </h3>

          <div v-if="currentAssignments.length > 0" class="assignments-list">
            <div
              v-for="assignment in currentAssignments"
              :key="assignment.id"
              class="assignment-card"
            >
              <div class="assignment-header">
                <h4 class="assignment-department">{{ assignment.department_name }}</h4>
                <span class="assignment-type">{{ assignment.assignment_type }}</span>
              </div>

              <div class="assignment-details">
                <div class="assignment-time">
                  
                  {{ formatTime(assignment.start_time) }} - {{ formatTime(assignment.end_time) }}
                </div>
                <div class="assignment-duration">
                  Duration: {{ getAssignmentDuration(assignment) }}
                </div>
              </div>
            </div>
          </div>

          <div v-else class="no-assignments">
            <div class="no-assignments-icon">📝</div>
            <h4>No Current Assignments</h4>
            <p>Porter has no temporary assignments for {{ formatDate(selectedDate) }}</p>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <div class="footer-info">
          <div class="info-item">
            <span class="info-label">Last Updated:</span>
            <span class="info-value">{{ formatDateTime(new Date()) }}</span>
          </div>
        </div>

        <div class="footer-actions">
          <button @click="$emit('close')" class="btn btn--secondary">
            Close
          </button>
          <button
            v-if="staff.isAvailable"
            @click="handleQuickAssign"
            class="btn btn--primary"
          >
            Quick Assign
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

interface Assignment {
  id: number
  department_name: string
  assignment_type: string
  start_time: string
  end_time: string
}

// Props
interface Props {
  staff: PorterAvailability
  selectedDate: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  quickAssign: [staff: PorterAvailability]
}>()

// Computed properties
const schedulePreview = computed(() => {
  const days = []
  const today = new Date()

  for (let i = 0; i < 14; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)

    // Mock calculation - in real app, this would use the shift calculation service
    const dayOfCycle = (i + props.staff.porter.shift_offset_days) % 8
    const working = dayOfCycle < 4 // 4 on, 4 off pattern

    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    days.push({
      date: date.toISOString().split('T')[0],
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      working,
      isToday: i === 0,
      isWeekend
    })
  }

  return days
})

const currentAssignments = computed(() => {
  // Mock data - in real app, this would come from props or API
  return [] as Assignment[]
})

// Methods
const handleOverlayClick = () => {
  emit('close')
}

const handleQuickAssign = () => {
  emit('quickAssign', props.staff)
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

const formatDateTime = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatTime = (time: string) => {
  return time.substring(0, 5)
}

const workingStatusClass = () => {
  return props.staff.isWorking ? 'status-indicator--working' : 'status-indicator--not-working'
}

const workingStatusIcon = () => {
  return props.staff.isWorking ? '' : ''
}

const availabilityClass = () => {
  if (props.staff.isAvailable) return 'availability-icon--available'
  if (props.staff.conflictReason) return 'availability-icon--conflict'
  return 'availability-icon--unavailable'
}

const availabilityIcon = () => {
  if (props.staff.isAvailable) return ''
  if (props.staff.conflictReason) return ''
  return ''
}

const availabilityText = () => {
  if (props.staff.isAvailable) return 'Available for Assignment'
  if (props.staff.conflictReason) return 'Has Conflicts'
  return 'Not Available'
}

const getAssignmentDuration = (assignment: Assignment) => {
  const start = timeToMinutes(assignment.start_time)
  const end = timeToMinutes(assignment.end_time)
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
  max-width: 900px;
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

.staff-header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.staff-avatar {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: var(--font-size-xl);
}

.staff-name {
  font-size: var(--font-size-xl);
  font-weight: 700;
  margin: 0 0 var(--space-1) 0;
  color: var(--color-neutral-800);
}

.staff-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
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

.porter-type {
  color: var(--color-neutral-600);
  font-size: var(--font-size-sm);
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

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-6);
  margin-bottom: var(--space-8);
}

.details-section {
  background: var(--color-neutral-50);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  border: 1px solid var(--color-neutral-200);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-neutral-800);
  margin: 0 0 var(--space-4) 0;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.section-icon {
  font-size: var(--font-size-xl);
}

.detail-items {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2);
  background: white;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-neutral-200);
}

.detail-label {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
  font-weight: 500;
}

.detail-value {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-800);
  font-weight: 600;
  text-align: right;
}

.status-badge--yes {
  background: var(--color-success);
  color: white;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
}

.status-indicator--working {
  color: var(--color-success);
}

.status-indicator--not-working {
  color: var(--color-danger);
}

.availability-card {
  background: white;
  border-radius: var(--radius-md);
  padding: var(--space-3);
  border: 1px solid var(--color-neutral-200);
}

.availability-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.availability-icon--available {
  color: var(--color-success);
  font-size: var(--font-size-lg);
}

.availability-icon--conflict {
  color: var(--color-warning);
  font-size: var(--font-size-lg);
}

.availability-icon--unavailable {
  color: var(--color-danger);
  font-size: var(--font-size-lg);
}

.availability-text {
  font-weight: 600;
  color: var(--color-neutral-800);
}

.conflict-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  margin: 0 0 var(--space-1) 0;
  color: var(--color-warning);
}

.conflict-reason {
  font-size: var(--font-size-sm);
  color: var(--color-warning);
  margin: 0;
}

.available-text,
.unavailable-text {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
  margin: 0;
}

.schedule-section,
.assignments-section {
  background: var(--color-neutral-50);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  border: 1px solid var(--color-neutral-200);
  margin-bottom: var(--space-6);
}

.schedule-calendar {
  margin-top: var(--space-4);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.calendar-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  background: white;
  border: 1px solid var(--color-neutral-200);
  font-size: var(--font-size-xs);
  text-align: center;
  position: relative;
}

.calendar-day--working {
  background: hsl(0, 0%, 45%);
  border-color: var(--color-success);
  color: var(--color-success);
}

.calendar-day--today {
  border-color: var(--color-primary);
  border-width: 2px;
  font-weight: 700;
}

.calendar-day--weekend {
  background: var(--color-neutral-100);
}

.day-name {
  font-weight: 600;
  margin-bottom: var(--space-1);
}

.day-date {
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-1);
}

.day-month {
  font-size: var(--font-size-xs);
  color: var(--color-neutral-600);
  margin-bottom: var(--space-1);
}

.day-status {
  font-size: var(--font-size-lg);
}

.today-indicator {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-primary);
  background: white;
  padding: 0 var(--space-1);
  border-radius: var(--radius-sm);
}

.calendar-legend {
  display: flex;
  justify-content: center;
  gap: var(--space-4);
  padding: var(--space-3);
  background: white;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-neutral-200);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
}

.legend-indicator {
  width: 12px;
  height: 12px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-neutral-300);
}

.legend-indicator--working {
  background: var(--color-success);
  border-color: var(--color-success);
}

.legend-indicator--off {
  background: white;
  border-color: var(--color-neutral-300);
}

.legend-indicator--today {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.assignments-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.assignment-card {
  background: white;
  border-radius: var(--radius-md);
  padding: var(--space-3);
  border: 1px solid var(--color-neutral-200);
}

.assignment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
}

.assignment-department {
  font-size: var(--font-size-base);
  font-weight: 600;
  margin: 0;
  color: var(--color-neutral-800);
}

.assignment-type {
  font-size: var(--font-size-xs);
  padding: var(--space-1) var(--space-2);
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-full);
  font-weight: 600;
}

.assignment-details {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.assignment-time {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-neutral-700);
}

.assignment-duration {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
}

.no-assignments {
  text-align: center;
  padding: var(--space-6);
  background: white;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-neutral-200);
}

.no-assignments-icon {
  font-size: var(--font-size-3xl);
  margin-bottom: var(--space-3);
}

.no-assignments h4 {
  margin: 0 0 var(--space-2) 0;
  color: var(--color-neutral-700);
}

.no-assignments p {
  margin: 0;
  color: var(--color-neutral-600);
  font-size: var(--font-size-sm);
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
  display: flex;
  gap: var(--space-4);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.info-label {
  font-size: var(--font-size-xs);
  color: var(--color-neutral-600);
}

.info-value {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-neutral-800);
}

.footer-actions {
  display: flex;
  gap: var(--space-3);
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal {
    margin: var(--space-4);
    max-height: calc(100vh - 2 * var(--space-4));
  }

  .staff-header {
    flex-direction: column;
    text-align: center;
    gap: var(--space-3);
  }

  .details-grid {
    grid-template-columns: 1fr;
  }

  .calendar-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .calendar-legend {
    flex-direction: column;
    align-items: center;
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
