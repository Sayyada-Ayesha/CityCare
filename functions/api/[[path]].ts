import { z } from 'zod'

interface D1Statement {
  bind(...values: unknown[]): D1Statement
  first<T = Record<string, unknown>>(): Promise<T | null>
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>
  run(): Promise<unknown>
}

interface D1Database {
  prepare(query: string): D1Statement
  batch<T = unknown>(statements: D1Statement[]): Promise<T[]>
}

interface Environment {
  DB?: D1Database
  CITYCARE_ADMIN_PIN?: string
}

interface ComplaintRow extends Record<string, unknown> {
  id: string
  complaint_number: string
  citizen_token_hash: string
  authority_id: string
  title: string
  subject: string
  description: string
  category: string
  issue_type: string
  severity: string
  impact: string | null
  location: string | null
  address: string | null
  landmark: string | null
  latitude: number | null
  longitude: number | null
  ai_summary: string | null
  ai_generated_complaint: string | null
  citizen_edited_complaint: string | null
  status: string
  created_at: string
  updated_at: string
}

const categories = ['Garbage', 'Water', 'Streetlight', 'Road Damage', 'Drainage', 'Sanitation', 'Public Infrastructure', 'Other'] as const
const statuses = ['SUBMITTED', 'IN_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const
const evidenceSchema = z.object({
  fileName: z.string().trim().min(1).max(160),
  fileType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  fileData: z.string().max(700_000).regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/),
  description: z.string().trim().max(300).default(''),
}).refine((item) => {
  try {
    const encoded = item.fileData.split(',')[1]
    const binary = atob(encoded)
    if (binary.length > 500_000) return false
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
    if (item.fileType === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    if (item.fileType === 'image/png') return [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte)
    return String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  } catch {
    return false
  }
}, 'Evidence must be a valid image of the declared type and no larger than 500 KB.')
const complaintSchema = z.object({
  title: z.string().trim().min(5).max(120),
  subject: z.string().trim().min(5).max(160),
  body: z.string().trim().min(20).max(2000),
  summary: z.string().trim().min(10).max(300),
  category: z.enum(categories),
  issueType: z.string().trim().min(3).max(150),
  severity: z.enum(['Low', 'Medium', 'High', 'Critical']),
  impact: z.string().trim().min(10).max(300),
  location: z.string().trim().max(300).default(''),
  address: z.string().trim().max(200).default(''),
  landmark: z.string().trim().max(200).default(''),
  latitude: z.number().finite().min(-90).max(90).nullable().default(null),
  longitude: z.number().finite().min(-180).max(180).nullable().default(null),
  evidence: z.array(evidenceSchema).max(3).default([]),
  aiGenerated: z.boolean().default(false),
})
const statusUpdateSchema = z.object({
  status: z.enum(statuses).optional(),
  authorityId: z.string().min(1).max(100).optional(),
  note: z.string().trim().max(500).default(''),
}).refine((value) => value.status !== undefined || value.authorityId !== undefined)
const authoritySchema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.enum(categories),
  description: z.string().trim().max(500).default(''),
  contactInfo: z.string().trim().max(200).default(''),
  area: z.string().trim().max(160).default('Citywide'),
  active: z.boolean().default(true),
})

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
const failure = (code: string, message: string, status: number) => json({ error: { code, message } }, status)
const createId = () => crypto.randomUUID()

async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function mapAuthority(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description ?? '',
    contactInfo: row.contact_info ?? '',
    area: row.area ?? '',
    active: Number(row.active) === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapComplaint(row: ComplaintRow, history: Record<string, unknown>[] = [], evidence: Record<string, unknown>[] = []) {
  return {
    id: row.id,
    complaintNumber: row.complaint_number,
    authorityId: row.authority_id,
    title: row.title,
    subject: row.subject,
    description: row.description,
    category: row.category,
    issueType: row.issue_type,
    severity: row.severity,
    impact: row.impact ?? '',
    location: row.location ?? '',
    address: row.address ?? '',
    landmark: row.landmark ?? '',
    latitude: row.latitude,
    longitude: row.longitude,
    aiSummary: row.ai_summary ?? '',
    aiGeneratedComplaint: row.ai_generated_complaint ?? '',
    citizenEditedComplaint: row.citizen_edited_complaint ?? '',
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    summary: row.ai_summary ?? '',
    body: row.citizen_edited_complaint ?? row.description,
    aiGenerated: Boolean(row.ai_generated_complaint),
    statusHistory: history.map((item) => ({
      id: item.id,
      complaintId: item.complaint_id,
      status: item.status,
      note: item.note ?? '',
      createdAt: item.created_at,
    })),
    evidence: evidence.map((item) => ({
      id: item.id,
      complaintId: item.complaint_id,
      fileName: item.file_name,
      fileType: item.file_type,
      fileData: item.file_data,
      description: item.description ?? '',
      createdAt: item.created_at,
    })),
  }
}

async function loadHistory(db: D1Database, ids: string[]) {
  if (!ids.length) return []
  const placeholders = ids.map(() => '?').join(', ')
  const result = await db.prepare(
    `SELECT id, complaint_id, status, note, created_at FROM complaint_status_history WHERE complaint_id IN (${placeholders}) ORDER BY created_at ASC`,
  ).bind(...ids).all<Record<string, unknown>>()
  return result.results
}

async function mapWithHistory(db: D1Database, rows: ComplaintRow[]) {
  const history = await loadHistory(db, rows.map((row) => row.id))
  const grouped = new Map<string, Record<string, unknown>[]>()
  for (const event of history) {
    const complaintId = String(event.complaint_id)
    grouped.set(complaintId, [...(grouped.get(complaintId) ?? []), event])
  }
  return rows.map((row) => mapComplaint(row, grouped.get(row.id) ?? []))
}

async function loadEvidence(db: D1Database, id: string) {
  const result = await db.prepare(
    'SELECT id, complaint_id, file_name, file_type, file_data, description, created_at FROM evidence WHERE complaint_id = ? ORDER BY created_at ASC',
  ).bind(id).all<Record<string, unknown>>()
  return result.results
}

function adminError(request: Request, env: Environment) {
  const expected = env.CITYCARE_ADMIN_PIN
  if (!expected || expected.length < 8 || expected === 'replace-with-your-own-secret') return 'not-configured'
  const supplied = request.headers.get('X-Admin-Pin') ?? ''
  let difference = supplied.length ^ expected.length
  const length = Math.max(supplied.length, expected.length)
  for (let index = 0; index < length; index += 1) {
    difference |= (supplied.charCodeAt(index) || 0) ^ (expected.charCodeAt(index) || 0)
  }
  return difference === 0 ? null : 'unauthorized'
}

async function citizenHash(request: Request) {
  const token = request.headers.get('X-Citizen-Token')
  return token && token.length >= 32 && token.length <= 128 ? hashToken(token) : null
}

export async function onRequest(context: { request: Request; env: Environment }) {
  const { request, env } = context
  const path = new URL(request.url).pathname.split('/').filter(Boolean).slice(1)
  const method = request.method.toUpperCase()

  if (path.length === 1 && path[0] === 'health' && method === 'GET') {
    return json({ ok: true, app: 'CityCare AI', status: 'healthy' })
  }

  if (path[0] === 'admin') {
    const authError = adminError(request, env)
    if (authError === 'not-configured') return failure('ADMIN_NOT_CONFIGURED', 'Admin access is not configured.', 503)
    if (authError) return failure('UNAUTHORIZED', 'Admin PIN is incorrect or missing.', 401)
    if (path.length === 2 && path[1] === 'session' && method === 'POST') return json({ authenticated: true })
  }

  const db = env.DB
  if (!db) return failure('DATABASE_NOT_CONFIGURED', 'The D1 database binding is unavailable.', 503)

  if (path.length === 1 && path[0] === 'authorities' && method === 'GET') {
    const result = await db.prepare('SELECT id, name, category, description, contact_info, area, active, created_at, updated_at FROM authorities WHERE active = 1 ORDER BY name').all<Record<string, unknown>>()
    return json({ authorities: result.results.map(mapAuthority) })
  }

  if (path.length === 1 && path[0] === 'complaints' && method === 'POST') {
    const ownerHash = await citizenHash(request)
    if (!ownerHash) return failure('CITIZEN_TOKEN_REQUIRED', 'A valid anonymous citizen token is required.', 401)
    const payload = await request.json().catch(() => null)
    const parsed = complaintSchema.safeParse(payload)
    if (!parsed.success) return failure('VALIDATION_ERROR', 'The complaint data is invalid.', 400)
    const input = parsed.data
    const authority = await db.prepare(
      'SELECT id FROM authorities WHERE active = 1 AND category = ? ORDER BY name LIMIT 1',
    ).bind(input.category).first<{ id: string }>() ?? await db.prepare(
      "SELECT id FROM authorities WHERE active = 1 AND category = 'Public Infrastructure' ORDER BY name LIMIT 1",
    ).first<{ id: string }>()
    if (!authority) return failure('NO_ACTIVE_AUTHORITY', 'No active authority is configured for this complaint.', 503)

    const year = new Date().getUTCFullYear()
    const sequence = await db.prepare(
      'INSERT INTO complaint_sequences (year, last_value) VALUES (?, 1) ON CONFLICT(year) DO UPDATE SET last_value = last_value + 1 RETURNING last_value',
    ).bind(year).first<{ last_value: number }>()
    if (!sequence) return failure('DATABASE_ERROR', 'A complaint number could not be allocated.', 500)

    const id = createId()
    const now = new Date().toISOString()
    const complaintNumber = `CC-${year}-${String(sequence.last_value).padStart(6, '0')}`
    const statements = [
      db.prepare(`INSERT INTO complaints (
        id, complaint_number, citizen_token_hash, authority_id, title, subject, description, category,
        issue_type, severity, impact, location, address, landmark, latitude, longitude, ai_summary,
        ai_generated_complaint, citizen_edited_complaint, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', ?, ?)`)
        .bind(id, complaintNumber, ownerHash, authority.id, input.title, input.subject, input.body, input.category,
          input.issueType, input.severity, input.impact, input.location, input.address, input.landmark,
            input.latitude, input.longitude, input.summary, input.aiGenerated ? input.body : null, input.body, now, now),
      db.prepare('INSERT INTO complaint_status_history (id, complaint_id, status, note, created_at) VALUES (?, ?, ?, ?, ?)')
        .bind(createId(), id, 'SUBMITTED', 'Complaint submitted by citizen.', now),
      ...input.evidence.map((item) => db.prepare(
        'INSERT INTO evidence (id, complaint_id, file_name, file_type, file_data, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ).bind(createId(), id, item.fileName, item.fileType, item.fileData, item.description, now)),
    ]
    await db.batch(statements)
    const row: ComplaintRow = {
      id, complaint_number: complaintNumber, citizen_token_hash: ownerHash, authority_id: authority.id,
      title: input.title, subject: input.subject, description: input.body, category: input.category,
      issue_type: input.issueType, severity: input.severity, impact: input.impact, location: input.location,
      address: input.address, landmark: input.landmark, latitude: input.latitude, longitude: input.longitude,
      ai_summary: input.summary, ai_generated_complaint: input.aiGenerated ? input.body : null, citizen_edited_complaint: input.body,
      status: 'SUBMITTED', created_at: now, updated_at: now,
    }
    return json({ complaint: mapComplaint(row, [{ id: '', complaint_id: id, status: 'SUBMITTED', note: 'Complaint submitted by citizen.', created_at: now }]) }, 201)
  }

  if (path.length === 1 && path[0] === 'complaints' && method === 'GET') {
    const ownerHash = await citizenHash(request)
    if (!ownerHash) return failure('CITIZEN_TOKEN_REQUIRED', 'A valid anonymous citizen token is required.', 401)
    const result = await db.prepare('SELECT * FROM complaints WHERE citizen_token_hash = ? ORDER BY created_at DESC LIMIT 100').bind(ownerHash).all<ComplaintRow>()
    return json({ complaints: await mapWithHistory(db, result.results) })
  }

  if (path.length === 2 && path[0] === 'complaints' && method === 'GET') {
    const ownerHash = await citizenHash(request)
    if (!ownerHash) return failure('CITIZEN_TOKEN_REQUIRED', 'A valid anonymous citizen token is required.', 401)
    const row = await db.prepare('SELECT * FROM complaints WHERE id = ? AND citizen_token_hash = ?').bind(path[1], ownerHash).first<ComplaintRow>()
    if (!row) return failure('NOT_FOUND', 'Complaint not found.', 404)
    const [history, evidence] = await Promise.all([loadHistory(db, [row.id]), loadEvidence(db, row.id)])
    return json({ complaint: mapComplaint(row, history, evidence) })
  }

  if (path.length === 2 && path[0] === 'admin' && path[1] === 'stats' && method === 'GET') {
    const result = await db.prepare('SELECT status, COUNT(*) AS count FROM complaints GROUP BY status').all<{ status: string; count: number }>()
    const counts = Object.fromEntries(result.results.map((item) => [item.status, Number(item.count)])) as Record<string, number>
    return json({
      total: Object.values(counts).reduce((sum, count) => sum + count, 0),
      submitted: counts.SUBMITTED ?? 0, inReview: counts.IN_REVIEW ?? 0, assigned: counts.ASSIGNED ?? 0,
      inProgress: counts.IN_PROGRESS ?? 0, resolved: counts.RESOLVED ?? 0, closed: counts.CLOSED ?? 0,
    })
  }

  if (path.length === 2 && path[0] === 'admin' && path[1] === 'complaints' && method === 'GET') {
    const result = await db.prepare('SELECT * FROM complaints ORDER BY created_at DESC LIMIT 500').all<ComplaintRow>()
    return json({ complaints: await mapWithHistory(db, result.results) })
  }

  if (path.length === 3 && path[0] === 'admin' && path[1] === 'complaints' && method === 'GET') {
    const row = await db.prepare('SELECT * FROM complaints WHERE id = ?').bind(path[2]).first<ComplaintRow>()
    if (!row) return failure('NOT_FOUND', 'Complaint not found.', 404)
    const [history, evidence] = await Promise.all([loadHistory(db, [row.id]), loadEvidence(db, row.id)])
    return json({ complaint: mapComplaint(row, history, evidence) })
  }

  if (path.length === 3 && path[0] === 'admin' && path[1] === 'complaints' && method === 'PATCH') {
    const parsed = statusUpdateSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return failure('VALIDATION_ERROR', 'A valid status or authority update is required.', 400)
    const current = await db.prepare('SELECT * FROM complaints WHERE id = ?').bind(path[2]).first<ComplaintRow>()
    if (!current) return failure('NOT_FOUND', 'Complaint not found.', 404)
    if (parsed.data.authorityId) {
      const authority = await db.prepare('SELECT id FROM authorities WHERE id = ? AND active = 1').bind(parsed.data.authorityId).first<{ id: string }>()
      if (!authority) return failure('INVALID_AUTHORITY', 'The selected authority is not active.', 400)
    }
    const now = new Date().toISOString()
    const nextStatus = parsed.data.status ?? (parsed.data.authorityId ? 'ASSIGNED' : current.status)
    const statements = [db.prepare('UPDATE complaints SET status = ?, authority_id = ?, updated_at = ? WHERE id = ?')
      .bind(nextStatus, parsed.data.authorityId ?? current.authority_id, now, path[2])]
    if (nextStatus !== current.status || (parsed.data.authorityId && parsed.data.authorityId !== current.authority_id)) {
      statements.push(db.prepare('INSERT INTO complaint_status_history (id, complaint_id, status, note, created_at) VALUES (?, ?, ?, ?, ?)')
        .bind(createId(), path[2], nextStatus, parsed.data.note || `Status changed to ${nextStatus}.`, now))
    }
    await db.batch(statements)
    return json({ success: true })
  }

  if (path.length === 2 && path[0] === 'admin' && path[1] === 'authorities' && method === 'GET') {
    const result = await db.prepare('SELECT id, name, category, description, contact_info, area, active, created_at, updated_at FROM authorities ORDER BY name').all<Record<string, unknown>>()
    return json({ authorities: result.results.map(mapAuthority) })
  }

  if (path.length === 2 && path[0] === 'admin' && path[1] === 'authorities' && method === 'POST') {
    const parsed = authoritySchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return failure('VALIDATION_ERROR', 'The authority data is invalid.', 400)
    const authority = parsed.data
    const id = createId()
    const now = new Date().toISOString()
    await db.prepare('INSERT INTO authorities (id, name, category, description, contact_info, area, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, authority.name, authority.category, authority.description, authority.contactInfo, authority.area, authority.active ? 1 : 0, now, now).run()
    return json({ authority: { id, ...authority, createdAt: now, updatedAt: now } }, 201)
  }

  return failure('NOT_FOUND', 'Route not found.', 404)
}