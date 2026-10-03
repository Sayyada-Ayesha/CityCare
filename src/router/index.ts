import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '../pages/LandingPage.vue'
import ReportIssuePage from '../pages/ReportIssuePage.vue'
import DashboardPage from '../pages/DashboardPage.vue'
import ComplaintsPage from '../pages/ComplaintsPage.vue'
import ComplaintDetailPage from '../pages/ComplaintDetailPage.vue'
import AdminPage from '../pages/AdminPage.vue'
import AdminComplaintsPage from '../pages/AdminComplaintsPage.vue'
import AdminAuthoritiesPage from '../pages/AdminAuthoritiesPage.vue'
import AdminComplaintDetailPage from '../pages/AdminComplaintDetailPage.vue'
import CivicAssistantPage from '../pages/CivicAssistantPage.vue'
import ProfilePage from '../pages/ProfilePage.vue'
import { useAppStore } from '../stores/app'

const routes = [
  { path: '/', name: 'home', component: LandingPage },
  { path: '/report', name: 'report', component: ReportIssuePage },
  { path: '/report/review', name: 'report-review', redirect: { name: 'report' } },
  { path: '/report/confirmation', name: 'report-confirmation', redirect: { name: 'dashboard' } },
  { path: '/assistant', name: 'assistant', component: CivicAssistantPage },
  { path: '/dashboard', name: 'dashboard', component: DashboardPage },
  { path: '/complaints', name: 'complaints', component: ComplaintsPage },
  { path: '/complaints/:id', name: 'complaint-detail', component: ComplaintDetailPage },
  { path: '/profile', name: 'profile', component: ProfilePage },
  { path: '/admin', name: 'admin', component: AdminPage },
  { path: '/admin/complaints', name: 'admin-complaints', component: AdminComplaintsPage, meta: { requiresAdmin: true } },
  { path: '/admin/complaints/:id', name: 'admin-complaint-detail', component: AdminComplaintDetailPage, meta: { requiresAdmin: true } },
  { path: '/admin/authorities', name: 'admin-authorities', component: AdminAuthoritiesPage, meta: { requiresAdmin: true } },
  { path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  if (to.meta.requiresAdmin && !useAppStore().adminAuthenticated) {
    return { name: 'admin', query: { redirect: to.fullPath } }
  }
})
