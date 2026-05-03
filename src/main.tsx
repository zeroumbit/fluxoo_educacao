import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { registerSW } from 'virtual:pwa-register'
import { toast } from 'sonner'
import { initSentry } from '@/lib/sentry'
import { setupErrorHandlers } from '@/lib/logger'
import '@/lib/config'

initSentry()
setupErrorHandlers()

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)

async function clearDevelopmentServiceWorkers() {
  if (!('serviceWorker' in navigator)) return

  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(registrations.map((registration) => registration.unregister()))

  if ('caches' in window) {
    const keys = await caches.keys()
    await Promise.all(
      keys
        .filter((key) => key.startsWith('workbox-') || key.includes('precache') || key.includes('fluxoo'))
        .map((key) => caches.delete(key))
    )
  }
}

if (import.meta.env.DEV) {
  clearDevelopmentServiceWorkers().catch((error) => {
    console.warn('Falha ao limpar service worker de desenvolvimento:', error)
  })
} else {
  const updateSW = registerSW({
    onNeedRefresh() {
      toast('Nova versao do app disponivel!', {
        description: 'A atualizacao melhora a performance e traz novos recursos.',
        action: {
          label: 'Atualizar Agora',
          onClick: () => updateSW(true),
        },
        duration: 10000,
        position: 'top-center',
      })
    },
    onOfflineReady() {
      toast.success('App pronto para uso offline', {
        description: 'Voce pode acessar os dados carregados mesmo sem internet.',
        position: 'top-center',
      })
    },
  })
}
