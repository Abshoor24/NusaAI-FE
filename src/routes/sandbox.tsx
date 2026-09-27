import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { executeApi, type ExecuteRequest, type ExecuteResponseData } from '@/lib/api/execute'
import { Container } from '@/components/ui/container'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Play, Clock, MemoryStick, Terminal, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export const Route = createFileRoute('/sandbox')({
  component: SandboxPage,
})

function SandboxPage() {
  const queryClient = useQueryClient()
  const [language, setLanguage] = useState<ExecuteRequest['language']>('python')
  const [code, setCode] = useState('')
  const [stdin, setStdin] = useState('')
  const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor')

  const { data: history = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['executions'],
    queryFn: () => executeApi.getExecutionHistory(),
  })

  const runMutation = useMutation({
    mutationFn: executeApi.runCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executions'] })
    },
  })

  const MAX_CODE_BYTES = 64 * 1024 // 64 KB backend limit

  const handleRun = () => {
    if (!code.trim()) return
    // Validate code size before sending to backend
    const codeBytes = new TextEncoder().encode(code).length
    if (codeBytes > MAX_CODE_BYTES) {
      alert(`Code size exceeds 64 KB limit (${(codeBytes / 1024).toFixed(1)} KB). Please reduce your code.`)
      return
    }
    runMutation.mutate({ language, code, stdin: stdin.trim() || undefined })
  }

  const renderCodeExecution = (result: ExecuteResponseData) => {
    const isError = result.exit_code !== 0 || result.stderr
    
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={isError ? 'destructive' : 'default'} className="uppercase">
            {result.status}
          </Badge>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Terminal className="size-3.5" />
            <span>Exit Code: {result.exit_code}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            <span>{result.execution_time_ms} ms</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MemoryStick className="size-3.5" />
            <span>{result.memory_kb} KB</span>
          </div>
        </div>

        {result.stdout && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Standard Output</Label>
            <pre className="p-3 bg-neutral-950 text-neutral-50 rounded-lg text-sm font-mono overflow-x-auto whitespace-pre-wrap">
              {result.stdout}
            </pre>
          </div>
        )}

        {result.stderr && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-destructive">Standard Error</Label>
            <pre className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm font-mono overflow-x-auto whitespace-pre-wrap">
              {result.stderr}
            </pre>
          </div>
        )}
        
        {!result.stdout && !result.stderr && (
          <div className="p-4 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground italic border border-border">
            No output produced.
          </div>
        )}
      </div>
    )
  }

  return (
    <Container className="py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Code Sandbox</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Execute Python, JavaScript, or Go code in a secure, isolated environment.
          </p>
        </div>
        <div className="flex bg-muted/50 p-1 rounded-xl border border-border">
          <button
            onClick={() => setActiveTab('editor')}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-lg transition-colors",
              activeTab === 'editor' ? "bg-white text-foreground shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Editor
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-lg transition-colors",
              activeTab === 'history' ? "bg-white text-foreground shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground"
            )}
          >
            History
          </button>
        </div>
      </div>

      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Code Editor</CardTitle>
                  <Select
                    value={language}
                    onChange={(e: any) => setLanguage(e.target.value)}
                    className="w-32 h-8 text-xs"
                  >
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="go">Go</option>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Source Code</Label>
                  <Textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={`Write your ${language} code here...`}
                    className="font-mono text-sm min-h-[300px] resize-y bg-neutral-950 text-neutral-100 placeholder:text-neutral-600 p-4"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Standard Input (Optional)</Label>
                  <Textarea
                    value={stdin}
                    onChange={(e) => setStdin(e.target.value)}
                    placeholder="Provide STDIN data..."
                    className="font-mono text-sm min-h-[80px]"
                  />
                </div>
                <Button 
                  onClick={handleRun} 
                  disabled={runMutation.isPending || !code.trim()}
                  className="w-full"
                >
                  {runMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <RotateCcw className="size-4 animate-spin" />
                      Running... (This may take a few seconds)
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Play className="size-4" /> Run Code
                    </span>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border-border/60 shadow-sm h-full">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-base font-semibold">Execution Output</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 h-[calc(100%-60px)] overflow-y-auto">
                {runMutation.isPending ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-3 py-12">
                    <RotateCcw className="size-8 animate-spin text-primary/60" />
                    <p className="text-sm">Executing your code in sandbox...</p>
                  </div>
                ) : runMutation.data ? (
                  renderCodeExecution(runMutation.data)
                ) : runMutation.isError ? (
                  <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm border border-destructive/20">
                    Failed to run code. Please try again.
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-3 py-12">
                    <Terminal className="size-10 text-muted-foreground/30" />
                    <p className="text-sm">Click "Run Code" to see the output here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Execution History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <RotateCcw className="size-4 animate-spin" /> Loading history...
              </div>
            ) : history.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No execution history found.
              </div>
            ) : (
              <div className="space-y-6 divide-y divide-border/40">
                {history.map((item) => (
                  <div key={item.id} className="pt-6 first:pt-0">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="uppercase font-mono text-[10px]">
                          {item.language}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.created_at || '').toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {item.code && (
                      <div className="mb-4 text-xs">
                        <div className="font-semibold text-muted-foreground mb-1.5">Code Snippet:</div>
                        <pre className="p-2 bg-muted/40 rounded border border-border overflow-x-auto text-muted-foreground line-clamp-3">
                          {item.code}
                        </pre>
                      </div>
                    )}
                    {renderCodeExecution(item)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </Container>
  )
}
