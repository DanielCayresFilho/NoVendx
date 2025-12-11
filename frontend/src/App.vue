<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import socketService from './services/socket'

const authStore = useAuthStore()

onMounted(() => {
  // Conectar ao WebSocket se estiver autenticado
  if (authStore.isAuthenticated && authStore.token) {
    socketService.connect(authStore.token)
  }
})
</script>
