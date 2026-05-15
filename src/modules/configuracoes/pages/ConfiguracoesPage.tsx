import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { ConfiguracoesPageMobile } from './ConfiguracoesPage.mobile'
import { ConfiguracoesPage as ConfiguracoesPageWeb } from './ConfiguracoesPage.web'

export function ConfiguracoesPage() {
  return (
    <AdaptiveView 
      web={<ConfiguracoesPageWeb />} 
      mobile={<ConfiguracoesPageMobile />} 
    />
  )
}
