import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { FuncionariosPageMobile } from './FuncionariosPage.mobile'
import { FuncionariosPage as FuncionariosPageWeb } from './FuncionariosPage.web'

export function FuncionariosPage() {
  return (
    <AdaptiveView 
      web={<FuncionariosPageWeb />} 
      mobile={<FuncionariosPageMobile />} 
    />
  )
}
