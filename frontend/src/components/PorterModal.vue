<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">
          
          {{ isEditing ? 'Edit Porter' : 'Add Porter' }}
        </h2>
        <button @click="$emit('cancel')" class="close-btn">✕</button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-content">
        <div class="form-section">
          <h3 class="section-title">Personal Information</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label for="firstName" class="form-label">First Name *</label>
              <input
                id="firstName"
                v-model="formData.first_name"
                type="text"
                class="form-input"
                placeholder="e.g., John"
                required
                :class="{ 'form-input--error': errors.first_name }"
              />
              <span v-if="errors.first_name" class="form-error">{{ errors.first_name }}</span>
            </div>

            <div class="form-group">
              <label for="lastName" class="form-label">Last Name *</label>
              <input
                id="lastName"
                v-model="formData.last_name"
                type="text"
                class="form-input"
                placeholder="e.g., Smith"
                required
                :class="{ 'form-input--error': errors.last_name }"
              />
              <span v-if="errors.last_name" class="form-error">{{ errors.last_name }}</span>
            </div>
          </div>

          <div class="form-group">
            <label for="employeeId" class="form-label">Employee ID</label>
            <input
              id="employeeId"
              v-model="formData.employee_id"
              type="text"
              class="form-input"
              placeholder="e.g., EMP001"
              :class="{ 'form-input--error': errors.employee_id }"
            />
            <span v-if="errors.employee_id" class="form-error">{{ errors.employee_id }}</span>
          </div>
        </div>

        <div class="form-section">
          <h3 class="section-title">Department & Shift Assignment</h3>
          
          <div class="form-group">
            <label for="department" class="form-label">Department *</label>
            <select
              id="department"
              v-model="formData.department_id"
              class="form-select"
              required
              :class="{ 'form-input--error': errors.department_id }"
            >
              <option value="">Select Department</option>
              <option v-for="dept in departments" :key="dept.id" :value="dept.id">
                {{ dept.name }}
              </option>
            </select>
            <span v-if="errors.department_id" class="form-error">{{ errors.department_id }}</span>
          </div>

          <div class="form-group">
            <label for="shiftType" class="form-label">Shift Type *</label>
            <select
              id="shiftType"
              v-model="formData.shift_type"
              class="form-select"
              required
              :class="{ 'form-input--error': errors.shift_type }"
            >
              <option value="">Select Shift Type</option>
              <option value="Day A">Day A (08:00 - 20:00)</option>
              <option value="Day B">Day B (08:00 - 20:00)</option>
              <option value="Night A">Night A (20:00 - 08:00)</option>
              <option value="Night B">Night B (20:00 - 08:00)</option>
              <option value="Relief">Relief (Flexible)</option>
            </select>
            <span v-if="errors.shift_type" class="form-error">{{ errors.shift_type }}</span>
          </div>

          <div v-if="formData.shift_type && formData.shift_type !== 'Relief'" class="form-group">
            <label for="shiftOffset" class="form-label">Shift Offset Days</label>
            <input
              id="shiftOffset"
              v-model.number="formData.shift_offset_days"
              type="number"
              min="0"
              max="7"
              class="form-input"
              :class="{ 'form-input--error': errors.shift_offset_days }"
            />
            <div class="form-help">
              Number of days to offset from the standard shift cycle (0-7 days)
            </div>
            <span v-if="errors.shift_offset_days" class="form-error">{{ errors.shift_offset_days }}</span>
          </div>
        </div>

        <div class="form-section">
          <h3 class="section-title">Employment Details</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label for="contractedHours" class="form-label">Contracted Hours/Week</label>
              <input
                id="contractedHours"
                v-model.number="formData.contracted_hours"
                type="number"
                min="1"
                max="60"
                class="form-input"
                placeholder="40"
                :class="{ 'form-input--error': errors.contracted_hours }"
              />
              <span v-if="errors.contracted_hours" class="form-error">{{ errors.contracted_hours }}</span>
            </div>

            <div class="form-group">
              <label for="status" class="form-label">Employment Status</label>
              <select
                id="status"
                v-model="formData.status"
                class="form-select"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="startDate" class="form-label">Start Date</label>
            <input
              id="startDate"
              v-model="formData.start_date"
              type="date"
              class="form-input"
              :class="{ 'form-input--error': errors.start_date }"
            />
            <span v-if="errors.start_date" class="form-error">{{ errors.start_date }}</span>
          </div>
        </div>

        <div v-if="formData.shift_type && formData.shift_type !== 'Relief'" class="form-section">
          <h3 class="section-title">Shift Preview</h3>
          <div class="shift-preview">
            <div class="preview-info">
              <div class="preview-item">
                <span class="preview-label">Shift Pattern:</span>
                <span class="preview-value">4 days on, 4 days off</span>
              </div>
              <div class="preview-item">
                <span class="preview-label">Working Hours:</span>
                <span class="preview-value">{{ getShiftHours(formData.shift_type) }}</span>
              </div>
              <div class="preview-item">
                <span class="preview-label">Cycle Offset:</span>
                <span class="preview-value">{{ formData.shift_offset_days }} days</span>
              </div>
            </div>
            
            <div class="preview-calendar">
              <h4 class="calendar-title">Next 7 Days</h4>
              <div class="calendar-days">
                <div 
                  v-for="day in previewDays" 
                  :key="day.date"
                  class="calendar-day"
                  :class="{ 'calendar-day--working': day.working }"
                >
                  <span class="day-name">{{ day.name }}</span>
                  <span class="day-date">{{ day.date }}</span>
                  <span class="day-status">{{ day.working ? '✓' : '○' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" @click="$emit('cancel')" class="btn btn--secondary">
            Cancel
          </button>
          <button type="submit" class="btn btn--primary" :disabled="!isFormValid">
            {{ isEditing ? 'Update Porter' : 'Create Porter' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

// Types
interface Porter {
  id?: number
  first_name: string
  last_name: string
  employee_id?: string
  shift_type: string
  shift_offset_days: number
  department_id: number
  contracted_hours?: number
  status?: 'active' | 'inactive' | 'on_leave'
  start_date?: string
}

interface Department {
  id: number
  name: string
}

// Props
interface Props {
  porter?: Porter | null
  departments: Department[]
  isEditing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  porter: null,
  isEditing: false
})

// Emits
const emit = defineEmits<{
  save: [porter: Porter]
  cancel: []
}>()

// Reactive data
const formData = ref<Porter>({
  first_name: '',
  last_name: '',
  employee_id: '',
  shift_type: '',
  shift_offset_days: 0,
  department_id: 0,
  contracted_hours: 40,
  status: 'active',
  start_date: ''
})

const errors = ref<Record<string, string>>({})

// Computed properties
const isFormValid = computed(() => {
  if (!formData.value.first_name.trim()) return false
  if (!formData.value.last_name.trim()) return false
  if (!formData.value.shift_type) return false
  if (!formData.value.department_id) return false
  
  return true
})

const previewDays = computed(() => {
  if (!formData.value.shift_type || formData.value.shift_type === 'Relief') {
    return []
  }
  
  const days = []
  const today = new Date()
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    
    // Simple shift calculation for preview
    const daysSinceGroundZero = Math.floor((date.getTime() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60 * 24))
    const adjustedDays = daysSinceGroundZero - formData.value.shift_offset_days
    const cyclePosition = adjustedDays % 8
    const working = cyclePosition >= 0 && cyclePosition < 4
    
    days.push({
      name: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      working
    })
  }
  
  return days
})

// Methods
const validateForm = () => {
  errors.value = {}
  
  if (!formData.value.first_name.trim()) {
    errors.value.first_name = 'First name is required'
  }
  
  if (!formData.value.last_name.trim()) {
    errors.value.last_name = 'Last name is required'
  }
  
  if (!formData.value.shift_type) {
    errors.value.shift_type = 'Shift type is required'
  }
  
  if (!formData.value.department_id) {
    errors.value.department_id = 'Department is required'
  }
  
  if (formData.value.contracted_hours && (formData.value.contracted_hours < 1 || formData.value.contracted_hours > 60)) {
    errors.value.contracted_hours = 'Contracted hours must be between 1 and 60'
  }
  
  return Object.keys(errors.value).length === 0
}

const handleSubmit = () => {
  if (!validateForm()) return
  
  const porterData = { ...formData.value }
  
  // Convert department_id to number
  porterData.department_id = Number(porterData.department_id)
  
  emit('save', porterData)
}

const handleOverlayClick = () => {
  emit('cancel')
}

const getShiftHours = (shiftType: string) => {
  if (shiftType.includes('Day')) return '08:00 - 20:00'
  if (shiftType.includes('Night')) return '20:00 - 08:00'
  return 'Flexible'
}

// Watchers
watch(() => formData.value.shift_type, (newShiftType) => {
  if (newShiftType === 'Relief') {
    formData.value.shift_offset_days = 0
  }
})

// Lifecycle
onMounted(() => {
  if (props.porter) {
    formData.value = {
      ...props.porter,
      start_date: props.porter.start_date || new Date().toISOString().split('T')[0]
    }
  } else {
    // Set default start date to today
    formData.value.start_date = new Date().toISOString().split('T')[0]
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

.form-section {
  margin-bottom: var(--space-8);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-neutral-800);
  margin: 0 0 var(--space-4) 0;
  padding-bottom: var(--space-2);
  border-bottom: 2px solid var(--color-neutral-200);
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

.calendar-days {
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
  background: hsl(0, 0%, 45%);
  border-color: var(--color-success);
  color: var(--color-success);
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
  
  .calendar-days {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-1);
  }
  
  .modal-footer {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .calendar-days {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
