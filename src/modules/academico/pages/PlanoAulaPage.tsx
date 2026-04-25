import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { PlanoAulaPage as PlanoAulaPageWeb } from './PlanoAulaPage.web'
import { PlanoAulaPageMobile } from './PlanoAulaPage.mobile'

export function PlanoAulaPage() {
  return (
    <AdaptiveView
      web={<PlanoAulaPageWeb />}
      mobile={<PlanoAulaPageMobile />}
    />
  )
}

export default PlanoAulaPage
