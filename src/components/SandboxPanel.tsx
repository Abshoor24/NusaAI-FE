import { useState, useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { executeApi, type ExecuteResponseData, type ExecuteLanguage } from '@/lib/api/execute'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Play, Copy, Check, X, RotateCcw, Terminal, Clock, MemoryStick } from 'lucide-react'

export interface CodeBlockInfo {
  id: string // Unique identifier for the code block
  language: ExecuteLanguage
  code: string
}

interface SandboxPanelProps {
  block: CodeBlockInfo | null
  isOpen: boolean
  onClose: () => void
  isStreaming: boolean
}

export function SandboxPanel({ block, isOpen, onClose, isStreaming }: SandboxPanelProps) {
  const [copied, setCopied] = useState(false)
  const lastExecutedBlockId = useRef<string | null>(null)

  const executeMutation = useMutation({
    mutationFn: executeApi.runCode,
  })

  // Auto-run code when panel is open, block exists, streaming finished, and block hasn't been executed yet
  useEffect(() => {
    if (isOpen && block && !isStreaming && lastExecutedBlockId.current !== block.id) {
      lastExecutedBlockId.current = block.id
      executeMutation.mutate({
        language: block.language,
        code: block.code,
      })
    }
  }, [isOpen, block, isStreaming])

  // Re-run execution manually
  const handleRun = () => {
    if (!block) return
    executeMutation.mutate({
      language: block.language,
      code: block.code,
    })
  }

  const handleCopy = () => {
    if (!block) return
    navigator.clipboard.writeText(block.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen || !block) return null

  const result: ExecuteResponseData | undefined = executeMutation.data
  const isLoading = executeMutation.isPending || isStreaming

  return (
    <aside className="w-full lg:w-[480px] xl:w-[540px] h-full border-l border-border bg-card flex flex-col shrink-0 z-20 shadow-lg transition-all duration-200">
      {/* Header */}
      <div className="h-14 px-4 border-b border-border/80 flex items-center justify-between gap-3 bg-muted/30 shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="size-4 text-primary" />
          <span className="font-semibold text-xs tracking-tight">Code Sandbox</span>
          <Badge variant="outline" className="uppercase text-[10px] font-mono px-2 py-0.5">
            {block.language}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRun}
            disabled={isLoading}
            className="h-8 gap-1.5 text-xs rounded-lg"
            title="Run Code"
          >
            {executeMutation.isPending ? (
              <RotateCcw className="size-3.5 animate-spin" />
            ) : (
              <Play className="size-3.5 fill-current" />
            )}
            <span>Run</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="size-8 rounded-lg"
            title="Copy Code"
          >
            {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
            title="Close Panel"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto flex flex-col p-4 space-y-4">
        {/* Code Editor Preview */}
        <div className="space-y-1.5 flex-1 flex flex-col min-h-[200px]">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Source Code
          </div>
          <div className="flex-1 rounded-xl bg-neutral-950 text-neutral-100 p-4 font-mono text-xs overflow-x-auto border border-neutral-800 whitespace-pre leading-relaxed">
            {block.code}
          </div>
        </div>

        {/* Execution Output Panel */}
        <div className="space-y-2 shrink-0 border-t border-border/60 pt-3">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Execution Result</span>
            {isStreaming && (
              <span className="text-primary animate-pulse text-[10px] lowercase italic">
                waiting for response completion...
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="p-6 rounded-xl bg-muted/40 border border-border/60 flex flex-col items-center justify-center text-muted-foreground space-y-2">
              <RotateCcw className="size-6 animate-spin text-primary" />
              <p className="text-xs">Executing code in Judge0 container...</p>
            </div>
          ) : executeMutation.isError ? (
            <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-xs border border-destructive/20 space-y-1">
              <div className="font-semibold">Execution Error</div>
              <p>{(executeMutation.error as Error).message || 'Failed to execute code.'}</p>
            </div>
          ) : result ? (
            <div className="space-y-3 p-3 rounded-xl bg-muted/40 border border-border/80">
              {/* Execution Metadata Bar */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs pb-2 border-b border-border/40">
                <Badge
                  variant={result.exit_code === 0 ? 'default' : 'destructive'}
                  className="uppercase text-[10px] px-2"
                >
                  {result.status}
                </Badge>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Terminal className="size-3" />
                  <span>Exit: {result.exit_code}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="size-3" />
                  <span>{result.execution_time_ms} ms</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MemoryStick className="size-3" />
                  <span>{result.memory_kb} KB</span>
                </div>
              </div>

              {/* Stdout Output */}
              {result.stdout && (
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-muted-foreground">Standard Output:</span>
                  <pre className="p-3 bg-neutral-950 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-48">
                    {result.stdout}
                  </pre>
                </div>
              )}

              {/* Stderr Output */}
              {result.stderr && (
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-destructive">Standard Error:</span>
                  <pre className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-48">
                    {result.stderr}
                  </pre>
                </div>
              )}

              {!result.stdout && !result.stderr && (
                <div className="py-2 text-center text-xs text-muted-foreground italic">
                  Code executed cleanly with no printed output.
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-muted/30 text-center text-xs text-muted-foreground italic border border-border/50">
              Click "Run" to execute this code block.
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
