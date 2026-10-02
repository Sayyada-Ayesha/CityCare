import { z } from 'zod'

export const CivicAssistantResponseSchema = z.object({
  answer: z.string().min(1).max(2000),
  source: z.enum(['AI', 'Database']),
  databaseInfo: z.record(z.unknown()).optional(),
})

export type CivicAssistantResponseSchemaType = z.infer<typeof CivicAssistantResponseSchema>
