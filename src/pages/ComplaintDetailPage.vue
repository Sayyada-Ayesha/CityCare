<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '../stores/app'

const route = useRoute()
const store = useAppStore()
const complaint = computed(() => store.getComplaintById(String(route.params.id)))
</script>

<template>
  <main v-if="complaint" class="mx-auto max-w-5xl px-6 py-10 text-slate-900">
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex items-center justify-between gap-4">
        <div>
          <p class="text-sm uppercase tracking-[0.2em] text-slate-500">Complaint</p>
          <h1 class="mt-2 text-3xl font-bold">{{ complaint.complaintNumber }}</h1>
        </div>
        <span class="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{{ complaint.status }}</span>
      </div>

      <div class="mt-6 grid gap-5 md:grid-cols-2">
        <div class="rounded-xl border border-slate-200 p-4"><p class="text-sm text-slate-500">Title</p><p class="mt-2 font-semibold">{{ complaint.title }}</p></div>
        <div class="rounded-xl border border-slate-200 p-4"><p class="text-sm text-slate-500">Subject</p><p class="mt-2 font-semibold">{{ complaint.subject }}</p></div>
        <div class="rounded-xl border border-slate-200 p-4"><p class="text-sm text-slate-500">Category</p><p class="mt-2 font-semibold">{{ complaint.category }}</p></div>
        <div class="rounded-xl border border-slate-200 p-4"><p class="text-sm text-slate-500">Severity</p><p class="mt-2 font-semibold">{{ complaint.severity }}</p></div>
      </div>

      <div class="mt-6 rounded-xl border border-slate-200 p-4">
        <p class="text-sm text-slate-500">Description</p>
        <p class="mt-2 whitespace-pre-line">{{ complaint.description }}</p>
      </div>

      <div class="mt-6 rounded-xl border border-slate-200 p-4">
        <p class="text-sm text-slate-500">Timeline</p>
        <div class="mt-4 space-y-3">
          <div v-for="event in complaint.statusHistory" :key="event.id" class="border-l-2 border-slate-200 pl-4">
            <p class="font-semibold text-slate-800">{{ event.status }}</p>
            <p class="text-sm text-slate-500">{{ new Date(event.createdAt).toLocaleString() }}</p>
            <p class="mt-1 text-sm">{{ event.note }}</p>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
