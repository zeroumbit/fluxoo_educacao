import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { PlanoPageMobile } from './PlanoPage.mobile'
import { PlanoPage as PlanoPageWeb } from './PlanoPage.web'

export function PlanoPage() {
  return (
    <AdaptiveView 
      web={<PlanoPageWeb />} 
      mobile={<PlanoPageMobile />} 
    />
  )
}
