import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { PerfilEscolaPageWeb } from './PerfilEscolaPage.web'
import { PerfilEscolaPageMobile } from './PerfilEscolaPage.mobile'

export function PerfilEscolaPage() {
  return (
    <AdaptiveView 
      web={<PerfilEscolaPageWeb />} 
      mobile={<PerfilEscolaPageMobile />} 
    />
  )
}
