import { useIsMobile } from '@/hooks/use-mobile';
import { PortalDocumentosPageV2Mobile } from './PortalDocumentosPageV2.mobile';
// import { PortalDocumentosPageV2Web } from './PortalDocumentosPageV2.web';

export default function PortalDocumentosPageV2() {
  const isMobile = useIsMobile();

  // Por enquanto, mobile native é o foco. O web pode usar o legado ou uma nova versão.
  if (isMobile) {
    return <PortalDocumentosPageV2Mobile />;
  }

  // Fallback para a versão mobile mesmo no desktop se não houver web v2 ainda, 
  // ou redirecionar para a versão legada se preferir.
  return <PortalDocumentosPageV2Mobile />;
}
