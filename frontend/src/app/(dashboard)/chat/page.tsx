'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { useChatStore } from '@/stores/chat-store'
import { ChatLayout } from '@/components/chat/chat-layout'
import { ConversationList } from '@/components/chat/conversation-list'
import { ChatView } from '@/components/chat/chat-view'
import { EmptyState } from '@/components/chat/empty-state'

export default function ChatPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthStore()
  const { activeConversation, fetchConversations } = useChatStore()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations()
    }
  }, [isAuthenticated, fetchConversations])

  if (isLoading || !isAuthenticated) {
    return null
  }

  return (
    <ChatLayout>
      <div className="flex h-full">
        {/* Conversations Sidebar */}
        <div className="w-[380px] border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
          <ConversationList />
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeConversation ? (
            <ChatView />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </ChatLayout>
  )
}

