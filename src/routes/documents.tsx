import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { documentsApi, type DocumentDetail } from '@/lib/api/documents'
import { Container } from '@/components/ui/container'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Trash2, 
  File, 
  X, 
  RefreshCw,
  Database
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export const Route = createFileRoute('/documents')({
  component: DocumentsPage,
})

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt']
const MAX_DOC_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

function DocumentsPage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  // 1. Fetch Documents with intelligent refetchInterval polling
  const {
    data: documents = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['documents'],
    queryFn: documentsApi.listDocuments,
    // Poll every 3 seconds if any document is in "processing" state
    refetchInterval: (query) => {
      const data = query.state.data
      const hasProcessing = data?.some((doc) => doc.status === 'processing')
      return hasProcessing ? 3000 : false
    },
  })

  // 2. Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('Please select a file to upload')
      return documentsApi.uploadDocument(selectedFile, title)
    },
    onSuccess: () => {
      setSelectedFile(null)
      setTitle('')
      setFormError(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: (err: Error) => {
      setFormError(err.message || 'Failed to upload document')
    },
  })

  // 3. Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentsApi.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: (err: Error) => {
      alert(`Error deleting document: ${err.message}`)
    },
  })

  const validateAndSetFile = (file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFormError(`Unsupported file format (${ext}). Supported formats: PDF, DOCX, TXT.`)
      return false
    }

    if (file.size > MAX_DOC_SIZE_BYTES) {
      setFormError(`File size exceeds 10 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB).`)
      return false
    }

    setFormError(null)
    setSelectedFile(file)
    if (!title.trim()) {
      // Default title without extension
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
      setTitle(baseName)
    }
    return true
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) validateAndSetFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) validateAndSetFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      setFormError('Please select a file first')
      return
    }
    // Backend constraint: title max 255 characters
    if (title.trim().length > 255) {
      setFormError('Document title cannot exceed 255 characters.')
      return
    }
    uploadMutation.mutate()
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const hasProcessingDocs = documents.some((d) => d.status === 'processing')

  return (
    <Container className="py-8 space-y-8 max-w-5xl">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Database className="size-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">RAG Knowledge Base</h1>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Upload PDF, Word (DOCX), or TXT documents to index knowledge for AI Assistant retrieval.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasProcessingDocs && (
            <Badge variant="secondary" className="gap-1.5 animate-pulse text-xs py-1">
              <Loader2 className="size-3.5 animate-spin text-primary" />
              <span>Indexing documents...</span>
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={cn('size-3.5', isRefetching && 'animate-spin')} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Grid: Upload Box + Documents List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Upload Form */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UploadCloud className="size-4 text-primary" />
                Upload Document
              </CardTitle>
              <CardDescription className="text-xs">
                Files are automatically extracted, chunked, and vector-embedded.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                
                {/* Drag and Drop Zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2',
                    dragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-muted/30',
                    selectedFile ? 'bg-muted/20 border-primary/40' : ''
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {selectedFile ? (
                    <div className="flex flex-col items-center gap-1.5 py-1">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <FileText className="size-5" />
                      </div>
                      <span className="text-xs font-semibold max-w-[220px] truncate">
                        {selectedFile.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {formatFileSize(selectedFile.size)}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="p-2.5 rounded-full bg-muted text-muted-foreground">
                        <UploadCloud className="size-5" />
                      </div>
                      <div className="text-xs">
                        <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        PDF, DOCX, TXT (Max 10 MB)
                      </span>
                    </>
                  )}
                </div>

                {selectedFile && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null)
                        setTitle('')
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      className="text-[11px] text-muted-foreground hover:text-destructive flex items-center gap-1"
                    >
                      <X className="size-3" /> Remove selected file
                    </button>
                  </div>
                )}

                {/* Document Title Input */}
                <div className="space-y-1.5">
                  <Label htmlFor="doc-title" className="text-xs">
                    Document Title (Optional)
                  </Label>
                  <Input
                    id="doc-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Employee Handbook 2026"
                    disabled={uploadMutation.isPending}
                    className="text-xs h-9"
                  />
                </div>

                {/* Form Error Message */}
                {formError && (
                  <div className="p-2.5 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive flex items-start gap-2">
                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  size="md"
                  variant="primary"
                  isLoading={uploadMutation.isPending}
                  disabled={!selectedFile || uploadMutation.isPending}
                  className="w-full text-xs font-semibold gap-2"
                >
                  <UploadCloud className="size-4" />
                  <span>Upload & Index</span>
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Documents List */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Indexed Documents ({documents.length})</CardTitle>
                <CardDescription className="text-xs">
                  Documents ready for vector semantic similarity search
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              {/* Loading State */}
              {isLoading && (
                <div className="space-y-3 py-4">
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                </div>
              )}

              {/* Error State */}
              {isError && (
                <ErrorState
                  title="Failed to load documents"
                  description={error?.message || 'Could not fetch documents list.'}
                  onRetry={() => refetch()}
                />
              )}

              {/* Empty State */}
              {!isLoading && !isError && documents.length === 0 && (
                <div className="py-8">
                  <EmptyState
                    title="No knowledge documents yet"
                    description="Upload your first document using the form on the left to activate RAG knowledge search."
                  />
                </div>
              )}

              {/* Document List Rows */}
              {!isLoading && !isError && documents.length > 0 && (
                <div className="divide-y divide-border/60">
                  {documents.map((doc: DocumentDetail) => {
                    return (
                      <div
                        key={doc.id}
                        className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 px-2 rounded-lg transition-colors"
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                            <File className="size-4" />
                          </div>

                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs font-semibold text-foreground truncate">
                                {doc.title}
                              </h4>
                              {renderStatusBadge(doc)}
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                              <span>{doc.file_name || doc.source}</span>
                              <span>&bull;</span>
                              <span>{formatFileSize(doc.file_size)}</span>
                              {doc.status === 'ready' && (
                                <>
                                  <span>&bull;</span>
                                  <span className="font-mono text-primary font-medium">
                                    {doc.chunk_count} {doc.chunk_count === 1 ? 'chunk' : 'chunks'}
                                  </span>
                                </>
                              )}
                              <span>&bull;</span>
                              <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                            </div>

                            {doc.status === 'failed' && doc.error_message && (
                              <p className="text-[11px] text-destructive leading-tight">
                                Error: {doc.error_message}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={deleteMutation.isPending}
                            onClick={() => {
                              if (window.confirm(`Delete document "${doc.title}"?`)) {
                                deleteMutation.mutate(doc.id)
                              }
                            }}
                            title="Delete document"
                            className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </Container>
  )
}

function renderStatusBadge(doc: DocumentDetail) {
  if (doc.status === 'processing') {
    return (
      <Badge variant="secondary" className="gap-1 text-[10px] bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300">
        <Loader2 className="size-3 animate-spin" />
        <span>Processing</span>
      </Badge>
    )
  }

  if (doc.status === 'ready') {
    return (
      <Badge variant="secondary" className="gap-1 text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
        <CheckCircle2 className="size-3" />
        <span>Ready</span>
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className="gap-1 text-[10px] bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300">
      <AlertCircle className="size-3" />
      <span>Failed</span>
    </Badge>
  )
}
