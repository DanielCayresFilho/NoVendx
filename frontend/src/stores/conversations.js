import { defineStore } from 'pinia'
import api from '../services/api'
import socketService from '../services/socket'

export const useConversationsStore = defineStore('conversations', {
  state: () => ({
    activeConversations: [],
    currentConversation: null,
    messages: [],
    loading: false,
  }),

  actions: {
    async fetchActiveConversations() {
      this.loading = true
      try {
        const response = await api.get('/conversations/active')
        this.activeConversations = response.data
      } catch (error) {
        console.error('Erro ao buscar conversas:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchConversationMessages(contactPhone) {
      this.loading = true
      try {
        const response = await api.get(`/conversations/contact/${contactPhone}`)
        this.messages = response.data
      } catch (error) {
        console.error('Erro ao buscar mensagens:', error)
      } finally {
        this.loading = false
      }
    },

    async sendMessage(contactPhone, message, messageType = 'text', mediaUrl = null) {
      try {
        socketService.emit('send-message', {
          contactPhone,
          message,
          messageType,
          mediaUrl,
        })
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error)
        throw error
      }
    },

    async tabulateConversation(contactPhone, tabulationId) {
      try {
        await api.post(`/conversations/tabulate/${contactPhone}`, {
          tabulationId,
        })

        // Remover conversa da lista de ativas
        this.activeConversations = this.activeConversations.filter(
          (conv) => conv.contactPhone !== contactPhone
        )

        // Limpar conversa atual se for a mesma
        if (this.currentConversation?.contactPhone === contactPhone) {
          this.currentConversation = null
          this.messages = []
        }
      } catch (error) {
        console.error('Erro ao tabular conversa:', error)
        throw error
      }
    },

    setCurrentConversation(conversation) {
      this.currentConversation = conversation
      if (conversation) {
        this.fetchConversationMessages(conversation.contactPhone)
      }
    },

    addMessage(message) {
      this.messages.push(message)

      // Atualizar última mensagem na lista de conversas
      const convIndex = this.activeConversations.findIndex(
        (c) => c.contactPhone === message.contactPhone
      )

      if (convIndex !== -1) {
        this.activeConversations[convIndex].message = message.message
        this.activeConversations[convIndex].datetime = message.datetime
      }
    },

    initializeSocketListeners() {
      socketService.on('new-message', (message) => {
        this.addMessage(message)
      })

      socketService.on('active-conversations', (conversations) => {
        this.activeConversations = conversations
      })

      socketService.on('message-sent', (message) => {
        this.addMessage(message)
      })

      socketService.on('conversation-tabulated', ({ contactPhone }) => {
        this.activeConversations = this.activeConversations.filter(
          (conv) => conv.contactPhone !== contactPhone
        )

        if (this.currentConversation?.contactPhone === contactPhone) {
          this.currentConversation = null
          this.messages = []
        }
      })
    },
  },
})
