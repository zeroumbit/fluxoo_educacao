import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { registerSW } from 'virtual:pwa-register'
import { toast } from 'sonner'
import { initSentry } from '@/lib/sentry'
import { setupErrorHandlers } from '@/lib/logger'

// Inicializar Sentry ANTES do primeiro render (captura erros desde o início)
initSentry()
setupErrorHandlers()

// Start App Registration first
createRoot(document.getElementById('root')!).render(<App />)

// Strategy: PWA Update Flow with Background Fetch
// Registers Service Worker. Tells user there's a new version available.
const updateSW = registerSW({
  onNeedRefresh() {
    toast('🚀 Nova versão do app disponível!', {
      description: 'A atualização melhora a performance e traz novos recursos.',
      action: {
        label: 'Atualizar Agora',
        onClick: () => updateSW(true) // will update and location.reload()
      },
      duration: 10000,
      position: 'top-center'
    });
  },
  onOfflineReady() {
    toast.success('App pronto para uso offline', {
      description: 'Você pode acessar os dados carregados mesmo sem internet.',
      position: 'top-center'
    });
  },
})
