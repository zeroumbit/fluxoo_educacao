import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { FrequenciaPageMobile } from './FrequenciaPage.mobile'
import { FrequenciaPageWeb } from './FrequenciaPage.web'

export function FrequenciaPage() {
  return (
    <AdaptiveView
      web={<FrequenciaPageWeb />}
      mobile={<FrequenciaPageMobile />}
    />
  )
}
