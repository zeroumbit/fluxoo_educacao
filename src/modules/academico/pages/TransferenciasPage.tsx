import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { TransferenciasPageMobile } from './TransferenciasPage.mobile'
import { TransferenciasPageWeb } from './TransferenciasPage.web'

export function TransferenciasPage() {
  return (
    <AdaptiveView
      web={<TransferenciasPageWeb />}
      mobile={<TransferenciasPageMobile />}
    />
  )
}

export default TransferenciasPage
