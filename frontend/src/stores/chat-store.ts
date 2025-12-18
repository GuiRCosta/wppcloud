import { create } from 'zustand'
import { conversationsApi, messagesApi, mediaApi } from '@/lib/api'
import { socketService } from '@/lib/socket'

interface Contact {
  id: string
  waId: string
  phoneNumber: string
  name: string
  avatar?: string
}

interface Message {
  id: string
  wamid?: string
  type: string
  direction: 'INBOUND' | 'OUTBOUND'
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
  content: Record<string, any>
  timestamp: string
  sentBy?: {
    id: string
    firstName: string
    lastName: string
    avatar?: string
  }
}

interface Conversation {
  id: string
  status: string
  priority: number
  unreadCount: number
  lastMessageAt: string
  lastMessagePreview: string
  lastMessageType: string
  contact: Contact
  assignedTo?: {
    id: string
    firstName: string
    lastName: string
    avatar?: string
  }
  tags: { id: string; name: string; color: string }[]
}

interface ChatState {
  conversations: Conversation[]
  activeConversation: Conversation | null
  messages: Message[]
  isLoadingConversations: boolean
  isLoadingMessages: boolean
  hasMoreMessages: boolean
  typingUsers: Record<string, string[]>
  
  fetchConversations: (params?: Record<string, any>) => Promise<void>
  fetchMessages: (conversationId: string, before?: string) => Promise<void>
  setActiveConversation: (conversation: Conversation | null) => void
  sendMessage: (type: string, content: Record<string, any>) => Promise<void>
  markAsRead: (conversationId: string) => Promise<void>
  
  // Socket handlers
  handleNewMessage: (data: { conversationId: string; message: Message }) => void
  handleMessageStatus: (data: { conversationId: string; messageId: string; status: string }) => void
  handleTypingStart: (data: { conversationId: string; userId: string }) => void
  handleTypingStop: (data: { conversationId: string; userId: string }) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  isLoadingConversations: false,
  isLoadingMessages: false,
  hasMoreMessages: true,
  typingUsers: {},

  fetchConversations: async (params) => {
    set({ isLoadingConversations: true })
    try {
      const response = await conversationsApi.getAll(params)
      set({ conversations: response.data.data })
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      set({ isLoadingConversations: false })
    }
  },

  fetchMessages: async (conversationId, before) => {
    set({ isLoadingMessages: true })
    try {
      const response = await messagesApi.getByConversation(conversationId, {
        before,
        limit: 50,
      })

      const newMessages = response.data.data

      set((state) => ({
        messages: before
          ? [...newMessages, ...state.messages]
          : newMessages,
        hasMoreMessages: response.data.meta.hasMore,
      }))
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      set({ isLoadingMessages: false })
    }
  },

  setActiveConversation: (conversation) => {
    const { activeConversation } = get()

    // Leave previous conversation room
    if (activeConversation) {
      socketService.leaveConversation(activeConversation.id)
    }

    set({
      activeConversation: conversation,
      messages: [],
      hasMoreMessages: true,
    })

    // Join new conversation room
    if (conversation) {
      socketService.joinConversation(conversation.id)
      get().fetchMessages(conversation.id)

      // Mark as read
      if (conversation.unreadCount > 0) {
        get().markAsRead(conversation.id)
      }
    }
  },

  sendMessage: async (type, content) => {
    const { activeConversation } = get()
    if (!activeConversation) return

    try {
      await messagesApi.send(activeConversation.id, { type, content })
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  },

  markAsRead: async (conversationId) => {
    try {
      await conversationsApi.markAsRead(conversationId)

      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c
        ),
        activeConversation:
          state.activeConversation?.id === conversationId
            ? { ...state.activeConversation, unreadCount: 0 }
            : state.activeConversation,
      }))
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  },

  handleNewMessage: ({ conversationId, message }) => {
    const { activeConversation } = get()

    // Update messages if in the active conversation
    if (activeConversation?.id === conversationId) {
      set((state) => ({
        messages: [...state.messages, message],
      }))

      // Mark as read if inbound
      if (message.direction === 'INBOUND') {
        get().markAsRead(conversationId)
      }
    }

    // Update conversation list
    set((state) => ({
      conversations: state.conversations.map((c) => {
        if (c.id === conversationId) {
          return {
            ...c,
            lastMessageAt: message.timestamp,
            lastMessagePreview:
              message.type === 'TEXT'
                ? message.content.body
                : `📎 ${message.type}`,
            lastMessageType: message.type,
            unreadCount:
              message.direction === 'INBOUND' &&
              activeConversation?.id !== conversationId
                ? c.unreadCount + 1
                : c.unreadCount,
          }
        }
        return c
      }),
    }))
  },

  handleMessageStatus: ({ conversationId, messageId, status }) => {
    const { activeConversation } = get()

    if (activeConversation?.id === conversationId) {
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === messageId ? { ...m, status: status as Message['status'] } : m
        ),
      }))
    }
  },

  handleTypingStart: ({ conversationId, userId }) => {
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [conversationId]: [
          ...(state.typingUsers[conversationId] || []),
          userId,
        ],
      },
    }))
  },

  handleTypingStop: ({ conversationId, userId }) => {
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [conversationId]: (state.typingUsers[conversationId] || []).filter(
          (id) => id !== userId
        ),
      },
    }))
  },
}))

