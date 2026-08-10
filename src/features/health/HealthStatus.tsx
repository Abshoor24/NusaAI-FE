import { useQuery } from '@tanstack/react-query'
import { getHealth } from './health.api'

export function HealthStatus() {
  const { isPending, isSuccess, isError, error } = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    retry: false,
  })

  const status = isPending
    ? 'Checking...'
    : isSuccess
      ? 'Connected'
      : 'Disconnected'

  const statusClass = isPending
    ? 'text-gray-500'
    : isSuccess
      ? 'text-green-600'
      : 'text-red-600'

  return (
    <section className="rounded-md border border-gray-200 bg-gray-50 p-4">
      <h2 className="text-sm font-medium text-gray-700">Backend Status</h2>
      <p className={`mt-1 text-lg font-semibold ${statusClass}`}>{status}</p>
      {isError && <p className="mt-1 text-sm text-gray-500">{error.message}</p>}
    </section>
  )
}