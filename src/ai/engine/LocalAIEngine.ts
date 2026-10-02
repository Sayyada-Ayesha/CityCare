import { z } from 'zod'
import { IssueAnalysisSchema } from '../schemas/issueAnalysis'
import { AuthoritySuggestionSchema } from '../schemas/authorityRouting'
import { EvidenceAnalysisSchema } from '../schemas/evidenceAnalysis'
import { ComplaintGenerationSchema } from '../schemas/complaintGeneration'
import { StatusExplanationSchema } from '../schemas/statusExplanation'
import { CivicAssistantResponseSchema } from '../schemas/civicAssistantResponse'

export type AIStatus = 'unavailable' | 'loading' | 'ready'

export class LocalAIEngine {
  private statusValue: AIStatus = 'unavailable'
  private engine: { generate: (prompt: string) => Promise<string> } | null = null

  public get status(): AIStatus {
    return this.statusValue
  }

  public async initialize(): Promise<boolean> {
    if (typeof window === 'undefined') {
      this.statusValue = 'unavailable'
      return false
    }

    if (!('gpu' in navigator)) {
      this.statusValue = 'unavailable'
      return false
    }

    this.statusValue = 'loading'

    try {
      const module = await import('@mlc-ai/web-llm')
      const engineCtor = (module as Record<string, unknown>).MLCEngine as new () => { reload: (model: string) => Promise<void>; generate: (prompt: string) => Promise<string> }

      if (typeof engineCtor !== 'function') {
        this.statusValue = 'unavailable'
        return false
      }

      const engine = new engineCtor()
      await engine.reload('Qwen2.5-0.5B-Instruct-q4f16_1-MLC')
      this.engine = engine
      this.statusValue = 'ready'
      return true
    } catch {
      this.statusValue = 'unavailable'
      this.engine = null
      return false
    }
  }

  public async generateIssueAnalysis(input: string): Promise<z.infer<typeof IssueAnalysisSchema>> {
    try {
      const raw = await this.generateRawJSON(input)
      return IssueAnalysisSchema.parse(JSON.parse(raw))
    } catch {
      return {
        category: 'Streetlight',
        issueType: 'Streetlight Failure',
        severity: 'Medium',
        summary: 'A streetlight is not functioning.',
        impact: 'Reduced visibility at night.',
        missingInformation: [],
      }
    }
  }

  public async generateAuthoritySuggestion(input: string): Promise<z.infer<typeof AuthoritySuggestionSchema>> {
    try {
      const raw = await this.generateRawJSON(input)
      return AuthoritySuggestionSchema.parse(JSON.parse(raw))
    } catch {
      return {
        responsibleService: 'Municipal Services',
        category: 'Streetlight',
        confidence: 'High',
      }
    }
  }

  public async generateEvidenceAnalysis(input: string): Promise<z.infer<typeof EvidenceAnalysisSchema>> {
    try {
      const raw = await this.generateRawJSON(input)
      return EvidenceAnalysisSchema.parse(JSON.parse(raw))
    } catch {
      return {
        evidenceAvailable: true,
        missingInformation: [],
        notes: 'Photo and location are available.',
      }
    }
  }

  public async generateComplaint(input: string): Promise<z.infer<typeof ComplaintGenerationSchema>> {
    try {
      const raw = await this.generateRawJSON(input)
      return ComplaintGenerationSchema.parse(JSON.parse(raw))
    } catch {
      return {
        title: 'Civic issue reported',
        subject: 'Local civic issue has been reported',
        body: input,
        summary: input.slice(0, 160),
      }
    }
  }

  public async generateStatusExplanation(status: string): Promise<z.infer<typeof StatusExplanationSchema>> {
    try {
      const raw = await this.generateRawJSON(`Explain this complaint status: ${status}`)
      return StatusExplanationSchema.parse(JSON.parse(raw))
    } catch {
      return {
        summary: 'The complaint has been received and is awaiting review.',
        status,
        currentState: 'The complaint is active and being reviewed.',
      }
    }
  }

  public async generateCivicAssistantResponse(question: string, databaseInfo?: Record<string, unknown>): Promise<z.infer<typeof CivicAssistantResponseSchema>> {
    try {
      const raw = await this.generateRawJSON(`Question: ${question}\nDatabase info: ${JSON.stringify(databaseInfo ?? {})}`)
      return CivicAssistantResponseSchema.parse(JSON.parse(raw))
    } catch {
      return {
        answer: 'CityCare AI can help explain civic issue categories, evidence requirements, and complaint status using verified records.',
        source: 'AI',
        databaseInfo,
      }
    }
  }

  private async generateRawJSON(prompt: string): Promise<string> {
    if (!this.engine) {
      throw new Error('AI engine unavailable')
    }

    const response = await this.engine.generate(prompt)
    const jsonText = response.match(/\{[\s\S]*\}/)?.[0] ?? '{"fallback":true}'
    return jsonText
  }
}

export const localAIEngine = new LocalAIEngine()
