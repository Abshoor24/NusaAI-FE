import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  conversationsApi, 
  type Conversation,
  type Message,
  type ImagePayload,
} from '@/lib/api/conversations'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/feedback/empty-state'
import { 
  BotIcon, 
  MessageSquareIcon, 
  SendIcon, 
  XIcon
} from '@/components/ui/icons'
import { 
  Plus, 
  Paperclip, 
  Database, 
  Sparkles, 
  PanelLeftClose, 
  PanelLeft, 
  Image as ImageIcon,
  Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export const Route = createFileRoute('/chat')({
  component: ChatRoutePage,
})

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
const MAX_MESSAGE_LENGTH = 10_000 // Backend constraint
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function ChatRoutePage() {
  const queryClient = useQueryClient()
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [useRag, setUseRag] = useState(true)
  const [selectedImage, setSelectedImage] = useState<{
    file: File
    previewUrl: string
    base64: string
  } | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // 1. Fetch Conversations List
  const { data: conversations = [], isLoading: isLoadingConversations } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: conversationsApi.list,
  })

  // 2. Fetch Detail of Active Conversation
  const { data: conversationDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['conversation', activeConversationId],
    queryFn: () => conversationsApi.get(activeConversationId!),
    enabled: !!activeConversationId,
  })

  // Synchronize detail messages into local state
  useEffect(() => {
    if (conversationDetail?.messages) {
      setMessages(conversationDetail.messages)
    } else if (!activeConversationId) {
      setMessages([])
    }
  }, [conversationDetail, activeConversationId])

  // Scroll to bottom on message change or streaming update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // 3. Delete Conversation Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => conversationsApi.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      if (activeConversationId === deletedId) {
        setActiveConversationId(null)
        setMessages([])
      }
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || 'Failed to delete conversation')
    },
  })

  const handleStartNewConversation = () => {
    if (isStreaming) {
      abortControllerRef.current?.abort()
      setIsStreaming(false)
    }
    setActiveConversationId(null)
    setMessages([])
    setStreamingContent('')
    setErrorMessage(null)
    setSelectedImage(null)
  }

  // 4. Handle Image File Selection & Validation
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setErrorMessage('Invalid image type. Only JPEG, PNG, and WebP are supported.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Validate size
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setErrorMessage(`Image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 10 MB.`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setErrorMessage(null)
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      // Extract base64 portion
      const base64Data = dataUrl.split(',')[1] || ''
      setSelectedImage({
        file,
        previewUrl: URL.createObjectURL(file),
        base64: base64Data,
      })
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    if (selectedImage?.previewUrl) {
      URL.revokeObjectURL(selectedImage.previewUrl)
    }
    setSelectedImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // 5. Submit Message (Streaming SSE)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedInput = input.trim()
    if ((!trimmedInput && !selectedImage) || isStreaming) return

    // Frontend validation: message length
    if (trimmedInput.length > MAX_MESSAGE_LENGTH) {
      setErrorMessage(`Message is too long (${trimmedInput.length} characters). Maximum is ${MAX_MESSAGE_LENGTH} characters.`)
      return
    }

    setErrorMessage(null)
    const userMessageContent = trimmedInput || '(Attached Image)'
    const userMsgId = 'temp-' + Date.now()

    const optimisticUserMessage: Message = {
      id: userMsgId,
      conversation_id: activeConversationId || '',
      role: 'user',
      content: userMessageContent,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, optimisticUserMessage])
    setInput('')
    setIsStreaming(true)
    setStreamingContent('')

    const imagePayload: ImagePayload[] | undefined = selectedImage
      ? [
          {
            file_name: selectedImage.file.name,
            mime_type: selectedImage.file.type,
            data: selectedImage.base64,
          },
        ]
      : undefined

    handleRemoveImage()

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    let accumulatedResponse = ''

    try {
      await conversationsApi.streamMessage(
        {
          conversation_id: activeConversationId || undefined,
          message: userMessageContent,
          use_rag: useRag,
          images: imagePayload,
        },
        {
          onToken: (token) => {
            accumulatedResponse += token
            setStreamingContent(accumulatedResponse)
          },
          onDone: (doneData) => {
            const finalAssistantMessage: Message = {
              id: doneData.message_id || 'msg-' + Date.now(),
              conversation_id: doneData.conversation_id || activeConversationId || '',
              role: 'assistant',
              content: accumulatedResponse,
              created_at: new Date().toISOString(),
            }

            setMessages((prev) => [...prev, finalAssistantMessage])
            setStreamingContent('')
            setIsStreaming(false)

            if (doneData.conversation_id && doneData.conversation_id !== activeConversationId) {
              setActiveConversationId(doneData.conversation_id)
            }
            queryClient.invalidateQueries({ queryKey: ['conversations'] })
            if (activeConversationId) {
              queryClient.invalidateQueries({ queryKey: ['conversation', activeConversationId] })
            }
          },
          onError: (streamError) => {
            setErrorMessage(streamError)
            setIsStreaming(false)
          },
        },
        abortController.signal
      )
    } catch (err: unknown) {
      if (!abortController.signal.aborted) {
        const errorObj = err as Error
        setErrorMessage(errorObj.message || 'Error occurred while streaming response')
        setIsStreaming(false)
      }
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full overflow-hidden bg-background text-foreground">
      
      {/* ========================================================= */}
      {/* SIDEBAR: CONVERSATION HISTORY (TanStack Query cached)    */}
      {/* ========================================================= */}
      <aside
        className={cn(
          'border-r border-border bg-card/60 flex flex-col transition-all duration-200 shrink-0 z-20',
          sidebarOpen ? 'w-72 md:w-80' : 'w-0 overflow-hidden border-r-0'
        )}
      >
        <div className="p-3 border-b border-border flex items-center justify-between gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleStartNewConversation}
            className="flex-1 justify-center gap-1.5 font-semibold text-xs shadow-sm"
          >
            <Plus className="size-4" />
            <span>New Conversation</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            aria-label="Collapse sidebar"
            className="md:hidden size-8"
          >
            <PanelLeftClose className="size-4 text-muted-foreground" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Past Conversations
          </div>

          {isLoadingConversations && (
            <div className="space-y-2 p-2">
              <div className="h-9 rounded-lg bg-muted/60 animate-pulse" />
              <div className="h-9 rounded-lg bg-muted/60 animate-pulse" />
              <div className="h-9 rounded-lg bg-muted/60 animate-pulse" />
            </div>
          )}

          {!isLoadingConversations && conversations.length === 0 && (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No conversations yet. Start a new one!
            </div>
          )}

          {conversations.map((conv) => {
            const isActive = activeConversationId === conv.id
            return (
              <div
                key={conv.id}
                className={cn(
                  'group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
                onClick={() => {
                  if (activeConversationId !== conv.id) {
                    setActiveConversationId(conv.id)
                    setErrorMessage(null)
                    setSelectedImage(null)
                  }
                }}
              >
                <div className="flex items-center gap-2.5 truncate flex-1 min-w-0 pr-1">
                  <MessageSquareIcon className={cn('size-4 shrink-0', isActive ? 'text-primary-foreground' : 'text-muted-foreground')} />
                  <span className="truncate">{conv.title || 'Untitled Thread'}</span>
                </div>

                <button
                  type="button"
                  title="Delete Conversation"
                  disabled={deleteMutation.isPending}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (window.confirm('Delete this conversation?')) {
                      deleteMutation.mutate(conv.id)
                    }
                  }}
                  className={cn(
                    'opacity-0 group-hover:opacity-100 p-1 rounded-md transition-opacity',
                    isActive 
                      ? 'text-primary-foreground hover:bg-primary-foreground/20' 
                      : 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
                  )}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN CHAT DISPLAY AREA                                    */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col min-w-0 bg-background relative">
        
        {/* Chat Control Top Header */}
        <header className="h-14 border-b border-border px-4 flex items-center justify-between gap-3 bg-card/40 backdrop-blur shrink-0">
          <div className="flex items-center gap-2 truncate">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                title="Open Sidebar"
                className="size-8"
              >
                <PanelLeft className="size-4" />
              </Button>
            )}
            <div className="flex items-center gap-2 truncate">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <BotIcon className="size-4" />
              </div>
              <h2 className="text-sm font-semibold truncate">
                {conversationDetail?.title || 'AI Assistant'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* RAG Toggle Switch */}
            <div 
              onClick={() => setUseRag(!useRag)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer select-none transition-all text-xs font-medium',
                useRag
                  ? 'bg-primary/10 border-primary/30 text-primary shadow-xs'
                  : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
              )}
              title="When enabled, AI will query your RAG knowledge base documents"
            >
              <Database className={cn('size-3.5', useRag ? 'text-primary' : 'text-muted-foreground')} />
              <span>Use RAG</span>
              <span className={cn('size-2 rounded-full ml-0.5', useRag ? 'bg-primary animate-pulse' : 'bg-muted-foreground/40')} />
            </div>

            {isStreaming && (
              <Badge variant="secondary" className="gap-1 animate-pulse hidden sm:inline-flex text-[11px]">
                <Sparkles className="size-3 text-primary animate-spin" />
                <span>Generating...</span>
              </Badge>
            )}
          </div>
        </header>

        {/* Message Thread Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          <div className="max-w-3xl mx-auto space-y-4">
            
            {/* Loading Initial Detail State */}
            {isLoadingDetail && (
              <div className="space-y-4 py-8">
                <div className="flex gap-3">
                  <div className="size-8 rounded-full bg-muted animate-pulse shrink-0" />
                  <div className="space-y-2 flex-1 max-w-sm">
                    <div className="h-4 bg-muted animate-pulse rounded" />
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoadingDetail && messages.length === 0 && !isStreaming && (
              <div className="py-12">
                <EmptyState
                  title="How can I help you today?"
                  description="Ask questions, execute code concepts, or toggle RAG to retrieve answers directly from your uploaded documents."
                />
              </div>
            )}

            {/* Render Messages */}
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user'
              return (
                <div
                  key={msg.id || index}
                  className={cn('flex gap-3', isUser && 'flex-row-reverse')}
                >
                  <div
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-xs',
                      isUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground border border-border'
                    )}
                  >
                    {isUser ? <MessageSquareIcon className="size-4" /> : <BotIcon className="size-4" />}
                  </div>

                  <div className={cn('max-w-[82%] space-y-2', isUser && 'text-right')}>
                    {/* Render message attachments if present */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className={cn('flex flex-wrap gap-2', isUser && 'justify-end')}>
                        {msg.attachments.map((att) => (
                          <div
                            key={att.id}
                            className="rounded-xl border border-border bg-card overflow-hidden shadow-xs max-w-xs"
                          >
                            <img
                              src={conversationsApi.getAttachmentUrl(att.id)}
                              alt={att.file_name}
                              className="max-h-48 w-auto object-cover"
                              loading="lazy"
                            />
                            <div className="p-1.5 text-[10px] text-muted-foreground truncate">
                              {att.file_name}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div
                      className={cn(
                        'text-sm whitespace-pre-wrap rounded-2xl px-4 py-2.5 leading-relaxed break-words text-left',
                        isUser
                          ? 'bg-primary text-primary-foreground rounded-tr-sm shadow-xs'
                          : 'bg-muted/70 text-foreground border border-border/80 rounded-tl-sm shadow-xs'
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Assistant Live Streaming Bubble */}
            {isStreaming && (
              <div className="flex gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground border border-border">
                  <BotIcon className="size-4" />
                </div>
                <div className="max-w-[82%]">
                  <div className="text-sm whitespace-pre-wrap rounded-2xl rounded-tl-sm px-4 py-2.5 bg-muted/70 text-foreground border border-border/80 leading-relaxed break-words shadow-xs">
                    {streamingContent ? (
                      <>
                        {streamingContent}
                        <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5 py-1 text-muted-foreground text-xs">
                        <Sparkles className="size-3.5 animate-spin text-primary" />
                        <span>Thinking...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20 text-destructive text-xs flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-destructive hover:opacity-75 p-1"
            >
              <XIcon className="size-3" />
            </button>
          </div>
        )}

        {/* Input Bar Form */}
        <div className="p-4 border-t border-border bg-card/40 shrink-0">
          <div className="max-w-3xl mx-auto space-y-2">
            
            {/* Selected Image Attachment Preview */}
            {selectedImage && (
              <div className="flex items-center gap-3 p-2 bg-muted/60 border border-border rounded-xl w-fit">
                <img
                  src={selectedImage.previewUrl}
                  alt="Attachment preview"
                  className="size-12 rounded-lg object-cover border border-border"
                />
                <div className="flex flex-col text-xs">
                  <span className="font-medium max-w-[200px] truncate">{selectedImage.file.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {(selectedImage.file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="p-1 text-muted-foreground hover:text-destructive rounded-md"
                  title="Remove image"
                >
                  <XIcon className="size-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />

              {/* Attach Image Button */}
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isStreaming}
                title="Attach Image (JPEG, PNG, WebP up to 10MB)"
                className={cn('size-11 shrink-0 rounded-xl', selectedImage && 'border-primary text-primary')}
              >
                {selectedImage ? <ImageIcon className="size-5" /> : <Paperclip className="size-5" />}
              </Button>

              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  useRag
                    ? 'Ask anything (RAG document search active)...'
                    : 'Ask anything to AI Assistant...'
                }
                disabled={isStreaming}
                rows={1}
                maxLength={MAX_MESSAGE_LENGTH}
                className="flex-1 min-h-[44px] max-h-36 resize-none rounded-xl text-xs md:text-sm py-3"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
              />

              <Button
                type="submit"
                variant="primary"
                size="icon"
                disabled={isStreaming || (!input.trim() && !selectedImage)}
                className="size-11 shrink-0 rounded-xl shadow-sm"
                aria-label="Send message"
              >
                <SendIcon className="size-4" />
              </Button>
            </form>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
              <span>Press <kbd className="font-mono bg-muted px-1 py-0.5 rounded text-[10px]">Enter</kbd> to send, <kbd className="font-mono bg-muted px-1 py-0.5 rounded text-[10px]">Shift+Enter</kbd> for new line</span>
              {useRag && (
                <span className="text-primary font-medium flex items-center gap-1">
                  <Database className="size-3" /> RAG Knowledge retrieval enabled
                </span>
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}