import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { EscolasPageMobile } from './EscolasPage.mobile'
import { EscolasPageWeb } from './EscolasPage.web'

export function EscolasPage() {
  return (
    <AdaptiveView 
      web={<EscolasPageWeb />} 
      mobile={<EscolasPageMobile />} 
    />
  )
}
