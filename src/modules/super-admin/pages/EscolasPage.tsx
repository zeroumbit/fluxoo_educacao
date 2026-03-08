import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { EscolasPageWeb } from './EscolasPage.web'
import { EscolasPageMobile } from './EscolasPage.mobile'

export function EscolasPage() {
  return (
    <AdaptiveView 
      web={<EscolasPageWeb />} 
      mobile={<EscolasPageMobile />} 
    />
  )
}
