import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { PlanoAulaPageMobile } from './PlanoAulaPage.mobile'
import { PlanoAulaPage as PlanoAulaPageWeb } from './PlanoAulaPage.web'

export function PlanoAulaPage() {
  return (
    <AdaptiveView
      web={<PlanoAulaPageWeb />}
      mobile={<PlanoAulaPageMobile />}
    />
  )
}

export default PlanoAulaPage
