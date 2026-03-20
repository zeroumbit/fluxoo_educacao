import React from 'react';
import { AdaptiveView } from '@/components/adaptive/AdaptiveView';
import { PortalLayoutV2Mobile } from './PortalLayoutV2.mobile';
import { PortalLayoutV2Web } from './PortalLayoutV2.web';
import { PortalProvider } from '@/modules/portal/context';

export function PortalLayoutV2() {
  return (
    <PortalProvider>
      <AdaptiveView web={<PortalLayoutV2Web />} mobile={<PortalLayoutV2Mobile />} />
    </PortalProvider>
  );
}
