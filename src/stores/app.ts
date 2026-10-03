import { defineStore } from 'pinia'
import { apiRequest } from '../lib/api'
import { generateCitizenToken } from '../lib/complaintUtils'
import type { AuthorityRecord, ComplaintRecord, ComplaintStatus } from '../types'

interface ComplaintState {
  complaints: ComplaintRecord[]
  adminComplaints: ComplaintRecord[]
  authorities: AuthorityRecord[]
  citizenToken: string
  adminPin: string
  adminAuthenticated: boolean
}

const CITIZEN_TOKEN_KEY = 'citycare-citizen-token-v1'

function readCitizenToken() {
  if (typeof window === 'undefined') return ''
  const token = window.localStorage.getItem(CITIZEN_TOKEN_KEY)
  if (token && /^[a-f0-9]{32}$/.test(token)) return token
  const generated = generateCitizenToken()
  window.localStorage.setItem(CITIZEN_TOKEN_KEY, generated)
  return generated
}

export const useAppStore = defineStore('citycare', {
  state: (): ComplaintState => ({
    complaints: [],
    adminComplaints: [],
    authorities: [],
    citizenToken: readCitizenToken(),
    adminPin: '',
    adminAuthenticated: false,
  }),
  actions: {
    async loadCitizenComplaints() {
      const response = await apiRequest<{ complaints: ComplaintRecord[] }>('complaints', { citizenToken: this.citizenToken })
      this.complaints = response.complaints
      return this.complaints
    },
    async loadComplaint(id: string, admin = false) {
      if (admin) {
        const response = await apiRequest<{ complaint: ComplaintRecord }>(`admin/complaints/${encodeURIComponent(id)}`, { adminPin: this.adminPin })
        this.adminComplaints = [response.complaint, ...this.adminComplaints.filter((item) => item.id !== id)]
        return response.complaint
      }
      const response = await apiRequest<{ complaint: ComplaintRecord }>(`complaints/${encodeURIComponent(id)}`, { citizenToken: this.citizenToken })
      this.complaints = [response.complaint, ...this.complaints.filter((item) => item.id !== id)]
      return response.complaint
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
      aiGenerated: boolean
      location: string
      address: string
      landmark: string
      latitude: number | null
      longitude: number | null
      evidence: { fileName: string; fileType: string; fileData: string; description: string }[]
    }) {
      const response = await apiRequest<{ complaint: ComplaintRecord }>('complaints', {
        method: 'POST',
        citizenToken: this.citizenToken,
        body: draft,
      })
      this.complaints.unshift(response.complaint)
      return response.complaint
    },
    async loadAuthorities(admin = false) {
      const path = admin ? 'admin/authorities' : 'authorities'
      const response = await apiRequest<{ authorities: AuthorityRecord[] }>(path, {
        adminPin: admin ? this.adminPin : undefined,
      })
      this.authorities = response.authorities
      return this.authorities
    },
    async authenticateAdmin(pin: string) {
      await apiRequest<{ authenticated: boolean }>('admin/session', {
        method: 'POST',
        adminPin: pin,
      })
      this.adminPin = pin
      this.adminAuthenticated = true
      return true
    },
    clearAdminSession() {
      this.adminPin = ''
      this.adminAuthenticated = false
      this.adminComplaints = []
    },
    async loadAdminComplaints() {
      const response = await apiRequest<{ complaints: ComplaintRecord[] }>('admin/complaints', { adminPin: this.adminPin })
      this.adminComplaints = response.complaints
      return this.adminComplaints
    },
    async updateComplaintStatus(complaintId: string, status: ComplaintStatus | undefined, note: string, authorityId?: string) {
      await apiRequest<{ success: boolean }>(`admin/complaints/${encodeURIComponent(complaintId)}`, {
        method: 'PATCH',
        adminPin: this.adminPin,
        body: { status, note, authorityId },
      })
      await this.loadAdminComplaints()
    },
    async addAuthority(authority: Pick<AuthorityRecord, 'name' | 'category'> & Partial<AuthorityRecord>) {
      const response = await apiRequest<{ authority: AuthorityRecord }>('admin/authorities', {
        method: 'POST',
        adminPin: this.adminPin,
        body: authority,
      })
      this.authorities.unshift(response.authority)
      return response.authority
    },
    getComplaintById(id: string) {
      return this.complaints.find((item) => item.id === id)
        ?? this.adminComplaints.find((item) => item.id === id)
        ?? null
    },
    getCitizenComplaints() {
      return this.complaints
    },
  },
})