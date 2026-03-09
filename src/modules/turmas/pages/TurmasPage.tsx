import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { TurmasPageWeb } from './TurmasPage.web'
import { TurmasPageMobile } from './TurmasPage.mobile'

export function TurmasPage() {
  return (
    <AdaptiveView
      web={<TurmasPageWeb />}
      mobile={<TurmasPageMobile />}
    />
  )
}
