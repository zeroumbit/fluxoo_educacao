import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { SuperAdminDashboardPageWeb } from './SuperAdminDashboardPage.web'
import { SuperAdminDashboardPageMobile } from './SuperAdminDashboardPage.mobile'

export function SuperAdminDashboardPage() {
  return (
    <AdaptiveView 
      web={<SuperAdminDashboardPageWeb />} 
      mobile={<SuperAdminDashboardPageMobile />} 
    />
  )
}
