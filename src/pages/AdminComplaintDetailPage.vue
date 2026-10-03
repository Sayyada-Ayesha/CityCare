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
    await store.loadComplaint(String(route.params.id), true)
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not load complaint details.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="mx-auto max-w-5xl px-6 py-10">
    <p v-if="loading" aria-live="polite">Loading complaint…</p>
    <p v-else-if="error" role="alert" class="rounded-lg bg-red-50 p-4 text-red-800">{{ error }}</p>
    <article v-else-if="complaint" class="rounded-xl border border-slate-200 bg-white p-6">
      <p class="text-sm font-semibold text-cyan-800">{{ complaint.complaintNumber }}</p>
      <h1 class="mt-2 text-2xl font-bold">{{ complaint.title }}</h1>
      <div class="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <p><strong>Status:</strong> {{ complaint.status }}</p>
        <p><strong>Authority:</strong> {{ store.authorities.find((item) => item.id === complaint.authorityId)?.name ?? 'Unknown' }}</p>
        <p><strong>Category:</strong> {{ complaint.category }}</p>
        <p><strong>Severity:</strong> {{ complaint.severity }}</p>
        <p><strong>Location:</strong> {{ complaint.location || 'Not provided' }}</p>
        <p><strong>Created:</strong> {{ new Date(complaint.createdAt).toLocaleString() }}</p>
      </div>
      <section class="mt-6">
        <h2 class="text-lg font-semibold">Complaint details</h2>
        <p class="mt-2 whitespace-pre-line">{{ complaint.description }}</p>
      </section>
      <section class="mt-6">
        <h2 class="text-lg font-semibold">Status history</h2>
        <ol class="mt-3 space-y-3">
          <li v-for="event in complaint.statusHistory" :key="event.id" class="border-l-2 border-slate-300 pl-4">
            <strong>{{ event.status }}</strong><span class="ml-2 text-sm text-slate-500">{{ new Date(event.createdAt).toLocaleString() }}</span>
            <p class="text-sm">{{ event.note }}</p>
          </li>
        </ol>
      </section>
      <section v-if="complaint.evidence?.length" class="mt-6">
        <h2 class="text-lg font-semibold">Evidence</h2>
        <div class="mt-3 grid gap-4 sm:grid-cols-2">
          <figure v-for="item in complaint.evidence" :key="item.id">
            <img :src="item.fileData" :alt="item.description || item.fileName" class="max-h-80 w-full rounded-lg object-contain" />
            <figcaption class="mt-2 break-words text-sm">{{ item.description || item.fileName }}</figcaption>
          </figure>
        </div>
      </section>
    </article>
    <p v-else class="rounded-lg border border-slate-200 bg-white p-4">Complaint not found.</p>
  </main>
</template>