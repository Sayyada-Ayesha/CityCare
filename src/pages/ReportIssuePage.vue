<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { localAIEngine } from '../ai/engine/LocalAIEngine'
import { ComplaintWorkflowOrchestrator } from '../ai/orchestrator/ComplaintWorkflowOrchestrator'
import LocationPicker from '../components/map/LocationPicker.vue'
import { ISSUE_CATEGORIES, ISSUE_SEVERITIES } from '../lib/complaintUtils'

const router = useRouter()
const store = useAppStore()
const step = ref(1)
const description = ref('')
const address = ref('')
const landmark = ref('')
const latitude = ref<number | null>(null)
const longitude = ref<number | null>(null)
const imageData = ref('')
const imageFileName = ref('')
const evidenceDescription = ref('')
const aiStatus = ref('AI unavailable')
const submitting = ref(false)
const aiGenerated = ref(false)
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
  title: '',
  subject: '',
  body: '',
  summary: '',
  category: 'Other',
  issueType: 'Civic issue',
  severity: 'Medium',
  impact: '',
})

const canSubmit = computed(() => draft.value.title.trim().length >= 5
  && draft.value.subject.trim().length >= 5
  && draft.value.body.trim().length >= 20
  && draft.value.summary.trim().length >= 10
  && draft.value.impact.trim().length >= 10)

function continueManually() {
  const report = description.value.trim()
  draft.value = {
    title: report.slice(0, 120) || 'Civic issue report',
    subject: report.slice(0, 160) || 'Civic issue report',
    body: report,
    summary: report.slice(0, 300),
    category: 'Other',
    issueType: 'Civic issue',
    severity: 'Medium',
    impact: 'The impact will be assessed by the responsible service.',
  }
  aiGenerated.value = false
  complaintReady.value = true
  step.value = 5
}

function onLocationChange(location: { latitude: number; longitude: number }) {
  latitude.value = location.latitude
  longitude.value = location.longitude
}

const runAI = async () => {
  if (description.value.trim().length < 20) {
    statusText.value = 'Describe the issue in at least 20 characters before running analysis.'
    return
  }
  aiStatus.value = 'CityCare AI is analyzing your report...'
  try {
    const engineReady = await localAIEngine.initialize((progress) => {
      aiStatus.value = progress.text || `Preparing local AI (${Math.round(progress.progress * 100)}%)`
    })
    if (!engineReady) {
      aiStatus.value = 'Local AI is unavailable in this browser. You can still submit a complaint manually.'
      continueManually()
      return
    }
    aiStatus.value = 'Local model loaded. Analyzing your report…'
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
    aiGenerated.value = true
    step.value = 5
  } catch (error) {
    aiStatus.value = 'Local AI could not be loaded. You can continue manually.'
    statusText.value = error instanceof Error ? error.message : 'AI analysis failed.'
    continueManually()
  }
}

const submitComplaint = async () => {
  submitting.value = true
  statusText.value = ''
  try {
    const complaint = await store.submitComplaint({
      title: draft.value.title,
      subject: draft.value.subject,
      body: draft.value.body,
      summary: draft.value.summary,
      category: draft.value.category,
      issueType: draft.value.issueType,
      severity: draft.value.severity,
      impact: draft.value.impact,
      location: `${address.value} ${landmark.value}`.trim(),
      address: address.value,
      landmark: landmark.value,
      latitude: latitude.value,
      longitude: longitude.value,
      aiGenerated: aiGenerated.value,
      evidence: imageData.value ? [{ fileName: imageFileName.value, fileType: 'image/jpeg', fileData: imageData.value, description: evidenceDescription.value }] : [],
    })
    await router.push(`/complaints/${complaint.id}`)
  } catch (cause) {
    statusText.value = cause instanceof Error ? cause.message : 'The complaint could not be submitted.'
  } finally {
    submitting.value = false
  }
}

const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    statusText.value = 'Choose a JPEG, PNG, or WebP image.'
    target.value = ''
    return
  }
  if (file.size > 10_000_000) {
    statusText.value = 'Choose an image smaller than 10 MB.'
    target.value = ''
    return
  }

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Image processing is unavailable in this browser.')
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    let compressed: Blob | null = null
    for (const quality of [0.82, 0.68, 0.54]) {
      compressed = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
      if (compressed && compressed.size <= 500_000) break
    }
    if (!compressed || compressed.size > 500_000) throw new Error('This image could not be compressed below 500 KB.')
    imageData.value = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result ?? ''))
      reader.onerror = () => reject(new Error('The selected image could not be read.'))
      reader.readAsDataURL(compressed)
    })
    imageFileName.value = file.name.slice(0, 160)
    statusText.value = `Image attached (${Math.ceil(compressed.size / 1024)} KB).`
  } catch (cause) {
    imageData.value = ''
    imageFileName.value = ''
    statusText.value = cause instanceof Error ? cause.message : 'The selected image could not be processed.'
    target.value = ''
  }
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
        <div class="rounded-full bg-cyan-100 px-3 py-1 text-sm font-medium text-cyan-800">Step {{ step }} of 5</div>
      </div>
    </div>

    <div class="grid gap-8 lg:grid-cols-[1.3fr,0.7fr]">
      <section class="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div v-if="step === 1" class="space-y-4">
          <label class="block text-sm font-medium text-slate-700">Describe Issue</label>
          <textarea v-model="description" rows="6" maxlength="2000" class="w-full rounded-xl border border-slate-300 bg-slate-50 p-3"></textarea>
          <button :disabled="description.trim().length < 20" class="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white disabled:opacity-50" @click="step = 2">Next</button>
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
          <LocationPicker :latitude="latitude" :longitude="longitude" :address="address" :landmark="landmark" @location-change="onLocationChange" />
          <button class="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white" @click="step = 3">Next</button>
        </div>

        <div v-if="step === 3" class="space-y-4">
          <label class="block text-sm font-medium text-slate-700">Image upload</label>
          <input type="file" accept="image/jpeg,image/png,image/webp" class="w-full rounded-xl border border-slate-300 bg-slate-50 p-3" @change="handleImageUpload" />
          <p class="text-sm text-slate-500">Images are resized and stored with the complaint (up to 500 KB).</p>
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
          <button class="rounded-lg border border-slate-300 px-4 py-2 font-medium" @click="continueManually">Continue manually</button>
        </div>

        <div v-if="step === 5 || complaintReady" class="space-y-4">
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ aiGenerated ? 'AI draft — review before submitting.' : 'Manual draft — review before submitting.' }}</p>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div><label class="text-sm font-medium text-slate-700">Title</label><input v-model="draft.title" class="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-3" /></div>
            <div><label class="text-sm font-medium text-slate-700">Subject</label><input v-model="draft.subject" class="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-3" /></div>
            <div><label class="text-sm font-medium text-slate-700">Category</label><select v-model="draft.category" class="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-3"><option v-for="category in ISSUE_CATEGORIES" :key="category" :value="category">{{ category }}</option></select></div>
            <div><label class="text-sm font-medium text-slate-700">Issue Type</label><input v-model="draft.issueType" class="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-3" /></div>
            <div><label class="text-sm font-medium text-slate-700">Severity</label><select v-model="draft.severity" class="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-3"><option v-for="severity in ISSUE_SEVERITIES" :key="severity" :value="severity">{{ severity }}</option></select></div>
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

          <button :disabled="!canSubmit || submitting" class="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50" @click="submitComplaint">{{ submitting ? 'Submitting…' : 'Create Complaint' }}</button>
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
