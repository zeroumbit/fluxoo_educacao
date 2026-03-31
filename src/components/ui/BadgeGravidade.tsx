import React from 'react';
import { AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BadgeGravidadeProps {
  gravidade: 'alta' | 'media' | 'baixa'
  className?: string
}

export function BadgeGravidade({ gravidade, className }: BadgeGravidadeProps) {
  const styles = {
    alta: "bg-rose-100 text-rose-700 border-rose-200",
    media: "bg-amber-100 text-amber-700 border-amber-200",
    baixa: "bg-emerald-100 text-emerald-700 border-emerald-200"
  };
  const icon = {
    alta: <AlertOctagon size={12} className="mr-1" />,
    media: <AlertTriangle size={12} className="mr-1" />,
    baixa: <CheckCircle2 size={12} className="mr-1" />
  };
  const label = {
    alta: 'CRÍTICO',
    media: 'ALERTA',
    baixa: 'ATENÇÃO'
  };
  
  return (
    <span className={cn("flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap", styles[gravidade], className)}>
      {icon[gravidade]} {label[gravidade]}
    </span>
  );
}
