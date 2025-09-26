<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'
import AppNavigation from './components/AppNavigation.vue'

const route = useRoute()

// Show navigation on all pages except home (which has its own header)
const showNavigation = computed(() => route.name !== 'home')
</script>

<template>
  <div id="app">
    <AppNavigation v-if="showNavigation" />
    <RouterView />
  </div>
</template>

<style>
/* Global app styles are handled in main.css */
#app {
  min-height: 100vh;
  display: grid;
  grid-template-rows: 1fr;
  container-type: inline-size;
}
</style>
