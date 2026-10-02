<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAppStore } from '../stores/app'
import type { ComplaintStatus } from '../types'

const store = useAppStore()
const statusFilter = ref('ALL')
const search = ref('')

const complaints = computed(() => store.complaints.filter((item) => {
  const matchesStatus = statusFilter.value === 'ALL' || item.status === statusFilter.value
  const matchesSearch = !search.value || item.title.toLowerCase().includes(search.value.toLowerCase()) || item.complaintNumber.toLowerCase().includes(search.value.toLowerCase())
  return matchesStatus && matchesSearch
}))

const updateStatus = (complaintId: string, status: string) => {
  store.updateComplaintStatus(complaintId, status as ComplaintStatus, `Status changed to ${status}`)
}
</script>

<template>
  <main class="mx-auto max-w-6xl px-6 py-10">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <p class="text-sm uppercase tracking-[0.2em] text-slate-500">Admin dashboard</p>
        <h1 class="mt-2 text-3xl font-bold text-slate-900">Complaint management</h1>
      </div>
      <div class="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">Admin session active</div>
    </div>

    <div class="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row">
      <input v-model="search" placeholder="Search complaints" class="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 md:max-w-xs" />
      <select v-model="statusFilter" class="rounded-xl border border-slate-300 bg-slate-50 p-3">
        <option value="ALL">All</option>
        <option value="SUBMITTED">Submitted</option>
        <option value="IN_REVIEW">In Review</option>
        <option value="ASSIGNED">Assigned</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="RESOLVED">Resolved</option>
        <option value="CLOSED">Closed</option>
      </select>
    </div>

    <div class="space-y-3">
      <div v-for="complaint in complaints" :key="complaint.id" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="text-sm font-semibold text-cyan-700">{{ complaint.complaintNumber }}</p>
            <h2 class="mt-1 text-xl font-semibold">{{ complaint.title }}</h2>
          </div>
          <div class="flex gap-2">
            <select :value="complaint.status" class="rounded-lg border border-slate-300 bg-slate-50 p-2" @change="updateStatus(complaint.id, ($event.target as HTMLSelectElement).value)">
              <option value="SUBMITTED">Submitted</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>
        <div class="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-5">
          <div><span class="font-semibold text-slate-800">Category:</span> {{ complaint.category }}</div>
          <div><span class="font-semibold text-slate-800">Severity:</span> {{ complaint.severity }}</div>
          <div><span class="font-semibold text-slate-800">Status:</span> {{ complaint.status }}</div>
          <div><span class="font-semibold text-slate-800">Created:</span> {{ new Date(complaint.createdAt).toLocaleString() }}</div>
          <div><span class="font-semibold text-slate-800">Authority:</span> {{ store.authorities.find((a) => a.id === complaint.authorityId)?.name ?? 'Unknown' }}</div>
        </div>
      </div>
    </div>
  </main>
</template>
