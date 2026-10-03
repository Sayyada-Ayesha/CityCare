import { afterEach, describe, expect, it, vi } from 'vitest'
import { onRequest } from '../functions/api/[[path]]'

function createDatabase() {
  const statements: { query: string; values: unknown[] }[] = []
  const database = {
    statements,
    prepare(query: string) {
      const statement = {
        values: [] as unknown[],
        bind(...values: unknown[]) {
          this.values = values
          statements.push({ query, values })
          return this
        },
        async first<T>() {
          return null as T | null
        },
        async all<T>() {
          return { results: [] as T[] }
        },
        async run() {
          return { success: true }
        },
      }
      return statement
    },
    async batch() {
      return []
    },
  }
  return database
}

function apiRequest(path: string, init: RequestInit = {}) {
  return new Request(`https://citycare.test/api/${path}`, init)
}

describe('CityCare API', () => {
  afterEach(() => vi.restoreAllMocks())

  it('requires an anonymous citizen token before accepting a complaint', async () => {
    const response = await onRequest({
      request: apiRequest('complaints', { method: 'POST', body: '{}' }),
      env: { DB: createDatabase() },
    })

    expect(response.status).toBe(401)
    expect(await response.json()).toMatchObject({ error: { code: 'CITIZEN_TOKEN_REQUIRED' } })
  })

  it('does not return complaints without matching the hashed citizen token', async () => {
    const db = createDatabase()
    const response = await onRequest({
      request: apiRequest('complaints/private-id', { headers: { 'X-Citizen-Token': 'c'.repeat(32) } }),
      env: { DB: db },
    })

    expect(response.status).toBe(404)
    expect(db.statements[0].query).toContain('id = ? AND citizen_token_hash = ?')
    expect(db.statements[0].values[0]).toBe('private-id')
    expect(db.statements[0].values[1]).toMatch(/^[a-f0-9]{64}$/)
    expect(JSON.stringify(await response.json())).not.toContain('citizen_token_hash')
  })

  it('rejects admin operations when the secret is not configured', async () => {
    const response = await onRequest({ request: apiRequest('admin/complaints'), env: { DB: createDatabase() } })

    expect(response.status).toBe(503)
    expect(await response.json()).toMatchObject({ error: { code: 'ADMIN_NOT_CONFIGURED' } })
  })

  it('rejects an incorrect admin PIN before accessing D1', async () => {
    const db = createDatabase()
    const response = await onRequest({
      request: apiRequest('admin/complaints', { headers: { 'X-Admin-Pin': 'wrong-pin' } }),
      env: { DB: db, CITYCARE_ADMIN_PIN: 'correct-pin-123' },
    })

    expect(response.status).toBe(401)
    expect(db.statements).toHaveLength(0)
  })

  it('returns a healthy response without requiring a D1 binding', async () => {
    const response = await onRequest({ request: apiRequest('health'), env: {} })

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ ok: true, status: 'healthy' })
  })
})