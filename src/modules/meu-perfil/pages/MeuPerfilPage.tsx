import { MeuPerfilPageWeb } from './MeuPerfilPage.web'
import { MeuPerfilPageMobile } from './MeuPerfilPage.mobile'
import { AdaptiveView } from '@/components/adaptive/AdaptiveView'

export function MeuPerfilPage() {
  return <AdaptiveView web={<MeuPerfilPageWeb />} mobile={<MeuPerfilPageMobile />} />
}
