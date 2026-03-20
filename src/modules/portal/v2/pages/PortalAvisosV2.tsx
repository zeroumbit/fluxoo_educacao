import React from 'react';
import { AdaptiveView } from '@/components/adaptive/AdaptiveView';
import { PortalAvisosPageV2 } from './PortalAvisosPageV2';

export function PortalAvisosV2() {
  // Por enquanto, o design V2 é focado em mobile/PWA, 
  // mas funciona bem em desktop via AdaptiveView se necessário, 
  // ou podemos manter o original para web se preferir.
  // Como o usuário quer 100% WEB e 100% APP, vamos usar o V2 para ambos por enquanto 
  // e otimizar conforme necessário.
  return <AdaptiveView web={<PortalAvisosPageV2 />} mobile={<PortalAvisosPageV2 />} />;
}
