import React from 'react';
import { AdaptiveView } from '@/components/adaptive/AdaptiveView';
import { PortalCobrancasPageV2 } from './PortalCobrancasPageV2';
import { PortalCobrancasPageV2Mobile } from './PortalCobrancasPageV2.mobile';

export function PortalFinanceiroV2() {
  return <AdaptiveView web={<PortalCobrancasPageV2 />} mobile={<PortalCobrancasPageV2Mobile />} />;
}
