import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { NotasPageWeb } from './NotasPage.web'
import { NotasPageMobile } from './NotasPage.mobile'

export function NotasPage() {
  return (
    <AdaptiveView
      web={<NotasPageWeb />}
      mobile={<NotasPageMobile />}
    />
  )
}

export default NotasPage
