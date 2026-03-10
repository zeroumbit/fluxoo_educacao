import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { LivrosPage as LivrosPageWeb } from './LivrosPage.web'
import { LivrosPageMobile } from './LivrosPage.mobile'

export function LivrosPage() {
  return (
    <AdaptiveView
      web={<LivrosPageWeb />}
      mobile={<LivrosPageMobile />}
    />
  )
}
