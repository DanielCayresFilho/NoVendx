import { defineStore } from 'pinia'
import api from '../services/api'
import socketService from '../services/socket'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isOperator: (state) => state.user?.role === 'operator',
    isSupervisor: (state) => state.user?.role === 'supervisor',
    isAdmin: (state) => state.user?.role === 'admin',
  },

  actions: {
    async login(email, password) {
      this.loading = true
      this.error = null

      try {
        const response = await api.post('/auth/login', { email, password })
        const { access_token, user } = response.data

        this.token = access_token
        this.user = user

        localStorage.setItem('token', access_token)
        localStorage.setItem('user', JSON.stringify(user))

        // Conectar ao WebSocket
        socketService.connect(access_token)

        return true
      } catch (error) {
        this.error = error.response?.data?.message || 'Erro ao fazer login'
        throw error
      } finally {
        this.loading = false
      }
    },

    async logout() {
      try {
        await api.post('/auth/logout')
      } catch (error) {
        console.error('Erro ao fazer logout:', error)
      }

      this.user = null
      this.token = null

      localStorage.removeItem('token')
      localStorage.removeItem('user')

      socketService.disconnect()
    },

    async getMe() {
      try {
        const response = await api.get('/auth/me')
        this.user = response.data
        localStorage.setItem('user', JSON.stringify(response.data))
      } catch (error) {
        console.error('Erro ao buscar usuário:', error)
      }
    },
  },
})
