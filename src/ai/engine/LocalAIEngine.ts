import type { MLCEngine, InitProgressReport } from '@mlc-ai/web-llm'
import { z } from 'zod'
import { IssueAnalysisSchema } from '../schemas/issueAnalysis'
import { AuthoritySuggestionSchema } from '../schemas/authorityRouting'
import { EvidenceAnalysisSchema } from '../schemas/evidenceAnalysis'
import { ComplaintGenerationSchema } from '../schemas/complaintGeneration'
import { StatusExplanationSchema } from '../schemas/statusExplanation'
import { CivicAssistantResponseSchema } from '../schemas/civicAssistantResponse'

export type AIStatus = 'unavailable' | 'loading' | 'ready'
export type AIProgressHandler = (report: InitProgressReport) => void

const MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC'

export function extractAIJSON(response: string): unknown {
  const content = response.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  const start = content.indexOf('{')
  if (start < 0) throw new Error('The local model did not return a JSON object.')

  let depth = 0
  let inString = false
  let escaped = false
  for (let index = start; index < content.length; index += 1) {
    const character = content[index]
    if (inString) {
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === '"') inString = false
      continue
    }
    if (character === '"') inString = true
    else if (character === '{') depth += 1
    else if (character === '}') {
      depth -= 1
      if (depth === 0) return JSON.parse(content.slice(start, index + 1)) as unknown
    }
  }
  throw new Error('The local model returned incomplete JSON.')
}

export class LocalAIEngine {
  private statusValue: AIStatus = 'unavailable'
  private engine: MLCEngine | null = null
  private initializing: Promise<boolean> | null = null

  public get status(): AIStatus {
    return this.statusValue
  }

  public async initialize(onProgress?: AIProgressHandler): Promise<boolean> {
    if (this.engine) return true
    if (typeof window === 'undefined' || !('gpu' in navigator)) {
      this.statusValue = 'unavailable'
      return false
    }
    if (this.initializing) return this.initializing

    this.statusValue = 'loading'
    this.initializing = (async () => {
      try {
        const gpu = (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown | null> } }).gpu
        if (!gpu || !(await gpu.requestAdapter())) {
          this.statusValue = 'unavailable'
          return false
        }
        const { CreateMLCEngine } = await import('@mlc-ai/web-llm')
        this.engine = await CreateMLCEngine(MODEL_ID, {
          initProgressCallback: (report) => onProgress?.(report),
        })
        this.statusValue = 'ready'
        return true
      } catch {
        this.engine = null
        this.statusValue = 'unavailable'
        return false
      } finally {
        this.initializing = null
      }
    })()
    return this.initializing
  }

  public async generateIssueAnalysis(input: string): Promise<z.infer<typeof IssueAnalysisSchema>> {
    return IssueAnalysisSchema.parse(await this.generateJSON(input))
  }

  public async generateAuthoritySuggestion(input: string): Promise<z.infer<typeof AuthoritySuggestionSchema>> {
    return AuthoritySuggestionSchema.parse(await this.generateJSON(input))
  }

  public async generateEvidenceAnalysis(input: string): Promise<z.infer<typeof EvidenceAnalysisSchema>> {
    return EvidenceAnalysisSchema.parse(await this.generateJSON(input))
  }

  public async generateComplaint(input: string): Promise<z.infer<typeof ComplaintGenerationSchema>> {
    return ComplaintGenerationSchema.parse(await this.generateJSON(input))
  }

  public async generateStatusExplanation(status: string): Promise<z.infer<typeof StatusExplanationSchema>> {
    return StatusExplanationSchema.parse(await this.generateJSON(status))
  }

  public async generateCivicAssistantResponse(question: string, databaseInfo?: Record<string, unknown>): Promise<z.infer<typeof CivicAssistantResponseSchema>> {
    const generated = await this.generateJSON(
      `Question: ${question}\nVerified database information: ${JSON.stringify(databaseInfo ?? {})}`,
    )
    return CivicAssistantResponseSchema.parse({
      ...(generated as Record<string, unknown>),
      source: 'AI',
      databaseInfo,
    })
  }

  private async generateJSON(prompt: string): Promise<unknown> {
    if (!this.engine || this.statusValue !== 'ready') throw new Error('Browser-local AI is not available.')
    const response = await this.engine.chat.completions.create({
      messages: [
        { role: 'system', content: 'Return one valid JSON object only. Do not add markdown or commentary.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.1,
    })
    const content = response.choices[0]?.message.content
    if (typeof content !== 'string' || !content.trim()) throw new Error('The local model returned an empty response.')
    return extractAIJSON(content)
  }
}

export const localAIEngine = new LocalAIEngine()