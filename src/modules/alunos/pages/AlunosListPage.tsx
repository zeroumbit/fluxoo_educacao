import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { AlunosListPageMobile } from './AlunosListPage.mobile'
import { AlunosListPageWeb } from './AlunosListPage.web'

export function AlunosListPage() {
  return (
    <AdaptiveView 
      web={<AlunosListPageWeb />} 
      mobile={<AlunosListPageMobile />} 
    />
  )
}

export default AlunosListPage
