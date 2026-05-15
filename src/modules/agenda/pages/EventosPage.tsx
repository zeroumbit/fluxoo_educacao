import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { EventosPageMobile } from './EventosPage.mobile'
import { EventosPage as EventosPageWeb } from './EventosPage.web'

export function EventosPage() {
  return (
    <AdaptiveView
      web={<EventosPageWeb />}
      mobile={<EventosPageMobile />}
    />
  )
}
