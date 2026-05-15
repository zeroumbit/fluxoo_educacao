import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { AlmoxarifadoPageMobile } from './AlmoxarifadoPage.mobile'
import { AlmoxarifadoPageWeb } from './AlmoxarifadoPage.web'

export function AlmoxarifadoPage() {
  return (
    <AdaptiveView 
      web={<AlmoxarifadoPageWeb />} 
      mobile={<AlmoxarifadoPageMobile />} 
    />
  )
}
