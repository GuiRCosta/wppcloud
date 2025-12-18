import { io, Socket } from 'socket.io-client'

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'

class SocketService {
  private socket: Socket | null = null
  private listeners: Map<string, Set<Function>> = new Map()

  connect(token: string) {
    if (this.socket?.connected) {
      return
    }

    this.socket = io(`${SOCKET_URL}/ws`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    this.socket.on('connect', () => {
      console.log('Socket connected')
    })

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected')
    })

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })

    // Re-attach listeners
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        this.socket?.on(event, callback as any)
      })
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)?.add(callback)

    if (this.socket) {
      this.socket.on(event, callback as any)
    }

    return () => this.off(event, callback)
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback)
    if (this.socket) {
      this.socket.off(event, callback as any)
    }
  }

  emit(event: string, data?: any) {
    if (this.socket) {
      this.socket.emit(event, data)
    }
  }

  joinConversation(conversationId: string) {
    this.emit('conversation:join', { conversationId })
  }

  leaveConversation(conversationId: string) {
    this.emit('conversation:leave', { conversationId })
  }

  startTyping(conversationId: string) {
    this.emit('typing:start', { conversationId })
  }

  stopTyping(conversationId: string) {
    this.emit('typing:stop', { conversationId })
  }

  updateStatus(status: 'ONLINE' | 'AWAY' | 'BUSY') {
    this.emit('status:update', { status })
  }

  get isConnected() {
    return this.socket?.connected ?? false
  }
}

export const socketService = new SocketService()

