'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { ChatLayout } from '@/components/chat/chat-layout'
import { User, Mail, Shield, Save, Loader2, Camera } from 'lucide-react'
import { usersApi } from '@/lib/api'
import { toast } from 'sonner'
import { getInitials } from '@/lib/utils'

export default function ProfilePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, user, checkAuth } = useAuthStore()
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: (user as any)?.phone || '',
  })

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: (user as any)?.phone || '',
      })
    }
  }, [user])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await usersApi.updateMe({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      })
      toast.success('Perfil atualizado com sucesso!')
      checkAuth() // Refresh user data
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar perfil')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !isAuthenticated || !user) {
    return null
  }

  return (
    <ChatLayout>
      <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Meu Perfil
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie suas informações pessoais
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold text-3xl">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(`${user.firstName} ${user.lastName}`)
                  )}
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-2">{user.email}</p>
                <span className="inline-block px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-sm font-medium rounded-full">
                  {user.role.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Primeiro Nome
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Sobrenome
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  O email não pode ser alterado
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+55 11 99999-9999"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  Informações da Conta
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">ID:</span>
                    <span className="ml-2 font-mono text-gray-700 dark:text-gray-300">
                      {user.id}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Status:</span>
                    <span className="ml-2 text-gray-700 dark:text-gray-300 capitalize">
                      {(user as any)?.status?.toLowerCase() || 'Ativo'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Organização:</span>
                    <span className="ml-2 text-gray-700 dark:text-gray-300">
                      {user.organization?.name || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Online Status:</span>
                    <span className="ml-2 text-gray-700 dark:text-gray-300 capitalize">
                      {user.onlineStatus?.toLowerCase() || 'Offline'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ChatLayout>
  )
}

