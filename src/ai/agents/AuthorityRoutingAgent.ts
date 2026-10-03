import { z } from 'zod'
import { localAIEngine } from '../engine/LocalAIEngine'
import { authorityRoutingPrompt } from '../prompts/authorityRoutingPrompt'
import { AuthoritySuggestionSchema } from '../schemas/authorityRouting'

export class AuthorityRoutingAgent {
  async suggest(category: string): Promise<z.infer<typeof AuthoritySuggestionSchema>> {
    const prompt = `${authorityRoutingPrompt}\nSuggested category:\n${category}`
    return localAIEngine.generateAuthoritySuggestion(prompt)
  }
}
