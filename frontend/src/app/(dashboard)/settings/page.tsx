'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Settings,
  MessageSquare,
  User,
  Building2,
  Shield,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

interface WhatsAppConfig {
  wabaId: string
  phoneNumberId: string
  phoneNumber: string
  accessToken: string
  webhookSecret: string
}

interface OrganizationSettings {
  name: string
  timezone: string
}

type TabType = 'whatsapp' | 'organization' | 'profile' | 'security'

export default function SettingsPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading, checkAuth } = useAuthStore()
  
  const [activeTab, setActiveTab] = useState<TabType>('whatsapp')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showToken, setShowToken] = useState(false)
  
  // WhatsApp config state
  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfig>({
    wabaId: '',
    phoneNumberId: '',
    phoneNumber: '',
    accessToken: '',
    webhookSecret: '',
  })
  
  // Organization settings state
  const [orgSettings, setOrgSettings] = useState<OrganizationSettings>({
    name: '',
    timezone: 'America/Sao_Paulo',
  })

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (isAuthenticated && user?.organization) {
      loadSettings()
    }
  }, [isAuthenticated, user])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/organizations/me')
      const org = response.data
      
      setWhatsappConfig({
        wabaId: org.wabaId || '',
        phoneNumberId: org.phoneNumberId || '',
        phoneNumber: org.phoneNumber || '',
        accessToken: org.accessToken || '',
        webhookSecret: org.webhookSecret || '',
      })
      
      setOrgSettings({
        name: org.name || '',
        timezone: org.timezone || 'America/Sao_Paulo',
      })
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      toast.error('Erro ao carregar configurações')
    } finally {
      setIsLoading(false)
    }
  }

  const saveWhatsAppConfig = async () => {
    setIsSaving(true)
    try {
      await api.patch('/organizations/me/whatsapp', whatsappConfig)
      toast.success('Configurações do WhatsApp salvas com sucesso!')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar configurações')
    } finally {
      setIsSaving(false)
    }
  }

  const saveOrgSettings = async () => {
    setIsSaving(true)
    try {
      await api.patch('/organizations/me', orgSettings)
      toast.success('Configurações salvas com sucesso!')
      checkAuth() // Refresh user data
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar configurações')
    } finally {
      setIsSaving(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copiado!`)
  }

  // Get webhook URL from environment or construct from API URL
  const getWebhookUrl = () => {
    if (typeof window === 'undefined') return '/webhook/whatsapp'
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
    // Remove /api/v1 and add /webhook/whatsapp
    const baseUrl = apiUrl.replace('/api/v1', '')
    return `${baseUrl}/webhook/whatsapp`
  }
  
  const webhookUrl = getWebhookUrl()

  const tabs = [
    { id: 'whatsapp' as TabType, label: 'WhatsApp', icon: MessageSquare },
    { id: 'organization' as TabType, label: 'Organização', icon: Building2 },
    { id: 'profile' as TabType, label: 'Perfil', icon: User },
    { id: 'security' as TabType, label: 'Segurança', icon: Shield },
  ]

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-primary-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Configurações
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Gerencie as configurações da sua organização
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                    activeTab === tab.id
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main content */}
          <div className="flex-1">
            {/* WhatsApp Tab */}
            {activeTab === 'whatsapp' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Configurações do WhatsApp Business API
                </h2>

                {/* Info box */}
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        Configure suas credenciais da WhatsApp Business Cloud API.
                        Você pode encontrá-las no{' '}
                        <a
                          href="https://developers.facebook.com/apps"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline font-medium"
                        >
                          Meta for Developers
                          <ExternalLink className="w-3 h-3 inline ml-1" />
                        </a>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Webhook URL */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    URL do Webhook (configure no Meta)
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono overflow-x-auto">
                      {webhookUrl}
                    </code>
                    <button
                      onClick={() => copyToClipboard(webhookUrl, 'URL')}
                      className="p-2 text-gray-500 hover:text-primary-500 transition-colors"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      WABA ID (WhatsApp Business Account ID)
                    </label>
                    <input
                      type="text"
                      value={whatsappConfig.wabaId}
                      onChange={(e) => setWhatsappConfig({ ...whatsappConfig, wabaId: e.target.value })}
                      placeholder="Ex: 123456789012345"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number ID
                    </label>
                    <input
                      type="text"
                      value={whatsappConfig.phoneNumberId}
                      onChange={(e) => setWhatsappConfig({ ...whatsappConfig, phoneNumberId: e.target.value })}
                      placeholder="Ex: 123456789012345"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Número do WhatsApp
                    </label>
                    <input
                      type="text"
                      value={whatsappConfig.phoneNumber}
                      onChange={(e) => setWhatsappConfig({ ...whatsappConfig, phoneNumber: e.target.value })}
                      placeholder="Ex: +5511999999999"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Access Token (permanente)
                    </label>
                    <div className="relative">
                      <input
                        type={showToken ? 'text' : 'password'}
                        value={whatsappConfig.accessToken}
                        onChange={(e) => setWhatsappConfig({ ...whatsappConfig, accessToken: e.target.value })}
                        placeholder="Token de acesso do WhatsApp"
                        className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Webhook Verify Token
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={whatsappConfig.webhookSecret}
                        onChange={(e) => setWhatsappConfig({ ...whatsappConfig, webhookSecret: e.target.value })}
                        placeholder="Token de verificação do webhook"
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => {
                          const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
                          setWhatsappConfig({ ...whatsappConfig, webhookSecret: token })
                        }}
                        className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        Gerar
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={saveWhatsAppConfig}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Salvar Configurações
                  </button>
                </div>
              </div>
            )}

            {/* Organization Tab */}
            {activeTab === 'organization' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Configurações da Organização
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nome da Organização
                    </label>
                    <input
                      type="text"
                      value={orgSettings.name}
                      onChange={(e) => setOrgSettings({ ...orgSettings, name: e.target.value })}
                      placeholder="Nome da sua empresa"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fuso Horário
                    </label>
                    <select
                      value={orgSettings.timezone}
                      onChange={(e) => setOrgSettings({ ...orgSettings, timezone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                      <option value="America/Fortaleza">Fortaleza (GMT-3)</option>
                      <option value="America/Manaus">Manaus (GMT-4)</option>
                      <option value="America/Rio_Branco">Rio Branco (GMT-5)</option>
                      <option value="America/New_York">New York (GMT-5)</option>
                      <option value="Europe/Lisbon">Lisboa (GMT+0)</option>
                      <option value="Europe/London">Londres (GMT+0)</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Informações
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">ID:</span>
                        <span className="ml-2 font-mono text-gray-700 dark:text-gray-300">
                          {user?.organization?.id}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Slug:</span>
                        <span className="ml-2 font-mono text-gray-700 dark:text-gray-300">
                          {user?.organization?.slug}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={saveOrgSettings}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Salvar
                  </button>
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Perfil do Usuário
                </h2>

                <div className="flex items-center gap-6 mb-6">
                  <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                    <span className="text-3xl font-semibold text-primary-600 dark:text-primary-400">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {user?.firstName} {user?.lastName}
                    </h3>
                    <p className="text-gray-500">{user?.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs rounded-full">
                      {user?.role}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    A edição de perfil estará disponível em breve.
                  </p>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Segurança
                </h2>

                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    As configurações de segurança (alteração de senha, 2FA) estarão disponíveis em breve.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

