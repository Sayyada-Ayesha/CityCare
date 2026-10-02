<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { localAIEngine } from '../ai/engine/LocalAIEngine'
import { ComplaintWorkflowOrchestrator } from '../ai/orchestrator/ComplaintWorkflowOrchestrator'

const router = useRouter()
const store = useAppStore()
const step = ref(1)
const description = ref('My gali ki street light 4 din se band hai.')
const address = ref('Market Road')
const landmark = ref('Near bus stand')
const latitude = ref(28.6139)
const longitude = ref(77.209)
const imageData = ref('')
const evidenceDescription = ref('Photo of the streetlight and nearby area.')
const aiStatus = ref('AI unavailable')
type WorkflowResult = {
  analysis: {
    category: string
    issueType: string
    severity: string
    summary: string
    impact: string
    missingInformation: string[]
  }
  authority: string
  evidence: {
    evidenceAvailable: boolean
    missingInformation: string[]
    notes: string
  }
  draft: {
    title: string
    subject: string
    body: string
    summary: string
    category: string
    issueType: string
    severity: string
    impact: string
  }
}

const result = ref<WorkflowResult | null>(null)
const statusText = ref('')
const complaintReady = ref(false)
const draft = ref({
  title: 'Streetlight not functioning',
  subject: 'Streetlight failure in local area',
  body: 'Streetlight is not functioning.',
  summary: 'Streetlight is not functioning and may affect visibility.',
  category: 'Streetlight',
  issueType: 'Streetlight Failure',
  severity: 'Medium',
  impact: 'Reduced visibility at night.',
})

const canSubmit = computed(() => !!draft.value.title && !!draft.value.body)

const runAI = async () => {
  aiStatus.value = 'CityCare AI is analyzing your report...'
  try {
    const engineReady = await localAIEngine.initialize()
    if (!engineReady) {
      aiStatus.value = 'Local AI is unavailable in this browser. You can still submit a complaint manually.'
      complaintReady.value = true
      return
    }
    aiStatus.value = 'AI ready'
    const orchestrator = new ComplaintWorkflowOrchestrator()
    const workflow = await orchestrator.run({
      description: description.value,
      address: address.value,
      landmark: landmark.value,
      latitude: latitude.value,
      longitude: longitude.value,
      image: imageData.value,
    })
    result.value = workflow
    draft.value = {
      title: workflow.draft.title,
      subject: workflow.draft.subject,
      body: workflow.draft.body,
      summary: workflow.draft.summary,
      category: workflow.analysis.category,
      issueType: workflow.analysis.issueType,
      severity: workflow.analysis.severity,
      impact: workflow.analysis.impact,
    }
    complaintReady.value = true
    step.value = 5
  } catch (error) {
    aiStatus.value = 'Local AI could not be loaded. You can continue manually.'
    complaintReady.value = true
    statusText.value = error instanceof Error ? error.message : 'AI analysis failed.'
  }
}

const submitComplaint = async () => {
  const complaint = await store.submitComplaint({
    title: draft.value.title,
    subject: draft.value.subject,
    body: draft.value.body,
    summary: draft.value.summary,
    category: draft.value.category,
    issueType: draft.value.issueType,
    severity: draft.value.severity,
    impact: draft.value.impact,
    location: `${address.value} ${landmark.value}`,
    address: address.value,
    landmark: landmark.value,
    latitude: latitude.value,
    longitude: longitude.value,
    evidence: imageData.value ? [{ fileName: 'report-image.jpg', fileType: 'image/jpeg', fileData: imageData.value, description: evidenceDescription.value }] : [],
  })

  router.push(`/complaints/${complaint.id}`)
}

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    statusText.value = 'For this free MVP, please use a compressed image under the supported size.'
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    imageData.value = String(reader.result ?? '')
  }
  reader.readAsDataURL(file)
}
</script>

<template>
  <main class="mx-auto max-w-5xl px-6 py-10 text-slate-900">
    <div class="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm uppercase tracking-[0.2em] text-slate-500">Complaint flow</p>
          <h1 class="mt-2 text-3xl font-bold">Report an issue</h1>
        </div>
        <div class="rounded-full bg-cyan-100 px-3 py-1 text-sm font-medium text-cyan-800">Step {{ step }} of 7</div>
      </div>
    </div>

    <div class="grid gap-8 lg:grid-cols-[1.3fr,0.7fr]">
      <section class="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div v-if="step === 1" class="space-y-4">
          <label class="block text-sm font-medium text-slate-700">Describe Issue</label>
          <textarea v-model="description" rows="6" class="w-full rounded-xl border border-slate-300 bg-slate-50 p-3"></textarea>
          <button class="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white" @click="step = 2">Next</button>
        </div>

        <div v-if="step === 2" class="space-y-4">
          <label class="block text-sm font-medium text-slate-700">Address</label>
          <input v-model="address" class="w-full rounded-xl border border-slate-300 bg-slate-50 p-3" />
          <label class="block text-sm font-medium text-slate-700">Landmark</label>
          <input v-model="landmark" class="w-full rounded-xl border border-slate-300 bg-slate-50 p-3" />
          <div class="grid grid-cols-2 gap-4">
            <div><label class="text-sm font-medium text-slate-700">Latitude</label><input v-model.number="latitude" class="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-3" /></div>
            <div><label class="text-sm font-medium text-slate-700">Longitude</label><input v-model.number="longitude" class="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-3" /></div>
          </div>
          <button class="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white" @click="step = 3">Next</button>
        </div>

        <div v-if="step === 3" class="space-y-4">
          <label class="block text-sm font-medium text-slate-700">Image upload</label>
          <input type="file" accept="image/jpeg,image/png,image/webp" class="w-full rounded-xl border border-slate-300 bg-slate-50 p-3" @change="handleImageUpload" />
          <label class="block text-sm font-medium text-slate-700">Evidence description</label>
          <textarea v-model="evidenceDescription" rows="4" class="w-full rounded-xl border border-slate-300 bg-slate-50 p-3"></textarea>
          <button class="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white" @click="step = 4">Next</button>
        </div>

        <div v-if="step === 4" class="space-y-4">
          <div class="rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-cyan-900">
            <p class="font-semibold">AI analysis</p>
            <p class="mt-2 text-sm">{{ aiStatus }}</p>
          </div>
          <button class="rounded-lg bg-cyan-600 px-4 py-2 font-medium text-white" @click="runAI">Run AI Analysis</button>
          <button class="rounded-lg border border-slate-300 px-4 py-2 font-medium" @click="complaintReady = true; step = 5">Continue manually</button>
        </div>

        <div v-if="step === 5 || complaintReady" class="space-y-4">
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">AI-generated — please review before submitting.</p>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div><label class="text-sm font-medium text-slate-700">Title</label><input v-model="draft.title" class="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-3" /></div>
            <div><label class="text-sm font-medium text-slate-700">Subject</label><input v-model="draft.subject" class="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-3" /></div>
            <div><label class="text-sm font-medium text-slate-700">Category</label><input v-model="draft.category" class="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-3" /></div>
            <div><label class="text-sm font-medium text-slate-700">Issue Type</label><input v-model="draft.issueType" class="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-3" /></div>
            <div><label class="text-sm font-medium text-slate-700">Severity</label><input v-model="draft.severity" class="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-3" /></div>
            <div><label class="text-sm font-medium text-slate-700">Impact</label><input v-model="draft.impact" class="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-3" /></div>
          </div>

          <div>
            <label class="text-sm font-medium text-slate-700">Formal complaint</label>
            <textarea v-model="draft.body" rows="6" class="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-3"></textarea>
          </div>

          <div>
            <label class="text-sm font-medium text-slate-700">Short summary</label>
            <textarea v-model="draft.summary" rows="3" class="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-3"></textarea>
          </div>

          <button :disabled="!canSubmit" class="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50" @click="submitComplaint">Create Complaint</button>
        </div>
      </section>

      <aside class="space-y-6">
        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-lg font-semibold">AI Result</h2>
          <div v-if="result" class="mt-4 space-y-3 text-sm text-slate-700">
            <p><span class="font-semibold">Category:</span> {{ result.analysis.category }}</p>
            <p><span class="font-semibold">Issue Type:</span> {{ result.analysis.issueType }}</p>
            <p><span class="font-semibold">Severity:</span> {{ result.analysis.severity }}</p>
            <p><span class="font-semibold">Responsible Service:</span> {{ result.authority }}</p>
            <p><span class="font-semibold">Evidence Status:</span> {{ result.evidence.evidenceAvailable ? 'Available' : 'Missing' }}</p>
          </div>
          <p v-else class="mt-3 text-sm text-slate-500">No AI analysis has run yet.</p>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-lg font-semibold">Status</h2>
          <p class="mt-3 text-sm text-slate-600">{{ statusText || 'Ready for report generation.' }}</p>
        </div>
      </aside>
    </div>
  </main>
</template>
