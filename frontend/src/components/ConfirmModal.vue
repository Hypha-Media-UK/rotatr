<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="confirm-modal" @click.stop>
      <div class="modal-header">
        <div class="modal-icon" :class="iconClass">
          {{ icon }}
        </div>
        <h2 class="modal-title">{{ title }}</h2>
      </div>

      <div class="modal-content">
        <p class="modal-message">{{ message }}</p>

        <div v-if="details" class="modal-details">
          <div class="details-toggle" @click="showDetails = !showDetails">
            <span>{{ showDetails ? 'Hide' : 'Show' }} Details</span>

          </div>

          <div v-if="showDetails" class="details-content">
            <pre>{{ details }}</pre>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button
          @click="$emit('cancel')"
          class="btn btn--secondary"
          :disabled="isLoading"
        >
          {{ cancelText }}
        </button>

        <button
          @click="handleConfirm"
          class="btn"
          :class="confirmButtonClass"
          :disabled="isLoading"
        >
          <span v-if="!isLoading">{{ confirmText }}</span>
          <span v-else class="loading-content">
            <span class="loading-spinner"></span>
            {{ loadingText }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// Props
interface Props {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'primary' | 'danger' | 'warning' | 'success'
  icon?: string
  details?: string
  loadingText?: string
  autoFocus?: 'confirm' | 'cancel'
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  confirmVariant: 'primary',
  icon: '',
  details: '',
  loadingText: 'Processing...',
  autoFocus: 'cancel'
})

// Emits
const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

// Reactive data
const isLoading = ref(false)
const showDetails = ref(false)

// Computed properties
const icon = computed(() => {
  if (props.icon) return props.icon

  switch (props.confirmVariant) {
    case 'danger': return ''
    case 'warning': return ''
    case 'success': return ''
    default: return ''
  }
})

const iconClass = computed(() => {
  return `modal-icon--${props.confirmVariant}`
})

const confirmButtonClass = computed(() => {
  return `btn--${props.confirmVariant}`
})

// Methods
const handleConfirm = async () => {
  isLoading.value = true

  try {
    // Add a small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 300))
    emit('confirm')
  } finally {
    isLoading.value = false
  }
}

const handleOverlayClick = () => {
  if (!isLoading.value) {
    emit('cancel')
  }
}

// Handle keyboard events
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && !isLoading.value) {
    emit('cancel')
  } else if (event.key === 'Enter' && !isLoading.value) {
    if (props.autoFocus === 'confirm') {
      handleConfirm()
    }
  }
}

// Add keyboard event listener
document.addEventListener('keydown', handleKeydown)

// Cleanup on unmount
import { onUnmounted } from 'vue'
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
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
  z-index: 1001;
  padding: var(--space-4);
  backdrop-filter: blur(2px);
}

.confirm-modal {
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  max-width: 480px;
  width: 100%;
  overflow: hidden;
  animation: modalEnter 0.2s ease-out;
}

@keyframes modalEnter {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  padding: var(--space-6);
  text-align: center;
  border-bottom: 1px solid var(--color-neutral-200);
}

.modal-icon {
  font-size: var(--font-size-4xl);
  margin-bottom: var(--space-3);
  display: inline-block;
  padding: var(--space-4);
  border-radius: var(--radius-full);
}

.modal-icon--primary {
  background: hsl(210, 100%, 95%);
}

.modal-icon--danger {
  background: hsl(0, 0%, 95%);
}

.modal-icon--warning {
  background: hsl(0, 0%, 90%);
}

.modal-icon--success {
  background: hsl(0, 0%, 85%);
}

.modal-title {
  font-size: var(--font-size-xl);
  font-weight: 700;
  margin: 0;
  color: var(--color-neutral-800);
}

.modal-content {
  padding: var(--space-6);
}

.modal-message {
  font-size: var(--font-size-base);
  color: var(--color-neutral-700);
  line-height: 1.6;
  margin: 0;
  text-align: center;
}

.modal-details {
  margin-top: var(--space-4);
  border-top: 1px solid var(--color-neutral-200);
  padding-top: var(--space-4);
}

.details-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  padding: var(--space-2);
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast);
}

.details-toggle:hover {
  background: hsl(210, 100%, 98%);
}

.toggle-arrow {
  font-size: var(--font-size-xs);
  transition: transform var(--transition-fast);
}

.toggle-arrow--open {
  transform: rotate(180deg);
}

.details-content {
  margin-top: var(--space-3);
  padding: var(--space-3);
  background: var(--color-neutral-50);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-neutral-200);
}

.details-content pre {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-700);
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  font-family: var(--font-family-mono);
}

.modal-footer {
  padding: var(--space-6);
  border-top: 1px solid var(--color-neutral-200);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  background: var(--color-neutral-50);
}

.loading-content {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Button variants */
.btn--primary {
  background: var(--color-primary);
  color: white;
}

.btn--primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn--danger {
  background: var(--color-danger);
  color: white;
}

.btn--danger:hover:not(:disabled) {
  background: hsl(0, 0%, 20%);
}

.btn--warning {
  background: var(--color-warning);
  color: var(--color-neutral-800);
}

.btn--warning:hover:not(:disabled) {
  background: hsl(0, 0%, 50%);
}

.btn--success {
  background: var(--color-success);
  color: white;
}

.btn--success:hover:not(:disabled) {
  background: hsl(0, 0%, 35%);
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Responsive Design */
@media (max-width: 480px) {
  .confirm-modal {
    margin: var(--space-4);
    max-width: calc(100vw - 2 * var(--space-4));
  }

  .modal-header,
  .modal-content,
  .modal-footer {
    padding: var(--space-4);
  }

  .modal-footer {
    flex-direction: column;
  }

  .modal-icon {
    font-size: var(--font-size-3xl);
    padding: var(--space-3);
  }

  .modal-title {
    font-size: var(--font-size-lg);
  }
}

/* Focus management */
.btn:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.btn--danger:focus {
  outline-color: var(--color-danger);
}

.btn--warning:focus {
  outline-color: var(--color-warning);
}

.btn--success:focus {
  outline-color: var(--color-success);
}
</style>
