'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { ChatLayout } from '@/components/chat/chat-layout'
import { Users, UserPlus, Search, Mail, Phone, Shield } from 'lucide-react'
import { usersApi } from '@/lib/api'
import { getInitials } from '@/lib/utils'

interface TeamMember {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  onlineStatus: string
  avatar?: string
}

export default function TeamPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useAuthStore()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (isAuthenticated) {
      loadMembers()
    }
  }, [isAuthenticated])

  const loadMembers = async () => {
    setIsLoadingMembers(true)
    try {
      const response = await usersApi.getAll()
      setMembers(response.data.data || [])
    } catch (error) {
      console.error('Erro ao carregar membros da equipe:', error)
    } finally {
      setIsLoadingMembers(false)
    }
  }

  const filteredMembers = members.filter((member) => {
    const searchLower = search.toLowerCase()
    return (
      member.firstName.toLowerCase().includes(searchLower) ||
      member.lastName.toLowerCase().includes(searchLower) ||
      member.email.toLowerCase().includes(searchLower)
    )
  })

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
      case 'ADMIN':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
      case 'SUPERVISOR':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
      case 'AGENT':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return 'bg-green-500'
      case 'AWAY':
        return 'bg-yellow-500'
      case 'BUSY':
        return 'bg-red-500'
      default:
        return 'bg-gray-400'
    }
  }

  if (isLoading || !isAuthenticated) {
    return null
  }

  return (
    <ChatLayout>
      <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Equipe
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gerencie os membros da sua equipe
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors">
              <UserPlus className="w-5 h-5" />
              Adicionar Membro
            </button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar membros..."
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Members List */}
          {isLoadingMembers ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 animate-pulse"
                >
                  <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-full w-16 mb-4" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                Nenhum membro encontrado
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {search
                  ? 'Tente buscar com outros termos'
                  : 'Adicione membros à sua equipe para começar'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold text-lg">
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={`${member.firstName} ${member.lastName}`}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getInitials(`${member.firstName} ${member.lastName}`)
                        )}
                      </div>
                      <div
                        className={`absolute bottom-0 right-0 w-4 h-4 ${getStatusColor(
                          member.onlineStatus
                        )} rounded-full border-2 border-white dark:border-gray-800`}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {member.firstName} {member.lastName}
                        </h3>
                        {member.id === user?.id && (
                          <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                            Você
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRoleBadgeColor(
                            member.role
                          )}`}
                        >
                          {member.role.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{member.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          <span className="capitalize">{member.onlineStatus.toLowerCase()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ChatLayout>
  )
}

