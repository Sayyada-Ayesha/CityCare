import { describe, expect, it } from 'vitest'
import { IssueAnalysisSchema } from '../src/ai/schemas/issueAnalysis'
import { hashCitizenToken, generateComplaintNumber, selectAuthorityForCategory } from '../src/lib/complaintUtils'

describe('CityCare AI utilities', () => {
  it('validates issue analysis JSON schema', () => {
    const parsed = IssueAnalysisSchema.parse({
      category: 'Streetlight',
      issueType: 'Streetlight Failure',
      severity: 'Medium',
      summary: 'A streetlight is not functioning.',
      impact: 'Reduced visibility at night.',
      missingInformation: [],
    })

    expect(parsed.category).toBe('Streetlight')
    expect(parsed.severity).toBe('Medium')
  })

  it('hashes citizen tokens deterministically', () => {
    const hashA = hashCitizenToken('token-123')
    const hashB = hashCitizenToken('token-123')

    expect(hashA).toBe(hashB)
    expect(hashA).toMatch(/^[a-f0-9]{64}$/)
  })

  it('generates complaint numbers in sequence', () => {
    expect(generateComplaintNumber(1)).toBe('CC-2026-000001')
    expect(generateComplaintNumber(12)).toBe('CC-2026-000012')
  })

  it('routes issues to sensible authorities', () => {
    expect(selectAuthorityForCategory('Streetlight')).toContain('Municipal Services')
    expect(selectAuthorityForCategory('Water')).toContain('Water & Sanitation')
  })
})
