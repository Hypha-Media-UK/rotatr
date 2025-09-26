<template>
  <div class="system-settings">
    <div class="settings-header">
      <h2 class="settings-title">System Settings</h2>
      <p class="settings-description">
        Configure system-wide preferences and operational parameters
      </p>
    </div>

    <div class="settings-content">
      <div class="settings-section">
        <h3 class="section-title">General Settings</h3>
        <div class="settings-grid">
          <div class="setting-item">
            <label class="setting-label">System Name</label>
            <input 
              v-model="settings.systemName"
              type="text" 
              class="setting-input"
              placeholder="Porter Shift Management System"
            />
          </div>

          <div class="setting-item">
            <label class="setting-label">Default Shift Duration (hours)</label>
            <input 
              v-model.number="settings.defaultShiftDuration"
              type="number" 
              class="setting-input"
              min="1"
              max="24"
            />
          </div>

          <div class="setting-item">
            <label class="setting-label">Minimum Staff Coverage</label>
            <input 
              v-model.number="settings.minimumStaffCoverage"
              type="number" 
              class="setting-input"
              min="1"
            />
          </div>

          <div class="setting-item">
            <label class="setting-label">Alert Threshold (hours before shift)</label>
            <input 
              v-model.number="settings.alertThreshold"
              type="number" 
              class="setting-input"
              min="1"
              max="48"
            />
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h3 class="section-title">Notification Settings</h3>
        <div class="settings-grid">
          <div class="setting-item">
            <label class="setting-checkbox">
              <input 
                v-model="settings.enableEmailNotifications"
                type="checkbox"
              />
              <span class="checkbox-label">Enable Email Notifications</span>
            </label>
          </div>

          <div class="setting-item">
            <label class="setting-checkbox">
              <input 
                v-model="settings.enableLowStaffingAlerts"
                type="checkbox"
              />
              <span class="checkbox-label">Enable Low Staffing Alerts</span>
            </label>
          </div>

          <div class="setting-item">
            <label class="setting-checkbox">
              <input 
                v-model="settings.enableShiftReminders"
                type="checkbox"
              />
              <span class="checkbox-label">Enable Shift Reminders</span>
            </label>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h3 class="section-title">Display Settings</h3>
        <div class="settings-grid">
          <div class="setting-item">
            <label class="setting-label">Date Format</label>
            <select v-model="settings.dateFormat" class="setting-select">
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>

          <div class="setting-item">
            <label class="setting-label">Time Format</label>
            <select v-model="settings.timeFormat" class="setting-select">
              <option value="12">12-hour (AM/PM)</option>
              <option value="24">24-hour</option>
            </select>
          </div>

          <div class="setting-item">
            <label class="setting-label">Items per Page</label>
            <select v-model="settings.itemsPerPage" class="setting-select">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="settings-actions">
      <button 
        @click="saveSettings"
        class="btn btn--primary"
        :disabled="isSaving"
      >
        {{ isSaving ? 'Saving...' : 'Save Settings' }}
      </button>
      
      <button 
        @click="resetSettings"
        class="btn btn--secondary"
      >
        Reset to Defaults
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Define emits
const emit = defineEmits<{
  settingsUpdated: [settings: any]
}>()

// Reactive data
const isSaving = ref(false)

const settings = ref({
  systemName: 'Porter Shift Management System',
  defaultShiftDuration: 8,
  minimumStaffCoverage: 2,
  alertThreshold: 24,
  enableEmailNotifications: true,
  enableLowStaffingAlerts: true,
  enableShiftReminders: true,
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12',
  itemsPerPage: 25
})

// Methods
const saveSettings = async () => {
  isSaving.value = true
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Store in localStorage for now
    localStorage.setItem('systemSettings', JSON.stringify(settings.value))
    
    emit('settingsUpdated', settings.value)
    
    // Show success message (you could add a toast notification here)
    console.log('Settings saved successfully')
  } catch (error) {
    console.error('Failed to save settings:', error)
  } finally {
    isSaving.value = false
  }
}

const resetSettings = () => {
  settings.value = {
    systemName: 'Porter Shift Management System',
    defaultShiftDuration: 8,
    minimumStaffCoverage: 2,
    alertThreshold: 24,
    enableEmailNotifications: true,
    enableLowStaffingAlerts: true,
    enableShiftReminders: true,
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12',
    itemsPerPage: 25
  }
}

const loadSettings = () => {
  try {
    const saved = localStorage.getItem('systemSettings')
    if (saved) {
      settings.value = { ...settings.value, ...JSON.parse(saved) }
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
}

// Lifecycle
onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.system-settings {
  max-width: 800px;
  margin: 0 auto;
}

.settings-header {
  margin-bottom: var(--space-8);
}

.settings-title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-neutral-900);
  margin-bottom: var(--space-2);
}

.settings-description {
  color: var(--color-neutral-600);
  font-size: var(--font-size-base);
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.settings-section {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  border: 1px solid var(--color-neutral-200);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-neutral-900);
  margin-bottom: var(--space-4);
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-4);
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.setting-label {
  font-weight: 500;
  color: var(--color-neutral-700);
  font-size: var(--font-size-sm);
}

.setting-input,
.setting-select {
  padding: var(--space-3);
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  transition: border-color var(--transition-fast);
}

.setting-input:focus,
.setting-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px hsl(0, 0%, 90%);
}

.setting-checkbox {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
}

.checkbox-label {
  font-weight: 500;
  color: var(--color-neutral-700);
}

.settings-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  padding-top: var(--space-6);
  border-top: 1px solid var(--color-neutral-200);
  margin-top: var(--space-6);
}

.btn {
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: var(--font-size-base);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn--primary {
  background: var(--color-primary);
  color: white;
}

.btn--primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn--primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn--secondary {
  background: white;
  color: var(--color-neutral-700);
  border-color: var(--color-neutral-300);
}

.btn--secondary:hover {
  background: var(--color-neutral-50);
}
</style>
