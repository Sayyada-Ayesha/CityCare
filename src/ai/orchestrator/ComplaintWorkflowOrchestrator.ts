import { selectAuthorityForCategory } from '../../lib/complaintUtils'
import type { ComplaintDraft, IssueAnalysis } from '../../types'
import { IssueUnderstandingAgent } from '../agents/IssueUnderstandingAgent'
import { AuthorityRoutingAgent } from '../agents/AuthorityRoutingAgent'
import { EvidenceAgent } from '../agents/EvidenceAgent'
import { ComplaintGenerationAgent } from '../agents/ComplaintGenerationAgent'

export class ComplaintWorkflowOrchestrator {
  private issueUnderstandingAgent = new IssueUnderstandingAgent()
  private authorityRoutingAgent = new AuthorityRoutingAgent()
  private evidenceAgent = new EvidenceAgent()
  private complaintGenerationAgent = new ComplaintGenerationAgent()

  public async run(input: {
    description: string
    category?: string
    issueType?: string
    severity?: string
    summary?: string
    impact?: string
    address?: string
    landmark?: string
    latitude?: number | null
    longitude?: number | null
    image?: string
  }): Promise<{
    analysis: IssueAnalysis
    authority: string
    evidence: { evidenceAvailable: boolean; missingInformation: string[]; notes: string }
    draft: ComplaintDraft
  }> {
    const fallbackAnalysis: IssueAnalysis = {
      category: (input.category as IssueAnalysis['category']) ?? 'Streetlight',
      issueType: input.issueType ?? 'Streetlight Failure',
      severity: (input.severity as IssueAnalysis['severity']) ?? 'Medium',
      summary: input.summary ?? 'A civic issue has been reported.',
      impact: input.impact ?? 'Reduced local quality of life.',
      missingInformation: [],
    }

    const analysis = (await this.issueUnderstandingAgent.analyze(input.description)) ?? fallbackAnalysis
    const authoritySuggestion = await this.authorityRoutingAgent.suggest(analysis.category)
    const authority = authoritySuggestion.responsibleService || selectAuthorityForCategory(analysis.category)
    const evidence = await this.evidenceAgent.assess(
      `${input.description} ${input.address ?? ''} ${input.landmark ?? ''} ${input.image ? 'image uploaded' : ''}`,
    )

    const generated = await this.complaintGenerationAgent.generate(
      JSON.stringify({
        category: analysis.category,
        issueType: analysis.issueType,
        summary: analysis.summary,
        impact: analysis.impact,
        description: input.description,
        authority,
      }),
    )

    const draft: ComplaintDraft = {
      title: generated.title,
      subject: generated.subject,
      body: generated.body,
      summary: generated.summary,
      category: analysis.category,
      issueType: analysis.issueType,
      severity: analysis.severity,
      impact: analysis.impact,
      location: input.address ?? 'Manual location',
      address: input.address ?? '',
      landmark: input.landmark ?? '',
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      status: 'SUBMITTED',
      aiGenerated: true,
    }

    return { analysis, authority, evidence, draft }
  }
}
