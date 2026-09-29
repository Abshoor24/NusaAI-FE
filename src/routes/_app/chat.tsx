import { createFileRoute, useLocation, useNavigate } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  conversationsApi, 
  type Message,
  type ImagePayload,
} from '@/lib/api/conversations'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/feedback/empty-state'
import { SandboxPanel, type CodeBlockInfo } from '@/components/SandboxPanel'
import { 
  BotIcon, 
  MessageSquareIcon, 
  SendIcon, 
  XIcon
} from '@/components/ui/icons'
import { 
  Paperclip, 
  Database, 
  Sparkles, 
  Image as ImageIcon,
  Terminal
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export const Route = createFileRoute('/_app/chat')({
  component: ChatRoutePage,
})

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
const MAX_MESSAGE_LENGTH = 10_000 // Backend constraint
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface ExtractedBlock extends CodeBlockInfo {
  rawLanguage: string
}

function extractCodeBlocks(content: string, messageId: string): ExtractedBlock[] {
  const blocks: ExtractedBlock[] = []
  const regex = /```([a-zA-Z0-9_+#-]*)\n([\s\S]*?)```/g
  let match: RegExpExecArray | null
  let index = 0

  while ((match = regex.exec(content)) !== null) {
    const rawLang = (match[1] || '').trim().toLowerCase()
    const code = match[2] || ''
    
    let language: 'python' | 'javascript' | 'go' | null = null
    if (rawLang === 'python' || rawLang === 'py') language = 'python'
    else if (rawLang === 'javascript' || rawLang === 'js') language = 'javascript'
    else if (rawLang === 'go' || rawLang === 'golang') language = 'go'

    if (language) {
      blocks.push({
        id: `${messageId}-block-${index}`,
        language,
        code,
        rawLanguage: rawLang,
      })
    }
    index++
  }

  return blocks
}

function ChatRoutePage() {
  const queryClient = useQueryClient()
  const location = useLocation()
  const navigate = useNavigate()

  // Conversation ID from URL search param ?c=xxx
  const activeConversationId = new URLSearchParams(location.search).get('c') || null

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Sandbox Panel state
  const [sandboxBlock, setSandboxBlock] = useState<CodeBlockInfo | null>(null)
  const [sandboxOpen, setSandboxOpen] = useState(false)
  const closedBlockIds = useRef<Set<string>>(new Set())

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // 1. Fetch Detail of Active Conversation
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

  // 2. Auto-detect code block after streaming or message update
  const handleAutoOpenSandbox = (content: string, msgId: string) => {
    const blocks = extractCodeBlocks(content, msgId)
    if (blocks.length > 0) {
      const latestBlock = blocks[blocks.length - 1]
      if (!closedBlockIds.current.has(latestBlock.id)) {
        setSandboxBlock(latestBlock)
        setSandboxOpen(true)
      }
    }
  }

  // 3. Image File Handling
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setErrorMessage('Invalid image type. Only JPEG, PNG, and WebP are supported.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setErrorMessage(`Image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 10 MB.`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setErrorMessage(null)
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
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

  // 4. Submit Message (Streaming SSE)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedInput = input.trim()
    if ((!trimmedInput && !selectedImage) || isStreaming) return

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
            const assistantMsgId = doneData.message_id || 'msg-' + Date.now()
            const finalAssistantMessage: Message = {
              id: assistantMsgId,
              conversation_id: doneData.conversation_id || activeConversationId || '',
              role: 'assistant',
              content: accumulatedResponse,
              created_at: new Date().toISOString(),
            }

            setMessages((prev) => [...prev, finalAssistantMessage])
            setStreamingContent('')
            setIsStreaming(false)

            // Auto-check for code blocks to open SandboxPanel
            handleAutoOpenSandbox(accumulatedResponse, assistantMsgId)

            if (doneData.conversation_id && doneData.conversation_id !== activeConversationId) {
              navigate({ to: '/chat', search: { c: doneData.conversation_id } as any })
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

  // Render assistant message content with formatted code blocks and "Open in sandbox" button
  const renderMessageContent = (msg: Message) => {
    if (msg.role !== 'assistant') {
      return msg.content
    }

    const blocks = extractCodeBlocks(msg.content, msg.id)
    if (blocks.length === 0) {
      return msg.content
    }

    // Split content by code blocks and render custom blocks with sandbox button
    const parts = msg.content.split(/```[a-zA-Z0-9_+#-]*\n[\s\S]*?```/g)
    
    return (
      <div className="space-y-3">
        {parts.map((part, idx) => (
          <div key={idx} className="space-y-3">
            {part && <div className="whitespace-pre-wrap">{part}</div>}
            {blocks[idx] && (
              <div className="my-2 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 text-neutral-100 font-mono text-xs">
                {/* Code Block Header */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800 text-[11px] text-neutral-400">
                  <span className="uppercase font-semibold">{blocks[idx].language}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSandboxBlock(blocks[idx])
                      setSandboxOpen(true)
                    }}
                    className="h-6 px-2 text-[10px] gap-1 text-primary hover:text-primary hover:bg-primary/10 rounded-md"
                  >
                    <Terminal className="size-3" />
                    <span>Open in sandbox</span>
                  </Button>
                </div>
                {/* Code Content */}
                <pre className="p-3 overflow-x-auto whitespace-pre leading-relaxed">
                  {blocks[idx].code}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-background text-foreground">
      {/* Main Chat Display */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Chat Control Top Header */}
        <header className="h-14 border-b border-border px-4 flex items-center justify-between gap-3 bg-card/40 backdrop-blur shrink-0">
          <div className="flex items-center gap-2 truncate">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <BotIcon className="size-4" />
            </div>
            <h2 className="text-xs sm:text-sm font-semibold truncate">
              {conversationDetail?.title || 'AI Assistant Workspace'}
            </h2>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* RAG Toggle Switch */}
            <div 
              onClick={() => setUseRag(!useRag)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-full border cursor-pointer select-none transition-all text-xs font-medium',
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
                  description="Ask questions, execute code directly in sandbox, or toggle RAG to query your uploaded documents."
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

                  <div className={cn('max-w-[85%] space-y-2', isUser && 'text-right')}>
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
                        'text-xs sm:text-sm rounded-2xl px-4 py-2.5 leading-relaxed break-words text-left',
                        isUser
                          ? 'bg-primary text-primary-foreground rounded-tr-sm shadow-xs whitespace-pre-wrap'
                          : 'bg-muted/70 text-foreground border border-border/80 rounded-tl-sm shadow-xs'
                      )}
                    >
                      {renderMessageContent(msg)}
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
                <div className="max-w-[85%]">
                  <div className="text-xs sm:text-sm whitespace-pre-wrap rounded-2xl rounded-tl-sm px-4 py-2.5 bg-muted/70 text-foreground border border-border/80 leading-relaxed break-words shadow-xs">
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
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />

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
              <span>Press <kbd className="font-mono bg-muted px-1 py-0.5 rounded text-[10px]">Enter</kbd> to send</span>
              {useRag && (
                <span className="text-primary font-medium flex items-center gap-1">
                  <Database className="size-3" /> RAG Knowledge enabled
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sandbox Panel (Slide-out on right) */}
      <SandboxPanel
        block={sandboxBlock}
        isOpen={sandboxOpen}
        onClose={() => {
          setSandboxOpen(false)
          if (sandboxBlock) {
            closedBlockIds.current.add(sandboxBlock.id)
          }
        }}
        isStreaming={isStreaming}
      />
    </div>
  )
}
