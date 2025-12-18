'use client'

import { useRef, useEffect, useState } from 'react'
import { 
  Check, 
  CheckCheck, 
  Clock, 
  AlertCircle, 
  Download, 
  Play, 
  Pause,
  MapPin,
  User,
  FileText,
  X,
  Maximize2,
} from 'lucide-react'
import { useChatStore } from '@/stores/chat-store'
import { cn, formatMessageTime } from '@/lib/utils'
import { mediaApi } from '@/lib/api'

interface ImageViewerProps {
  src: string
  alt: string
  onClose: () => void
}

function ImageViewer({ src, alt, onClose }: ImageViewerProps) {
  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
      >
        <X className="w-8 h-8" />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-[90vw] max-h-[90vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

function AudioPlayer({ src }: { src: string }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  const togglePlay = () => {
    if (!audioRef.current) return
    
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleTimeUpdate = () => {
    if (!audioRef.current) return
    setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100)
  }

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return
    setDuration(audioRef.current.duration)
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setProgress(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-3 p-2 min-w-[200px]">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
      <button
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0"
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 text-white" />
        ) : (
          <Play className="w-5 h-5 text-white ml-0.5" />
        )}
      </button>
      <div className="flex-1">
        <div className="h-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  )
}

export function MessageList() {
  const { messages, isLoadingMessages, hasMoreMessages, activeConversation, fetchMessages } =
    useChatStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const [viewingImage, setViewingImage] = useState<{ src: string; alt: string } | null>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length])

  // Infinite scroll for loading more
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreMessages && !isLoadingMessages && activeConversation) {
          const firstMessage = messages[0]
          if (firstMessage) {
            fetchMessages(activeConversation.id, firstMessage.id)
          }
        }
      },
      { threshold: 1.0 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [hasMoreMessages, isLoadingMessages, activeConversation, messages, fetchMessages])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-3.5 h-3.5 text-gray-400" />
      case 'SENT':
        return <Check className="w-3.5 h-3.5 text-gray-400" />
      case 'DELIVERED':
        return <CheckCheck className="w-3.5 h-3.5 text-gray-400" />
      case 'READ':
        return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
      case 'FAILED':
        return <AlertCircle className="w-3.5 h-3.5 text-red-500" />
      default:
        return null
    }
  }

  const getMediaUrl = (content: any): string => {
    // Priority: localUrl > url > mediaId
    if (content.localUrl) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
      return `${apiUrl.replace('/api/v1', '')}${content.localUrl}`
    }
    if (content.url) {
      return content.url
    }
    if (content.mediaId) {
      return mediaApi.getUrl(content.mediaId)
    }
    return ''
  }

  const renderMessageContent = (message: any) => {
    const content = message.content

    switch (message.type) {
      case 'TEXT':
        return (
          <p className="whitespace-pre-wrap break-words">
            {content.body || content.text}
          </p>
        )

      case 'IMAGE': {
        const imageUrl = getMediaUrl(content)
        return (
          <div className="relative group">
            <img
              src={imageUrl || 'https://via.placeholder.com/300x200?text=Carregando...'}
              alt="Imagem"
              className="max-w-[280px] rounded-lg cursor-pointer"
              onClick={() => imageUrl && setViewingImage({ src: imageUrl, alt: 'Imagem' })}
              loading="lazy"
            />
            <button
              onClick={() => imageUrl && setViewingImage({ src: imageUrl, alt: 'Imagem' })}
              className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            {content.caption && (
              <p className="mt-1 text-sm">{content.caption}</p>
            )}
          </div>
        )
      }

      case 'VIDEO': {
        const videoUrl = getMediaUrl(content)
        return (
          <div>
            <video
              src={videoUrl}
              controls
              className="max-w-[280px] rounded-lg"
              preload="metadata"
            >
              Seu navegador não suporta vídeos.
            </video>
            {content.caption && (
              <p className="mt-1 text-sm">{content.caption}</p>
            )}
          </div>
        )
      }

      case 'AUDIO': {
        const audioUrl = getMediaUrl(content)
        return audioUrl ? (
          <AudioPlayer src={audioUrl} />
        ) : (
          <div className="flex items-center gap-2 text-gray-500">
            <span>🎵</span>
            <span>Áudio não disponível</span>
          </div>
        )
      }

      case 'DOCUMENT': {
        const docUrl = getMediaUrl(content)
        const filename = content.filename || 'Documento'
        const fileSize = content.size ? `${(content.size / 1024 / 1024).toFixed(2)} MB` : ''
        
        return (
          <a
            href={docUrl}
            download={filename}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg hover:bg-white/70 dark:hover:bg-black/30 transition-colors"
          >
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{filename}</p>
              {fileSize && <p className="text-xs text-gray-500">{fileSize}</p>}
              {content.caption && <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{content.caption}</p>}
            </div>
            <Download className="w-5 h-5 text-gray-400 flex-shrink-0" />
          </a>
        )
      }

      case 'STICKER': {
        const stickerUrl = getMediaUrl(content)
        return (
          <img
            src={stickerUrl || 'https://via.placeholder.com/128?text=🎭'}
            alt="Sticker"
            className="w-32 h-32"
            loading="lazy"
          />
        )
      }

      case 'LOCATION':
        return (
          <a
            href={`https://www.google.com/maps?q=${content.latitude},${content.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-[250px] rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
          >
            <div className="h-[120px] bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 flex items-center justify-center">
              <MapPin className="w-12 h-12 text-red-500" />
            </div>
            <div className="p-2 bg-white/50 dark:bg-black/20">
              <p className="font-medium text-sm">
                {content.name || 'Localização'}
              </p>
              {content.address && (
                <p className="text-xs text-gray-500 truncate">{content.address}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {content.latitude?.toFixed(6)}, {content.longitude?.toFixed(6)}
              </p>
            </div>
          </a>
        )

      case 'CONTACTS':
        return (
          <div className="space-y-2">
            {(content.contacts || []).map((contact: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-2 bg-white/50 dark:bg-black/20 rounded-lg"
              >
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">
                    {contact.name?.formatted_name || 'Contato'}
                  </p>
                  {contact.phones?.[0]?.phone && (
                    <p className="text-sm text-gray-500">{contact.phones[0].phone}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )

      case 'INTERACTIVE':
        return (
          <div className="space-y-2">
            {content.body?.text && <p>{content.body.text}</p>}
            {content.buttonReply && (
              <div className="px-3 py-2 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-lg text-sm inline-block">
                ✓ {content.buttonReply.title}
              </div>
            )}
            {content.listReply && (
              <div className="px-3 py-2 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-lg text-sm inline-block">
                ✓ {content.listReply.title}
              </div>
            )}
          </div>
        )

      case 'REACTION':
        return (
          <div className="text-4xl">{content.emoji}</div>
        )

      case 'TEMPLATE':
        return (
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">📋 Template</p>
            <p>{content.name || 'Mensagem de template'}</p>
          </div>
        )

      default:
        return (
          <div className="flex items-center gap-2 text-gray-500">
            <AlertCircle className="w-4 h-4" />
            <span>Mensagem não suportada ({message.type})</span>
          </div>
        )
    }
  }

  return (
    <>
      {/* Image viewer modal */}
      {viewingImage && (
        <ImageViewer
          src={viewingImage.src}
          alt={viewingImage.alt}
          onClose={() => setViewingImage(null)}
        />
      )}

      <div ref={scrollRef} className="h-full overflow-y-auto px-4 py-4">
        {/* Load more trigger */}
        {hasMoreMessages && (
          <div ref={loadMoreRef} className="flex justify-center py-4">
            {isLoadingMessages && (
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        )}

        {/* Empty state */}
        {messages.length === 0 && !isLoadingMessages && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p>Nenhuma mensagem ainda</p>
            <p className="text-sm">Comece uma conversa!</p>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-2">
          {messages.map((message, index) => {
            const isOutbound = message.direction === 'OUTBOUND'
            const showTime =
              index === 0 ||
              new Date(messages[index - 1].timestamp).getTime() + 5 * 60 * 1000 <
                new Date(message.timestamp).getTime()

            return (
              <div key={message.id}>
                {/* Time separator */}
                {showTime && (
                  <div className="flex justify-center my-4">
                    <span className="px-3 py-1 text-xs text-gray-500 bg-white dark:bg-gray-700 rounded-full shadow-sm">
                      {formatMessageTime(message.timestamp)}
                    </span>
                  </div>
                )}

                {/* Message bubble */}
                <div
                  className={cn(
                    'flex',
                    isOutbound ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[70%] px-3 py-2 shadow-sm',
                      isOutbound
                        ? 'message-bubble-out text-gray-900 dark:text-white'
                        : 'message-bubble-in text-gray-900 dark:text-white'
                    )}
                  >
                    {/* Agent name (for outbound) */}
                    {isOutbound && message.sentBy && (
                      <p className="text-xs text-primary-600 dark:text-primary-400 mb-1">
                        {message.sentBy.firstName} {message.sentBy.lastName}
                      </p>
                    )}

                    {/* Content */}
                    {renderMessageContent(message)}

                    {/* Footer */}
                    <div
                      className={cn(
                        'flex items-center gap-1 mt-1',
                        isOutbound ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatMessageTime(message.timestamp)}
                      </span>
                      {isOutbound && getStatusIcon(message.status)}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
