'use client'

import { useRef, useEffect } from 'react'
import { Phone, Video, MoreVertical, ArrowLeft } from 'lucide-react'
import { useChatStore } from '@/stores/chat-store'
import { cn, getInitials, formatPhoneNumber } from '@/lib/utils'
import { MessageList } from './message-list'
import { ChatInput } from './chat-input'

export function ChatView() {
  const { activeConversation, setActiveConversation, typingUsers } = useChatStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  if (!activeConversation) {
    return null
  }

  const typingInConversation = typingUsers[activeConversation.id] || []

  return (
    <div className="h-full flex flex-col bg-chat-bg dark:bg-chat-bg-dark chat-bg">
      {/* Chat header */}
      <div className="h-16 px-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Back button (mobile) */}
          <button
            onClick={() => setActiveConversation(null)}
            className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium">
            {activeConversation.contact.avatar ? (
              <img
                src={activeConversation.contact.avatar}
                alt={activeConversation.contact.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(activeConversation.contact.name || '?')
            )}
          </div>

          {/* Contact info */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              {activeConversation.contact.name || activeConversation.contact.phoneNumber}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {typingInConversation.length > 0 ? (
                <span className="text-primary-500">Digitando...</span>
              ) : (
                formatPhoneNumber(activeConversation.contact.phoneNumber)
              )}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList />
      </div>

      {/* Input */}
      <ChatInput />
    </div>
  )
}

