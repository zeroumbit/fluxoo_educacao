import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { AtividadesPage as AtividadesPageWeb } from './AtividadesPage.web'
import { AtividadesPageMobile } from './AtividadesPage.mobile'

export function AtividadesPage() {
  return (
    <AdaptiveView
      web={<AtividadesPageWeb />}
      mobile={<AtividadesPageMobile />}
    />
  )
}
