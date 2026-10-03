import { z } from 'zod'
import { localAIEngine } from '../engine/LocalAIEngine'
import { complaintGenerationPrompt } from '../prompts/complaintGenerationPrompt'
import { ComplaintGenerationSchema } from '../schemas/complaintGeneration'

export class ComplaintGenerationAgent {
  async generate(input: string): Promise<z.infer<typeof ComplaintGenerationSchema>> {
    const prompt = `${complaintGenerationPrompt}\nIssue data:\n${input}`
    return localAIEngine.generateComplaint(prompt)
  }
}
