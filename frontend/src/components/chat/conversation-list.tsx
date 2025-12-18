'use client'

import { useState } from 'react'
import { Search, Filter, MessageCircle, Check, CheckCheck } from 'lucide-react'
import { useChatStore } from '@/stores/chat-store'
import { cn, formatConversationTime, getInitials, truncate } from '@/lib/utils'

export function ConversationList() {
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    isLoadingConversations,
  } = useChatStore()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'open' | 'pending' | 'resolved'>('all')

  const filteredConversations = conversations.filter((conv) => {
    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase()
      const name = conv.contact.name?.toLowerCase() || ''
      const phone = conv.contact.phoneNumber?.toLowerCase() || ''
      if (!name.includes(searchLower) && !phone.includes(searchLower)) {
        return false
      }
    }

    // Filter by status
    if (filter !== 'all' && conv.status.toLowerCase() !== filter) {
      return false
    }

    return true
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT':
        return <Check className="w-4 h-4 text-gray-400" />
      case 'DELIVERED':
        return <CheckCheck className="w-4 h-4 text-gray-400" />
      case 'READ':
        return <CheckCheck className="w-4 h-4 text-blue-500" />
      default:
        return null
    }
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Conversas
          </h2>
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conversas..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-3">
          {(['all', 'open', 'pending', 'resolved'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-lg transition-colors',
                filter === f
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              )}
            >
              {f === 'all' ? 'Todas' : f === 'open' ? 'Abertas' : f === 'pending' ? 'Pendentes' : 'Resolvidas'}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingConversations ? (
          // Loading skeleton
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              Nenhuma conversa
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {search
                ? 'Nenhuma conversa encontrada para esta busca'
                : 'Aguardando novas mensagens'}
            </p>
          </div>
        ) : (
          <div>
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setActiveConversation(conversation)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left',
                  activeConversation?.id === conversation.id &&
                    'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500'
                )}
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium">
                    {conversation.contact.avatar ? (
                      <img
                        src={conversation.contact.avatar}
                        alt={conversation.contact.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(conversation.contact.name || '?')
                    )}
                  </div>
                  {/* Online indicator could go here */}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900 dark:text-white truncate">
                      {conversation.contact.name || conversation.contact.phoneNumber}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                      {conversation.lastMessageAt &&
                        formatConversationTime(conversation.lastMessageAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                      {getStatusIcon(conversation.lastMessageType)}
                      {truncate(conversation.lastMessagePreview || 'Sem mensagens', 35)}
                    </p>

                    {conversation.unreadCount > 0 && (
                      <span className="flex-shrink-0 ml-2 min-w-[20px] h-5 px-1.5 bg-primary-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                        {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

