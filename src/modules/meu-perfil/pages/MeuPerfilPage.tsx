import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { MeuPerfilPageMobile } from './MeuPerfilPage.mobile'
import { MeuPerfilPageWeb } from './MeuPerfilPage.web'

export function MeuPerfilPage() {
  return <AdaptiveView web={<MeuPerfilPageWeb />} mobile={<MeuPerfilPageMobile />} />
}
