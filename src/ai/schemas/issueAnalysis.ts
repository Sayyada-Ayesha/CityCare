import { z } from 'zod'

export const IssueAnalysisSchema = z.object({
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
  issueType: z.string().min(3).max(150),
  severity: z.enum(['Low', 'Medium', 'High', 'Critical']),
  summary: z.string().min(10).max(300),
  impact: z.string().min(10).max(300),
  missingInformation: z.array(z.string()).default([]),
})

export type IssueAnalysisSchemaType = z.infer<typeof IssueAnalysisSchema>
