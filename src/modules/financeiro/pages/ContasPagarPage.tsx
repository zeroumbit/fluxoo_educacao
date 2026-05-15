import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { ContasPagarPageMobile } from './ContasPagarPage.mobile'
import { ContasPagarPage as ContasPagarPageWeb } from './ContasPagarPage.web'

export function ContasPagarPage() {
  return (
    <AdaptiveView 
      web={<ContasPagarPageWeb />} 
      mobile={<ContasPagarPageMobile />} 
    />
  )
}
