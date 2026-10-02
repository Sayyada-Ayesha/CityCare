<script setup lang="ts">
import { useAppStore } from '../stores/app'
const store = useAppStore()
</script>

<template>
  <main class="mx-auto max-w-6xl px-6 py-10">
    <div class="mb-6">
      <p class="text-sm uppercase tracking-[0.2em] text-slate-500">Authorities</p>
      <h1 class="mt-2 text-3xl font-bold text-slate-900">Configurable sample service directory — not official government data.</h1>
    </div>

    <div class="space-y-4">
      <div v-for="authority in store.authorities" :key="authority.id" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="text-xl font-semibold">{{ authority.name }}</h2>
            <p class="text-sm text-slate-500">{{ authority.category }} • {{ authority.area }}</p>
          </div>
          <span class="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">{{ authority.active ? 'Active' : 'Inactive' }}</span>
        </div>
        <p class="mt-3 text-sm text-slate-600">{{ authority.description }}</p>
        <p class="mt-2 text-sm text-slate-600">Contact: {{ authority.contactInfo }}</p>
      </div>
    </div>
  </main>
</template>
