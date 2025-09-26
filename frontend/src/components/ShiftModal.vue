<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">
          <span class="title-icon">{{ isEditing ? '✏️' : '➕' }}</span>
          {{ isEditing ? 'Edit Shift' : 'Create Shift' }}
        </h2>
        <button @click="$emit('cancel')" class="close-btn">✕</button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-content">
        <div class="form-section">
          <h3 class="section-title">Basic Information</h3>
          
          <div class="form-group">
            <label for="name" class="form-label">Shift Name *</label>
            <input
              id="name"
              v-model="formData.name"
              type="text"
              class="form-input"
              placeholder="e.g., Day Shift A"
              required
              :class="{ 'form-input--error': errors.name }"
            />
            <span v-if="errors.name" class="form-error">{{ errors.name }}</span>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="shiftType" class="form-label">Shift Type *</label>
              <select
                id="shiftType"
                v-model="formData.shift_type"
                class="form-select"
                required
                :class="{ 'form-input--error': errors.shift_type }"
              >
                <option value="">Select Type</option>
                <option value="Day">Day Shift</option>
                <option value="Night">Night Shift</option>
              </select>
              <span v-if="errors.shift_type" class="form-error">{{ errors.shift_type }}</span>
            </div>

            <div class="form-group">
              <label for="shiftIdent" class="form-label">Shift Identifier *</label>
              <select
                id="shiftIdent"
                v-model="formData.shift_ident"
                class="form-select"
                required
                :class="{ 'form-input--error': errors.shift_ident }"
              >
                <option value="">Select Identifier</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
              <span v-if="errors.shift_ident" class="form-error">{{ errors.shift_ident }}</span>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="startTime" class="form-label">Start Time *</label>
              <input
                id="startTime"
                v-model="formData.start_time"
                type="time"
                class="form-input"
                required
                :class="{ 'form-input--error': errors.start_time }"
              />
              <span v-if="errors.start_time" class="form-error">{{ errors.start_time }}</span>
            </div>

            <div class="form-group">
              <label for="endTime" class="form-label">End Time *</label>
              <input
                id="endTime"
                v-model="formData.end_time"
                type="time"
                class="form-input"
                required
                :class="{ 'form-input--error': errors.end_time }"
              />
              <span v-if="errors.end_time" class="form-error">{{ errors.end_time }}</span>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3 class="section-title">Shift Pattern</h3>
          <p class="section-description">Configure the working cycle for this shift</p>
          
          <div class="form-row">
            <div class="form-group">
              <label for="daysOn" class="form-label">Days On *</label>
              <input
                id="daysOn"
                v-model.number="formData.days_on"
                type="number"
                min="1"
                max="30"
                class="form-input"
                required
                :class="{ 'form-input--error': errors.days_on }"
              />
              <div class="form-help">Number of consecutive working days</div>
              <span v-if="errors.days_on" class="form-error">{{ errors.days_on }}</span>
            </div>

            <div class="form-group">
              <label for="daysOff" class="form-label">Days Off *</label>
              <input
                id="daysOff"
                v-model.number="formData.days_off"
                type="number"
                min="0"
                max="30"
                class="form-input"
                required
                :class="{ 'form-input--error': errors.days_off }"
              />
              <div class="form-help">Number of consecutive days off</div>
              <span v-if="errors.days_off" class="form-error">{{ errors.days_off }}</span>
            </div>
          </div>

          <div class="form-group">
            <label for="offsetDays" class="form-label">Offset Days</label>
            <input
              id="offsetDays"
              v-model.number="formData.offset_days"
              type="number"
              min="0"
              max="30"
              class="form-input"
              :class="{ 'form-input--error': errors.offset_days }"
            />
            <div class="form-help">
              Days to offset this shift from the ground zero date (used to stagger shifts)
            </div>
            <span v-if="errors.offset_days" class="form-error">{{ errors.offset_days }}</span>
          </div>

          <div class="form-group">
            <label for="groundZero" class="form-label">Ground Zero Date</label>
            <input
              id="groundZero"
              v-model="formData.ground_zero"
              type="date"
              class="form-input"
              :class="{ 'form-input--error': errors.ground_zero }"
            />
            <div class="form-help">
              Reference date for calculating shift cycles (default: 2024-01-01)
            </div>
            <span v-if="errors.ground_zero" class="form-error">{{ errors.ground_zero }}</span>
          </div>
        </div>

        <div class="form-section">
          <h3 class="section-title">Shift Preview</h3>
          <div class="shift-preview">
            <div class="preview-info">
              <div class="preview-item">
                <span class="preview-label">Full Name:</span>
                <span class="preview-value">{{ getFullShiftName() }}</span>
              </div>
              <div class="preview-item">
                <span class="preview-label">Working Hours:</span>
                <span class="preview-value">{{ getShiftDuration() }}</span>
              </div>
              <div class="preview-item">
                <span class="preview-label">Cycle Length:</span>
                <span class="preview-value">{{ formData.days_on + formData.days_off }} days</span>
              </div>
              <div class="preview-item">
                <span class="preview-label">Pattern:</span>
                <span class="preview-value">{{ formData.days_on }} on / {{ formData.days_off }} off</span>
              </div>
            </div>
            
            <div class="preview-calendar">
              <h4 class="calendar-title">Next 14 Days Preview</h4>
              <div class="calendar-grid">
                <div 
                  v-for="day in previewDays" 
                  :key="day.date"
                  class="calendar-day"
                  :class="{ 
                    'calendar-day--working': day.working,
                    'calendar-day--today': day.isToday 
                  }"
                >
                  <span class="day-name">{{ day.name }}</span>
                  <span class="day-date">{{ day.date }}</span>
                  <span class="day-status">{{ day.working ? '●' : '○' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3 class="section-title">Impact Analysis</h3>
          <div class="impact-analysis">
            <div class="impact-item">
              <span class="impact-icon">👥</span>
              <div class="impact-content">
                <span class="impact-title">Porter Assignments</span>
                <span class="impact-description">
                  {{ getPorterImpactMessage() }}
                </span>
              </div>
            </div>
            
            <div class="impact-item">
              <span class="impact-icon">🏥</span>
              <div class="impact-content">
                <span class="impact-title">Department Coverage</span>
                <span class="impact-description">
                  This shift will affect staffing calculations for all departments
                </span>
              </div>
            </div>
            
            <div class="impact-item">
              <span class="impact-icon">⚠️</span>
              <div class="impact-content">
                <span class="impact-title">Scheduling Impact</span>
                <span class="impact-description">
                  Changes may affect existing shift calculations and alerts
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" @click="$emit('cancel')" class="btn btn--secondary">
            Cancel
          </button>
          <button type="submit" class="btn btn--primary" :disabled="!isFormValid">
            {{ isEditing ? 'Update Shift' : 'Create Shift' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

// Types
interface Shift {
  id?: number
  name: string
  start_time: string
  end_time: string
  shift_type: 'Day' | 'Night' | ''
  shift_ident: 'A' | 'B' | 'C' | 'D' | ''
  days_on: number
  days_off: number
  offset_days: number
  ground_zero: string
}

// Props
interface Props {
  shift?: Shift | null
  isEditing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  shift: null,
  isEditing: false
})

// Emits
const emit = defineEmits<{
  save: [shift: Shift]
  cancel: []
}>()

// Reactive data
const formData = ref<Shift>({
  name: '',
  start_time: '',
  end_time: '',
  shift_type: '',
  shift_ident: '',
  days_on: 4,
  days_off: 4,
  offset_days: 0,
  ground_zero: '2024-01-01'
})

const errors = ref<Record<string, string>>({})

// Computed properties
const isFormValid = computed(() => {
  if (!formData.value.name.trim()) return false
  if (!formData.value.start_time) return false
  if (!formData.value.end_time) return false
  if (!formData.value.shift_type) return false
  if (!formData.value.shift_ident) return false
  if (formData.value.days_on < 1) return false
  if (formData.value.days_off < 0) return false
  
  return true
})

const previewDays = computed(() => {
  if (!formData.value.ground_zero || !formData.value.days_on || !formData.value.days_off) {
    return []
  }
  
  const days = []
  const today = new Date()
  const groundZero = new Date(formData.value.ground_zero)
  
  for (let i = 0; i < 14; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    
    // Calculate if this shift is working on this date
    const daysSinceGroundZero = Math.floor((date.getTime() - groundZero.getTime()) / (1000 * 60 * 60 * 24))
    const adjustedDays = daysSinceGroundZero - formData.value.offset_days
    const cycleLength = formData.value.days_on + formData.value.days_off
    const cyclePosition = adjustedDays % cycleLength
    
    let working = false
    if (cyclePosition < 0) {
      const normalizedPosition = cyclePosition + cycleLength
      working = normalizedPosition >= 0 && normalizedPosition < formData.value.days_on
    } else {
      working = cyclePosition >= 0 && cyclePosition < formData.value.days_on
    }
    
    days.push({
      date: date.getDate(),
      name: date.toLocaleDateString('en-US', { weekday: 'short' }),
      working,
      isToday: i === 0
    })
  }
  
  return days
})

// Methods
const validateForm = () => {
  errors.value = {}
  
  if (!formData.value.name.trim()) {
    errors.value.name = 'Shift name is required'
  }
  
  if (!formData.value.start_time) {
    errors.value.start_time = 'Start time is required'
  }
  
  if (!formData.value.end_time) {
    errors.value.end_time = 'End time is required'
  }
  
  if (!formData.value.shift_type) {
    errors.value.shift_type = 'Shift type is required'
  }
  
  if (!formData.value.shift_ident) {
    errors.value.shift_ident = 'Shift identifier is required'
  }
  
  if (formData.value.days_on < 1) {
    errors.value.days_on = 'Days on must be at least 1'
  }
  
  if (formData.value.days_off < 0) {
    errors.value.days_off = 'Days off cannot be negative'
  }
  
  return Object.keys(errors.value).length === 0
}

const handleSubmit = () => {
  if (!validateForm()) return
  
  const shiftData = { ...formData.value }
  
  emit('save', shiftData)
}

const handleOverlayClick = () => {
  emit('cancel')
}

const getFullShiftName = () => {
  if (!formData.value.shift_type || !formData.value.shift_ident) {
    return formData.value.name || 'Unnamed Shift'
  }
  return `${formData.value.shift_type} Shift ${formData.value.shift_ident}`
}

const getShiftDuration = () => {
  if (!formData.value.start_time || !formData.value.end_time) {
    return 'Not specified'
  }
  
  const start = formData.value.start_time
  const end = formData.value.end_time
  
  // Calculate duration
  const startMinutes = timeToMinutes(start)
  const endMinutes = timeToMinutes(end)
  
  let duration = endMinutes - startMinutes
  if (duration < 0) {
    duration += 24 * 60 // Handle overnight shifts
  }
  
  const hours = Math.floor(duration / 60)
  const minutes = duration % 60
  
  return `${hours}h ${minutes > 0 ? minutes + 'm' : ''} (${start} - ${end})`
}

const timeToMinutes = (timeString: string) => {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}

const getPorterImpactMessage = () => {
  if (props.isEditing) {
    return 'Existing porter assignments will be updated to reflect changes'
  }
  return 'New shift will be available for porter assignments'
}

// Watchers
watch(() => [formData.value.shift_type, formData.value.shift_ident], ([type, ident]) => {
  if (type && ident) {
    // Auto-generate name if not manually set
    if (!formData.value.name || formData.value.name === getFullShiftName()) {
      formData.value.name = `${type} Shift ${ident}`
    }
    
    // Set default times based on shift type
    if (type === 'Day' && !formData.value.start_time) {
      formData.value.start_time = '08:00'
      formData.value.end_time = '20:00'
    } else if (type === 'Night' && !formData.value.start_time) {
      formData.value.start_time = '20:00'
      formData.value.end_time = '08:00'
    }
  }
})

// Lifecycle
onMounted(() => {
  if (props.shift) {
    formData.value = {
      ...props.shift,
      ground_zero: props.shift.ground_zero.split('T')[0] // Convert to date string
    }
  }
})
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
}

.modal {
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  max-width: 800px;
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

.form-section {
  margin-bottom: var(--space-8);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-neutral-800);
  margin: 0 0 var(--space-2) 0;
  padding-bottom: var(--space-2);
  border-bottom: 2px solid var(--color-neutral-200);
}

.section-description {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
  margin: var(--space-2) 0 var(--space-4) 0;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.form-group {
  margin-bottom: var(--space-4);
}

.form-label {
  display: block;
  font-weight: 500;
  color: var(--color-neutral-700);
  margin-bottom: var(--space-2);
}

.form-input,
.form-select {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  transition: border-color var(--transition-fast);
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input--error {
  border-color: var(--color-danger);
}

.form-error {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--color-danger);
  margin-top: var(--space-1);
}

.form-help {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
  margin-top: var(--space-1);
}

.shift-preview {
  padding: var(--space-4);
  background: var(--color-neutral-50);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-neutral-200);
}

.preview-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.preview-item {
  display: flex;
  justify-content: space-between;
  padding: var(--space-2);
  background: white;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}

.preview-label {
  color: var(--color-neutral-600);
  font-weight: 500;
}

.preview-value {
  color: var(--color-neutral-800);
  font-weight: 600;
}

.preview-calendar {
  border-top: 1px solid var(--color-neutral-200);
  padding-top: var(--space-4);
}

.calendar-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-neutral-700);
  margin: 0 0 var(--space-3) 0;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--space-2);
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

.day-status {
  font-size: var(--font-size-lg);
}

.impact-analysis {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.impact-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--color-neutral-50);
  border-radius: var(--radius-md);
  border-left: 4px solid var(--color-warning);
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
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .preview-info {
    grid-template-columns: 1fr;
  }
  
  .calendar-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .modal-footer {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .calendar-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
