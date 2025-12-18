'use client'

import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { useChatStore } from '@/stores/chat-store'
import { socketService } from '@/lib/socket'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})

function SocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, accessToken } = useAuthStore()
  const { handleNewMessage, handleMessageStatus, handleTypingStart, handleTypingStop } =
    useChatStore()

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      socketService.connect(accessToken)

      // Set up event listeners
      const unsubNewMessage = socketService.on('message:new', handleNewMessage)
      const unsubMessageStatus = socketService.on('message:status', handleMessageStatus)
      const unsubTypingStart = socketService.on('typing:start', handleTypingStart)
      const unsubTypingStop = socketService.on('typing:stop', handleTypingStop)

      return () => {
        unsubNewMessage()
        unsubMessageStatus()
        unsubTypingStart()
        unsubTypingStop()
      }
    }
  }, [
    isAuthenticated,
    accessToken,
    handleNewMessage,
    handleMessageStatus,
    handleTypingStart,
    handleTypingStop,
  ])

  return <>{children}</>
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkAuth, isLoading } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Carregando...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>{children}</SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

