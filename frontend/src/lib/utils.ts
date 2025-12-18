import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMessageTime(date: Date | string) {
  const d = new Date(date)
  return format(d, 'HH:mm')
}

export function formatConversationTime(date: Date | string) {
  const d = new Date(date)

  if (isToday(d)) {
    return format(d, 'HH:mm')
  }

  if (isYesterday(d)) {
    return 'Ontem'
  }

  return format(d, 'dd/MM/yyyy')
}

export function formatRelativeTime(date: Date | string) {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: ptBR,
  })
}

export function formatPhoneNumber(phone: string) {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')

  // Brazilian format
  if (digits.length === 13 && digits.startsWith('55')) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`
  }

  if (digits.length === 12 && digits.startsWith('55')) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`
  }

  // Generic format
  return phone
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getMessagePreview(type: string, content: any): string {
  switch (type) {
    case 'TEXT':
      return content.body || content.text || ''
    case 'IMAGE':
      return '📷 Imagem'
    case 'VIDEO':
      return '🎥 Vídeo'
    case 'AUDIO':
      return '🎵 Áudio'
    case 'DOCUMENT':
      return `📄 ${content.filename || 'Documento'}`
    case 'STICKER':
      return '🎭 Sticker'
    case 'LOCATION':
      return '📍 Localização'
    case 'CONTACTS':
      return '👤 Contato'
    case 'INTERACTIVE':
      return content.body?.text || 'Mensagem interativa'
    case 'TEMPLATE':
      return 'Template'
    default:
      return 'Mensagem'
  }
}

export function truncate(str: string, length: number) {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

