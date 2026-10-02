import { z } from 'zod'
import { complaintGenerationPrompt } from '../prompts/complaintGenerationPrompt'
import { ComplaintGenerationSchema } from '../schemas/complaintGeneration'

export class ComplaintGenerationAgent {
  async generate(input: string): Promise<z.infer<typeof ComplaintGenerationSchema>> {
    const fallback: z.infer<typeof ComplaintGenerationSchema> = {
      title: 'Civic issue reported',
      subject: 'Local civic issue reported',
      body: input,
      summary: 'Issue reported for review.',
    }

    try {
      const prompt = `${complaintGenerationPrompt}\nIssue data:\n${input}`
      const raw = prompt.match(/\{[\s\S]*\}/)?.[0] ?? JSON.stringify(fallback)
      return ComplaintGenerationSchema.parse(JSON.parse(raw))
    } catch {
      return fallback
    }
  }
}
