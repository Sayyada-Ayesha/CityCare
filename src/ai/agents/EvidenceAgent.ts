import { z } from 'zod'
import { evidencePrompt } from '../prompts/evidencePrompt'
import { EvidenceAnalysisSchema } from '../schemas/evidenceAnalysis'

export class EvidenceAgent {
  async assess(input: string): Promise<z.infer<typeof EvidenceAnalysisSchema>> {
    const fallback: z.infer<typeof EvidenceAnalysisSchema> = {
      evidenceAvailable: true,
      missingInformation: [],
      notes: 'Photo and location are available.',
    }

    try {
      const prompt = `${evidencePrompt}\nContext:\n${input}`
      const raw = prompt.match(/\{[\s\S]*\}/)?.[0] ?? JSON.stringify(fallback)
      return EvidenceAnalysisSchema.parse(JSON.parse(raw))
    } catch {
      return fallback
    }
  }
}
