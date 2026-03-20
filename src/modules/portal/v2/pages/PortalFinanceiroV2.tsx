import React from 'react';
import { AdaptiveView } from '@/components/adaptive/AdaptiveView';
import { PortalCobrancasPageV2 } from './PortalCobrancasPageV2';

export function PortalFinanceiroV2() {
  return <AdaptiveView web={<PortalCobrancasPageV2 />} mobile={<PortalCobrancasPageV2 />} />;
}
