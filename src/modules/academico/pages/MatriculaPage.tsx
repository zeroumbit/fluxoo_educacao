import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { MatriculaListPageWeb } from './MatriculaListPage.web'
import { MatriculasListPageMobile } from './MatriculasListPage.mobile'

export default function MatriculaPage() {
  return (
    <AdaptiveView
      web={<MatriculaListPageWeb />}
      mobile={<MatriculasListPageMobile />}
    />
  )
}
