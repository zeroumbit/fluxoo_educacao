import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { NotasPageMobile } from './NotasPage.mobile'
import { NotasPageWeb } from './NotasPage.web'

export function NotasPage() {
  return (
    <AdaptiveView
      web={<NotasPageWeb />}
      mobile={<NotasPageMobile />}
    />
  )
}

export default NotasPage
