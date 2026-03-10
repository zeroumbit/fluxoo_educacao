import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { FilaVirtualAdminPage as FilaVirtualAdminPageWeb } from './FilaVirtualAdminPage.web'
import { FilaVirtualAdminPageMobile } from './FilaVirtualAdminPage.mobile'

export function FilaVirtualAdminPage() {
  return (
    <AdaptiveView
      web={<FilaVirtualAdminPageWeb />}
      mobile={<FilaVirtualAdminPageMobile />}
    />
  )
}
