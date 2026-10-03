import { z } from 'zod'
import { localAIEngine } from '../engine/LocalAIEngine'
import { evidencePrompt } from '../prompts/evidencePrompt'
import { EvidenceAnalysisSchema } from '../schemas/evidenceAnalysis'

export class EvidenceAgent {
  async assess(input: string): Promise<z.infer<typeof EvidenceAnalysisSchema>> {
    const prompt = `${evidencePrompt}\nContext:\n${input}`
    return localAIEngine.generateEvidenceAnalysis(prompt)
  }
}
