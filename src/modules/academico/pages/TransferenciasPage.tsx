import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { TransferenciasPageWeb } from './TransferenciasPage.web'
import { TransferenciasPageMobile } from './TransferenciasPage.mobile'

export function TransferenciasPage() {
  return (
    <AdaptiveView
      web={<TransferenciasPageWeb />}
      mobile={<TransferenciasPageMobile />}
    />
  )
}

export default TransferenciasPage
