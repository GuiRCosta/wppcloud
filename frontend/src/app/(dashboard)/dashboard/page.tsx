'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { ChatLayout } from '@/components/chat/chat-layout'
import { MessageCircle, Users, Clock, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { useState } from 'react'

export default function DashboardPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthStore()
  const [stats, setStats] = useState({
    totalConversations: 0,
    openConversations: 0,
    pendingConversations: 0,
    resolvedConversations: 0,
    totalMessages: 0,
    avgResponseTime: 0,
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (isAuthenticated) {
      loadStats()
    }
  }, [isAuthenticated])

  const loadStats = async () => {
    setIsLoadingStats(true)
    try {
      const [conversationsRes, statsRes] = await Promise.all([
        api.get('/conversations'),
        api.get('/conversations/stats').catch(() => ({ data: {} })),
      ])

      const conversations = conversationsRes.data.data || []
      const statsData = statsRes.data || {}

      setStats({
        totalConversations: conversations.length,
        openConversations: conversations.filter((c: any) => c.status === 'OPEN').length,
        pendingConversations: conversations.filter((c: any) => c.status === 'PENDING').length,
        resolvedConversations: conversations.filter((c: any) => c.status === 'RESOLVED').length,
        totalMessages: statsData.totalMessages || 0,
        avgResponseTime: statsData.avgResponseTime || 0,
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  if (isLoading || !isAuthenticated) {
    return null
  }

  const statCards = [
    {
      title: 'Total de Conversas',
      value: stats.totalConversations,
      icon: MessageCircle,
      color: 'bg-blue-500',
    },
    {
      title: 'Abertas',
      value: stats.openConversations,
      icon: AlertCircle,
      color: 'bg-yellow-500',
    },
    {
      title: 'Pendentes',
      value: stats.pendingConversations,
      icon: Clock,
      color: 'bg-orange-500',
    },
    {
      title: 'Resolvidas',
      value: stats.resolvedConversations,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
  ]

  return (
    <ChatLayout>
      <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Visão geral das suas conversas e métricas
            </p>
          </div>

          {isLoadingStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 animate-pulse"
                >
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat) => (
                  <div
                    key={stat.title}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`${stat.color} p-3 rounded-lg`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {stat.title}
                    </h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="w-6 h-6 text-primary-500" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Métricas
                    </h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Total de Mensagens
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.totalMessages}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Tempo Médio de Resposta
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.avgResponseTime > 0
                          ? `${Math.round(stats.avgResponseTime / 60)} min`
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="w-6 h-6 text-primary-500" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Informações
                    </h2>
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Mais funcionalidades do dashboard estarão disponíveis em breve.
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Aqui você poderá ver gráficos, relatórios e análises detalhadas das suas
                      conversas.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </ChatLayout>
  )
}

