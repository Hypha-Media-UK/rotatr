<template>
  <div class="configure-view">
    <main class="configure-main">
      <div class="configure-header">
        <h1 class="configure-title">
          System Configuration
        </h1>
        <p class="configure-description">
          Manage departments, porters, shifts, and system settings
        </p>
      </div>

      <div class="configure-tabs">
        <div class="tab-list">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="tab-button"
            :class="{ 'tab-button--active': activeTab === tab.id }"
          >
            <span class="tab-icon">{{ tab.icon }}</span>
            <span class="tab-label">{{ tab.label }}</span>
            <span v-if="tab.count" class="tab-count">{{ tab.count }}</span>
          </button>
        </div>

        <div class="tab-content">
          <div v-if="activeTab === 'departments'" class="tab-panel">
            <DepartmentManagement
              @department-updated="handleDepartmentUpdated"
            />
          </div>

          <div v-if="activeTab === 'porters'" class="tab-panel">
            <PorterManagement
              @porter-updated="handlePorterUpdated"
            />
          </div>

          <div v-if="activeTab === 'shifts'" class="tab-panel">
            <ShiftManagement
              @shift-updated="handleShiftUpdated"
            />
          </div>

          <div v-if="activeTab === 'settings'" class="tab-panel">
            <SystemSettings
              @settings-updated="handleSettingsUpdated"
            />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DepartmentManagement from '../components/DepartmentManagement.vue'
import PorterManagement from '../components/PorterManagement.vue'
import ShiftManagement from '../components/ShiftManagement.vue'
import SystemSettings from '../components/SystemSettings.vue'

// Reactive data
const activeTab = ref('departments')

const tabs = ref([
  {
    id: 'departments',
    label: 'Departments',
    icon: '',
    count: 6
  },
  {
    id: 'porters',
    label: 'Porters',
    icon: '',
    count: 19
  },
  {
    id: 'shifts',
    label: 'Shifts',
    icon: '',
    count: 4
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: '',
    count: null
  }
])

// Methods
const handleDepartmentUpdated = () => {
  console.log('Department updated')
  // Refresh department count
  loadTabCounts()
}

const handlePorterUpdated = () => {
  console.log('Porter updated')
  // Refresh porter count
  loadTabCounts()
}

const handleShiftUpdated = () => {
  console.log('Shift updated')
  // Refresh shift count
  loadTabCounts()
}

const handleSettingsUpdated = () => {
  console.log('Settings updated')
}

const loadTabCounts = async () => {
  // This would typically fetch from the API
  // For now, we'll use mock data
  tabs.value[0].count = 6  // departments
  tabs.value[1].count = 19 // porters
  tabs.value[2].count = 4  // shifts
}

// Lifecycle
onMounted(() => {
  loadTabCounts()
})
</script>

<style scoped>
.configure-view {
  min-height: 100vh;
  background: var(--color-neutral-50);
  container-type: inline-size;
}

.configure-main {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--space-6);
}

.configure-header {
  margin-bottom: var(--space-8);
  text-align: center;
}

.configure-title {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--color-neutral-800);
  margin: 0 0 var(--space-3) 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
}

.title-icon {
  font-size: var(--font-size-4xl);
}

.configure-description {
  font-size: var(--font-size-lg);
  color: var(--color-neutral-600);
  margin: 0;
}

.configure-tabs {
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-base);
  overflow: hidden;
}

.tab-list {
  display: flex;
  background: var(--color-neutral-100);
  border-bottom: 1px solid var(--color-neutral-200);
}

.tab-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-6);
  border: none;
  background: none;
  color: var(--color-neutral-600);
  font-size: var(--font-size-base);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
}

.tab-button:hover {
  color: var(--color-neutral-800);
  background: var(--color-neutral-200);
}

.tab-button--active {
  color: var(--color-primary);
  background: white;
  border-bottom: 2px solid var(--color-primary);
}

.tab-button--active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-primary);
}

.tab-icon {
  font-size: var(--font-size-lg);
}

.tab-label {
  font-weight: 600;
}

.tab-count {
  background: var(--color-primary);
  color: white;
  font-size: var(--font-size-xs);
  font-weight: 700;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  min-width: 20px;
  text-align: center;
}

.tab-button--active .tab-count {
  background: var(--color-primary-dark);
}

.tab-content {
  min-height: 600px;
}

.tab-panel {
  padding: var(--space-6);
  animation: fadeIn 0.3s ease-in-out;
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  font-size: var(--font-size-xl);
  color: var(--color-neutral-500);
  background: var(--color-neutral-100);
  border-radius: var(--radius-lg);
  border: 2px dashed var(--color-neutral-300);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Design */
@container (max-width: 768px) {
  .configure-main {
    padding: var(--space-4);
  }

  .configure-title {
    font-size: var(--font-size-2xl);
    flex-direction: column;
    gap: var(--space-2);
  }

  .tab-list {
    flex-direction: column;
  }

  .tab-button {
    justify-content: flex-start;
    padding: var(--space-3) var(--space-4);
  }

  .tab-panel {
    padding: var(--space-4);
  }
}

@container (max-width: 480px) {
  .configure-header {
    margin-bottom: var(--space-6);
  }

  .configure-title {
    font-size: var(--font-size-xl);
  }

  .configure-description {
    font-size: var(--font-size-base);
  }

  .tab-button {
    padding: var(--space-3);
  }

  .tab-label {
    font-size: var(--font-size-sm);
  }
}
</style>
