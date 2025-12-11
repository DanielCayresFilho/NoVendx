import { io } from 'socket.io-client'

class SocketService {
  constructor() {
    this.socket = null
    this.connected = false
  }

  connect(token) {
    if (this.connected) return

    const url = import.meta.env.VITE_API_URL || 'http://localhost:3000'

    this.socket = io(url, {
      auth: { token },
      transports: ['websocket'],
    })

    this.socket.on('connect', () => {
      console.log('✅ Conectado ao WebSocket')
      this.connected = true
    })

    this.socket.on('disconnect', () => {
      console.log('❌ Desconectado do WebSocket')
      this.connected = false
    })

    this.socket.on('connect_error', (error) => {
      console.error('Erro na conexão WebSocket:', error)
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.connected = false
    }
  }

  emit(event, data) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data)
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback)
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback)
    }
  }
}

export default new SocketService()
