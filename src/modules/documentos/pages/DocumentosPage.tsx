import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { DocumentosPageMobile } from './DocumentosPage.mobile'
import { DocumentosPage as DocumentosPageWeb } from './DocumentosPage.web'

export function DocumentosPage() {
  return (
    <AdaptiveView
      web={<DocumentosPageWeb />}
      mobile={<DocumentosPageMobile />}
    />
  )
}
