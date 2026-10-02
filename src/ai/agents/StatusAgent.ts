import { z } from 'zod'
import { statusPrompt } from '../prompts/statusPrompt'
import { StatusExplanationSchema } from '../schemas/statusExplanation'

export class StatusAgent {
  async explain(status: string): Promise<z.infer<typeof StatusExplanationSchema>> {
    const fallback: z.infer<typeof StatusExplanationSchema> = {
      summary: 'The complaint has been received and is awaiting review.',
      status,
      currentState: 'The complaint is active and being reviewed.',
    }

    try {
      const prompt = `${statusPrompt}\nCurrent status:\n${status}`
      const raw = prompt.match(/\{[\s\S]*\}/)?.[0] ?? JSON.stringify(fallback)
      return StatusExplanationSchema.parse(JSON.parse(raw))
    } catch {
      return fallback
    }
  }
}
