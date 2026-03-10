import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { MatriculaFormPageWeb } from './MatriculaFormPage.web'
import { MatriculaFormPageMobile } from './MatriculaFormPage.mobile'

export function MatriculaFormPage() {
  return (
    <AdaptiveView
      web={<MatriculaFormPageWeb />}
      mobile={<MatriculaFormPageMobile />}
    />
  )
}
