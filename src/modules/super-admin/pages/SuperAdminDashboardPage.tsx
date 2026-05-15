import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { SuperAdminDashboardPageMobile } from './SuperAdminDashboardPage.mobile'
import { SuperAdminDashboardPageWeb } from './SuperAdminDashboardPage.web'

export function SuperAdminDashboardPage() {
  return (
    <AdaptiveView 
      web={<SuperAdminDashboardPageWeb />} 
      mobile={<SuperAdminDashboardPageMobile />} 
    />
  )
}
