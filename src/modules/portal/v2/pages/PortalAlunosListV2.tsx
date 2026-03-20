import React from 'react';
import { AdaptiveView } from '@/components/adaptive/AdaptiveView';
import { PortalAlunosListV2Mobile } from './PortalAlunosListV2.mobile';
import { PortalAlunosListV2Web } from './PortalAlunosListV2.web';

export function PortalAlunosListV2() {
  return <AdaptiveView web={<PortalAlunosListV2Web />} mobile={<PortalAlunosListV2Mobile />} />;
}
