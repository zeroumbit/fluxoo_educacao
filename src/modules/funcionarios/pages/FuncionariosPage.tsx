import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { FuncionariosPage as FuncionariosPageWeb } from './FuncionariosPage.web'
import { FuncionariosPageMobile } from './FuncionariosPage.mobile'

export function FuncionariosPage() {
  return (
    <AdaptiveView 
      web={<FuncionariosPageWeb />} 
      mobile={<FuncionariosPageMobile />} 
    />
  )
}
