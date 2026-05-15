import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { PerfilEscolaPageMobile } from './PerfilEscolaPage.mobile'
import { PerfilEscolaPageWeb } from './PerfilEscolaPage.web'

export function PerfilEscolaPage() {
  return (
    <AdaptiveView 
      web={<PerfilEscolaPageWeb />} 
      mobile={<PerfilEscolaPageMobile />} 
    />
  )
}
