import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { EventosPage as EventosPageWeb } from './EventosPage.web'
import { EventosPageMobile } from './EventosPage.mobile'

export function EventosPage() {
  return (
    <AdaptiveView
      web={<EventosPageWeb />}
      mobile={<EventosPageMobile />}
    />
  )
}
