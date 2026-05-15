import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { AlunoDetalhePageMobile } from './AlunoDetalhePage.mobile'
import { AlunoDetalhePageWeb } from './AlunoDetalhePage.web'

export function AlunoDetalhePage() {
  return (
    <AdaptiveView 
      web={<AlunoDetalhePageWeb />} 
      mobile={<AlunoDetalhePageMobile />} 
    />
  )
}
