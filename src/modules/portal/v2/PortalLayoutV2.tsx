import { AdaptiveView } from '@/components/adaptive/AdaptiveView';
import { PortalProvider } from '@/modules/portal/context';
import { PortalLayoutV2Mobile } from './PortalLayoutV2.mobile';
import { PortalLayoutV2Web } from './PortalLayoutV2.web';

export function PortalLayoutV2() {
  return (
    <PortalProvider>
      <AdaptiveView web={<PortalLayoutV2Web />} mobile={<PortalLayoutV2Mobile />} />
    </PortalProvider>
  );
}
