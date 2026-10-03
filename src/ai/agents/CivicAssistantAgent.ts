import { z } from 'zod'
import { localAIEngine } from '../engine/LocalAIEngine'
import { civicAssistantPrompt } from '../prompts/civicAssistantPrompt'
import { CivicAssistantResponseSchema } from '../schemas/civicAssistantResponse'

export class CivicAssistantAgent {
  async respond(question: string, databaseInfo?: Record<string, unknown>): Promise<z.infer<typeof CivicAssistantResponseSchema>> {
    const prompt = `${civicAssistantPrompt}\nQuestion:\n${question}\nVerified database info:\n${JSON.stringify(databaseInfo ?? {})}`
    return localAIEngine.generateCivicAssistantResponse(prompt, databaseInfo)
  }
}
