import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { FrequenciaPageWeb } from './FrequenciaPage.web'
import { FrequenciaPageMobile } from './FrequenciaPage.mobile'

export function FrequenciaPage() {
  return (
    <AdaptiveView
      web={<FrequenciaPageWeb />}
      mobile={<FrequenciaPageMobile />}
    />
  )
}
