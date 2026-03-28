import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { PlanoPage as PlanoPageWeb } from './PlanoPage.web'
import { PlanoPageMobile } from './PlanoPage.mobile'

export function PlanoPage() {
  return (
    <AdaptiveView 
      web={<PlanoPageWeb />} 
      mobile={<PlanoPageMobile />} 
    />
  )
}
