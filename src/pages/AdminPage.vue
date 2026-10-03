<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'

const store = useAppStore()
const pin = ref('')
const error = ref('')
const router = useRouter()

const login = async () => {
  error.value = ''
  try {
    await store.authenticateAdmin(pin.value)
    router.push('/admin/complaints')
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Admin verification failed.'
  }
}
</script>

<template>
  <main class="mx-auto max-w-xl px-6 py-16">
    <div class="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <p class="text-sm uppercase tracking-[0.2em] text-slate-500">Admin access</p>
      <h1 class="mt-3 text-3xl font-bold text-slate-900">Admin PIN</h1>
      <input v-model="pin" type="password" placeholder="Enter admin PIN" class="mt-6 w-full rounded-xl border border-slate-300 bg-slate-50 p-3" />
      <p v-if="error" role="alert" class="mt-3 text-sm text-red-700">{{ error }}</p>
      <button class="mt-5 w-full rounded-lg bg-slate-900 px-4 py-3 font-medium text-white" @click="login">Continue</button>
    </div>
  </main>
</template>
