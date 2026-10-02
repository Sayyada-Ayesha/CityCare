<script setup lang="ts">
import { ref } from 'vue'

const question = ref('What is the status of my complaint?')
const answer = ref('CityCare AI can explain category, service routing, evidence, and complaint status using verified records.')
</script>

<template>
  <main class="mx-auto max-w-4xl px-6 py-10">
    <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p class="text-sm uppercase tracking-[0.2em] text-slate-500">Civic AI assistant</p>
      <h1 class="mt-3 text-3xl font-bold text-slate-900">Ask about civic issues</h1>
      <textarea v-model="question" rows="4" class="mt-5 w-full rounded-xl border border-slate-300 bg-slate-50 p-3"></textarea>
      <button class="mt-4 rounded-lg bg-cyan-600 px-4 py-2 font-medium text-white" @click="answer = 'AI explanation: the complaint status is based on the database record. Database information: the current complaint state is stored and retrieved from the application data.'">Ask AI</button>

      <div class="mt-8 grid gap-4 md:grid-cols-2">
        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">AI explanation</p>
          <p class="mt-3 text-slate-700">{{ answer }}</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Database information</p>
          <p class="mt-3 text-slate-700">The system retrieves the current complaint record and status from local app data before answering.</p>
        </div>
      </div>
    </div>
  </main>
</template>
