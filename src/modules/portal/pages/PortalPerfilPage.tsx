import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { PortalPerfilPageMobile } from './PortalPerfilPage.mobile'
import { PortalPerfilPage as PortalPerfilPageWeb } from './PortalPerfilPage.web'

export function PortalPerfilPage() {
  return <AdaptiveView web={<PortalPerfilPageWeb />} mobile={<PortalPerfilPageMobile />} />
}
