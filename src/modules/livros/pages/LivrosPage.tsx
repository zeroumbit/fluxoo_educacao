import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { LivrosPageMobile } from './LivrosPage.mobile'
import { LivrosPage as LivrosPageWeb } from './LivrosPage.web'

export function LivrosPage() {
  return (
    <AdaptiveView
      web={<LivrosPageWeb />}
      mobile={<LivrosPageMobile />}
    />
  )
}
