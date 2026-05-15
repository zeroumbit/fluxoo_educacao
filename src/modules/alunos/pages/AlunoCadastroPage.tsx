import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { AlunoCadastroPageMobile } from './AlunoCadastroPage.mobile'
import { AlunoCadastroPage as AlunoCadastroPageWeb } from './AlunoCadastroPage.web'

export function AlunoCadastroPage() {
  return (
    <AdaptiveView
      web={<AlunoCadastroPageWeb />}
      mobile={<AlunoCadastroPageMobile />}
    />
  )
}
