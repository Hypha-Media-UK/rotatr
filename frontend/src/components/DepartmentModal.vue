<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">

          {{ isEditing ? 'Edit Department' : 'Add Department' }}
        </h2>
        <button @click="$emit('cancel')" class="close-btn">✕</button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-content">
        <div class="form-section">
          <h3 class="section-title">Basic Information</h3>

          <div class="form-group">
            <label for="name" class="form-label">Department Name *</label>
            <input
              id="name"
              v-model="formData.name"
              type="text"
              class="form-input"
              placeholder="e.g., Emergency Department"
              required
              :class="{ 'form-input--error': errors.name }"
            />
            <span v-if="errors.name" class="form-error">{{ errors.name }}</span>
          </div>

          <div class="form-group">
            <label for="defaultPorters" class="form-label">Default Porters Required *</label>
            <input
              id="defaultPorters"
              v-model.number="formData.default_porters_required"
              type="number"
              min="1"
              max="20"
              class="form-input"
              required
              :class="{ 'form-input--error': errors.default_porters_required }"
            />
            <span v-if="errors.default_porters_required" class="form-error">{{ errors.default_porters_required }}</span>
          </div>

          <div class="form-group">
            <label class="form-checkbox">
              <input
                v-model="formData.is_24_7"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="checkbox-label">24/7 Operations</span>
              <span class="checkbox-description">Department operates around the clock</span>
            </label>
          </div>
        </div>

        <div v-if="!formData.is_24_7" class="form-section">
          <h3 class="section-title">Operating Schedule</h3>
          <p class="section-description">Define when this department operates during the week</p>


          <div class="schedules-container">
            <div
              v-for="(schedule, index) in formData.schedules"
              :key="index"
              class="schedule-row"
            >
              <div class="schedule-day">
                <select
                  v-model="schedule.day_of_week"
                  class="form-select"
                  required
                >
                  <option value="">Select Day</option>
                  <option v-for="day in daysOfWeek" :key="day" :value="day">{{ day }}</option>
                </select>
              </div>

              <div class="schedule-time">
                <input
                  v-model="schedule.opens_at"
                  type="time"
                  class="form-input"
                  required
                />
                <span class="time-separator">to</span>
                <input
                  v-model="schedule.closes_at"
                  type="time"
                  class="form-input"
                  required
                />
              </div>

              <div class="schedule-porters">
                <input
                  v-model.number="schedule.porters_required"
                  type="number"
                  min="1"
                  max="20"
                  class="form-input"
                  placeholder="Porters"
                  required
                />
              </div>

              <button
                type="button"
                @click="removeSchedule(index)"
                class="remove-btn"
                :disabled="formData.schedules.length === 1"
              >
                🗑️
              </button>
            </div>

            <button
              type="button"
              @click="addSchedule"
              class="add-schedule-btn"
              :disabled="formData.schedules.length >= 7"
            >
              Add Day
            </button>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" @click="$emit('cancel')" class="btn btn--secondary">
            Cancel
          </button>
          <button type="submit" class="btn btn--primary" :disabled="!isFormValid">
            {{ isEditing ? 'Update Department' : 'Create Department' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

// Types
interface Schedule {
  day_of_week: string
  opens_at: string
  closes_at: string
  porters_required: number
}

interface Department {
  id?: number
  name: string
  is_24_7: boolean
  default_porters_required: number
  schedules?: Schedule[]
}

// Props
interface Props {
  department?: Department | null
  isEditing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  department: null,
  isEditing: false
})

// Emits
const emit = defineEmits<{
  save: [department: Department]
  cancel: []
}>()

// Reactive data
const formData = ref<Department>({
  name: '',
  is_24_7: false,
  default_porters_required: 1,
  schedules: [
    {
      day_of_week: '',
      opens_at: '08:00',
      closes_at: '17:00',
      porters_required: 1
    }
  ]
})

const errors = ref<Record<string, string>>({})

const daysOfWeek = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
]

// Computed properties
const isFormValid = computed(() => {
  if (!formData.value.name.trim()) return false
  if (formData.value.default_porters_required < 1) return false

  if (!formData.value.is_24_7) {
    return formData.value.schedules?.every(schedule =>
      schedule.day_of_week &&
      schedule.opens_at &&
      schedule.closes_at &&
      schedule.porters_required >= 1
    ) ?? false
  }

  return true
})

// Methods
const validateForm = () => {
  errors.value = {}

  if (!formData.value.name.trim()) {
    errors.value.name = 'Department name is required'
  }

  if (formData.value.default_porters_required < 1) {
    errors.value.default_porters_required = 'At least 1 porter is required'
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = () => {
  if (!validateForm()) return

  const departmentData = { ...formData.value }

  // Remove schedules if 24/7
  if (departmentData.is_24_7) {
    departmentData.schedules = []
  }

  emit('save', departmentData)
}

const handleOverlayClick = () => {
  emit('cancel')
}

const addSchedule = () => {
  if (formData.value.schedules && formData.value.schedules.length < 7) {
    formData.value.schedules.push({
      day_of_week: '',
      opens_at: '08:00',
      closes_at: '17:00',
      porters_required: formData.value.default_porters_required
    })
  }
}

const removeSchedule = (index: number) => {
  if (formData.value.schedules && formData.value.schedules.length > 1) {
    formData.value.schedules.splice(index, 1)
  }
}

// Watchers
watch(() => formData.value.default_porters_required, (newValue) => {
  // Update all schedule porter requirements when default changes
  if (formData.value.schedules) {
    formData.value.schedules.forEach(schedule => {
      if (schedule.porters_required === 0 || !schedule.porters_required) {
        schedule.porters_required = newValue
      }
    })
  }
})

watch(() => formData.value.is_24_7, (is24_7) => {
  if (is24_7) {
    // Clear schedules when switching to 24/7
    formData.value.schedules = []
  } else {
    // Add default schedule when switching from 24/7
    formData.value.schedules = [
      {
        day_of_week: '',
        opens_at: '08:00',
        closes_at: '17:00',
        porters_required: formData.value.default_porters_required
      }
    ]
  }
})

// Lifecycle
onMounted(() => {
  if (props.department) {
    console.log('DepartmentModal - Received department:', JSON.stringify(props.department, null, 2))
    console.log('DepartmentModal - Department schedules length:', props.department.schedules?.length)
    console.log('DepartmentModal - Department schedules:', JSON.stringify(props.department.schedules, null, 2))
    console.log('DepartmentModal - Department is_24_7:', props.department.is_24_7)

    formData.value = {
      ...props.department,
      schedules: props.department.schedules ? [...props.department.schedules] : []
    }

    console.log('DepartmentModal - FormData after setup:', JSON.stringify(formData.value, null, 2))
    console.log('DepartmentModal - FormData schedules length:', formData.value.schedules?.length)
    console.log('DepartmentModal - FormData is_24_7:', formData.value.is_24_7)

    // Ensure at least one schedule for non-24/7 departments
    if (!formData.value.is_24_7 && (!formData.value.schedules || formData.value.schedules.length === 0)) {
      formData.value.schedules = [
        {
          day_of_week: '',
          opens_at: '08:00',
          closes_at: '17:00',
          porters_required: formData.value.default_porters_required
        }
      ]
      console.log('DepartmentModal - Added default schedule for non-24/7 department')
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

.form-section {
  margin-bottom: var(--space-8);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-neutral-800);
  margin: 0 0 var(--space-2) 0;
}

.section-description {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
  margin: 0 0 var(--space-4) 0;
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

.form-checkbox {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  cursor: pointer;
}

.checkbox-input {
  margin-top: 2px;
}

.checkbox-label {
  font-weight: 500;
  color: var(--color-neutral-800);
}

.checkbox-description {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
  margin-top: var(--space-1);
}

.schedules-container {
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  background: var(--color-neutral-50);
}

.schedule-row {
  display: grid;
  grid-template-columns: 1fr 2fr auto auto;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
  padding: var(--space-3);
  background: white;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-neutral-200);
}

.schedule-time {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.time-separator {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
  white-space: nowrap;
}

.remove-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-md);
  background: hsl(0, 0%, 95%);
  color: var(--color-danger);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover:not(:disabled) {
  background: hsl(0, 0%, 90%);
}

.remove-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.add-schedule-btn {
  width: 100%;
  padding: var(--space-3);
  border: 2px dashed var(--color-neutral-300);
  border-radius: var(--radius-md);
  background: none;
  color: var(--color-neutral-600);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
}

.add-schedule-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: hsl(210, 100%, 98%);
}

.add-schedule-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

  .schedule-row {
    grid-template-columns: 1fr;
    gap: var(--space-2);
  }

  .schedule-time {
    justify-content: center;
  }

  .modal-footer {
    flex-direction: column;
  }
}
</style>
