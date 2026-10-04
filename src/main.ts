import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { router } from './router'
import './style.css'
import App from './App.vue'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch((error: unknown) => {
      console.warn('CityCare service worker registration failed; the app remains available online.', error)
    })
  })
}

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
