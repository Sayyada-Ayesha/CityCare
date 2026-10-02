import { z } from 'zod'

export const AuthoritySuggestionSchema = z.object({
  responsibleService: z.string().min(2).max(120),
  category: z.enum([
    'Garbage',
    'Water',
    'Streetlight',
    'Road Damage',
    'Drainage',
    'Sanitation',
    'Public Infrastructure',
    'Other',
  ]),
  confidence: z.enum(['Low', 'Medium', 'High']),
})

export type AuthoritySuggestionSchemaType = z.infer<typeof AuthoritySuggestionSchema>
