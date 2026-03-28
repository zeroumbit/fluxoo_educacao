import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { AlmoxarifadoPageWeb } from './AlmoxarifadoPage.web'
import { AlmoxarifadoPageMobile } from './AlmoxarifadoPage.mobile'

export function AlmoxarifadoPage() {
  return (
    <AdaptiveView 
      web={<AlmoxarifadoPageWeb />} 
      mobile={<AlmoxarifadoPageMobile />} 
    />
  )
}
