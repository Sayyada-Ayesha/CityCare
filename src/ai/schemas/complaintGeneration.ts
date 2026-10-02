import { z } from 'zod'

export const ComplaintGenerationSchema = z.object({
  title: z.string().min(5).max(120),
  subject: z.string().min(5).max(160),
  body: z.string().min(20).max(2000),
  summary: z.string().min(10).max(300),
})

export type ComplaintGenerationSchemaType = z.infer<typeof ComplaintGenerationSchema>
