'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  MessageCircle,
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Moon,
  Sun,
  Bell,
  ChevronDown,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { cn, getInitials } from '@/lib/utils'

interface ChatLayoutProps {
  children: React.ReactNode
}

export function ChatLayout({ children }: ChatLayoutProps) {
  const { user, logout } = useAuthStore()
  const pathname = usePathname()
  const [isDark, setIsDark] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
  }

  const navigation = [
    { name: 'Chat', icon: MessageCircle, href: '/chat' },
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Equipe', icon: Users, href: '/team' },
    { name: 'Configurações', icon: Settings, href: '/settings' },
  ]

  return (
    <div className="h-screen flex bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-[72px] bg-primary-700 dark:bg-gray-800 flex flex-col items-center py-4">
        {/* Logo */}
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-8">
          <MessageCircle className="w-7 h-7 text-white" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col items-center gap-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                )}
                title={item.name}
              >
                <item.icon className="w-6 h-6" />
              </Link>
            )
          })}
        </nav>

        {/* Bottom actions */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={toggleTheme}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            title={isDark ? 'Modo claro' : 'Modo escuro'}
          >
            {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>

          <button
            onClick={() => logout()}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            title="Sair"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {user?.organization?.name || 'WhatsApp Chat'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.firstName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(`${user?.firstName} ${user?.lastName}`)
                  )}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.role}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Meu perfil
                  </Link>
                  <Link
                    href="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Configurações
                  </Link>
                  <hr className="my-2 border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      logout()
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}

