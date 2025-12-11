<template>
  <div class="min-h-screen app-shell flex items-center justify-center px-4">
    <div class="max-w-md w-full">
      <div class="glass-panel card-soft p-8">
        <!-- Logo e título -->
        <div class="text-center mb-8">
          <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
            <span class="text-white text-2xl font-bold">V</span>
          </div>
          <h1 class="text-3xl font-bold text-textPrimary">Bem-vindo ao Vend</h1>
          <p class="text-textSecondary mt-2">Sistema de Atendimento</p>
        </div>

        <!-- Formulário de login -->
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-textPrimary mb-2">Email</label>
            <input
              v-model="email"
              type="email"
              required
              class="input-soft w-full px-4 py-3"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-textPrimary mb-2">Senha</label>
            <input
              v-model="password"
              type="password"
              required
              class="input-soft w-full px-4 py-3"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full btn-primary py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Entrando...' : 'Entrar' }}
          </button>

          <p v-if="error" class="text-error text-sm text-center">{{ error }}</p>
        </form>

        <!-- Footer -->
        <p class="text-center text-xs text-textSecondary mt-8">
          © 2024 Vend - Todos os direitos reservados
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''

  try {
    await authStore.login(email.value, password.value)
    router.push('/')
  } catch (err) {
    error.value = 'Email ou senha inválidos'
  } finally {
    loading.value = false
  }
}
</script>
