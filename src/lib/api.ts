export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH'
  body?: unknown
  citizenToken?: string
  adminPin?: string
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers = new Headers()
  if (options.body !== undefined) headers.set('Content-Type', 'application/json')
  if (options.citizenToken) headers.set('X-Citizen-Token', options.citizenToken)
  if (options.adminPin) headers.set('X-Admin-Pin', options.adminPin)

  let response: Response
  try {
    response = await fetch(`/api/${path.replace(/^\/+/, '')}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch {
    throw new ApiError('CityCare could not reach its server. Check your connection and try again.', 0, 'NETWORK_ERROR')
  }

  const payload = await response.json().catch(() => null) as {
    error?: { code?: string; message?: string }
  } | null
  if (!response.ok) {
    throw new ApiError(
      payload?.error?.message ?? 'The request could not be completed.',
      response.status,
      payload?.error?.code ?? 'REQUEST_FAILED',
    )
  }
  if (payload === null) throw new ApiError('The server returned an invalid response.', response.status, 'INVALID_RESPONSE')
  return payload as T
}