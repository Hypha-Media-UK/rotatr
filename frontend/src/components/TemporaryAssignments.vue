<template>
  <div class="temporary-assignments">
    <div class="assignments-header">
      <h2 class="section-title">
        Temporary Assignments
      </h2>

      <div class="header-controls">
        <div class="date-selector">
          <label for="assignment-date" class="date-label">Assignment Date:</label>
          <input
            id="assignment-date"
            v-model="selectedDate"
            type="date"
            class="date-input"
          />
        </div>

        <div class="shift-toggle">
          <button
            @click="activeShift = 'Day'"
            class="shift-btn"
            :class="{ 'shift-btn--active': activeShift === 'Day' }"
          >
            Day
          </button>
          <button
            @click="activeShift = 'Night'"
            class="shift-btn"
            :class="{ 'shift-btn--active': activeShift === 'Night' }"
          >
            Night
          </button>
        </div>

        <button @click="refreshData" class="btn btn--secondary" :disabled="isLoading">
          <span v-if="!isLoading">Refresh</span>
          <span v-else>Loading...</span>
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading assignment data...</p>
    </div>

    <div v-else class="assignments-layout">
      <!-- Available Floor Staff Panel -->
      <div class="floor-staff-panel">
        <div class="panel-header">
          <h3 class="panel-title">

            Available Floor Staff
            <span class="staff-count">({{ availableFloorStaff.length }})</span>
          </h3>

          <div class="panel-filters">
            <select v-model="staffFilter" class="filter-select">
              <option value="all">All Staff</option>
              <option value="available">Available Only</option>
              <option value="conflicts">With Conflicts</option>
            </select>
          </div>
        </div>

        <div class="staff-list">
          <div
            v-for="staff in filteredFloorStaff"
            :key="staff.porter.id"
            class="staff-card"
            :class="staffCardClass(staff)"
            draggable="true"
            @dragstart="handleDragStart($event, staff)"
            @dragend="handleDragEnd"
          >
            <div class="staff-avatar">
              <span class="avatar-text">{{ getInitials(staff.porter.name) }}</span>
            </div>

            <div class="staff-info">
              <h4 class="staff-name">{{ staff.porter.name }}</h4>
              <div class="staff-meta">
                <span class="shift-badge" :class="shiftBadgeClass(staff.porter.shift_type)">
                  {{ staff.porter.shift_type }}
                </span>
                <span class="department-text">{{ staff.porter.department_name || 'Floor Staff' }}</span>
              </div>

              <div class="availability-status">
                <span class="status-indicator" :class="availabilityClass(staff)">
                  {{ availabilityIcon(staff) }}
                </span>
                <span class="status-text">{{ availabilityText(staff) }}</span>
              </div>

              <div v-if="staff.conflictReason" class="conflict-reason">

                {{ staff.conflictReason }}
              </div>

              <div class="working-hours">

                {{ formatWorkingHours(staff.workingHours) }}
              </div>
            </div>

            <div class="staff-actions">
              <button
                v-if="staff.isAvailable"
                @click="showQuickAssignModal(staff)"
                class="btn btn--small btn--primary"
                title="Quick Assign"
              >
                Assign
              </button>

              <button
                @click="viewStaffDetails(staff)"
                class="btn btn--small btn--secondary"
                title="View Details"
              >
                👁️
              </button>
            </div>
          </div>

          <div v-if="filteredFloorStaff.length === 0" class="no-staff">
            <h4>No Floor Staff Available</h4>
            <p>{{ getNoStaffMessage() }}</p>
          </div>
        </div>
      </div>

      <!-- Department Assignment Panel -->
      <div class="departments-panel">
        <div class="panel-header">
          <h3 class="panel-title">
            Department Assignments
            <span class="dept-count">({{ departments.length }})</span>
          </h3>

          <div class="panel-filters">
            <select v-model="departmentFilter" class="filter-select">
              <option value="all">All Departments</option>
              <option value="understaffed">Understaffed</option>
              <option value="critical">Critical</option>
              <option value="24-7">24/7 Only</option>
            </select>
          </div>
        </div>

        <div class="departments-grid">
          <div
            v-for="department in filteredDepartments"
            :key="department.id"
            class="department-card"
            :class="departmentCardClass(department)"
            @drop="handleDrop($event, department)"
            @dragover="handleDragOver"
            @dragenter="handleDragEnter"
            @dragleave="handleDragLeave"
          >
            <div class="department-header">
              <div class="department-info">
                <h4 class="department-name">{{ department.name }}</h4>
                <div class="department-type">
                  <span v-if="department.is_24_7" class="type-badge type-badge--24-7">24/7</span>
                  <span v-else class="type-badge type-badge--scheduled">Scheduled</span>
                </div>
              </div>

              <div class="staffing-status" :class="staffingStatusClass(department)">

                {{ staffingStatusText(department) }}
              </div>
            </div>

            <div class="department-content">
              <div class="staffing-metrics">
                <div class="metric">
                  <span class="metric-label">Required</span>
                  <span class="metric-value">{{ department.required_porters }}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Available</span>
                  <span class="metric-value available">{{ department.available_porters }}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Temp Assigned</span>
                  <span class="metric-value temp">{{ getTempAssignedCount(department.id) }}</span>
                </div>
              </div>

              <div class="drop-zone" :class="{ 'drop-zone--active': isDragOver }">
                <div class="drop-zone-content">

                  <span class="drop-text">Drop porter here to assign</span>
                </div>
              </div>

              <div v-if="getTempAssignments(department.id).length > 0" class="temp-assignments">
                <h5 class="assignments-title">Temporary Assignments</h5>
                <div
                  v-for="assignment in getTempAssignments(department.id)"
                  :key="assignment.id"
                  class="assignment-item"
                >
                  <div class="assignment-porter">
                    <span class="porter-avatar">{{ getInitials(assignment.porter_name) }}</span>
                    <span class="porter-name">{{ assignment.porter_name }}</span>
                  </div>

                  <div class="assignment-time">
                    {{ formatTime(assignment.start_time) }} - {{ formatTime(assignment.end_time) }}
                  </div>

                  <button
                    @click="removeAssignment(assignment)"
                    class="remove-btn"
                    title="Remove Assignment"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Assignment Modal -->
    <QuickAssignModal
      v-if="showQuickAssign"
      :staff="selectedStaff"
      :departments="departments"
      :selected-date="selectedDate"
      :active-shift="activeShift"
      @assign="handleQuickAssign"
      @cancel="closeQuickAssignModal"
    />

    <!-- Assignment Confirmation Modal -->
    <AssignmentConfirmModal
      v-if="showConfirmModal"
      :staff="draggedStaff"
      :department="targetDepartment"
      :selected-date="selectedDate"
      :active-shift="activeShift"
      :conflicts="assignmentConflicts"
      @confirm="confirmAssignment"
      @cancel="cancelAssignment"
    />

    <!-- Staff Details Modal -->
    <StaffDetailsModal
      v-if="showStaffDetails"
      :staff="selectedStaff"
      :selected-date="selectedDate"
      @close="closeStaffDetailsModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import api from '../services/api'

// Import modal components (to be created)
import QuickAssignModal from './QuickAssignModal.vue'
import AssignmentConfirmModal from './AssignmentConfirmModal.vue'
import StaffDetailsModal from './StaffDetailsModal.vue'

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

interface TemporaryAssignment {
  id: number
  porter_id: number
  department_id: number
  assignment_date: string
  start_time: string
  end_time: string
  assignment_type: string
  porter_name: string
  department_name: string
}

// Props
interface Props {
  selectedDate?: string
}

const props = withDefaults(defineProps<Props>(), {
  selectedDate: () => new Date().toISOString().split('T')[0]
})

// Emits
const emit = defineEmits<{
  assignmentCreated: [assignment: TemporaryAssignment]
  assignmentRemoved: [assignmentId: number]
}>()

// Reactive data
const selectedDate = ref(props.selectedDate)
const activeShift = ref<'Day' | 'Night'>('Day')
const isLoading = ref(false)
const availableFloorStaff = ref<PorterAvailability[]>([])
const departments = ref<Department[]>([])
const temporaryAssignments = ref<TemporaryAssignment[]>([])

// Filters
const staffFilter = ref('all')
const departmentFilter = ref('all')

// Drag and drop state
const isDragOver = ref(false)
const draggedStaff = ref<PorterAvailability | null>(null)
const targetDepartment = ref<Department | null>(null)
const assignmentConflicts = ref<string[]>([])

// Modal state
const showQuickAssign = ref(false)
const showConfirmModal = ref(false)
const showStaffDetails = ref(false)
const selectedStaff = ref<PorterAvailability | null>(null)

// Computed properties
const filteredFloorStaff = computed(() => {
  let filtered = availableFloorStaff.value

  if (staffFilter.value === 'available') {
    filtered = filtered.filter(staff => staff.isAvailable)
  } else if (staffFilter.value === 'conflicts') {
    filtered = filtered.filter(staff => !staff.isAvailable && staff.conflictReason)
  }

  // Filter by active shift
  filtered = filtered.filter(staff =>
    staff.porter.shift_type.toLowerCase().includes(activeShift.value.toLowerCase())
  )

  return filtered
})

const filteredDepartments = computed(() => {
  let filtered = departments.value

  if (departmentFilter.value === 'understaffed') {
    filtered = filtered.filter(dept => dept.staffing_level === 'Low')
  } else if (departmentFilter.value === 'critical') {
    filtered = filtered.filter(dept => dept.staffing_level === 'Critical')
  } else if (departmentFilter.value === '24-7') {
    filtered = filtered.filter(dept => dept.is_24_7)
  }

  return filtered
})

// Methods
const refreshData = async () => {
  isLoading.value = true
  try {
    await Promise.all([
      loadFloorStaff(),
      loadDepartments(),
      loadTemporaryAssignments()
    ])
  } catch (error) {
    console.error('Failed to refresh data:', error)
  } finally {
    isLoading.value = false
  }
}

const loadFloorStaff = async () => {
  try {
    // This would call the backend API to get floor staff availability
    // For now, using mock data
    availableFloorStaff.value = [
      {
        porter: {
          id: 1,
          name: 'John Smith',
          shift_type: 'Day A',
          shift_offset_days: 0,
          regular_department_id: 0,
          is_floor_staff: true,
          porter_type: 'Porter',
          department_name: 'Floor Staff'
        },
        isWorking: true,
        isAvailable: true,
        workingHours: { start: '08:00:00', end: '20:00:00' }
      },
      {
        porter: {
          id: 2,
          name: 'Sarah Johnson',
          shift_type: 'Day B',
          shift_offset_days: 4,
          regular_department_id: 0,
          is_floor_staff: true,
          porter_type: 'Porter',
          department_name: 'Floor Staff'
        },
        isWorking: false,
        isAvailable: false,
        conflictReason: 'Not working today (Day 2 of 4 off)',
        workingHours: { start: '08:00:00', end: '20:00:00' }
      }
    ]
  } catch (error) {
    console.error('Failed to load floor staff:', error)
  }
}

const loadDepartments = async () => {
  try {
    const data = await api.getDepartments()
    // Add mock staffing data
    departments.value = data.map(dept => ({
      ...dept,
      required_porters: Math.floor(Math.random() * 5) + 2,
      available_porters: Math.floor(Math.random() * 3) + 1,
      staffing_level: Math.random() > 0.7 ? 'Critical' : Math.random() > 0.4 ? 'Low' : 'Adequate'
    }))
  } catch (error) {
    console.error('Failed to load departments:', error)
  }
}

const loadTemporaryAssignments = async () => {
  try {
    const data = await api.getTemporaryAssignments(selectedDate.value)
    temporaryAssignments.value = data
  } catch (error) {
    console.error('Failed to load temporary assignments:', error)
  }
}

// Drag and drop handlers
const handleDragStart = (event: DragEvent, staff: PorterAvailability) => {
  if (!staff.isAvailable) {
    event.preventDefault()
    return
  }

  draggedStaff.value = staff
  event.dataTransfer!.effectAllowed = 'move'
  event.dataTransfer!.setData('text/plain', staff.porter.id.toString())
}

const handleDragEnd = () => {
  isDragOver.value = false
  draggedStaff.value = null
  targetDepartment.value = null
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'move'
}

const handleDragEnter = () => {
  isDragOver.value = true
}

const handleDragLeave = () => {
  isDragOver.value = false
}

const handleDrop = async (event: DragEvent, department: Department) => {
  event.preventDefault()
  isDragOver.value = false

  if (!draggedStaff.value) return

  targetDepartment.value = department

  // Check for conflicts
  const conflicts = await checkAssignmentConflicts(draggedStaff.value, department)
  assignmentConflicts.value = conflicts

  // Show confirmation modal
  showConfirmModal.value = true
}

// Helper methods
const getInitials = (name: string) => {
  return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase()
}

const staffCardClass = (staff: PorterAvailability) => {
  return {
    'staff-card--available': staff.isAvailable,
    'staff-card--unavailable': !staff.isAvailable,
    'staff-card--conflict': staff.conflictReason
  }
}

const availabilityClass = (staff: PorterAvailability) => {
  if (staff.isAvailable) return 'status-indicator--available'
  if (staff.conflictReason) return 'status-indicator--conflict'
  return 'status-indicator--unavailable'
}

const availabilityIcon = (staff: PorterAvailability) => {
  if (staff.isAvailable) return ''
  if (staff.conflictReason) return ''
  return ''
}

const availabilityText = (staff: PorterAvailability) => {
  if (staff.isAvailable) return 'Available'
  if (staff.conflictReason) return 'Conflict'
  return 'Not Working'
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

const formatTime = (time: string) => {
  return time.substring(0, 5)
}

const getNoStaffMessage = () => {
  if (staffFilter.value === 'available') {
    return `No floor staff available for ${activeShift.value} shift on ${selectedDate.value}`
  }
  if (staffFilter.value === 'conflicts') {
    return 'No staff with conflicts found'
  }
  return `No floor staff found for ${activeShift.value} shift`
}

const departmentCardClass = (department: Department) => {
  return {
    'department-card--adequate': department.staffing_level === 'Adequate',
    'department-card--low': department.staffing_level === 'Low',
    'department-card--critical': department.staffing_level === 'Critical'
  }
}

const staffingStatusClass = (department: Department) => {
  return `staffing-status--${department.staffing_level.toLowerCase()}`
}

const staffingStatusIcon = (department: Department) => {
  switch (department.staffing_level) {
    case 'Adequate': return ''
    case 'Low': return ''
    case 'Critical': return ''
    default: return ''
  }
}

const staffingStatusText = (department: Department) => {
  return department.staffing_level
}

const getTempAssignedCount = (departmentId: number) => {
  return temporaryAssignments.value.filter(a => a.department_id === departmentId).length
}

const getTempAssignments = (departmentId: number) => {
  return temporaryAssignments.value.filter(a => a.department_id === departmentId)
}

const checkAssignmentConflicts = async (staff: PorterAvailability, department: Department): Promise<string[]> => {
  const conflicts: string[] = []

  // Check if staff is already assigned to another department
  const existingAssignment = temporaryAssignments.value.find(a =>
    a.porter_id === staff.porter.id && a.assignment_date === selectedDate.value
  )

  if (existingAssignment) {
    conflicts.push(`Already assigned to ${existingAssignment.department_name}`)
  }

  // Check if department is at capacity
  const currentAssignments = getTempAssignedCount(department.id)
  const totalStaff = department.available_porters + currentAssignments

  if (totalStaff >= department.required_porters) {
    conflicts.push('Department is at full capacity')
  }

  return conflicts
}

// Modal handlers
const showQuickAssignModal = (staff: PorterAvailability) => {
  selectedStaff.value = staff
  showQuickAssign.value = true
}

const closeQuickAssignModal = () => {
  showQuickAssign.value = false
  selectedStaff.value = null
}

const handleQuickAssign = async (assignmentData: any) => {
  try {
    const assignment = await api.createTemporaryAssignment(assignmentData)
    temporaryAssignments.value.push(assignment)
    emit('assignmentCreated', assignment)
    closeQuickAssignModal()
  } catch (error) {
    console.error('Failed to create assignment:', error)
  }
}

const confirmAssignment = async (assignmentData: any) => {
  try {
    const assignment = await api.createTemporaryAssignment(assignmentData)
    temporaryAssignments.value.push(assignment)
    emit('assignmentCreated', assignment)
    showConfirmModal.value = false
    draggedStaff.value = null
    targetDepartment.value = null
  } catch (error) {
    console.error('Failed to create assignment:', error)
  }
}

const cancelAssignment = () => {
  showConfirmModal.value = false
  draggedStaff.value = null
  targetDepartment.value = null
  assignmentConflicts.value = []
}

const removeAssignment = async (assignment: TemporaryAssignment) => {
  try {
    await api.deleteTemporaryAssignment(assignment.id)
    temporaryAssignments.value = temporaryAssignments.value.filter(a => a.id !== assignment.id)
    emit('assignmentRemoved', assignment.id)
  } catch (error) {
    console.error('Failed to remove assignment:', error)
  }
}

const viewStaffDetails = (staff: PorterAvailability) => {
  selectedStaff.value = staff
  showStaffDetails.value = true
}

const closeStaffDetailsModal = () => {
  showStaffDetails.value = false
  selectedStaff.value = null
}

// Watchers
watch([selectedDate, activeShift], () => {
  refreshData()
})

// Lifecycle
onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.temporary-assignments {
  container-type: inline-size;
}

.assignments-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6);
  gap: var(--space-4);
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

.header-controls {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.date-selector {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.date-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-neutral-700);
}

.date-input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}

.shift-toggle {
  display: flex;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--color-neutral-300);
}

.shift-btn {
  padding: var(--space-2) var(--space-3);
  border: none;
  background: white;
  color: var(--color-neutral-600);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.shift-btn:hover {
  background: var(--color-neutral-100);
}

.shift-btn--active {
  background: var(--color-primary);
  color: white;
}

.loading-state {
  padding: var(--space-8);
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
  margin: 0 auto var(--space-4);
}

.assignments-layout {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: var(--space-6);
  min-height: 600px;
}

.floor-staff-panel,
.departments-panel {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-base);
  overflow: hidden;
}

.panel-header {
  padding: var(--space-4);
  background: var(--color-neutral-50);
  border-bottom: 1px solid var(--color-neutral-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-neutral-800);
}

.panel-icon {
  font-size: var(--font-size-xl);
}

.staff-count,
.dept-count {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
  font-weight: 400;
}

.panel-filters {
  display: flex;
  gap: var(--space-2);
}

.filter-select {
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: white;
}

.staff-list {
  padding: var(--space-4);
  max-height: 600px;
  overflow-y: auto;
}

.staff-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-neutral-200);
  margin-bottom: var(--space-3);
  cursor: grab;
  transition: all var(--transition-fast);
  background: white;
}

.staff-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.staff-card:active {
  cursor: grabbing;
}

.staff-card--available {
  border-left: 4px solid var(--color-success);
}

.staff-card--unavailable {
  border-left: 4px solid var(--color-neutral-400);
  opacity: 0.7;
  cursor: not-allowed;
}

.staff-card--conflict {
  border-left: 4px solid var(--color-warning);
}

.staff-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: var(--font-size-sm);
  flex-shrink: 0;
}

.staff-info {
  flex: 1;
  min-width: 0;
}

.staff-name {
  font-size: var(--font-size-base);
  font-weight: 600;
  margin: 0 0 var(--space-1) 0;
  color: var(--color-neutral-800);
}

.staff-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
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

.shift-badge--relief {
  background: hsl(0, 0%, 90%);
  color: hsl(0, 0%, 30%);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: var(--font-size-xs);
}

.department-text {
  font-size: var(--font-size-xs);
  color: var(--color-neutral-600);
}

.availability-status {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-xs);
  margin-bottom: var(--space-1);
}

.status-indicator--available {
  color: var(--color-success);
}

.status-indicator--conflict {
  color: var(--color-warning);
}

.status-indicator--unavailable {
  color: var(--color-danger);
}

.status-text {
  color: var(--color-neutral-600);
}

.conflict-reason {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--color-warning);
  margin-bottom: var(--space-1);
}

.working-hours {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--color-neutral-600);
}

.staff-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.btn--small {
  padding: var(--space-1) var(--space-2);
  font-size: var(--font-size-xs);
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-staff {
  text-align: center;
  padding: var(--space-8);
  color: var(--color-neutral-600);
}

.no-staff-icon {
  font-size: var(--font-size-3xl);
  margin-bottom: var(--space-3);
}

.no-staff h4 {
  margin: 0 0 var(--space-2) 0;
  color: var(--color-neutral-700);
}

.no-staff p {
  margin: 0;
  font-size: var(--font-size-sm);
}

.departments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-4);
  padding: var(--space-4);
  max-height: 600px;
  overflow-y: auto;
}

.department-card {
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-neutral-200);
  padding: var(--space-4);
  transition: all var(--transition-fast);
  position: relative;
}

.department-card:hover {
  box-shadow: var(--shadow-md);
}

.department-card--adequate {
  border-left: 4px solid var(--color-success);
}

.department-card--low {
  border-left: 4px solid var(--color-warning);
}

.department-card--critical {
  border-left: 4px solid var(--color-danger);
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

.department-type {
  display: flex;
  gap: var(--space-2);
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

.staffing-status {
  font-size: var(--font-size-sm);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: var(--space-1);
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

.department-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.staffing-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
}

.metric {
  text-align: center;
  padding: var(--space-2);
  background: var(--color-neutral-50);
  border-radius: var(--radius-md);
}

.metric-label {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-neutral-600);
  margin-bottom: var(--space-1);
}

.metric-value {
  display: block;
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-neutral-800);
}

.metric-value.available {
  color: var(--color-primary);
}

.metric-value.temp {
  color: var(--color-success);
}

.drop-zone {
  min-height: 80px;
  border: 2px dashed var(--color-neutral-300);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.drop-zone--active {
  border-color: var(--color-primary);
  background: hsl(0, 0%, 98%);
}

.drop-zone-content {
  text-align: center;
  color: var(--color-neutral-500);
}

.drop-icon {
  font-size: var(--font-size-xl);
  margin-bottom: var(--space-2);
}

.drop-text {
  font-size: var(--font-size-sm);
}

.temp-assignments {
  background: var(--color-neutral-50);
  border-radius: var(--radius-md);
  padding: var(--space-3);
}

.assignments-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  margin: 0 0 var(--space-2) 0;
  color: var(--color-neutral-700);
}

.assignment-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2);
  background: white;
  border-radius: var(--radius-md);
  margin-bottom: var(--space-2);
  border: 1px solid var(--color-neutral-200);
}

.assignment-porter {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.porter-avatar {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: var(--font-size-xs);
}

.porter-name {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-neutral-800);
}

.assignment-time {
  font-size: var(--font-size-xs);
  color: var(--color-neutral-600);
}

.remove-btn {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: var(--radius-full);
  background: var(--color-danger);
  color: white;
  cursor: pointer;
  font-size: var(--font-size-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.remove-btn:hover {
  background: hsl(0, 0%, 95%);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive Design */
@container (max-width: 1200px) {
  .assignments-layout {
    grid-template-columns: 1fr;
  }

  .floor-staff-panel {
    order: 2;
  }

  .departments-panel {
    order: 1;
  }
}

@media (max-width: 768px) {
  .assignments-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-3);
  }

  .header-controls {
    flex-direction: column;
    gap: var(--space-3);
  }

  .date-selector {
    flex-direction: column;
    align-items: stretch;
  }

  .departments-grid {
    grid-template-columns: 1fr;
  }

  .staffing-metrics {
    grid-template-columns: 1fr;
  }

  .staff-card {
    flex-direction: column;
    text-align: center;
  }

  .staff-actions {
    flex-direction: row;
    justify-content: center;
  }
}
</style>
