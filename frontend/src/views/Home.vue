<template>
  <Layout>
    <div class="flex-1 flex items-center justify-center px-4">
      <div class="glass-panel card-soft p-8 w-full max-w-4xl fade-in-up">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div class="flex items-center space-x-4">
            <div class="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-white text-4xl shadow-lg">
              <i class="fas fa-headset"></i>
            </div>
            <div>
              <h1 class="text-3xl font-bold text-textPrimary">Bem-vindo ao Vend</h1>
              <p class="text-textSecondary mt-1">Atendimento omnichannel com visão única do cliente</p>
              <div class="flex flex-wrap gap-2 mt-3">
                <span class="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary font-semibold">Tempo real</span>
                <span class="px-3 py-1 text-xs rounded-full bg-success/10 text-success font-semibold">Supervisão</span>
                <span class="px-3 py-1 text-xs rounded-full bg-secondary/10 text-textPrimary font-semibold">Campanhas</span>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            <div class="glass-panel rounded-xl p-4 text-center">
              <p class="text-sm text-textSecondary">Conversas ativas</p>
              <p class="text-2xl font-bold text-primary">12</p>
            </div>
            <div class="glass-panel rounded-xl p-4 text-center">
              <p class="text-sm text-textSecondary">Operadores online</p>
              <p class="text-2xl font-bold text-success">7</p>
            </div>
            <div class="glass-panel rounded-xl p-4 text-center">
              <p class="text-sm text-textSecondary">Canais</p>
              <p class="text-2xl font-bold text-textPrimary">Web • WhatsApp • Email</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import Layout from '../components/layout/Layout.vue'
</script>
