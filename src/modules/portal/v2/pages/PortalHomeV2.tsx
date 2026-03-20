import React from 'react';
import { AdaptiveView } from '@/components/adaptive/AdaptiveView';
import { PortalHomeV2Mobile } from './PortalHomeV2.mobile';
import { PortalHomeV2Web } from './PortalHomeV2.web';

export function PortalHomeV2() {
  return <AdaptiveView web={<PortalHomeV2Web />} mobile={<PortalHomeV2Mobile />} />;
}
