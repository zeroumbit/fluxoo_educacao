import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { FinanceiroPageMobile } from './FinanceiroPage.mobile'
import { FinanceiroPageWeb } from './FinanceiroPage.web'

export function FinanceiroPage() {
  return (
    <AdaptiveView 
      web={<FinanceiroPageWeb />} 
      mobile={<FinanceiroPageMobile />} 
    />
  )
}
