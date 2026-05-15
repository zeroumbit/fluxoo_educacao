import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { AtividadesPageMobile } from './AtividadesPage.mobile'
import { AtividadesPage as AtividadesPageWeb } from './AtividadesPage.web'

export function AtividadesPage() {
  return (
    <AdaptiveView
      web={<AtividadesPageWeb />}
      mobile={<AtividadesPageMobile />}
    />
  )
}

export default AtividadesPage
