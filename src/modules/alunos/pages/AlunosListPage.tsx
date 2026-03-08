import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { AlunosListPageWeb } from './AlunosListPage.web'
import { AlunosListPageMobile } from './AlunosListPage.mobile'

export function AlunosListPage() {
  return (
    <AdaptiveView 
      web={<AlunosListPageWeb />} 
      mobile={<AlunosListPageMobile />} 
    />
  )
}
