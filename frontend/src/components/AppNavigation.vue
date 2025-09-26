<template>
  <nav class="app-navigation">
    <div class="nav-content">
      <div class="nav-brand">
        <RouterLink to="/" class="brand-link">
          <span class="brand-icon">🏥</span>
          <span class="brand-text">Porter Shift Management</span>
        </RouterLink>
      </div>
      
      <div class="nav-links">
        <RouterLink 
          to="/" 
          class="nav-link"
          :class="{ 'nav-link--active': $route.name === 'home' }"
        >
          <span class="nav-icon">📊</span>
          <span class="nav-text">Dashboard</span>
        </RouterLink>
        
        <RouterLink 
          to="/configure" 
          class="nav-link"
          :class="{ 'nav-link--active': $route.name === 'configure' }"
        >
          <span class="nav-icon">⚙️</span>
          <span class="nav-text">Configure</span>
        </RouterLink>
      </div>
      
      <div class="nav-actions">
        <button 
          @click="toggleTheme"
          class="action-btn"
          :title="isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
        >
          <span v-if="isDarkMode">☀️</span>
          <span v-else>🌙</span>
        </button>
        
        <div class="user-menu">
          <button class="user-btn" @click="toggleUserMenu">
            <span class="user-avatar">👤</span>
            <span class="user-name">Admin</span>
            <span class="dropdown-arrow" :class="{ 'dropdown-arrow--open': isUserMenuOpen }">▼</span>
          </button>
          
          <div v-if="isUserMenuOpen" class="user-dropdown">
            <a href="#" class="dropdown-item">
              <span class="item-icon">👤</span>
              Profile
            </a>
            <a href="#" class="dropdown-item">
              <span class="item-icon">⚙️</span>
              Settings
            </a>
            <div class="dropdown-divider"></div>
            <a href="#" class="dropdown-item">
              <span class="item-icon">🚪</span>
              Logout
            </a>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'

// Reactive data
const isDarkMode = ref(false)
const isUserMenuOpen = ref(false)

// Methods
const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  // In a real app, this would update the theme
  console.log('Theme toggled:', isDarkMode.value ? 'dark' : 'light')
}

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

const closeUserMenu = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.user-menu')) {
    isUserMenuOpen.value = false
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', closeUserMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeUserMenu)
})
</script>

<style scoped>
.app-navigation {
  background: white;
  border-bottom: 1px solid var(--color-neutral-200);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 var(--space-6);
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-6);
  height: 64px;
}

.nav-brand {
  display: flex;
  align-items: center;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  text-decoration: none;
  color: var(--color-neutral-800);
  font-weight: 700;
  font-size: var(--font-size-lg);
  transition: color var(--transition-fast);
}

.brand-link:hover {
  color: var(--color-primary);
}

.brand-icon {
  font-size: var(--font-size-2xl);
}

.brand-text {
  white-space: nowrap;
}

.nav-links {
  display: flex;
  justify-content: center;
  gap: var(--space-2);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: var(--color-neutral-600);
  font-weight: 500;
  transition: all var(--transition-fast);
  position: relative;
}

.nav-link:hover {
  color: var(--color-neutral-800);
  background: var(--color-neutral-100);
}

.nav-link--active {
  color: var(--color-primary);
  background: hsl(210, 100%, 95%);
}

.nav-link--active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 2px;
  background: var(--color-primary);
  border-radius: var(--radius-full);
}

.nav-icon {
  font-size: var(--font-size-lg);
}

.nav-text {
  font-size: var(--font-size-sm);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: var(--radius-lg);
  background: var(--color-neutral-100);
  color: var(--color-neutral-700);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: var(--font-size-lg);
}

.action-btn:hover {
  background: var(--color-neutral-200);
  transform: scale(1.05);
}

.user-menu {
  position: relative;
}

.user-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border: none;
  border-radius: var(--radius-lg);
  background: var(--color-neutral-100);
  color: var(--color-neutral-700);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
}

.user-btn:hover {
  background: var(--color-neutral-200);
}

.user-avatar {
  font-size: var(--font-size-lg);
}

.user-name {
  font-weight: 500;
}

.dropdown-arrow {
  font-size: var(--font-size-xs);
  transition: transform var(--transition-fast);
}

.dropdown-arrow--open {
  transform: rotate(180deg);
}

.user-dropdown {
  position: absolute;
  top: calc(100% + var(--space-2));
  right: 0;
  min-width: 180px;
  background: white;
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--space-2);
  z-index: 1001;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--color-neutral-700);
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
}

.dropdown-item:hover {
  background: var(--color-neutral-100);
  color: var(--color-neutral-800);
}

.item-icon {
  font-size: var(--font-size-base);
}

.dropdown-divider {
  height: 1px;
  background: var(--color-neutral-200);
  margin: var(--space-2) 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .nav-content {
    padding: 0 var(--space-4);
    gap: var(--space-4);
  }
  
  .brand-text {
    display: none;
  }
  
  .nav-text {
    display: none;
  }
  
  .nav-link {
    padding: var(--space-2);
  }
  
  .user-name {
    display: none;
  }
}

@media (max-width: 480px) {
  .nav-content {
    grid-template-columns: auto 1fr;
    gap: var(--space-3);
  }
  
  .nav-actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
    margin-top: var(--space-2);
    padding-top: var(--space-2);
    border-top: 1px solid var(--color-neutral-200);
  }
  
  .app-navigation {
    position: relative;
  }
  
  .nav-content {
    height: auto;
    padding: var(--space-3);
  }
}
</style>
