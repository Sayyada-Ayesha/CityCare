import { z } from 'zod'
import { localAIEngine } from '../engine/LocalAIEngine'
import { statusPrompt } from '../prompts/statusPrompt'
import { StatusExplanationSchema } from '../schemas/statusExplanation'

export class StatusAgent {
  async explain(status: string): Promise<z.infer<typeof StatusExplanationSchema>> {
    const prompt = `${statusPrompt}\nCurrent status:\n${status}`
    return localAIEngine.generateStatusExplanation(prompt)
  }
}
