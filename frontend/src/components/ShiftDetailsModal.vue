<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <div class="shift-header">
          <div class="shift-icon" :class="shiftIconClass(shift.shift_type)">
            {{ shift.shift_type === 'Day' ? '☀️' : '🌙' }}
          </div>
          <div class="shift-title">
            <h2 class="shift-name">{{ shift.name }}</h2>
            <div class="shift-meta">
              <span class="meta-badge" :class="shiftBadgeClass(shift.shift_type)">
                {{ shift.shift_type }} {{ shift.shift_ident }}
              </span>
              <span class="meta-text">{{ formatShiftHours(shift) }}</span>
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
              <span class="section-icon">🕐</span>
              Shift Information
            </h3>
            
            <div class="detail-items">
              <div class="detail-item">
                <span class="detail-label">Shift Name</span>
                <span class="detail-value">{{ shift.name }}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Type & Identifier</span>
                <span class="detail-value">
                  <span class="shift-badge" :class="shiftBadgeClass(shift.shift_type)">
                    {{ shift.shift_type }} {{ shift.shift_ident }}
                  </span>
                </span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Working Hours</span>
                <span class="detail-value">{{ formatShiftHours(shift) }}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Shift Duration</span>
                <span class="detail-value">{{ getShiftDuration(shift) }}</span>
              </div>
            </div>
          </div>

          <div class="details-section">
            <h3 class="section-title">
              <span class="section-icon">🔄</span>
              Cycle Pattern
            </h3>
            
            <div class="detail-items">
              <div class="detail-item">
                <span class="detail-label">Days On</span>
                <span class="detail-value">{{ shift.days_on }} days</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Days Off</span>
                <span class="detail-value">{{ shift.days_off }} days</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Cycle Length</span>
                <span class="detail-value">{{ shift.days_on + shift.days_off }} days</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Pattern</span>
                <span class="detail-value pattern-text">{{ shift.days_on }} on / {{ shift.days_off }} off</span>
              </div>
            </div>
          </div>

          <div class="details-section">
            <h3 class="section-title">
              <span class="section-icon">🎯</span>
              Ground Zero System
            </h3>
            
            <div class="detail-items">
              <div class="detail-item">
                <span class="detail-label">Ground Zero Date</span>
                <span class="detail-value">{{ formatDate(shift.ground_zero) }}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Offset Days</span>
                <span class="detail-value">{{ shift.offset_days }} days</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Days Since Ground Zero</span>
                <span class="detail-value">{{ daysSinceGroundZero }} days</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Current Cycle Position</span>
                <span class="detail-value cycle-position">
                  Day {{ getCurrentCyclePosition() }} of {{ shift.days_on + shift.days_off }}
                </span>
              </div>
            </div>
          </div>

          <div class="details-section">
            <h3 class="section-title">
              <span class="section-icon">👥</span>
              Porter Assignments
            </h3>
            
            <div class="porter-summary">
              <div class="summary-stat">
                <span class="stat-number">{{ porterAssignments.length }}</span>
                <span class="stat-text">Assigned Porters</span>
              </div>
              
              <div class="porter-list">
                <div 
                  v-for="porter in porterAssignments.slice(0, 5)" 
                  :key="porter.id"
                  class="porter-item"
                >
                  <div class="porter-avatar">
                    {{ getPorterInitials(porter.name) }}
                  </div>
                  <div class="porter-info">
                    <span class="porter-name">{{ porter.name }}</span>
                    <span class="porter-dept">{{ porter.department_name }}</span>
                  </div>
                </div>
                
                <div v-if="porterAssignments.length > 5" class="porter-more">
                  +{{ porterAssignments.length - 5 }} more porters
                </div>
                
                <div v-if="porterAssignments.length === 0" class="no-porters">
                  No porters assigned to this shift
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="schedule-visualization">
          <h3 class="section-title">
            <span class="section-icon">📅</span>
            Schedule Visualization - Next 21 Days
          </h3>
          
          <div class="visualization-container">
            <div class="calendar-grid">
              <div 
                v-for="day in scheduleVisualization" 
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
            
            <div class="visualization-legend">
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
              <div class="legend-item">
                <span class="legend-indicator legend-indicator--weekend"></span>
                <span class="legend-text">Weekend</span>
              </div>
            </div>
          </div>
        </div>

        <div class="interconnection-analysis">
          <h3 class="section-title">
            <span class="section-icon">🔗</span>
            System Interconnections
          </h3>
          
          <div class="interconnection-grid">
            <div class="interconnection-item">
              <div class="interconnection-header">
                <span class="interconnection-icon">👥</span>
                <span class="interconnection-title">Porter Impact</span>
              </div>
              <div class="interconnection-content">
                <p>{{ porterAssignments.length }} porters depend on this shift pattern</p>
                <p>Changes will affect their individual schedules and offsets</p>
              </div>
            </div>
            
            <div class="interconnection-item">
              <div class="interconnection-header">
                <span class="interconnection-icon">🏥</span>
                <span class="interconnection-title">Department Coverage</span>
              </div>
              <div class="interconnection-content">
                <p>Affects staffing calculations for {{ getDepartmentCount() }} departments</p>
                <p>May trigger low staffing alerts when porters are off duty</p>
              </div>
            </div>
            
            <div class="interconnection-item">
              <div class="interconnection-header">
                <span class="interconnection-icon">⚠️</span>
                <span class="interconnection-title">Alert System</span>
              </div>
              <div class="interconnection-content">
                <p>Shift changes may affect existing staffing alerts</p>
                <p>Automatic recalculation will occur after modifications</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <div class="footer-info">
          <div class="info-item">
            <span class="info-label">Created:</span>
            <span class="info-value">{{ formatDateTime(shift.created_at) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Updated:</span>
            <span class="info-value">{{ formatDateTime(shift.updated_at) }}</span>
          </div>
        </div>
        
        <div class="footer-actions">
          <button @click="$emit('close')" class="btn btn--secondary">
            Close
          </button>
          <button @click="$emit('edit')" class="btn btn--primary">
            ✏️ Edit Shift
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

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
  department_name: string
}

// Props
interface Props {
  shift: Shift
  porterAssignments: Porter[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  edit: []
}>()

// Computed properties
const daysSinceGroundZero = computed(() => {
  const groundZero = new Date(props.shift.ground_zero)
  const today = new Date()
  const diffTime = today.getTime() - groundZero.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
})

const scheduleVisualization = computed(() => {
  const days = []
  const today = new Date()
  const groundZero = new Date(props.shift.ground_zero)
  
  for (let i = 0; i < 21; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    
    // Calculate if this shift is working on this date
    const daysSinceGroundZero = Math.floor((date.getTime() - groundZero.getTime()) / (1000 * 60 * 60 * 24))
    const adjustedDays = daysSinceGroundZero - props.shift.offset_days
    const cycleLength = props.shift.days_on + props.shift.days_off
    const cyclePosition = adjustedDays % cycleLength
    
    let working = false
    if (cyclePosition < 0) {
      const normalizedPosition = cyclePosition + cycleLength
      working = normalizedPosition >= 0 && normalizedPosition < props.shift.days_on
    } else {
      working = cyclePosition >= 0 && cyclePosition < props.shift.days_on
    }
    
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

// Methods
const handleOverlayClick = () => {
  emit('close')
}

const shiftIconClass = (shiftType: string) => {
  return `shift-icon--${shiftType.toLowerCase()}`
}

const shiftBadgeClass = (shiftType: string) => {
  return `shift-badge--${shiftType.toLowerCase()}`
}

const formatShiftHours = (shift: Shift) => {
  const start = shift.start_time.substring(0, 5)
  const end = shift.end_time.substring(0, 5)
  return `${start} - ${end}`
}

const getShiftDuration = (shift: Shift) => {
  const startMinutes = timeToMinutes(shift.start_time)
  const endMinutes = timeToMinutes(shift.end_time)
  
  let duration = endMinutes - startMinutes
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

const getCurrentCyclePosition = () => {
  const adjustedDays = daysSinceGroundZero.value - props.shift.offset_days
  const cycleLength = props.shift.days_on + props.shift.days_off
  const cyclePosition = adjustedDays % cycleLength
  
  if (cyclePosition < 0) {
    return cyclePosition + cycleLength + 1
  }
  
  return cyclePosition + 1
}

const getPorterInitials = (name: string) => {
  return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase()
}

const getDepartmentCount = () => {
  const departments = new Set(props.porterAssignments.map(p => p.department_name).filter(Boolean))
  return departments.size
}

const formatDate = (dateString: string) => {
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
  max-width: 1000px;
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

.shift-header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.shift-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-2xl);
}

.shift-icon--day {
  background: hsl(45, 100%, 90%);
}

.shift-icon--night {
  background: hsl(240, 100%, 90%);
}

.shift-name {
  font-size: var(--font-size-xl);
  font-weight: 700;
  margin: 0 0 var(--space-1) 0;
  color: var(--color-neutral-800);
}

.shift-meta {
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

.shift-badge--day {
  background: hsl(45, 100%, 90%);
  color: hsl(45, 100%, 30%);
}

.shift-badge--night {
  background: hsl(240, 100%, 90%);
  color: hsl(240, 100%, 30%);
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

.pattern-text {
  color: var(--color-primary);
}

.cycle-position {
  color: var(--color-success);
}

.porter-summary {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.summary-stat {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  background: white;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-neutral-200);
}

.stat-number {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-primary);
}

.stat-text {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
}

.porter-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.porter-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  background: white;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-neutral-200);
}

.porter-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: var(--font-size-xs);
}

.porter-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.porter-name {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-neutral-800);
}

.porter-dept {
  font-size: var(--font-size-xs);
  color: var(--color-neutral-600);
}

.porter-more {
  padding: var(--space-2);
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
  background: var(--color-neutral-100);
  border-radius: var(--radius-md);
}

.no-porters {
  padding: var(--space-3);
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-neutral-500);
  background: white;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-neutral-200);
}

.schedule-visualization {
  background: var(--color-neutral-50);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  border: 1px solid var(--color-neutral-200);
  margin-bottom: var(--space-8);
}

.visualization-container {
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
  position: relative;
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

.visualization-legend {
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

.legend-indicator--weekend {
  background: var(--color-neutral-300);
  border-color: var(--color-neutral-400);
}

.legend-text {
  color: var(--color-neutral-700);
}

.interconnection-analysis {
  background: var(--color-neutral-50);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  border: 1px solid var(--color-neutral-200);
}

.interconnection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-4);
  margin-top: var(--space-4);
}

.interconnection-item {
  background: white;
  border-radius: var(--radius-md);
  padding: var(--space-3);
  border: 1px solid var(--color-neutral-200);
  border-left: 4px solid var(--color-warning);
}

.interconnection-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.interconnection-icon {
  font-size: var(--font-size-lg);
}

.interconnection-title {
  font-weight: 600;
  color: var(--color-neutral-800);
  font-size: var(--font-size-sm);
}

.interconnection-content {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
  line-height: 1.4;
}

.interconnection-content p {
  margin: 0 0 var(--space-1) 0;
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
  
  .shift-header {
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
  
  .visualization-legend {
    flex-direction: column;
    align-items: center;
  }
  
  .interconnection-grid {
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

@media (max-width: 480px) {
  .calendar-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .footer-info {
    flex-direction: column;
    gap: var(--space-2);
  }
}
</style>
