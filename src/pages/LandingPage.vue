<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-white">
    <header class="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <div class="text-2xl font-bold">CityCare AI</div>
      <nav class="flex gap-4 text-sm text-slate-300">
        <button class="hover:text-white" @click="router.push('/report')">Report an Issue</button>
        <button class="hover:text-white" @click="router.push('/dashboard')">Track My Complaints</button>
      </nav>
    </header>

    <section class="mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 md:grid-cols-2">
      <div>
        <p class="mb-5 inline-flex rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">
          Independent civic technology project
        </p>
        <h1 class="text-5xl font-bold leading-tight text-white">Turn civic problems into actionable complaints.</h1>
        <p class="mt-6 max-w-xl text-lg text-slate-300">
          Report local civic issues, understand what service they belong to, prepare a clear complaint, and track what happens next.
        </p>

        <div class="mt-8 flex flex-wrap gap-4">
          <button class="rounded-lg bg-cyan-500 px-5 py-3 font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400" @click="router.push('/report')">
            Report an Issue
          </button>
          <button class="rounded-lg border border-slate-600 bg-slate-900 px-5 py-3 font-semibold text-white transition hover:border-slate-400" @click="router.push('/dashboard')">
            Track My Complaints
          </button>
        </div>

        <p class="mt-4 text-sm text-slate-400">CityCare AI is an independent civic technology project and is not affiliated with any government department.</p>
      </div>

      <div class="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-slate-950/60">
        <div class="space-y-4 rounded-2xl border border-slate-700 bg-slate-950 p-5">
          <div class="flex items-center justify-between">
            <span class="text-xs uppercase tracking-[0.2em] text-slate-400">AI classification</span>
            <span class="rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-300">AI ready</span>
          </div>
          <div class="rounded-xl bg-slate-900 p-4">
            <p class="text-sm text-slate-400">Issue</p>
            <p class="mt-2 text-lg font-semibold text-white">Streetlight not functioning</p>
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="rounded-xl bg-slate-800 p-3"><p class="text-slate-400">Category</p><p class="mt-1 font-semibold text-white">Streetlight</p></div>
            <div class="rounded-xl bg-slate-800 p-3"><p class="text-slate-400">Severity</p><p class="mt-1 font-semibold text-white">Medium</p></div>
            <div class="rounded-xl bg-slate-800 p-3"><p class="text-slate-400">Service</p><p class="mt-1 font-semibold text-white">Municipal Services</p></div>
            <div class="rounded-xl bg-slate-800 p-3"><p class="text-slate-400">Status</p><p class="mt-1 font-semibold text-white">Submitted</p></div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
