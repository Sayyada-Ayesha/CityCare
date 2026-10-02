import { z } from 'zod'
import { authorityRoutingPrompt } from '../prompts/authorityRoutingPrompt'
import { AuthoritySuggestionSchema } from '../schemas/authorityRouting'

export class AuthorityRoutingAgent {
  async suggest(category: string): Promise<z.infer<typeof AuthoritySuggestionSchema>> {
    const fallback: z.infer<typeof AuthoritySuggestionSchema> = {
      responsibleService: 'Municipal Services',
      category: 'Streetlight',
      confidence: 'High',
    }

    try {
      const prompt = `${authorityRoutingPrompt}\nSuggested category:\n${category}`
      const raw = prompt.match(/\{[\s\S]*\}/)?.[0] ?? JSON.stringify(fallback)
      return AuthoritySuggestionSchema.parse(JSON.parse(raw))
    } catch {
      return fallback
    }
  }
}
