<template>
  <div class="department-management">
    <div class="management-header">
      <h2 class="section-title">
        Department Management
      </h2>

      <div class="header-actions">
        <button
          @click="refreshDepartments"
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
          <span>Add Department</span>
        </button>
      </div>
    </div>

    <div v-if="isLoading && departments.length === 0" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading departments...</p>
    </div>

    <div v-else-if="departments.length === 0" class="empty-state">
      <h3>No Departments Found</h3>
      <p>Get started by adding your first department</p>
      <button @click="openCreateModal" class="btn btn--primary">
        Add Department
      </button>
    </div>

    <div v-else class="departments-grid">
      <div
        v-for="department in departments"
        :key="department.id"
        class="department-card"
      >
        <div class="card-header">
          <div class="department-info">
            <h3 class="department-name">{{ department.name }}</h3>
            <div class="department-meta">
              <span v-if="department.is_24_7" class="meta-badge meta-badge--24-7">24/7</span>
              <span v-else class="meta-badge meta-badge--scheduled">Scheduled</span>
              <span class="meta-text">{{ department.default_porters_required }} porters required</span>
            </div>
          </div>

          <div class="card-actions">
            <button
              @click="editDepartment(department)"
              class="action-btn action-btn--edit"
              title="Edit Department"
            >
              
            </button>
            <button
              @click="deleteDepartment(department)"
              class="action-btn action-btn--delete"
              title="Delete Department"
            >
              🗑️
            </button>
          </div>
        </div>

        <div v-if="!department.is_24_7 && department.schedules?.length > 0" class="schedules-section">
          <h4 class="schedules-title">Operating Schedule</h4>
          <div class="schedules-list">
            <div
              v-for="schedule in department.schedules"
              :key="schedule.id"
              class="schedule-item"
            >
              <span class="schedule-day">{{ schedule.day_of_week }}</span>
              <span class="schedule-time">
                {{ formatTime(schedule.opens_at) }} - {{ formatTime(schedule.closes_at) }}
              </span>
              <span class="schedule-porters">{{ schedule.porters_required }} porters</span>
            </div>
          </div>
        </div>

        <div v-else-if="department.is_24_7" class="schedules-section">
          <div class="schedule-24-7">
            
            <span class="schedule-text">24/7 Operations</span>
            <span class="schedule-porters">{{ department.default_porters_required }} porters</span>
          </div>
        </div>

        <div class="card-footer">
          <div class="department-stats">
            <div class="stat">
              <span class="stat-label">Created</span>
              <span class="stat-value">{{ formatDate(department.created_at) }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Updated</span>
              <span class="stat-value">{{ formatDate(department.updated_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Department Modal -->
    <DepartmentModal
      v-if="showModal"
      :department="selectedDepartment"
      :is-editing="isEditing"
      @save="handleSaveDepartment"
      @cancel="closeModal"
    />

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      v-if="showDeleteModal"
      title="Delete Department"
      :message="`Are you sure you want to delete ${departmentToDelete?.name}? This action cannot be undone.`"
      confirm-text="Delete"
      confirm-variant="danger"
      @confirm="handleDeleteConfirm"
      @cancel="closeDeleteModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DepartmentModal from './DepartmentModal.vue'
import ConfirmModal from './ConfirmModal.vue'
import api from '../services/api'

// Types
interface Department {
  id: number
  name: string
  is_24_7: boolean
  default_porters_required: number
  created_at: string
  updated_at: string
  schedules?: Array<{
    id: number
    department_id: number
    day_of_week: string
    opens_at: string
    closes_at: string
    porters_required: number
  }>
}

// Emits
const emit = defineEmits<{
  departmentUpdated: []
}>()

// Reactive data
const departments = ref<Department[]>([])
const isLoading = ref(false)
const showModal = ref(false)
const showDeleteModal = ref(false)
const selectedDepartment = ref<Department | null>(null)
const departmentToDelete = ref<Department | null>(null)
const isEditing = ref(false)

// Methods
const refreshDepartments = async () => {
  isLoading.value = true
  try {
    const data = await api.getDepartments()
    departments.value = data
  } catch (error) {
    console.error('Failed to load departments:', error)
  } finally {
    isLoading.value = false
  }
}

const openCreateModal = () => {
  selectedDepartment.value = null
  isEditing.value = false
  showModal.value = true
}

const editDepartment = (department: Department) => {
  selectedDepartment.value = { ...department }
  isEditing.value = true
  showModal.value = true
}

const deleteDepartment = (department: Department) => {
  departmentToDelete.value = department
  showDeleteModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedDepartment.value = null
  isEditing.value = false
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  departmentToDelete.value = null
}

const handleSaveDepartment = async (departmentData: any) => {
  try {
    if (isEditing.value && selectedDepartment.value?.id) {
      // Update existing department
      await api.updateDepartment(selectedDepartment.value.id, departmentData)
    } else {
      // Create new department
      await api.createDepartment(departmentData)
    }

    // Refresh the list
    await refreshDepartments()

    // Close modal
    closeModal()

    // Emit update event
    emit('departmentUpdated')
  } catch (error) {
    console.error('Failed to save department:', error)
    // In a real app, you'd show an error message to the user
  }
}

const handleDeleteConfirm = async () => {
  if (!departmentToDelete.value) return

  try {
    // Call the API to delete the department
    await api.deleteDepartment(departmentToDelete.value.id)

    // Refresh the list
    await refreshDepartments()

    // Close modal
    closeDeleteModal()

    // Emit update event
    emit('departmentUpdated')
  } catch (error) {
    console.error('Failed to delete department:', error)
    // In a real app, you'd show an error message to the user
  }
}

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${displayHour}:${minutes} ${ampm}`
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

// Lifecycle
onMounted(() => {
  refreshDepartments()
})
</script>

<style scoped>
.department-management {
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
  gap: var(--space-3);
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

.departments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: var(--space-6);
}

.department-card {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-base);
  overflow: hidden;
  transition: all var(--transition-base);
}

.department-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.card-header {
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-neutral-200);
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: start;
  gap: var(--space-4);
}

.department-name {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin: 0 0 var(--space-2) 0;
  color: var(--color-neutral-800);
}

.department-meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.meta-badge {
  font-size: var(--font-size-xs);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-weight: 600;
}

.meta-badge--24-7 {
  background: var(--color-primary);
  color: white;
}

.meta-badge--scheduled {
  background: var(--color-neutral-200);
  color: var(--color-neutral-700);
}

.meta-text {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
}

.card-actions {
  display: flex;
  gap: var(--space-2);
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

.action-btn--edit {
  background: hsl(210, 100%, 95%);
  color: var(--color-primary);
}

.action-btn--edit:hover {
  background: hsl(210, 100%, 90%);
}

.action-btn--delete {
  background: hsl(0, 0%, 30%);
  color: var(--color-danger);
}

.action-btn--delete:hover {
  background: hsl(0, 0%, 30%);
}

.schedules-section {
  padding: var(--space-4);
}

.schedules-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-neutral-700);
  margin: 0 0 var(--space-3) 0;
}

.schedules-list {
  display: grid;
  gap: var(--space-2);
}

.schedule-item {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2);
  background: var(--color-neutral-50);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}

.schedule-day {
  font-weight: 500;
  color: var(--color-neutral-800);
}

.schedule-time {
  color: var(--color-neutral-600);
}

.schedule-porters {
  color: var(--color-primary);
  font-weight: 500;
}

.schedule-24-7 {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: hsl(210, 100%, 95%);
  border-radius: var(--radius-md);
  color: var(--color-primary);
  font-weight: 500;
}

.schedule-icon {
  font-size: var(--font-size-lg);
}

.schedule-text {
  flex: 1;
}

.card-footer {
  padding: var(--space-4);
  background: var(--color-neutral-50);
  border-top: 1px solid var(--color-neutral-200);
}

.department-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.stat {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-neutral-600);
  margin-bottom: var(--space-1);
}

.stat-value {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-neutral-800);
}

/* Responsive Design */
@container (max-width: 768px) {
  .management-header {
    grid-template-columns: 1fr;
    gap: var(--space-4);
    text-align: center;
  }

  .header-actions {
    justify-content: center;
  }

  .departments-grid {
    grid-template-columns: 1fr;
  }

  .card-header {
    grid-template-columns: 1fr;
    gap: var(--space-3);
  }

  .card-actions {
    justify-content: center;
  }

  .schedule-item {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .department-stats {
    grid-template-columns: 1fr;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
