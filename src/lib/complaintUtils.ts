import { createHash } from 'node:crypto'

export const ISSUE_CATEGORIES = [
  'Garbage',
  'Water',
  'Streetlight',
  'Road Damage',
  'Drainage',
  'Sanitation',
  'Public Infrastructure',
  'Other',
] as const

export const ISSUE_SEVERITIES = ['Low', 'Medium', 'High', 'Critical'] as const

export function hashCitizenToken(token: string): string | Promise<string> {
  if (typeof process !== 'undefined' && process.versions?.node) {
    return createHash('sha256').update(token, 'utf8').digest('hex')
  }

  if (typeof window !== 'undefined' && typeof window.crypto?.subtle !== 'undefined') {
    const bytes = new TextEncoder().encode(token)
    return window.crypto.subtle
      .digest('SHA-256', bytes)
      .then((buffer) => Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, '0')).join(''))
  }

  return createHash('sha256').update(token, 'utf8').digest('hex')
}

export function generateComplaintNumber(sequence: number, year = 2026): string {
  const numeric = Math.max(1, sequence)
  return `CC-${year}-${String(numeric).padStart(6, '0')}`
}

export function selectAuthorityForCategory(category: string): string {
  const normalized = category.toLowerCase()

  if (normalized.includes('streetlight')) return 'Municipal Services'
  if (normalized.includes('water')) return 'Water & Sanitation'
  if (normalized.includes('road') || normalized.includes('damage')) return 'Roads / Public Works'
  if (normalized.includes('drain') || normalized.includes('sanitation')) return 'Drainage / Sanitation'
  if (normalized.includes('garbage')) return 'Waste Management'

  return 'Municipal Services'
}

export function clampBase64Image(dataUrl: string): string {
  if (dataUrl.length > 1_200_000) {
    return dataUrl.slice(0, 1_200_000)
  }
  return dataUrl
}

export function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    SUBMITTED: 'bg-slate-100 text-slate-700',
    IN_REVIEW: 'bg-amber-100 text-amber-700',
    ASSIGNED: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
    RESOLVED: 'bg-emerald-100 text-emerald-700',
    CLOSED: 'bg-gray-100 text-gray-700',
  }

  return map[status] ?? 'bg-slate-100 text-slate-700'
}
