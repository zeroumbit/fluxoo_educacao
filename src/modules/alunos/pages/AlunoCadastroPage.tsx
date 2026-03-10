import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { AlunoCadastroPage as AlunoCadastroPageWeb } from './AlunoCadastroPage.web'
import { AlunoCadastroPageMobile } from './AlunoCadastroPage.mobile'

export function AlunoCadastroPage() {
  return (
    <AdaptiveView
      web={<AlunoCadastroPageWeb />}
      mobile={<AlunoCadastroPageMobile />}
    />
  )
}
