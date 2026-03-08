import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { DashboardPageWeb } from './DashboardPage.web'
import { DashboardPageMobile } from './DashboardPage.mobile'

export function DashboardPage() {
  return (
    <AdaptiveView 
      web={<DashboardPageWeb />} 
      mobile={<DashboardPageMobile />} 
    />
  )
}
