import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { FinanceiroRelatoriosPage as FinanceiroRelatoriosPageWeb } from './FinanceiroRelatoriosPage.web'
import { FinanceiroRelatoriosPageMobile } from './FinanceiroRelatoriosPage.mobile'

export function FinanceiroRelatoriosPage() {
  return (
    <AdaptiveView 
      web={<FinanceiroRelatoriosPageWeb />} 
      mobile={<FinanceiroRelatoriosPageMobile />} 
    />
  )
}
