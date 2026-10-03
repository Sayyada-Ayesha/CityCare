import { describe, expect, it, vi } from 'vitest'
import worker from '../src/worker'

const executionContext = {
  waitUntil: vi.fn(),
  passThroughOnException: vi.fn(),
}

describe('Cloudflare Worker routing', () => {
  it('routes API requests through the existing API handler', async () => {
    const assetsFetch = vi.fn()
    const response = await worker.fetch(
      new Request('https://citycare.test/api/health'),
      { ASSETS: { fetch: assetsFetch } },
      executionContext,
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ ok: true, app: 'CityCare AI' })
    expect(assetsFetch).not.toHaveBeenCalled()
  })

  it('delegates non-API requests to the Static Assets binding', async () => {
    const assetResponse = new Response('asset')
    const assetsFetch = vi.fn(async () => assetResponse)
    const request = new Request('https://citycare.test/dashboard')
    const response = await worker.fetch(
      request,
      { ASSETS: { fetch: assetsFetch } },
      executionContext,
    )

    expect(response).toBe(assetResponse)
    expect(assetsFetch).toHaveBeenCalledWith(request)
  })
})
