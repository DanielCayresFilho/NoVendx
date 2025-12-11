<template>
  <div class="flex h-screen overflow-hidden bg-backgroundLight">
    <Sidebar />
    <main class="flex-1 overflow-hidden flex flex-col">
      <slot />
    </main>
  </div>
</template>

<script setup>
import Sidebar from './Sidebar.vue'
</script>
