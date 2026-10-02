import { z } from 'zod'

export const EvidenceAnalysisSchema = z.object({
  evidenceAvailable: z.boolean(),
  missingInformation: z.array(z.string()).default([]),
  notes: z.string().min(1).max(300),
})

export type EvidenceAnalysisSchemaType = z.infer<typeof EvidenceAnalysisSchema>
