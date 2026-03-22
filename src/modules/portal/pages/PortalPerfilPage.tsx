import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { PortalPerfilPage as PortalPerfilPageWeb } from './PortalPerfilPage.web'
import { PortalPerfilPageMobile } from './PortalPerfilPage.mobile'

export function PortalPerfilPage() {
  return <AdaptiveView web={<PortalPerfilPageWeb />} mobile={<PortalPerfilPageMobile />} />
}
