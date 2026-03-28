import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { ConfiguracoesPage as ConfiguracoesPageWeb } from './ConfiguracoesPage.web'
import { ConfiguracoesPageMobile } from './ConfiguracoesPage.mobile'

export function ConfiguracoesPage() {
  return (
    <AdaptiveView 
      web={<ConfiguracoesPageWeb />} 
      mobile={<ConfiguracoesPageMobile />} 
    />
  )
}
