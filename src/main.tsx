import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { registerSW } from 'virtual:pwa-register'
import { toast } from 'sonner' // toast for update notification

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
      position: 'top-center',
      className: 'z-[9999]',
      classNames: {
        toast: 'z-[9999]',
        content: 'z-[9999]'
      }
    });
  },
  onOfflineReady() {
    toast.success('App pronto para uso offline', {
      description: 'Você pode acessar os dados carregados mesmo sem internet.',
      position: 'top-center',
      className: 'z-[9999]',
      classNames: {
        toast: 'z-[9999]',
        content: 'z-[9999]'
      }
    });
  },
})
