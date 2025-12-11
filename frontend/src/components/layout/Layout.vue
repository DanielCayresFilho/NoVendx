<template>
  <div class="app-shell flex h-screen overflow-hidden">
    <Sidebar />
    <main class="flex-1 overflow-hidden flex flex-col app-content">
      <slot />
    </main>
  </div>
</template>

<script setup>
import Sidebar from './Sidebar.vue'
</script>
