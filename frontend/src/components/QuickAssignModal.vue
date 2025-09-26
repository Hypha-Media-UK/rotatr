<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">
          
          Quick Assignment
        </h2>
        <button @click="$emit('cancel')" class="close-btn">✕</button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-content">
        <div class="staff-info">
          <div class="staff-avatar">
            <span class="avatar-text">{{ getInitials(staff.porter.name) }}</span>
          </div>
          <div class="staff-details">
            <h3 class="staff-name">{{ staff.porter.name }}</h3>
            <div class="staff-meta">
              <span class="shift-badge" :class="shiftBadgeClass(staff.porter.shift_type)">
                {{ staff.porter.shift_type }}
              </span>
              <span class="working-hours">
                {{ formatWorkingHours(staff.workingHours) }}
              </span>
            </div>
          </div>
        </div>

        <div class="assignment-form">
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
              <option
                v-for="dept in availableDepartments"
                :key="dept.id"
                :value="dept.id"
                :disabled="isDepartmentFull(dept)"
              >
                {{ dept.name }}
                <span v-if="isDepartmentFull(dept)"> (Full)</span>
                <span v-else-if="dept.staffing_level === 'Critical'"> (Critical)</span>
                <span v-else-if="dept.staffing_level === 'Low'"> (Low)</span>
              </option>
            </select>
            <span v-if="errors.department_id" class="form-error">{{ errors.department_id }}</span>
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

          <div class="form-group">
            <label for="assignmentType" class="form-label">Assignment Type</label>
            <select
              id="assignmentType"
              v-model="formData.assignment_type"
              class="form-select"
            >
              <option value="Floor Staff">Floor Staff</option>
              <option value="Relief Cover">Relief Cover</option>
            </select>
          </div>

          <div v-if="selectedDepartment" class="department-preview">
            <h4 class="preview-title">Department Information</h4>
            <div class="preview-content">
              <div class="preview-item">
                <span class="preview-label">Current Staffing:</span>
                <span class="preview-value">
                  {{ selectedDepartment.available_porters }} / {{ selectedDepartment.required_porters }}
                </span>
              </div>
              <div class="preview-item">
                <span class="preview-label">Status:</span>
                <span class="preview-value" :class="staffingStatusClass(selectedDepartment)">
                  {{ selectedDepartment.staffing_level }}
                </span>
              </div>
              <div class="preview-item">
                <span class="preview-label">Type:</span>
                <span class="preview-value">
                  {{ selectedDepartment.is_24_7 ? '24/7 Operation' : 'Scheduled Operation' }}
                </span>
              </div>
            </div>
          </div>

          <div v-if="assignmentConflicts.length > 0" class="conflicts-warning">
            <h4 class="warning-title">
              
              Assignment Conflicts
            </h4>
            <ul class="conflicts-list">
              <li v-for="conflict in assignmentConflicts" :key="conflict" class="conflict-item">
                {{ conflict }}
              </li>
            </ul>
          </div>

          <div class="assignment-summary">
            <h4 class="summary-title">Assignment Summary</h4>
            <div class="summary-content">
              <div class="summary-item">
                <span class="summary-label">Porter:</span>
                <span class="summary-value">{{ staff.porter.name }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Date:</span>
                <span class="summary-value">{{ formatDate(selectedDate) }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Shift:</span>
                <span class="summary-value">{{ activeShift }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Duration:</span>
                <span class="summary-value">{{ getAssignmentDuration() }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" @click="$emit('cancel')" class="btn btn--secondary">
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn--primary"
            :disabled="!isFormValid || assignmentConflicts.length > 0"
          >
            Create Assignment
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

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

interface AssignmentData {
  porter_id: number
  department_id: number | string
  assignment_date: string
  start_time: string
  end_time: string
  assignment_type: string
}

// Props
interface Props {
  staff: PorterAvailability
  departments: Department[]
  selectedDate: string
  activeShift: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  assign: [assignment: AssignmentData]
  cancel: []
}>()

// Reactive data
const formData = ref<AssignmentData>({
  porter_id: props.staff.porter.id,
  department_id: '',
  assignment_date: props.selectedDate,
  start_time: '',
  end_time: '',
  assignment_type: 'Floor Staff'
})

const errors = ref<Record<string, string>>({})
const assignmentConflicts = ref<string[]>([])

// Computed properties
const availableDepartments = computed(() => {
  // Filter departments that need staff
  return props.departments.filter(dept =>
    dept.staffing_level === 'Low' || dept.staffing_level === 'Critical'
  ).sort((a, b) => {
    // Prioritize critical departments
    if (a.staffing_level === 'Critical' && b.staffing_level !== 'Critical') return -1
    if (b.staffing_level === 'Critical' && a.staffing_level !== 'Critical') return 1
    return a.name.localeCompare(b.name)
  })
})

const selectedDepartment = computed(() => {
  if (!formData.value.department_id) return null
  return props.departments.find(d => d.id === Number(formData.value.department_id)) || null
})

const isFormValid = computed(() => {
  return formData.value.department_id &&
         formData.value.start_time &&
         formData.value.end_time &&
         formData.value.start_time < formData.value.end_time
})

// Methods
const validateForm = () => {
  errors.value = {}

  if (!formData.value.department_id) {
    errors.value.department_id = 'Department is required'
  }

  if (!formData.value.start_time) {
    errors.value.start_time = 'Start time is required'
  }

  if (!formData.value.end_time) {
    errors.value.end_time = 'End time is required'
  }

  if (formData.value.start_time && formData.value.end_time &&
      formData.value.start_time >= formData.value.end_time) {
    errors.value.end_time = 'End time must be after start time'
  }

  return Object.keys(errors.value).length === 0
}

const checkConflicts = () => {
  const conflicts: string[] = []

  if (selectedDepartment.value) {
    // Check if department is at capacity
    if (isDepartmentFull(selectedDepartment.value)) {
      conflicts.push('Department is at full capacity')
    }

    // Check time conflicts with porter's working hours
    const assignmentStart = timeToMinutes(formData.value.start_time)
    const assignmentEnd = timeToMinutes(formData.value.end_time)
    const workingStart = timeToMinutes(props.staff.workingHours.start)
    const workingEnd = timeToMinutes(props.staff.workingHours.end)

    if (assignmentStart < workingStart || assignmentEnd > workingEnd) {
      conflicts.push('Assignment time is outside porter\'s working hours')
    }
  }

  assignmentConflicts.value = conflicts
}

const handleSubmit = () => {
  if (!validateForm()) return

  const assignmentData: AssignmentData = {
    ...formData.value,
    department_id: Number(formData.value.department_id)
  }

  emit('assign', assignmentData)
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

const isDepartmentFull = (department: Department) => {
  return department.available_porters >= department.required_porters
}

const staffingStatusClass = (department: Department) => {
  return `staffing-status--${department.staffing_level.toLowerCase()}`
}

const timeToMinutes = (timeString: string) => {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}

const getAssignmentDuration = () => {
  if (!formData.value.start_time || !formData.value.end_time) return 'Not specified'

  const start = timeToMinutes(formData.value.start_time)
  const end = timeToMinutes(formData.value.end_time)
  const duration = end - start

  const hours = Math.floor(duration / 60)
  const minutes = duration % 60

  return `${hours}h ${minutes > 0 ? minutes + 'm' : ''}`
}

// Watchers
watch(() => formData.value.department_id, () => {
  checkConflicts()
})

watch(() => [formData.value.start_time, formData.value.end_time], () => {
  checkConflicts()
})

// Lifecycle
onMounted(() => {
  // Set default times based on shift and porter's working hours
  if (props.activeShift === 'Day') {
    formData.value.start_time = props.staff.workingHours.start.substring(0, 5)
    formData.value.end_time = props.staff.workingHours.end.substring(0, 5)
  } else {
    formData.value.start_time = props.staff.workingHours.start.substring(0, 5)
    formData.value.end_time = props.staff.workingHours.end.substring(0, 5)
  }

  // Pre-select the most critical department if available
  const criticalDept = availableDepartments.value.find(d => d.staffing_level === 'Critical')
  if (criticalDept) {
    formData.value.department_id = criticalDept.id
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
  max-width: 600px;
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

.staff-info {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--color-neutral-50);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-6);
}

.staff-avatar {
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

.staff-name {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin: 0 0 var(--space-1) 0;
  color: var(--color-neutral-800);
}

.staff-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
}

.shift-badge--day {
  background: hsl(0, 0%, 90%);
  color: hsl(0, 0%, 30%);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: var(--font-size-xs);
}

.shift-badge--night {
  background: hsl(0, 0%, 85%);
  color: hsl(0, 0%, 25%);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: var(--font-size-xs);
}

.working-hours {
  color: var(--color-neutral-600);
}

.assignment-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.form-label {
  font-weight: 500;
  color: var(--color-neutral-700);
}

.form-input,
.form-select {
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
  font-size: var(--font-size-sm);
  color: var(--color-danger);
}

.department-preview {
  padding: var(--space-4);
  background: var(--color-neutral-50);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-neutral-200);
}

.preview-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  margin: 0 0 var(--space-3) 0;
  color: var(--color-neutral-800);
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.preview-item {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-sm);
}

.preview-label {
  color: var(--color-neutral-600);
}

.preview-value {
  font-weight: 500;
  color: var(--color-neutral-800);
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

.conflicts-warning {
  padding: var(--space-4);
  background: hsl(0, 0%, 97%);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-lg);
}

.warning-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  margin: 0 0 var(--space-2) 0;
  color: var(--color-danger);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.conflicts-list {
  margin: 0;
  padding-left: var(--space-4);
}

.conflict-item {
  font-size: var(--font-size-sm);
  color: var(--color-danger);
  margin-bottom: var(--space-1);
}

.assignment-summary {
  padding: var(--space-4);
  background: var(--color-neutral-50);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-neutral-200);
}

.summary-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  margin: 0 0 var(--space-3) 0;
  color: var(--color-neutral-800);
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.summary-item {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-sm);
}

.summary-label {
  color: var(--color-neutral-600);
}

.summary-value {
  font-weight: 500;
  color: var(--color-neutral-800);
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

  .staff-info {
    flex-direction: column;
    text-align: center;
  }

  .modal-footer {
    flex-direction: column;
  }
}
</style>
