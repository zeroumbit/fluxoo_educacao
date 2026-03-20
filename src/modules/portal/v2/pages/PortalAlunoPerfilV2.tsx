import React from 'react';
import { AdaptiveView } from '@/components/adaptive/AdaptiveView';
import { PortalAlunoPerfilV2Mobile } from './PortalAlunoPerfilV2.mobile';
import { PortalAlunoPerfilV2Web } from './PortalAlunoPerfilV2.web';

export function PortalAlunoPerfilV2() {
  return <AdaptiveView web={<PortalAlunoPerfilV2Web />} mobile={<PortalAlunoPerfilV2Mobile />} />;
}
