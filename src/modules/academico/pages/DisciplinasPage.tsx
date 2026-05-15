
import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { DisciplinasPageMobile } from './DisciplinasPage.mobile'
import { DisciplinasPageWeb } from './DisciplinasPage.web'

export function DisciplinasPage() {
  return (
    <AdaptiveView
      web={<DisciplinasPageWeb />}
      mobile={<DisciplinasPageMobile />}
    />
  )
}

export default DisciplinasPage
