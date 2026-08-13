import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { getHealth } from '@/lib/api/health'

export function HealthStatus() {
  const { isPending, isSuccess, isError, error } = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    retry: false,
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">Backend Status</CardTitle>
          <CardDescription>
            Verifies that the API client can reach the backend. Dev-only.
          </CardDescription>
        </div>
        {isPending && <Spinner className="text-muted-foreground" />}
        {isSuccess && <Badge variant="success">Connected</Badge>}
        {isError && <Badge variant="destructive">Disconnected</Badge>}
      </CardHeader>
      {isError && (
        <div className="px-6 pb-5">
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      )}
    </Card>
  )
}