'use client'

import { MessageCircle, Lock } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-8">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <MessageCircle className="w-10 h-10 text-primary-500" />
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
          WhatsApp Chat
        </h2>

        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Selecione uma conversa na lista à esquerda para começar a atender.
          Todas as mensagens são sincronizadas em tempo real com o WhatsApp Business.
        </p>

        <div className="flex items-center justify-center gap-2 text-sm text-gray-400 dark:text-gray-500">
          <Lock className="w-4 h-4" />
          <span>Criptografia de ponta a ponta</span>
        </div>
      </div>
    </div>
  )
}

