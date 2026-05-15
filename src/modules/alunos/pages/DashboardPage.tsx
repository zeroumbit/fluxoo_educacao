import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { DashboardPageMobile } from './DashboardPage.mobile'
import { DashboardPageWeb } from './DashboardPage.web'

export function DashboardPage() {
  return (
    <AdaptiveView 
      web={<DashboardPageWeb />} 
      mobile={<DashboardPageMobile />} 
    />
  )
}

export default DashboardPage
