<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '../stores/app'

const route = useRoute()
const store = useAppStore()
const error = ref('')
const loading = ref(true)
const complaint = computed(() => store.getComplaintById(String(route.params.id)))

onMounted(async () => {
  try {
    await store.loadComplaint(String(route.params.id))
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not load this complaint.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main v-if="loading" class="mx-auto max-w-5xl px-6 py-10" aria-live="polite">Loading complaint…</main>
  <main v-else-if="error" class="mx-auto max-w-5xl px-6 py-10" role="alert">{{ error }}</main>
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

      <div v-if="complaint.evidence?.length" class="mt-6 rounded-xl border border-slate-200 p-4">
        <h2 class="text-lg font-semibold">Evidence</h2>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <figure v-for="item in complaint.evidence" :key="item.id" class="min-w-0">
            <img :src="item.fileData" :alt="item.description || item.fileName" class="max-h-80 w-full rounded-lg object-contain" />
            <figcaption class="mt-2 break-words text-sm text-slate-600">{{ item.description || item.fileName }}</figcaption>
          </figure>
        </div>
      </div>
    </div>
  </main>
</template>
