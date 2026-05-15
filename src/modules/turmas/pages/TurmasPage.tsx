import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { TurmasPageMobile } from './TurmasPage.mobile'
import { TurmasPageWeb } from './TurmasPage.web'

export function TurmasPage() {
  return (
    <AdaptiveView
      web={<TurmasPageWeb />}
      mobile={<TurmasPageMobile />}
    />
  )
}
