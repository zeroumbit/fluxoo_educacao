import { useIsMobile } from '@/hooks/use-mobile'
import { PortalTransferenciasV2Mobile } from './PortalTransferenciasV2.mobile'

export default function PortalTransferenciasV2() {
  const isMobile = useIsMobile()
  if (isMobile) {
    return <PortalTransferenciasV2Mobile />
  }
  return <PortalTransferenciasV2Mobile />
}
