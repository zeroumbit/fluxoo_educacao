import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { FiliaisPageWeb } from './FiliaisPage.web'
import { FiliaisPageMobile } from './FiliaisPage.mobile'

export function FiliaisPage() {
  return (
    <AdaptiveView 
      web={<FiliaisPageWeb />} 
      mobile={<FiliaisPageMobile />} 
    />
  )
}
