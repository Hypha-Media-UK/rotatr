<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <div class="porter-header">
          <div class="porter-avatar">
            <span class="avatar-text">{{ getInitials(porter.first_name, porter.last_name) }}</span>
          </div>
          <div class="porter-title">
            <h2 class="porter-name">{{ porter.first_name }} {{ porter.last_name }}</h2>
            <div class="porter-meta">
              <span class="meta-badge" :class="shiftBadgeClass(porter.shift_type)">
                {{ porter.shift_type }}
              </span>
              <span class="meta-text">{{ porter.department_name }}</span>
            </div>
          </div>
        </div>
        
        <div class="header-actions">
          <button @click="$emit('edit')" class="btn btn--primary btn--small">
            ✏️ Edit
          </button>
          <button @click="$emit('close')" class="close-btn">✕</button>
        </div>
      </div>

      <div class="modal-content">
        <div class="details-grid">
          <div class="details-section">
            <h3 class="section-title">
              <span class="section-icon">👤</span>
              Personal Information
            </h3>
            
            <div class="detail-items">
              <div class="detail-item">
                <span class="detail-label">Full Name</span>
                <span class="detail-value">{{ porter.first_name }} {{ porter.last_name }}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Employee ID</span>
                <span class="detail-value">{{ porter.employee_id || 'Not assigned' }}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Employment Status</span>
                <span class="detail-value" :class="statusClass(porter)">
                  {{ getPorterStatus(porter) }}
                </span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Start Date</span>
                <span class="detail-value">{{ formatDate(porter.start_date) }}</span>
              </div>
            </div>
          </div>

          <div class="details-section">
            <h3 class="section-title">
              <span class="section-icon">🏥</span>
              Department & Shift
            </h3>
            
            <div class="detail-items">
              <div class="detail-item">
                <span class="detail-label">Department</span>
                <span class="detail-value">{{ porter.department_name }}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Shift Type</span>
                <span class="detail-value">
                  <span class="shift-badge" :class="shiftBadgeClass(porter.shift_type)">
                    {{ porter.shift_type }}
                  </span>
                </span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Shift Hours</span>
                <span class="detail-value">{{ getShiftHours(porter.shift_type) }}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Shift Offset</span>
                <span class="detail-value">{{ porter.shift_offset_days }} days</span>
              </div>
            </div>
          </div>

          <div class="details-section">
            <h3 class="section-title">
              <span class="section-icon">⏰</span>
              Working Hours
            </h3>
            
            <div class="detail-items">
              <div class="detail-item">
                <span class="detail-label">Contracted Hours</span>
                <span class="detail-value">{{ porter.contracted_hours || 40 }} hours/week</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Shift Pattern</span>
                <span class="detail-value">{{ getShiftPattern(porter.shift_type) }}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Next Shift</span>
                <span class="detail-value next-shift">{{ getNextShiftDate(porter) }}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Days Off</span>
                <span class="detail-value">{{ getDaysOff(porter) }}</span>
              </div>
            </div>
          </div>

          <div class="details-section">
            <h3 class="section-title">
              <span class="section-icon">📊</span>
              System Information
            </h3>
            
            <div class="detail-items">
              <div class="detail-item">
                <span class="detail-label">Created</span>
                <span class="detail-value">{{ formatDateTime(porter.created_at) }}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Last Updated</span>
                <span class="detail-value">{{ formatDateTime(porter.updated_at) }}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Porter ID</span>
                <span class="detail-value">#{{ porter.id }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="schedule-preview">
          <h3 class="section-title">
            <span class="section-icon">📅</span>
            Schedule Preview - Next 14 Days
          </h3>
          
          <div class="calendar-container">
            <div class="calendar-grid">
              <div 
                v-for="day in schedulePreview" 
                :key="day.date"
                class="calendar-day"
                :class="{ 
                  'calendar-day--working': day.working,
                  'calendar-day--today': day.isToday 
                }"
              >
                <span class="day-name">{{ day.dayName }}</span>
                <span class="day-date">{{ day.dayNumber }}</span>
                <span class="day-month">{{ day.month }}</span>
                <span class="day-status">
                  {{ day.working ? '✓' : '○' }}
                </span>
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
      </div>

      <div class="modal-footer">
        <button @click="$emit('close')" class="btn btn--secondary">
          Close
        </button>
        <button @click="$emit('edit')" class="btn btn--primary">
          ✏️ Edit Porter
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Types
interface Porter {
  id: number
  first_name: string
  last_name: string
  employee_id?: string
  shift_type: string
  shift_offset_days: number
  department_id: number
  department_name: string
  contracted_hours?: number
  status?: 'active' | 'inactive' | 'on_leave'
  start_date?: string
  created_at: string
  updated_at: string
}

// Props
interface Props {
  porter: Porter
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  edit: []
}>()

// Computed properties
const schedulePreview = computed(() => {
  const days = []
  const today = new Date()
  
  for (let i = 0; i < 14; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    
    // Simple shift calculation for preview
    const daysSinceGroundZero = Math.floor((date.getTime() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60 * 24))
    const adjustedDays = daysSinceGroundZero - props.porter.shift_offset_days
    const cyclePosition = adjustedDays % 8
    const working = props.porter.shift_type !== 'Relief' && cyclePosition >= 0 && cyclePosition < 4
    
    days.push({
      date: date.toISOString().split('T')[0],
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      working,
      isToday: i === 0
    })
  }
  
  return days
})

// Methods
const handleOverlayClick = () => {
  emit('close')
}

const getInitials = (firstName: string, lastName: string) => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

const shiftBadgeClass = (shiftType: string) => {
  if (shiftType.includes('Day')) return 'shift-badge--day'
  if (shiftType.includes('Night')) return 'shift-badge--night'
  if (shiftType === 'Relief') return 'shift-badge--relief'
  return 'shift-badge--default'
}

const statusClass = (porter: Porter) => {
  const status = getPorterStatus(porter)
  return `status--${status.toLowerCase().replace(' ', '-')}`
}

const getPorterStatus = (porter: Porter) => {
  return porter.status ? porter.status.charAt(0).toUpperCase() + porter.status.slice(1).replace('_', ' ') : 'Active'
}

const getShiftHours = (shiftType: string) => {
  if (shiftType.includes('Day')) return '08:00 - 20:00 (12 hours)'
  if (shiftType.includes('Night')) return '20:00 - 08:00 (12 hours)'
  return 'Flexible hours'
}

const getShiftPattern = (shiftType: string) => {
  if (shiftType === 'Relief') return 'Flexible schedule'
  return '4 days on, 4 days off'
}

const getNextShiftDate = (porter: Porter) => {
  if (porter.shift_type === 'Relief') return 'As assigned'
  
  // Simple calculation for next working day
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  
  return tomorrow.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'short', 
    day: 'numeric' 
  })
}

const getDaysOff = (porter: Porter) => {
  if (porter.shift_type === 'Relief') return 'Variable'
  return '4 consecutive days per cycle'
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Not specified'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
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

.porter-header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.porter-avatar {
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

.porter-name {
  font-size: var(--font-size-xl);
  font-weight: 700;
  margin: 0 0 var(--space-1) 0;
  color: var(--color-neutral-800);
}

.porter-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.meta-badge {
  font-size: var(--font-size-xs);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-weight: 600;
}

.meta-badge--day {
  background: hsl(45, 100%, 90%);
  color: hsl(45, 100%, 30%);
}

.meta-badge--night {
  background: hsl(240, 100%, 90%);
  color: hsl(240, 100%, 30%);
}

.meta-badge--relief {
  background: hsl(120, 60%, 90%);
  color: var(--color-success);
}

.meta-text {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
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

.shift-badge {
  font-size: var(--font-size-xs);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-weight: 600;
}

.shift-badge--day {
  background: hsl(45, 100%, 90%);
  color: hsl(45, 100%, 30%);
}

.shift-badge--night {
  background: hsl(240, 100%, 90%);
  color: hsl(240, 100%, 30%);
}

.shift-badge--relief {
  background: hsl(120, 60%, 90%);
  color: var(--color-success);
}

.status--active {
  color: var(--color-success);
}

.status--inactive {
  color: var(--color-neutral-500);
}

.status--on-leave {
  color: var(--color-warning);
}

.next-shift {
  color: var(--color-primary);
}

.schedule-preview {
  background: var(--color-neutral-50);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  border: 1px solid var(--color-neutral-200);
}

.calendar-container {
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
  transition: all var(--transition-fast);
}

.calendar-day--working {
  background: hsl(120, 60%, 95%);
  border-color: var(--color-success);
  color: var(--color-success);
}

.calendar-day--today {
  border-color: var(--color-primary);
  border-width: 2px;
  font-weight: 700;
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

.legend-text {
  color: var(--color-neutral-700);
}

.modal-footer {
  padding: var(--space-6);
  border-top: 1px solid var(--color-neutral-200);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  background: var(--color-neutral-50);
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal {
    margin: var(--space-4);
    max-height: calc(100vh - 2 * var(--space-4));
  }
  
  .porter-header {
    flex-direction: column;
    text-align: center;
    gap: var(--space-3);
  }
  
  .header-actions {
    flex-direction: column;
    width: 100%;
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
  }
}

@media (max-width: 480px) {
  .calendar-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-1);
  }
  
  .detail-value {
    text-align: left;
  }
}
</style>
