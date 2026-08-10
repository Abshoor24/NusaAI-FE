const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8080'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new ApiError(response.status, `HTTP ${response.status}: ${response.statusText}`)
  }

  return (await response.json()) as T
}

export const api = {
  get: async <T>(path: string): Promise<T> => {
    const response = await fetch(`${API_URL}${path}`)
    return handleResponse<T>(response)
  },

  post: async <T>(path: string, body: unknown): Promise<T> => {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return handleResponse<T>(response)
  },
}