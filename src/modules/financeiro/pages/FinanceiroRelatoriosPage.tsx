import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { FinanceiroRelatoriosPageMobile } from './FinanceiroRelatoriosPage.mobile'
import { FinanceiroRelatoriosPage as FinanceiroRelatoriosPageWeb } from './FinanceiroRelatoriosPage.web'

export function FinanceiroRelatoriosPage() {
  return (
    <AdaptiveView 
      web={<FinanceiroRelatoriosPageWeb />} 
      mobile={<FinanceiroRelatoriosPageMobile />} 
    />
  )
}
