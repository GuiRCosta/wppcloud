import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '@/lib/api'
import { socketService } from '@/lib/socket'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  displayName?: string
  role: string
  avatar?: string
  onlineStatus: string
  organization: {
    id: string
    name: string
    slug: string
  }
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    email: string
    password: string
    firstName: string
    lastName: string
    organizationName?: string
  }) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  updateUser: (data: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email, password) => {
        const response = await authApi.login(email, password)
        const { accessToken, refreshToken, user } = response.data

        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)

        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        })

        // Connect socket
        socketService.connect(accessToken)
      },

      register: async (data) => {
        const response = await authApi.register(data)
        const { accessToken, refreshToken, user } = response.data

        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)

        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        })

        // Connect socket
        socketService.connect(accessToken)
      },

      logout: async () => {
        try {
          await authApi.logout()
        } catch (error) {
          // Ignore errors
        }

        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')

        socketService.disconnect()

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },

      checkAuth: async () => {
        const accessToken = localStorage.getItem('accessToken')

        if (!accessToken) {
          set({ isLoading: false, isAuthenticated: false })
          return
        }

        try {
          const response = await authApi.me()
          set({
            user: response.data,
            accessToken,
            refreshToken: localStorage.getItem('refreshToken'),
            isAuthenticated: true,
            isLoading: false,
          })

          // Connect socket
          socketService.connect(accessToken)
        } catch (error) {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      updateUser: (data) => {
        const { user } = get()
        if (user) {
          set({ user: { ...user, ...data } })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
)

