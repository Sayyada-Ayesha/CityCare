import { z } from 'zod'

export const StatusExplanationSchema = z.object({
  summary: z.string().min(1).max(300),
  status: z.string().min(1).max(32),
  currentState: z.string().min(1).max(300),
})

export type StatusExplanationSchemaType = z.infer<typeof StatusExplanationSchema>
