import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { AlunoDetalhePageWeb } from './AlunoDetalhePage.web'
import { AlunoDetalhePageMobile } from './AlunoDetalhePage.mobile'

export function AlunoDetalhePage() {
  return (
    <AdaptiveView 
      web={<AlunoDetalhePageWeb />} 
      mobile={<AlunoDetalhePageMobile />} 
    />
  )
}
