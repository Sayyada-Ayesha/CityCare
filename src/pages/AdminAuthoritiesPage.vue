<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ISSUE_CATEGORIES } from '../lib/complaintUtils'
import { useAppStore } from '../stores/app'
const store = useAppStore()
const error = ref('')
const form = reactive({ name: '', category: 'Public Infrastructure', description: '', contactInfo: '', area: 'Citywide' })

onMounted(async () => {
  try {
    await store.loadAuthorities(true)
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not load authorities.'
  }
})

const addAuthority = async () => {
  try {
    await store.addAuthority(form)
    form.name = ''
    form.description = ''
    form.contactInfo = ''
    error.value = ''
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not add the authority.'
  }
}
</script>

<template>
  <main class="mx-auto max-w-6xl px-6 py-10">
    <div class="mb-6">
      <p class="text-sm uppercase tracking-[0.2em] text-slate-500">Authorities</p>
      <h1 class="mt-2 text-3xl font-bold text-slate-900">Authority directory</h1>
    </div>

    <form class="mb-8 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2" @submit.prevent="addAuthority">
      <input v-model="form.name" required minlength="2" maxlength="120" placeholder="Authority name" class="rounded-lg border border-slate-300 p-3" />
      <select v-model="form.category" class="rounded-lg border border-slate-300 p-3">
        <option v-for="category in ISSUE_CATEGORIES" :key="category" :value="category">{{ category }}</option>
      </select>
      <input v-model="form.description" maxlength="500" placeholder="Description" class="rounded-lg border border-slate-300 p-3" />
      <input v-model="form.contactInfo" maxlength="200" placeholder="Contact information" class="rounded-lg border border-slate-300 p-3" />
      <input v-model="form.area" maxlength="160" placeholder="Service area" class="rounded-lg border border-slate-300 p-3" />
      <button class="rounded-lg bg-slate-900 px-4 py-3 font-medium text-white">Add authority</button>
    </form>
    <p v-if="error" role="alert" class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{{ error }}</p>

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
