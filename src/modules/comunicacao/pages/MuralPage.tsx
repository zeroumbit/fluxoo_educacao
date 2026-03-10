import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { MuralPage as MuralPageWeb } from './MuralPage.web'
import { MuralPageMobile } from './MuralPage.mobile'

export function MuralPage() {
  return (
    <AdaptiveView
      web={<MuralPageWeb />}
      mobile={<MuralPageMobile />}
    />
  )
}
