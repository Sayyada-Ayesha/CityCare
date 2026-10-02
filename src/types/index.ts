export type ComplaintCategory =
  | 'Garbage'
  | 'Water'
  | 'Streetlight'
  | 'Road Damage'
  | 'Drainage'
  | 'Sanitation'
  | 'Public Infrastructure'
  | 'Other'

export type ComplaintSeverity = 'Low' | 'Medium' | 'High' | 'Critical'

export type ComplaintStatus =
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'

export interface IssueAnalysis {
  category: ComplaintCategory
  issueType: string
  severity: ComplaintSeverity
  summary: string
  impact: string
  missingInformation: string[]
}

export interface EvidenceAnalysis {
  evidenceAvailable: boolean
  missingInformation: string[]
  notes: string
}

export interface AuthoritySuggestion {
  responsibleService: string
  category: ComplaintCategory
  confidence: 'Low' | 'Medium' | 'High'
}

export interface ComplaintDraft {
  title: string
  subject: string
  body: string
  summary: string
  category: ComplaintCategory
  issueType: string
  severity: ComplaintSeverity
  impact: string
  location: string
  address: string
  landmark: string
  latitude: number | null
  longitude: number | null
  status: ComplaintStatus
  aiGenerated: boolean
}

export interface EvidenceRecord {
  id: string
  complaintId: string
  fileName: string
  fileType: string
  fileData: string
  description: string
  createdAt: string
}

export interface ComplaintRecord extends ComplaintDraft {
  id: string
  complaintNumber: string
  citizenTokenHash: string
  authorityId: string
  description: string
  createdAt: string
  updatedAt: string
  statusHistory: ComplaintStatusEntry[]
  internalNotes?: string[]
  evidence?: EvidenceRecord[]
}

export interface ComplaintStatusEntry {
  id: string
  complaintId: string
  status: ComplaintStatus
  note: string
  createdAt: string
}

export interface AuthorityRecord {
  id: string
  name: string
  category: string
  description: string
  contactInfo: string
  area: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface AdminSession {
  pinVerified: boolean
}

export interface CivicAssistantResponse {
  answer: string
  source: 'AI' | 'Database'
  databaseInfo?: Record<string, unknown>
}
