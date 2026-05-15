import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { GatewayTenantConfigPageMobile } from './GatewayTenantConfigPage.mobile'
import { GatewayTenantConfigPageWeb } from './GatewayTenantConfigPage.web'

export function GatewayTenantConfigPage() {
  return (
    <AdaptiveView
      web={<GatewayTenantConfigPageWeb />}
      mobile={<GatewayTenantConfigPageMobile />}
    />
  )
}
