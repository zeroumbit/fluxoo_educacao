import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { MatriculaFormPageMobile } from './MatriculaFormPage.mobile'
import { MatriculaFormPageWeb } from './MatriculaFormPage.web'

export function MatriculaFormPage() {
  return (
    <AdaptiveView
      web={<MatriculaFormPageWeb />}
      mobile={<MatriculaFormPageMobile />}
    />
  )
}
