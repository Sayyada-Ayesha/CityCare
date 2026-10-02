import { z } from 'zod'
import { issueUnderstandingPrompt } from '../prompts/issueUnderstandingPrompt'
import { IssueAnalysisSchema } from '../schemas/issueAnalysis'

export class IssueUnderstandingAgent {
  async analyze(description: string): Promise<z.infer<typeof IssueAnalysisSchema>> {
    const fallback: z.infer<typeof IssueAnalysisSchema> = {
      category: 'Streetlight',
      issueType: 'Streetlight Failure',
      severity: 'Medium',
      summary: 'A streetlight is not functioning.',
      impact: 'Reduced visibility at night.',
      missingInformation: [],
    }

    if (!description.trim()) {
      return fallback
    }

    try {
      const prompt = `${issueUnderstandingPrompt}\nCitizen description:\n${description}`
      const raw = prompt.match(/\{[\s\S]*\}/)?.[0] ?? JSON.stringify(fallback)
      return IssueAnalysisSchema.parse(JSON.parse(raw))
    } catch {
      return fallback
    }
  }
}
