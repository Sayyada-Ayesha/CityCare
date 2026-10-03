<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'

const store = useAppStore()
const router = useRouter()
const error = ref('')

onMounted(async () => {
  try {
    await store.loadCitizenComplaints()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not load your dashboard.'
  }
})

const copyCitizenId = async () => {
  try {
    await navigator.clipboard.writeText(store.citizenToken)
    error.value = 'Citizen ID copied.'
  } catch {
    error.value = 'Clipboard access is unavailable. Select and copy the ID above.'
  }
}

const citizenComplaints = computed(() => store.getCitizenComplaints())
const total = computed(() => citizenComplaints.value.length)
const counts = computed(() => ({
  SUBMITTED: citizenComplaints.value.filter((item) => item.status === 'SUBMITTED').length,
  IN_REVIEW: citizenComplaints.value.filter((item) => item.status === 'IN_REVIEW').length,
  ASSIGNED: citizenComplaints.value.filter((item) => item.status === 'ASSIGNED').length,
  IN_PROGRESS: citizenComplaints.value.filter((item) => item.status === 'IN_PROGRESS').length,
  RESOLVED: citizenComplaints.value.filter((item) => item.status === 'RESOLVED').length,
  CLOSED: citizenComplaints.value.filter((item) => item.status === 'CLOSED').length,
}))
</script>

<template>
  <main class="mx-auto max-w-6xl px-6 py-10 text-slate-900">
    <div class="mb-8 flex items-center justify-between">
      <div>
        <p class="text-sm uppercase tracking-[0.2em] text-slate-500">Citizen dashboard</p>
        <h1 class="mt-2 text-3xl font-bold">Your Citizen ID</h1>
      </div>
      <button class="rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium" @click="router.push('/report')">Report Issue</button>
    </div>
    <p v-if="error" role="status" class="mb-4 text-sm text-slate-600">{{ error }}</p>

    <div class="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="text-sm text-slate-500">Anonymous citizen ID</p>
          <p class="mt-1 font-mono text-lg font-semibold">{{ store.citizenToken }}</p>
        </div>
        <button class="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white" @click="copyCitizenId">Copy Citizen ID</button>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-6">
      <div class="rounded-xl bg-slate-900 p-4 text-white"><p class="text-xs uppercase text-slate-400">Total</p><p class="mt-2 text-2xl font-bold">{{ total }}</p></div>
      <div class="rounded-xl bg-slate-100 p-4"><p class="text-xs uppercase text-slate-500">Submitted</p><p class="mt-2 text-2xl font-bold text-slate-900">{{ counts.SUBMITTED }}</p></div>
      <div class="rounded-xl bg-amber-50 p-4"><p class="text-xs uppercase text-amber-600">In Review</p><p class="mt-2 text-2xl font-bold text-amber-700">{{ counts.IN_REVIEW }}</p></div>
      <div class="rounded-xl bg-blue-50 p-4"><p class="text-xs uppercase text-blue-600">Assigned</p><p class="mt-2 text-2xl font-bold text-blue-700">{{ counts.ASSIGNED }}</p></div>
      <div class="rounded-xl bg-indigo-50 p-4"><p class="text-xs uppercase text-indigo-600">In Progress</p><p class="mt-2 text-2xl font-bold text-indigo-700">{{ counts.IN_PROGRESS }}</p></div>
      <div class="rounded-xl bg-emerald-50 p-4"><p class="text-xs uppercase text-emerald-600">Resolved</p><p class="mt-2 text-2xl font-bold text-emerald-700">{{ counts.RESOLVED }}</p></div>
    </div>

    <div class="mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-semibold">Recent complaints</h2>
        <button class="text-sm font-medium text-cyan-700" @click="router.push('/complaints')">My Complaints</button>
      </div>

      <div class="space-y-3">
        <div v-if="!citizenComplaints.length" class="rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-500">No complaints yet.</div>
        <div v-for="complaint in citizenComplaints.slice(0, 5)" :key="complaint.id" class="flex items-center justify-between rounded-xl border border-slate-200 p-4">
          <div>
            <p class="font-semibold text-slate-900">{{ complaint.complaintNumber }} • {{ complaint.title }}</p>
            <p class="mt-1 text-sm text-slate-500">{{ complaint.category }} • {{ complaint.severity }}</p>
          </div>
          <button class="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium" @click="router.push(`/complaints/${complaint.id}`)">View</button>
        </div>
      </div>
    </div>
  </main>
</template>
