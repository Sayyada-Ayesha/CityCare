<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'

const store = useAppStore()
const router = useRouter()
const search = ref('')
const statusFilter = ref('ALL')

const complaints = computed(() => {
  return store.getCitizenComplaints().filter((item) => {
    const matchesStatus = statusFilter.value === 'ALL' || item.status === statusFilter.value
    const matchesSearch = !search.value || item.title.toLowerCase().includes(search.value.toLowerCase()) || item.complaintNumber.toLowerCase().includes(search.value.toLowerCase())
    return matchesStatus && matchesSearch
  })
})
</script>

<template>
  <main class="mx-auto max-w-6xl px-6 py-10">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <p class="text-sm uppercase tracking-[0.2em] text-slate-500">My complaints</p>
        <h1 class="mt-2 text-3xl font-bold text-slate-900">Complaint history</h1>
      </div>
      <button class="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white" @click="router.push('/report')">Report Issue</button>
    </div>

    <div class="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row">
      <input v-model="search" placeholder="Search complaint number or title" class="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 md:max-w-xs" />
      <select v-model="statusFilter" class="rounded-xl border border-slate-300 bg-slate-50 p-3">
        <option value="ALL">All statuses</option>
        <option value="SUBMITTED">Submitted</option>
        <option value="IN_REVIEW">In Review</option>
        <option value="ASSIGNED">Assigned</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="RESOLVED">Resolved</option>
        <option value="CLOSED">Closed</option>
      </select>
    </div>

    <div class="space-y-3">
      <div v-if="!complaints.length" class="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">No complaints match your filters.</div>
      <div v-for="complaint in complaints" :key="complaint.id" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="text-sm font-semibold text-cyan-700">{{ complaint.complaintNumber }}</p>
            <h2 class="mt-1 text-xl font-semibold text-slate-900">{{ complaint.title }}</h2>
          </div>
          <button class="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium" @click="router.push(`/complaints/${complaint.id}`)">View details</button>
        </div>
        <div class="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-5">
          <div><span class="font-semibold text-slate-800">Category:</span> {{ complaint.category }}</div>
          <div><span class="font-semibold text-slate-800">Severity:</span> {{ complaint.severity }}</div>
          <div><span class="font-semibold text-slate-800">Status:</span> {{ complaint.status }}</div>
          <div><span class="font-semibold text-slate-800">Created:</span> {{ new Date(complaint.createdAt).toLocaleDateString() }}</div>
          <div><span class="font-semibold text-slate-800">Updated:</span> {{ new Date(complaint.updatedAt).toLocaleDateString() }}</div>
        </div>
      </div>
    </div>
  </main>
</template>
