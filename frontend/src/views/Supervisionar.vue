<template>
  <Layout>
    <div class="flex-1 overflow-hidden flex gap-4 xl:gap-6 px-2 md:px-0 flex-col lg:flex-row fade-in-up">
      <!-- Lista de conversas -->
      <div class="w-full lg:w-80 glass-panel rounded-2xl overflow-hidden flex flex-col shadow-lg">
        <div class="p-4 border-b border-borderColor/60">
          <h3 class="font-semibold mb-3">Supervisão</h3>

          <!-- Filtro por operador -->
          <select
            v-model="selectedOperator"
            @change="filterConversations"
            class="input-soft w-full px-4 py-2"
          >
            <option value="">Todos os operadores</option>
            <option v-for="op in operators" :key="op.id" :value="op.id">
              {{ op.name }}
            </option>
          </select>
        </div>

        <div class="flex-1 overflow-y-auto scrollbar-thin">
          <div
            v-for="conv in filteredConversations"
            :key="conv.id"
            @click="selectConversation(conv)"
            :class="[
              'chat-item p-4 border-b border-borderColor/60 cursor-pointer transition-colors',
              currentConversation?.id === conv.id ? 'chat-item-active' : ''
            ]"
          >
            <div class="flex items-start space-x-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                <span class="font-bold text-white text-sm">{{ conv.contactName?.charAt(0).toUpperCase() }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <h4 class="font-semibold truncate">{{ conv.contactName }}</h4>
                  <span class="text-xs text-textSecondary">{{ formatTime(conv.datetime) }}</span>
                </div>
                <p class="text-sm text-textSecondary truncate">{{ conv.message }}</p>
                <p v-if="conv.userName" class="text-xs text-primary mt-1">Operador: {{ conv.userName }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Área de conversa (somente leitura) -->
      <div v-if="currentConversation" class="flex-1 flex flex-col overflow-hidden glass-panel rounded-2xl shadow-lg">
        <!-- Header da conversa -->
        <div class="bg-white/80 backdrop-blur border-b border-borderColor/60 p-4 sticky top-0 z-10">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span class="font-bold text-white text-sm">{{ currentConversation.contactName?.charAt(0).toUpperCase() }}</span>
            </div>
            <div>
              <h3 class="font-bold">{{ currentConversation.contactName }}</h3>
              <p class="text-xs text-textSecondary">
                {{ currentConversation.contactPhone }}
                <span v-if="currentConversation.userName" class="text-primary ml-2">
                  • Atendido por: {{ currentConversation.userName }}
                </span>
              </p>
            </div>
          </div>
        </div>

        <!-- Histórico da conversa -->
        <div class="flex-1 overflow-y-auto p-6 bg-gray-50 scrollbar-thin">
          <div class="space-y-4">
            <div
              v-for="message in messages"
              :key="message.id"
              :class="[
                'flex items-start space-x-3',
                message.sender === 'operator' ? 'justify-end' : 'justify-start'
              ]"
            >
              <div
                v-if="message.sender === 'contact'"
                class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0"
              >
                <span class="font-bold text-white text-xs">{{ message.contactName?.charAt(0).toUpperCase() }}</span>
              </div>

              <div
                :class="[
                  'chat-bubble rounded-2xl p-4 max-w-xl shadow-sm',
                  message.sender === 'operator'
                    ? 'bg-primary text-white rounded-tr-none'
                    : 'bg-white border border-borderColor rounded-tl-none'
                ]"
              >
                <p class="text-sm">{{ message.message }}</p>
                <span :class="['text-xs mt-2 block', message.sender === 'operator' ? 'text-gray-300' : 'text-textSecondary']">
                  {{ formatTime(message.datetime) }}
                </span>
              </div>

              <div
                v-if="message.sender === 'operator'"
                class="w-8 h-8 rounded-full bg-gradient-to-br from-warning to-error flex items-center justify-center flex-shrink-0"
              >
                <span class="font-bold text-white text-xs">{{ message.userName?.charAt(0).toUpperCase() }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Banner indicando modo leitura -->
        <div class="bg-warning bg-opacity-20 border-t border-warning p-4 text-center">
          <p class="text-sm font-medium text-warning">
            <i class="fas fa-eye mr-2"></i>
            Modo supervisão - Somente leitura
          </p>
        </div>
      </div>

      <!-- Mensagem quando não há conversa selecionada -->
      <div v-else class="flex-1 flex items-center justify-center bg-gray-50">
        <div class="text-center text-textSecondary">
          <i class="fas fa-eye text-6xl mb-4 opacity-30"></i>
          <p class="text-lg">Selecione uma conversa para visualizar</p>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import Layout from '../components/layout/Layout.vue'
import api from '../services/api'

const authStore = useAuthStore()

const conversations = ref([])
const operators = ref([])
const selectedOperator = ref('')
const currentConversation = ref(null)
const messages = ref([])

const filteredConversations = computed(() => {
  if (!selectedOperator.value) return conversations.value
  return conversations.value.filter(c => c.userName === operators.value.find(o => o.id === selectedOperator.value)?.name)
})

onMounted(async () => {
  // Buscar operadores do segmento
  const opsResponse = await api.get('/users', {
    params: { role: 'operator', segment: authStore.user.segment }
  })
  operators.value = opsResponse.data

  // Buscar todas as conversas do segmento
  await loadConversations()
})

const loadConversations = async () => {
  const response = await api.get(`/conversations/segment/${authStore.user.segment}`)
  conversations.value = response.data
}

const filterConversations = async () => {
  await loadConversations()
}

const selectConversation = async (conv) => {
  currentConversation.value = conv
  // Buscar todas as mensagens dessa conversa
  const response = await api.get(`/conversations/contact/${conv.contactPhone}`)
  messages.value = response.data
}

const formatTime = (datetime) => {
  if (!datetime) return ''
  const date = new Date(datetime)
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
</script>
