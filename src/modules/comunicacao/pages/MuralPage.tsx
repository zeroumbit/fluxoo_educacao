import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { MuralPageMobile } from './MuralPage.mobile'
import { MuralPage as MuralPageWeb } from './MuralPage.web'

export function MuralPage() {
  return (
    <AdaptiveView
      web={<MuralPageWeb />}
      mobile={<MuralPageMobile />}
    />
  )
}
