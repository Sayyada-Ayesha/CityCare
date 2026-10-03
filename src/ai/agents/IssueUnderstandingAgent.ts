import { z } from 'zod'
import { localAIEngine } from '../engine/LocalAIEngine'
import { issueUnderstandingPrompt } from '../prompts/issueUnderstandingPrompt'
import { IssueAnalysisSchema } from '../schemas/issueAnalysis'

export class IssueUnderstandingAgent {
  async analyze(description: string): Promise<z.infer<typeof IssueAnalysisSchema>> {
    if (!description.trim()) {
      throw new Error('Describe the civic issue before asking AI to analyze it.')
    }

    const prompt = `${issueUnderstandingPrompt}\nCitizen description:\n${description}`
    return localAIEngine.generateIssueAnalysis(prompt)
  }
}
