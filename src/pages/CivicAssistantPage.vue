<script setup lang="ts">
import { ref } from 'vue'
import { localAIEngine } from '../ai/engine/LocalAIEngine'
import { CivicAssistantAgent } from '../ai/agents/CivicAssistantAgent'
import { useAppStore } from '../stores/app'

const store = useAppStore()
const question = ref('')
const answer = ref('')
const source = ref('')
const busy = ref(false)
const status = ref('')

const ask = async () => {
  if (question.value.trim().length < 4 || busy.value) return
  busy.value = true
  answer.value = ''
  status.value = 'Checking local AI availability…'
  try {
    const ready = await localAIEngine.initialize((progress) => {
      status.value = progress.text || `Loading local model (${Math.round(progress.progress * 100)}%)`
    })
    if (!ready) {
      status.value = 'Browser-local AI needs WebGPU and could not start. Your question and records were not sent to an external AI service.'
      return
    }

    const [complaints, authorities] = await Promise.all([
      store.loadCitizenComplaints(),
      store.loadAuthorities(),
    ])
    const response = await new CivicAssistantAgent().respond(question.value.trim(), {
      myComplaints: complaints.map(({ complaintNumber, status: complaintStatus, title, updatedAt }) => ({
        complaintNumber,
        status: complaintStatus,
        title,
        updatedAt,
      })),
      activeAuthorities: authorities.map(({ name, category, area }) => ({ name, category, area })),
    })
    answer.value = response.answer
    source.value = response.source === 'AI' ? 'Browser-local AI' : 'Verified CityCare records'
    status.value = ''
  } catch (cause) {
    status.value = cause instanceof Error ? cause.message : 'The assistant could not complete this request.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="mx-auto max-w-4xl px-6 py-10">
    <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p class="text-sm uppercase tracking-[0.2em] text-slate-500">Civic AI assistant</p>
      <h1 class="mt-3 text-3xl font-bold text-slate-900">Ask about civic issues</h1>
      <textarea v-model="question" rows="4" maxlength="1000" class="mt-5 w-full rounded-xl border border-slate-300 bg-slate-50 p-3"></textarea>
      <button :disabled="question.trim().length < 4 || busy" class="mt-4 rounded-lg bg-cyan-700 px-4 py-2 font-medium text-white disabled:opacity-50" @click="ask">{{ busy ? 'Working…' : 'Ask locally' }}</button>
      <p v-if="status" role="status" class="mt-4 text-sm text-slate-600">{{ status }}</p>

      <div class="mt-8 grid gap-4 md:grid-cols-2">
        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">AI explanation</p>
          <p v-if="answer" class="mt-3 text-slate-700">{{ answer }}</p>
          <p v-else class="mt-3 text-slate-500">No answer yet.</p>
          <p v-if="source" class="mt-3 text-xs text-slate-500">Source: {{ source }}</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Privacy</p>
          <p class="mt-3 text-slate-700">Responses are generated in this browser. When asked, only your own complaint statuses and the public authority directory are supplied as context.</p>
        </div>
      </div>
    </div>
  </main>
</template>
