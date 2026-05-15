import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { FilaVirtualAdminPageMobile } from './FilaVirtualAdminPage.mobile'
import { FilaVirtualAdminPage as FilaVirtualAdminPageWeb } from './FilaVirtualAdminPage.web'

export function FilaVirtualAdminPage() {
  return (
    <AdaptiveView
      web={<FilaVirtualAdminPageWeb />}
      mobile={<FilaVirtualAdminPageMobile />}
    />
  )
}
