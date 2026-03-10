import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { DocumentosPage as DocumentosPageWeb } from './DocumentosPage.web'
import { DocumentosPageMobile } from './DocumentosPage.mobile'

export function DocumentosPage() {
  return (
    <AdaptiveView
      web={<DocumentosPageWeb />}
      mobile={<DocumentosPageMobile />}
    />
  )
}
