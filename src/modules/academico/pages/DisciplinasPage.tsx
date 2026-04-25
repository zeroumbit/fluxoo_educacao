
import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { DisciplinasPageWeb } from './DisciplinasPage.web'
import { DisciplinasPageMobile } from './DisciplinasPage.mobile'

export function DisciplinasPage() {
  return (
    <AdaptiveView
      web={<DisciplinasPageWeb />}
      mobile={<DisciplinasPageMobile />}
    />
  )
}

export default DisciplinasPage
