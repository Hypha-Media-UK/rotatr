<template>
  <div class="porter-management">
    <div class="management-header">
      <h2 class="section-title">

        Porter Management
      </h2>

      <div class="header-actions">
        <div class="filter-controls">
          <select v-model="filterDepartment" class="filter-select">
            <option value="">All Departments</option>
            <option v-for="dept in departments" :key="dept.id" :value="dept.id">
              {{ dept.name }}
            </option>
          </select>

          <select v-model="filterShift" class="filter-select">
            <option value="">All Shifts</option>
            <option value="Day A">Day A</option>
            <option value="Day B">Day B</option>
            <option value="Night A">Night A</option>
            <option value="Night B">Night B</option>
            <option value="Relief">Relief</option>
          </select>
        </div>

        <button
          @click="refreshPorters"
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
          <span>Add Porter</span>
        </button>
      </div>
    </div>

    <div class="stats-summary">
      <div class="stat-card">
        <span class="stat-value">{{ filteredPorters.length }}</span>
        <span class="stat-label">Total Porters</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ activePorters }}</span>
        <span class="stat-label">Active</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ dayShiftPorters }}</span>
        <span class="stat-label">Day Shift</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ nightShiftPorters }}</span>
        <span class="stat-label">Night Shift</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ reliefPorters }}</span>
        <span class="stat-label">Relief</span>
      </div>
    </div>

    <div v-if="isLoading && porters.length === 0" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading porters...</p>
    </div>

    <div v-else-if="filteredPorters.length === 0" class="empty-state">
      <div class="empty-icon"></div>
      <h3>{{ porters.length === 0 ? 'No Porters Found' : 'No Matching Porters' }}</h3>
      <p>{{ porters.length === 0 ? 'Get started by adding your first porter' : 'Try adjusting your filters' }}</p>
      <button v-if="porters.length === 0" @click="openCreateModal" class="btn btn--primary">
        Add Porter
      </button>
    </div>

    <div v-else class="porters-grid">
      <div
        v-for="porter in filteredPorters"
        :key="porter.id"
        class="porter-card"
        :class="porterCardClass(porter)"
      >
        <div class="card-header">
          <div class="porter-avatar">
            <span class="avatar-text">{{ getInitials(porter.first_name, porter.last_name) }}</span>
          </div>

          <div class="porter-info">
            <h3 class="porter-name">{{ porter.first_name }} {{ porter.last_name }}</h3>
            <div class="porter-meta">
              <span class="meta-badge" :class="shiftBadgeClass(porter.shift_type)">
                {{ porter.shift_type }}
              </span>
              <span class="meta-text">{{ porter.department_name }}</span>
            </div>
          </div>

          <div class="card-actions">
            <button
              @click="viewPorterDetails(porter)"
              class="action-btn action-btn--view"
              title="View Details"
            >
              👁️
            </button>
            <button
              @click="editPorter(porter)"
              class="action-btn action-btn--edit"
              title="Edit Porter"
            >

            </button>
            <button
              @click="deletePorter(porter)"
              class="action-btn action-btn--delete"
              title="Delete Porter"
            >
              🗑️
            </button>
          </div>
        </div>

        <div class="card-content">
          <div class="porter-details">
            <div class="detail-item">
              <span class="detail-label">Employee ID</span>
              <span class="detail-value">{{ porter.employee_id || 'N/A' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Shift Offset</span>
              <span class="detail-value">{{ porter.shift_offset_days }} days</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Contracted Hours</span>
              <span class="detail-value">{{ porter.contracted_hours || 40 }}h/week</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Status</span>
              <span class="detail-value" :class="statusClass(porter)">
                {{ getPorterStatus(porter) }}
              </span>
            </div>
          </div>

          <div class="porter-schedule">
            <h4 class="schedule-title">Current Schedule</h4>
            <div class="schedule-info">
              <div class="schedule-pattern">

                <span class="pattern-text">{{ getSchedulePattern(porter) }}</span>
              </div>
              <div class="next-shift">
                <span class="next-label">Next Shift:</span>
                <span class="next-date">{{ getNextShiftDate(porter) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card-footer">
          <div class="porter-stats">
            <div class="stat">
              <span class="stat-label">Joined</span>
              <span class="stat-value">{{ formatDate(porter.created_at) }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Updated</span>
              <span class="stat-value">{{ formatDate(porter.updated_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Porter Modal -->
    <PorterModal
      v-if="showModal"
      :porter="selectedPorter"
      :departments="departments"
      :is-editing="isEditing"
      @save="handleSavePorter"
      @cancel="closeModal"
    />

    <!-- Porter Details Modal -->
    <PorterDetailsModal
      v-if="showDetailsModal"
      :porter="selectedPorter"
      @close="closeDetailsModal"
      @edit="editPorterFromDetails"
    />

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      v-if="showDeleteModal"
      title="Delete Porter"
      :message="`Are you sure you want to delete ${porterToDelete?.first_name} ${porterToDelete?.last_name}? This action cannot be undone.`"
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

import PorterModal from './PorterModal.vue'
import PorterDetailsModal from './PorterDetailsModal.vue'

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
  created_at: string
  updated_at: string
}

interface Department {
  id: number
  name: string
}

// Emits
const emit = defineEmits<{
  porterUpdated: []
}>()

// Reactive data
const porters = ref<Porter[]>([])
const departments = ref<Department[]>([])
const isLoading = ref(false)
const showModal = ref(false)
const showDetailsModal = ref(false)
const showDeleteModal = ref(false)
const selectedPorter = ref<Porter | null>(null)
const porterToDelete = ref<Porter | null>(null)
const isEditing = ref(false)

// Filters
const filterDepartment = ref('')
const filterShift = ref('')

// Computed properties
const filteredPorters = computed(() => {
  let filtered = porters.value

  if (filterDepartment.value) {
    filtered = filtered.filter(p => p.department_id === parseInt(filterDepartment.value))
  }

  if (filterShift.value) {
    filtered = filtered.filter(p => p.shift_type === filterShift.value)
  }

  return filtered
})

const activePorters = computed(() =>
  filteredPorters.value.filter(p => getPorterStatus(p) === 'Active').length
)

const dayShiftPorters = computed(() =>
  filteredPorters.value.filter(p => p.shift_type.includes('Day')).length
)

const nightShiftPorters = computed(() =>
  filteredPorters.value.filter(p => p.shift_type.includes('Night')).length
)

const reliefPorters = computed(() =>
  filteredPorters.value.filter(p => p.shift_type === 'Relief').length
)

// Methods
const refreshPorters = async () => {
  isLoading.value = true
  try {
    const [porterData, departmentData] = await Promise.all([
      api.getPorters(),
      api.getDepartments()
    ])
    porters.value = porterData
    departments.value = departmentData
  } catch (error) {
    console.error('Failed to load porters:', error)
  } finally {
    isLoading.value = false
  }
}

const openCreateModal = () => {
  selectedPorter.value = null
  isEditing.value = false
  showModal.value = true
}

const editPorter = (porter: Porter) => {
  selectedPorter.value = { ...porter }
  isEditing.value = true
  showModal.value = true
}

const viewPorterDetails = (porter: Porter) => {
  selectedPorter.value = porter
  showDetailsModal.value = true
}

const deletePorter = (porter: Porter) => {
  porterToDelete.value = porter
  showDeleteModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedPorter.value = null
  isEditing.value = false
}

const closeDetailsModal = () => {
  showDetailsModal.value = false
  selectedPorter.value = null
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  porterToDelete.value = null
}

const editPorterFromDetails = () => {
  closeDetailsModal()
  if (selectedPorter.value) {
    editPorter(selectedPorter.value)
  }
}

const handleSavePorter = async (porterData: any) => {
  try {
    if (isEditing.value && selectedPorter.value?.id) {
      // Update existing porter
      await api.updatePorter(selectedPorter.value.id, porterData)
    } else {
      // Create new porter
      await api.createPorter(porterData)
    }

    // Refresh the list
    await refreshPorters()

    // Close modal
    closeModal()

    // Emit update event
    emit('porterUpdated')
  } catch (error) {
    console.error('Failed to save porter:', error)
    // In a real app, you'd show an error message to the user
  }
}

const handleDeleteConfirm = async () => {
  if (!porterToDelete.value) return

  try {
    // Call the API to delete the porter
    await api.deletePorter(porterToDelete.value.id)

    // Refresh the list
    await refreshPorters()

    // Close modal
    closeDeleteModal()

    // Emit update event
    emit('porterUpdated')
  } catch (error) {
    console.error('Failed to delete porter:', error)
    // In a real app, you'd show an error message to the user
  }
}

// Utility methods
const getInitials = (firstName: string, lastName: string) => {
  const first = firstName?.charAt(0) || ''
  const last = lastName?.charAt(0) || ''
  return `${first}${last}`.toUpperCase()
}

const porterCardClass = (porter: Porter) => {
  const status = getPorterStatus(porter)
  return `porter-card--${status.toLowerCase().replace(' ', '-')}`
}

const shiftBadgeClass = (shiftType: string) => {
  if (shiftType.includes('Day')) return 'meta-badge--day'
  if (shiftType.includes('Night')) return 'meta-badge--night'
  if (shiftType === 'Relief') return 'meta-badge--relief'
  return 'meta-badge--default'
}

const statusClass = (porter: Porter) => {
  const status = getPorterStatus(porter)
  return `status--${status.toLowerCase().replace(' ', '-')}`
}

const getPorterStatus = (porter: Porter) => {
  return porter.status ? porter.status.charAt(0).toUpperCase() + porter.status.slice(1).replace('_', ' ') : 'Active'
}

const getSchedulePattern = (porter: Porter) => {
  if (porter.shift_type === 'Relief') return 'Flexible Schedule'
  return '4 on / 4 off cycle'
}

const getNextShiftDate = (porter: Porter) => {
  // This would calculate the next shift based on the shift calculation logic
  const today = new Date()
  const nextShift = new Date(today)
  nextShift.setDate(today.getDate() + 1)
  return nextShift.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
  refreshPorters()
})
</script>

<style scoped>
.porter-management {
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

.filter-controls {
  display: flex;
  gap: var(--space-2);
}

.filter-select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: white;
  min-width: 140px;
}

.stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
  padding: var(--space-4);
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-base);
}

.stat-card {
  text-align: center;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-neutral-50);
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

.porters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: var(--space-6);
}

.porter-card {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-base);
  overflow: hidden;
  transition: all var(--transition-base);
  border-left: 4px solid var(--color-neutral-300);
}

.porter-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.porter-card--active {
  border-left-color: var(--color-success);
}

.porter-card--inactive {
  border-left-color: var(--color-neutral-400);
  opacity: 0.8;
}

.porter-card--on-leave {
  border-left-color: var(--color-warning);
}

.card-header {
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-neutral-200);
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-4);
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
  flex-wrap: wrap;
}

.meta-badge {
  font-size: var(--font-size-xs);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-weight: 600;
}

.meta-badge--day {
  background: hsl(0, 0%, 55%);
  color: hsl(0, 0%, 55%);
}

.meta-badge--night {
  background: hsl(0, 0%, 40%);
  color: hsl(0, 0%, 40%);
}

.meta-badge--relief {
  background: hsl(0, 0%, 45%);
  color: var(--color-success);
}

.meta-badge--default {
  background: var(--color-neutral-200);
  color: var(--color-neutral-700);
}

.meta-text {
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
  background: hsl(0, 0%, 50%);
  color: hsl(0, 0%, 50%);
}

.action-btn--view:hover {
  background: hsl(0, 0%, 50%);
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

.card-content {
  padding: var(--space-4);
}

.porter-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.detail-label {
  font-size: var(--font-size-xs);
  color: var(--color-neutral-600);
  font-weight: 500;
}

.detail-value {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-800);
  font-weight: 500;
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

.porter-schedule {
  padding: var(--space-3);
  background: var(--color-neutral-50);
  border-radius: var(--radius-md);
}

.schedule-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-neutral-700);
  margin: 0 0 var(--space-2) 0;
}

.schedule-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.schedule-pattern {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-neutral-700);
}

.pattern-icon {
  font-size: var(--font-size-base);
}

.next-shift {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-xs);
}

.next-label {
  color: var(--color-neutral-600);
}

.next-date {
  color: var(--color-primary);
  font-weight: 500;
}

.card-footer {
  padding: var(--space-4);
  background: var(--color-neutral-50);
  border-top: 1px solid var(--color-neutral-200);
}

.porter-stats {
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

  .filter-controls {
    justify-content: center;
  }

  .stats-summary {
    grid-template-columns: repeat(3, 1fr);
  }

  .porters-grid {
    grid-template-columns: 1fr;
  }

  .card-header {
    grid-template-columns: 1fr;
    text-align: center;
    gap: var(--space-3);
  }

  .porter-details {
    grid-template-columns: 1fr;
  }

  .porter-stats {
    grid-template-columns: 1fr;
  }
}

@container (max-width: 480px) {
  .stats-summary {
    grid-template-columns: repeat(2, 1fr);
  }

  .filter-controls {
    flex-direction: column;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
