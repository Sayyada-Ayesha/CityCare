import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '../pages/LandingPage.vue'
import ReportIssuePage from '../pages/ReportIssuePage.vue'
import DashboardPage from '../pages/DashboardPage.vue'
import ComplaintsPage from '../pages/ComplaintsPage.vue'
import ComplaintDetailPage from '../pages/ComplaintDetailPage.vue'
import AdminPage from '../pages/AdminPage.vue'
import AdminComplaintsPage from '../pages/AdminComplaintsPage.vue'
import AdminAuthoritiesPage from '../pages/AdminAuthoritiesPage.vue'
import CivicAssistantPage from '../pages/CivicAssistantPage.vue'

const ReportReviewPage = { template: '<main class="mx-auto max-w-3xl px-6 py-12"><div class="rounded-2xl border border-slate-200 bg-white p-6"><h1 class="text-2xl font-bold">Review report</h1><p class="mt-3 text-slate-600">Review the generated complaint before final submission.</p></div></main>' }
const ReportConfirmationPage = { template: '<main class="mx-auto max-w-3xl px-6 py-12"><div class="rounded-2xl border border-slate-200 bg-white p-6"><h1 class="text-2xl font-bold">Complaint created</h1><p class="mt-3 text-slate-600">Your complaint was submitted successfully and will appear in your citizen dashboard.</p></div></main>' }
const ProfilePage = { template: '<main class="mx-auto max-w-3xl px-6 py-12"><div class="rounded-2xl border border-slate-200 bg-white p-6"><h1 class="text-2xl font-bold">Profile</h1><p class="mt-3 text-slate-600">Anonymous citizen identity is stored locally in your browser.</p></div></main>' }
const AdminComplaintDetailPage = { template: '<main class="mx-auto max-w-3xl px-6 py-12"><div class="rounded-2xl border border-slate-200 bg-white p-6"><h1 class="text-2xl font-bold">Admin complaint detail</h1><p class="mt-3 text-slate-600">Complaint detail view for admin review.</p></div></main>' }

const routes = [
  { path: '/', name: 'home', component: LandingPage },
  { path: '/report', name: 'report', component: ReportIssuePage },
  { path: '/report/review', name: 'report-review', component: ReportReviewPage },
  { path: '/report/confirmation', name: 'report-confirmation', component: ReportConfirmationPage },
  { path: '/assistant', name: 'assistant', component: CivicAssistantPage },
  { path: '/dashboard', name: 'dashboard', component: DashboardPage },
  { path: '/complaints', name: 'complaints', component: ComplaintsPage },
  { path: '/complaints/:id', name: 'complaint-detail', component: ComplaintDetailPage },
  { path: '/profile', name: 'profile', component: ProfilePage },
  { path: '/admin', name: 'admin', component: AdminPage },
  { path: '/admin/complaints', name: 'admin-complaints', component: AdminComplaintsPage },
  { path: '/admin/complaints/:id', name: 'admin-complaint-detail', component: AdminComplaintDetailPage },
  { path: '/admin/authorities', name: 'admin-authorities', component: AdminAuthoritiesPage },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
