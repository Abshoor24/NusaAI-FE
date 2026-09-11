import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { LoadingState } from '@/components/feedback/loading-state'
import { ErrorState } from '@/components/feedback/error-state'
import { EmptyState } from '@/components/feedback/empty-state'
import { aiApi, type GenerateSolutionRequest, type GeneratedSolution, type SolutionContext } from '@/lib/api/ai'
import { Container } from '@/components/ui/container'
import { Section } from '@/components/sections/section'
import { SectionHeader } from '@/components/sections/section-header'
import { CheckIcon, ZapIcon, CpuIcon, AlertTriangleIcon, MessageSquareIcon } from '@/components/ui/icons'

export const Route = createFileRoute('/ai-solution-generator')({
  component: AISolutionGeneratorPage,
})

function AISolutionGeneratorPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<GenerateSolutionRequest>({
    business_type: '',
    business_problem: '',
    business_goal: '',
  })
  const [result, setResult] = useState<GeneratedSolution | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (field: keyof GenerateSolutionRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await aiApi.generateSolution(formData)
      setResult(response.solution)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate solution'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({ business_type: '', business_problem: '', business_goal: '' })
    setResult(null)
    setError(null)
  }

  const handleRetry = () => {
    handleSubmit({ preventDefault: () => {} } as React.FormEvent)
  }

  const handleDiscuss = () => {
    if (!result) return
    const context: SolutionContext = {
      business_type: formData.business_type,
      business_problem: formData.business_problem,
      business_goal: formData.business_goal,
      solution: result,
    }
    navigate({ to: '/chat', state: context as any })
  }

  const isFormValid = formData.business_type.trim() && formData.business_problem.trim() && formData.business_goal.trim()

  return (
    <Container className="py-16">
      <Section className="animate-fade-up motion-reduce:animate-none">
        <SectionHeader
          eyebrow="AI Generator"
          title="AI Business Solution Generator"
          description="Describe your business needs and let AI recommend a structured digital solution."
        />

        <div className="mx-auto max-w-3xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ZapIcon className="size-5" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="business_type">Business Type</Label>
                  <Input
                    id="business_type"
                    placeholder="e.g., Restaurant, E-commerce, SaaS, Healthcare"
                    value={formData.business_type}
                    onChange={(e) => handleChange('business_type', e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_problem">Business Problem</Label>
                  <Textarea
                    id="business_problem"
                    placeholder="e.g., Customers cannot order food online, High cart abandonment, Manual inventory tracking"
                    value={formData.business_problem}
                    onChange={(e) => handleChange('business_problem', e.target.value)}
                    disabled={isLoading}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_goal">Business Goal</Label>
                  <Textarea
                    id="business_goal"
                    placeholder="e.g., Increase online sales, Reduce operational costs, Improve customer retention"
                    value={formData.business_goal}
                    onChange={(e) => handleChange('business_goal', e.target.value)}
                    disabled={isLoading}
                    rows={3}
                  />
                </div>

                <Button type="submit" size="lg" className="w-full" isLoading={isLoading} disabled={!isFormValid || isLoading}>
                  Generate Solution
                </Button>
              </CardContent>
            </Card>

            {error && (
              <ErrorState
                title="Generation Failed"
                description={error}
                onRetry={handleRetry}
              />
            )}

            {!isLoading && !error && !result && (
              <EmptyState
                title="Ready to Generate"
                description="Fill in the form above and click Generate Solution to get AI-powered recommendations."
              />
            )}

            {isLoading && <LoadingState label="Analyzing your business and generating solution..." />}

            {result && (
              <SolutionResultCard solution={result} onReset={handleReset} onDiscuss={handleDiscuss} />
            )}
          </form>
        </div>
      </Section>
    </Container>
  )
}

function SolutionResultCard({
  solution,
  onReset,
  onDiscuss,
}: {
  solution: GeneratedSolution
  onReset: () => void
  onDiscuss: () => void
}) {
  const complexityColors = {
    Low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    High: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  }

  const complexityIcon = {
    Low: CheckIcon,
    Medium: ZapIcon,
    High: AlertTriangleIcon,
  }

  const ComplexityIcon = complexityIcon[solution.complexity as keyof typeof complexityIcon] || CpuIcon
  const complexityClass = complexityColors[solution.complexity as keyof typeof complexityColors] || complexityColors.Medium

  return (
    <Card className="animate-fade-up motion-reduce:animate-none border-primary/20">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">{solution.solution_name}</CardTitle>
            <p className="text-muted-foreground mt-1">{solution.summary}</p>
          </div>
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${complexityClass}`}>
            <ComplexityIcon className="size-3" />
            {solution.complexity}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <CheckIcon className="size-4 text-primary" />
            Recommended Features
          </h3>
          <div className="flex flex-wrap gap-2">
            {solution.recommended_features.map((feature, index) => (
              <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary border border-primary/20">
                {feature}
              </span>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <CpuIcon className="size-4 text-primary" />
            Recommended Technologies
          </h3>
          <div className="flex flex-wrap gap-2">
            {solution.recommended_technology.map((tech, index) => (
              <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-secondary text-secondary-foreground border border-secondary">
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onReset}>
            Generate Another
          </Button>
          <Button onClick={onDiscuss} className="gap-2">
            <MessageSquareIcon className="size-4" />
            Discuss This Solution
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}