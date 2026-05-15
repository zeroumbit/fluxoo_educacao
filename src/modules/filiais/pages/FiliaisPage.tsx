import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { FiliaisPageMobile } from './FiliaisPage.mobile'
import { FiliaisPageWeb } from './FiliaisPage.web'

export function FiliaisPage() {
  return (
    <AdaptiveView 
      web={<FiliaisPageWeb />} 
      mobile={<FiliaisPageMobile />} 
    />
  )
}
