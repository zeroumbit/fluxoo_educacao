import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { GatewayTenantConfigPageWeb } from './GatewayTenantConfigPage.web'
import { GatewayTenantConfigPageMobile } from './GatewayTenantConfigPage.mobile'

export function GatewayTenantConfigPage() {
  return (
    <AdaptiveView
      web={<GatewayTenantConfigPageWeb />}
      mobile={<GatewayTenantConfigPageMobile />}
    />
  )
}
