<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '../stores/app'

const store = useAppStore()
const message = ref('')

async function copyId() {
  try {
    await navigator.clipboard.writeText(store.citizenToken)
    message.value = 'Citizen ID copied.'
  } catch {
    message.value = 'Clipboard is unavailable. Select the ID and copy it manually.'
  }
}
</script>

<template>
  <main class="mx-auto max-w-3xl px-6 py-10">
    <section class="rounded-xl border border-slate-200 bg-white p-6">
      <p class="text-sm font-semibold uppercase text-slate-500">Anonymous profile</p>
      <h1 class="mt-2 text-2xl font-bold">Your citizen ID</h1>
      <p class="mt-5 break-all rounded-lg bg-slate-50 p-4 font-mono text-sm">{{ store.citizenToken }}</p>
      <button class="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-white" @click="copyId">Copy ID</button>
      <p v-if="message" role="status" class="mt-3 text-sm text-slate-600">{{ message }}</p>
      <p class="mt-6 text-sm text-slate-600">This random ID is stored in this browser and identifies complaints you submit. CityCare does not require an account.</p>
    </section>
  </main>
</template>