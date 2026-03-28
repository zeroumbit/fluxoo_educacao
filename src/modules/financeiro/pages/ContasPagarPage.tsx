import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { ContasPagarPage as ContasPagarPageWeb } from './ContasPagarPage.web'
import { ContasPagarPageMobile } from './ContasPagarPage.mobile'

export function ContasPagarPage() {
  return (
    <AdaptiveView 
      web={<ContasPagarPageWeb />} 
      mobile={<ContasPagarPageMobile />} 
    />
  )
}
