import { z } from 'zod'
import { civicAssistantPrompt } from '../prompts/civicAssistantPrompt'
import { CivicAssistantResponseSchema } from '../schemas/civicAssistantResponse'

export class CivicAssistantAgent {
  async respond(question: string, databaseInfo?: Record<string, unknown>): Promise<z.infer<typeof CivicAssistantResponseSchema>> {
    const fallback: z.infer<typeof CivicAssistantResponseSchema> = {
      answer: 'CityCare AI can help explain civic issue categories, evidence requirements, and complaint status. Please review the relevant database information before submitting.',
      source: 'AI',
      databaseInfo,
    }

    try {
      const prompt = `${civicAssistantPrompt}\nQuestion:\n${question}\nDatabase info:\n${JSON.stringify(databaseInfo ?? {})}`
      const raw = prompt.match(/\{[\s\S]*\}/)?.[0] ?? JSON.stringify(fallback)
      return CivicAssistantResponseSchema.parse(JSON.parse(raw))
    } catch {
      return fallback
    }
  }
}
