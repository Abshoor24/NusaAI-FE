import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ErrorState } from '@/components/feedback/error-state'
import { EmptyState } from '@/components/feedback/empty-state'
import { Container } from '@/components/ui/container'
import { Section } from '@/components/sections/section'
import { Badge } from '@/components/ui/badge'
import { aiApi, type AiChatMessage, type AiChatRequest, type SolutionContext } from '@/lib/api/ai'
import { SendIcon, XIcon, BotIcon, MessageSquareIcon } from '@/components/ui/icons'
import { cn } from '@/lib/utils/cn'

export const Route = createFileRoute('/chat')({
  component: ChatPage,
  loader: ({ location }) => {
    return location.state as unknown as SolutionContext | undefined
  },
})

function ChatPage() {
  const [messages, setMessages] = useState<AiChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const solutionContext = Route.useLoaderData()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: AiChatMessage = { role: 'user', content: input }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      const payload: AiChatRequest = {
        messages: newMessages,
        solution_context: solutionContext,
      }
      const response = await aiApi.chat(payload)
      const assistantMessage: AiChatMessage = { role: 'assistant', content: response.reply }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send message'
      setError(message)
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setMessages([])
    setError(null)
  }

  const hasMessages = messages.length > 0
  const isSolutionMode = !!solutionContext

  return (
    <Container className="py-8">
      <Section className="animate-fade-up motion-reduce:animate-none">
        <div className="mx-auto max-w-3xl">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <BotIcon className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">AI Assistant</CardTitle>
                    {isSolutionMode && (
                      <p className="text-sm text-muted-foreground">
                        Discussing: <span className="font-medium">{solutionContext.solution.solution_name}</span>
                      </p>
                    )}
                  </div>
                </div>
                {isSolutionMode && (
                  <Badge variant="secondary" className="gap-1.5">
                    <MessageSquareIcon className="size-3" />
                    Solution Discussion
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col min-h-0">
              {isSolutionMode && (
                <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm font-medium text-primary">Solution Context Active</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {solutionContext.business_type} &mdash; {solutionContext.solution.summary}
                  </p>
                </div>
              )}

              <ScrollArea className="flex-1 overflow-y-auto pr-2">
                <div className="flex flex-col gap-4 py-2">
                  {!hasMessages && !isLoading && (
                    <EmptyState
                      title={isSolutionMode ? 'Start discussing the solution' : 'Start a conversation'}
                      description={isSolutionMode
                        ? 'Ask questions about the generated solution, implementation details, timeline, or anything else.'
                        : 'Ask me anything about digital solutions, technology recommendations, or business strategy.'}
                    />
                  )}

                  {messages.map((msg, idx) => (
                    <ChatMessage key={idx} message={msg} />
                  ))}

                  {isLoading && (
                    <ChatMessageSkeleton />
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {error && (
                <ErrorState
                  title="Failed to send"
                  description={error}
                  className="mb-4"
                />
              )}

              <form onSubmit={handleSubmit} className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isSolutionMode ? 'Ask about the solution...' : 'Type your message...'}
                  disabled={isLoading}
                  rows={1}
                  className="flex-1 min-h-[48px] max-h-32 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e)
                    }
                  }}
                />
                <Button
                  type="submit"
                  size="lg"
                  isLoading={isLoading}
                  disabled={!input.trim() || isLoading}
                  aria-label="Send message"
                >
                  <SendIcon className="size-4" />
                </Button>
              </form>
            </CardContent>
          </Card>

          {hasMessages && (
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" size="sm" onClick={handleClear}>
                <XIcon className="size-3 mr-1" />
                Clear Chat
              </Button>
            </div>
          )}
        </div>
      </Section>
    </Container>
  )
}

function ChatMessage({ message }: { message: AiChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-full', isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground')}>
        {isUser ? <MessageSquareIcon className="size-4" /> : <BotIcon className="size-4" />}
      </div>
      <div className={cn('max-w-[80%]', isUser ? 'text-right' : '')}>
        <p className={cn('text-sm whitespace-pre-wrap', isUser ? 'bg-primary text-primary-foreground rounded-2xl px-4 py-2' : 'bg-secondary text-secondary-foreground rounded-2xl px-4 py-2')}>
          {message.content}
        </p>
      </div>
    </div>
  )
}

function ChatMessageSkeleton() {
  return (
    <div className="flex gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary" />
      <div className="max-w-[80%]">
        <div className="h-6 w-3/4 bg-muted animate-pulse rounded-xl" />
        <div className="h-6 w-1/2 bg-muted animate-pulse rounded-xl mt-1" />
      </div>
    </div>
  )
}