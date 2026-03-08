import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { FinanceiroPageWeb } from './FinanceiroPage.web'
import { FinanceiroPageMobile } from './FinanceiroPage.mobile'

export function FinanceiroPage() {
  return (
    <AdaptiveView 
      web={<FinanceiroPageWeb />} 
      mobile={<FinanceiroPageMobile />} 
    />
  )
}
