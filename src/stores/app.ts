import { defineStore } from 'pinia'
import { DEFAULT_AUTHORITIES } from '../lib/defaultAuthorities'
import type { AuthorityRecord, ComplaintRecord, ComplaintStatus } from '../types'
import { createId, generateComplaintNumber, hashCitizenToken } from '../lib/complaintUtils'

interface ComplaintState {
  complaints: ComplaintRecord[]
  authorities: AuthorityRecord[]
  citizenToken: string
  adminAuthenticated: boolean
}

const STORAGE_KEY = 'citycare-demo-state-v1'

const createInitialComplaints = (): ComplaintRecord[] => [
  {
    id: 'demo-complaint-1',
    complaintNumber: 'CC-2026-000001',
    citizenTokenHash: 'demo-token-hash',
    authorityId: 'authority-1',
    title: 'Streetlight not functioning',
    subject: 'Streetlight failure in local area',
    description: 'My gali ki street light 4 din se band hai.',
    category: 'Streetlight',
    issueType: 'Streetlight Failure',
    severity: 'Medium',
    impact: 'Reduced visibility at night.',
    location: 'Near market road',
    address: 'Market Road',
    landmark: 'Near bus stand',
    latitude: 28.6139,
    longitude: 77.209,
    aiSummary: 'Streetlight is not functioning and may affect visibility at night.',
    aiGeneratedComplaint: 'AI-generated complaint text',
    citizenEditedComplaint: 'AI-generated complaint text',
    status: 'IN_REVIEW',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    statusHistory: [
      {
        id: 'hist-1',
        complaintId: 'demo-complaint-1',
        status: 'SUBMITTED',
        note: 'Complaint submitted via CityCare AI',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'hist-2',
        complaintId: 'demo-complaint-1',
        status: 'IN_REVIEW',
        note: 'Awaiting review',
        createdAt: new Date().toISOString(),
      },
    ],
    summary: 'Streetlight is not functioning.',
    body: 'This complaint was created as a demo issue for the CityCare dashboard.',
    aiGenerated: true,
    evidence: [],
    internalNotes: ['Demo note for admin review'],
  },
] as ComplaintRecord[]

export const useAppStore = defineStore('citycare', {
  state: (): ComplaintState => {
    const existing = typeof window === 'undefined' ? null : window.localStorage.getItem(STORAGE_KEY)
    if (existing) {
      try {
        const parsed = JSON.parse(existing) as ComplaintState
        return {
          complaints: parsed.complaints ?? createInitialComplaints(),
          authorities: parsed.authorities ?? DEFAULT_AUTHORITIES,
          citizenToken: parsed.citizenToken ?? `citizen-${Math.random().toString(36).slice(2, 9)}`,
          adminAuthenticated: false,
        }
      } catch {
        // ignore invalid persisted state
      }
    }

    return {
      complaints: createInitialComplaints(),
      authorities: DEFAULT_AUTHORITIES,
      citizenToken: `citizen-${Math.random().toString(36).slice(2, 9)}`,
      adminAuthenticated: false,
    }
  },
  actions: {
    persist() {
      if (typeof window === 'undefined') return
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.$state))
    },
    ensureCitizenToken() {
      if (!this.citizenToken) {
        this.citizenToken = `citizen-${Math.random().toString(36).slice(2, 9)}`
      }
      this.persist()
    },
    async submitComplaint(draft: {
      title: string
      subject: string
      body: string
      summary: string
      category: string
      issueType: string
      severity: string
      impact: string
      location: string
      address: string
      landmark: string
      latitude: number | null
      longitude: number | null
      evidence: { fileName: string; fileType: string; fileData: string; description: string }[]
    }): Promise<ComplaintRecord> {
      const tokenHash = await hashCitizenToken(this.citizenToken)
      const authority = this.authorities[0] ?? DEFAULT_AUTHORITIES[0]
      const complaintId = createId('complaint')
      const complaintNumber = generateComplaintNumber(this.complaints.length + 1)

      const complaint: ComplaintRecord = {
        id: complaintId,
        complaintNumber,
        citizenTokenHash: tokenHash,
        authorityId: authority.id,
        title: draft.title,
        subject: draft.subject,
        description: draft.body,
        category: draft.category as ComplaintRecord['category'],
        issueType: draft.issueType,
        severity: draft.severity as ComplaintRecord['severity'],
        impact: draft.impact,
        location: draft.location,
        address: draft.address,
        landmark: draft.landmark,
        latitude: draft.latitude,
        longitude: draft.longitude,
        aiSummary: draft.summary,
        aiGeneratedComplaint: draft.body,
        citizenEditedComplaint: draft.body,
        status: 'SUBMITTED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        summary: draft.summary,
        body: draft.body,
        aiGenerated: true,
        statusHistory: [
          {
            id: createId('status'),
            complaintId: complaintId,
            status: 'SUBMITTED',
            note: 'Complaint submitted by citizen.',
            createdAt: new Date().toISOString(),
          },
        ],
        evidence: draft.evidence.map((item, index) => ({
          id: createId('evidence'),
          complaintId: complaintId,
          fileName: item.fileName,
          fileType: item.fileType,
          fileData: item.fileData,
          description: item.description || `Evidence ${index + 1}`,
          createdAt: new Date().toISOString(),
        })),
      }

      this.complaints.unshift(complaint)
      this.persist()
      return complaint
    },
    setAdminSession(isLoggedIn: boolean) {
      this.adminAuthenticated = isLoggedIn
      this.persist()
    },
    updateComplaintStatus(complaintId: string, status: ComplaintStatus, note: string) {
      const complaint = this.complaints.find((item) => item.id === complaintId)
      if (!complaint) return

      complaint.status = status
      complaint.updatedAt = new Date().toISOString()
      complaint.statusHistory.push({
        id: createId('status'),
        complaintId,
        status,
        note,
        createdAt: new Date().toISOString(),
      })
      this.persist()
    },
    addAuthority(authority: Partial<AuthorityRecord>) {
      const nextAuthority: AuthorityRecord = {
        id: authority.id ?? createId('authority'),
        name: authority.name ?? 'Sample Authority',
        category: authority.category ?? 'Municipal Services',
        description: authority.description ?? 'Configurable sample service directory',
        contactInfo: authority.contactInfo ?? 'Not official government contact info',
        area: authority.area ?? 'Local area',
        active: authority.active ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      this.authorities.unshift(nextAuthority)
      this.persist()
    },
    getComplaintById(id: string) {
      return this.complaints.find((item) => item.id === id) ?? null
    },
    getCitizenComplaints() {
      return this.complaints.filter((complaint) => complaint.citizenTokenHash === 'demo-token-hash')
    },
  },
})
