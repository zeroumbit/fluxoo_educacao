import React from 'react';
import { AdaptiveView } from '@/components/adaptive/AdaptiveView';
import { PortalAvisosPageV2 } from './PortalAvisosPageV2';
import { PortalAvisosPageV2Mobile } from './PortalAvisosPageV2.mobile';

export function PortalAvisosV2() {
  return <AdaptiveView web={<PortalAvisosPageV2 />} mobile={<PortalAvisosPageV2Mobile />} />;
}
