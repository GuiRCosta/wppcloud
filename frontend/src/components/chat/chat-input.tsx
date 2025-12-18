'use client'

import { useState, useRef, useEffect, ChangeEvent } from 'react'
import {
  Paperclip,
  Smile,
  Send,
  Mic,
  X,
  Image,
  FileText,
  MapPin,
  Video,
  Music,
  Loader2,
} from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'
import TextareaAutosize from 'react-textarea-autosize'
import { toast } from 'sonner'
import { useChatStore } from '@/stores/chat-store'
import { socketService } from '@/lib/socket'
import { messagesApi } from '@/lib/api'
import { cn } from '@/lib/utils'

interface FilePreview {
  file: File
  url: string
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT'
}

export function ChatInput() {
  const { activeConversation, sendMessage } = useChatStore()
  const [text, setText] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [showAttachment, setShowAttachment] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null)
  const [caption, setCaption] = useState('')
  
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Focus input on conversation change
  useEffect(() => {
    if (activeConversation) {
      inputRef.current?.focus()
    }
  }, [activeConversation?.id])

  // Cleanup file preview URL on unmount or change
  useEffect(() => {
    return () => {
      if (filePreview?.url) {
        URL.revokeObjectURL(filePreview.url)
      }
    }
  }, [filePreview])

  const handleTyping = () => {
    if (!activeConversation) return

    socketService.startTyping(activeConversation.id)

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socketService.stopTyping(activeConversation.id)
    }, 2000)
  }

  const handleSendText = async () => {
    if (!text.trim() || !activeConversation || isSending) return

    const messageText = text.trim()
    setText('')
    setIsSending(true)

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    socketService.stopTyping(activeConversation.id)

    try {
      await sendMessage('TEXT', { body: messageText })
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao enviar mensagem')
      setText(messageText) // Restore text on error
    } finally {
      setIsSending(false)
    }
  }

  const handleSendMedia = async () => {
    if (!filePreview || !activeConversation || isSending) return

    setIsSending(true)
    setUploadProgress(0)

    try {
      await messagesApi.sendMedia(
        activeConversation.id,
        filePreview.file,
        filePreview.type,
        caption || undefined,
        (progress) => setUploadProgress(progress)
      )

      toast.success('Mídia enviada com sucesso!')
      clearFilePreview()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao enviar mídia')
    } finally {
      setIsSending(false)
      setUploadProgress(0)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (filePreview) {
        handleSendMedia()
      } else {
        handleSendText()
      }
    }
  }

  const handleEmojiSelect = (emojiData: any) => {
    if (filePreview) {
      setCaption((prev) => prev + emojiData.emoji)
    } else {
      setText((prev) => prev + emojiData.emoji)
    }
    inputRef.current?.focus()
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>, type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT') => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size
    const maxSizes: Record<string, number> = {
      IMAGE: 5 * 1024 * 1024, // 5MB
      VIDEO: 16 * 1024 * 1024, // 16MB
      AUDIO: 16 * 1024 * 1024, // 16MB
      DOCUMENT: 100 * 1024 * 1024, // 100MB
    }

    if (file.size > maxSizes[type]) {
      toast.error(`Arquivo muito grande. Máximo: ${Math.round(maxSizes[type] / 1024 / 1024)}MB`)
      return
    }

    // Create preview URL
    const url = URL.createObjectURL(file)
    setFilePreview({ file, url, type })
    setShowAttachment(false)
    setCaption('')

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const clearFilePreview = () => {
    if (filePreview?.url) {
      URL.revokeObjectURL(filePreview.url)
    }
    setFilePreview(null)
    setCaption('')
  }

  const openFileDialog = (type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT') => {
    if (!fileInputRef.current) return

    const accepts: Record<string, string> = {
      IMAGE: 'image/jpeg,image/png,image/webp,image/gif',
      VIDEO: 'video/mp4,video/3gpp',
      AUDIO: 'audio/aac,audio/mp3,audio/mpeg,audio/ogg,audio/opus',
      DOCUMENT: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt',
    }

    fileInputRef.current.accept = accepts[type]
    fileInputRef.current.dataset.type = type
    fileInputRef.current.click()
  }

  const attachmentOptions = [
    { icon: Image, label: 'Imagem', type: 'IMAGE' as const, color: 'bg-green-500' },
    { icon: Video, label: 'Vídeo', type: 'VIDEO' as const, color: 'bg-blue-500' },
    { icon: Music, label: 'Áudio', type: 'AUDIO' as const, color: 'bg-purple-500' },
    { icon: FileText, label: 'Documento', type: 'DOCUMENT' as const, color: 'bg-orange-500' },
  ]

  // Render file preview
  const renderFilePreview = () => {
    if (!filePreview) return null

    return (
      <div className="absolute bottom-full left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 animate-slide-in">
        <div className="flex items-start gap-4">
          {/* Preview */}
          <div className="relative flex-shrink-0">
            <button
              onClick={clearFilePreview}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center z-10 hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {filePreview.type === 'IMAGE' && (
              <img
                src={filePreview.url}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-lg"
              />
            )}

            {filePreview.type === 'VIDEO' && (
              <video
                src={filePreview.url}
                className="w-32 h-32 object-cover rounded-lg"
              />
            )}

            {filePreview.type === 'AUDIO' && (
              <div className="w-32 h-32 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Music className="w-12 h-12 text-purple-500" />
              </div>
            )}

            {filePreview.type === 'DOCUMENT' && (
              <div className="w-32 h-32 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <FileText className="w-12 h-12 text-orange-500" />
              </div>
            )}
          </div>

          {/* File info and caption */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-white truncate">
              {filePreview.file.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {(filePreview.file.size / 1024 / 1024).toFixed(2)} MB
            </p>

            {/* Caption input (for images, videos, documents) */}
            {filePreview.type !== 'AUDIO' && (
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Adicionar legenda..."
                className="mt-2 w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            )}

            {/* Upload progress */}
            {isSending && uploadProgress > 0 && (
              <div className="mt-2">
                <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{uploadProgress}%</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const type = fileInputRef.current?.dataset.type as 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT'
          handleFileSelect(e, type || 'DOCUMENT')
        }}
      />

      {/* File preview */}
      {renderFilePreview()}

      {/* Emoji picker */}
      {showEmoji && (
        <div className="absolute bottom-20 left-4 z-50">
          <div className="relative">
            <button
              onClick={() => setShowEmoji(false)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <EmojiPicker
              onEmojiClick={handleEmojiSelect}
              width={350}
              height={400}
            />
          </div>
        </div>
      )}

      {/* Attachment options */}
      {showAttachment && (
        <div className="mb-4 flex gap-4 animate-fade-in">
          {attachmentOptions.map((option) => (
            <button
              key={option.type}
              onClick={() => openFileDialog(option.type)}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', option.color)}>
                <option.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-300">
                {option.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        {/* Attachment button */}
        <button
          onClick={() => setShowAttachment(!showAttachment)}
          disabled={!!filePreview}
          className={cn(
            'p-3 rounded-xl transition-colors',
            showAttachment
              ? 'bg-primary-500 text-white'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700',
            filePreview && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Text input or caption display */}
        <div className="flex-1 relative">
          {filePreview ? (
            <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-2xl text-gray-600 dark:text-gray-300">
              📎 {filePreview.file.name}
            </div>
          ) : (
            <TextareaAutosize
              ref={inputRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                handleTyping()
              }}
              onKeyDown={handleKeyDown}
              placeholder="Digite uma mensagem..."
              disabled={isSending}
              maxRows={5}
              className="w-full px-4 py-3 pr-12 bg-gray-100 dark:bg-gray-700 rounded-2xl resize-none text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          )}
        </div>

        {/* Emoji button */}
        <button
          onClick={() => setShowEmoji(!showEmoji)}
          className={cn(
            'p-3 rounded-xl transition-colors',
            showEmoji
              ? 'bg-primary-500 text-white'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
          )}
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Send button */}
        {(text.trim() || filePreview) ? (
          <button
            onClick={filePreview ? handleSendMedia : handleSendText}
            disabled={isSending}
            className="p-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        ) : (
          <button
            onClick={() => toast.info('Gravação de áudio - Em desenvolvimento')}
            className="p-3 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <Mic className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}
