<template>
  <Layout>
    <div class="flex-1 flex items-center justify-center bg-backgroundLight">
      <div class="text-center">
        <div class="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center">
          <i class="fas fa-headset text-white text-4xl"></i>
        </div>
        <h1 class="text-3xl font-bold text-textPrimary mb-4">Bem-vindo ao Vend</h1>
        <p class="text-textSecondary text-lg">
          Escolha uma das opções no menu lateral para iniciar
        </p>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import Layout from '../components/layout/Layout.vue'
</script>
