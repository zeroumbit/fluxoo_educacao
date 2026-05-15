import { BottomSheet } from '@/components/mobile/BottomSheet';
import { BadgeGravidade } from '@/components/ui/BadgeGravidade';
import { Button } from '@/components/ui/button';
import {
Dialog,
DialogContent,
DialogDescription,
DialogHeader,
DialogTitle
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import {
AlertTriangle,
Archive,
Calendar,
CheckCircle2,
DollarSign,
Info,
Mail,
Phone,
RefreshCcw,
UserCircle,
Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { RadarAlunoComStatus } from '../AlertasContext';
import { useAlertas } from '../AlertasContext';
import { useState, useEffect } from 'react';

interface RadarEvasaoModalProps {
  aluno: RadarAlunoComStatus | null;
  isOpen: boolean;
  onClose: () => void;
  isProfessor?: boolean;
}

function RadarEvasaoDetailsContent({ aluno, onClose, isProfessor = false }: { aluno: RadarAlunoComStatus; onClose: () => void; isProfessor?: boolean }) {
  const navigate = useNavigate();
  const { mudarStatusAlerta } = useAlertas();
  const [responsavel, setResponsavel] = useState<{ telefone: string; email: string } | null>(null);

  useEffect(() => {
    async function buscarResponsavel() {
      if (!aluno.aluno_id) return;
      
      const { data } = await supabase
        .from('aluno_responsavel')
        .select('responsaveis(telefone, email)')
        .eq('aluno_id', aluno.aluno_id)
        .limit(1)
        .maybeSingle();
      
      if (data && (data as any).responsaveis) {
        setResponsavel((data as any).responsaveis);
      }
    }
    
    buscarResponsavel();
  }, [aluno.aluno_id]);

  const handleLigar = () => {
    if (responsavel?.telefone) {
      const telefone = responsavel.telefone.replace(/\D/g, '');
      window.open(`tel:${telefone}`, '_self');
    }
  };

  const handleEnviarEmail = () => {
    if (responsavel?.email) {
      window.open(`mailto:${responsavel.email}`, '_self');
    }
  };

  const nivel = aluno.gravidade === 'alta' ? 'CRÍTICO' : aluno.gravidade === 'media' ? 'ALERTA' : 'ATENÇÃO';

  const nivelBgColors = {
    CRÍTICO: 'bg-red-50 border-red-200',
    ALERTA: 'bg-amber-50 border-amber-200',
    ATENÇÃO: 'bg-yellow-50 border-yellow-200',
  };

  const nivelIcons = {
    CRÍTICO: AlertTriangle,
    ALERTA: AlertTriangle,
    ATENÇÃO: Info,
  };

  const nivelTextColor = {
    CRÍTICO: 'text-red-700',
    ALERTA: 'text-amber-700',
    ATENÇÃO: 'text-yellow-700',
  };

  const nivelTitleColor = {
    CRÍTICO: 'text-red-900',
    ALERTA: 'text-amber-900',
    ATENÇÃO: 'text-yellow-900',
  };

  const NivelIcon = nivelIcons[nivel];

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Aluno */}
      <div className="flex items-center gap-4 pb-4 border-b border-zinc-100">
        <div className="h-16 w-16 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
          <Users className="h-8 w-8 text-rose-600" />
        </div>
        <div className="flex-1">
          <h2 className="font-black text-2xl text-zinc-900 tracking-tight">{aluno.nome_completo}</h2>
          <div className="flex items-center gap-2 mt-1">
            <BadgeGravidade gravidade={aluno.gravidade} />
          </div>
        </div>
      </div>

      {/* Caixa de Alerta Explicativa */}
      <div className={`rounded-[1.5rem] p-5 border-2 ${nivelBgColors[nivel]}`}>
        <div className="flex items-start gap-3">
          <NivelIcon className={`h-6 w-6 shrink-0 ${nivel === 'CRÍTICO' ? 'text-red-600' : nivel === 'ALERTA' ? 'text-amber-600' : 'text-yellow-600'}`} />
          <div className="flex-1">
            <h3 className={`font-black text-lg mb-1 ${nivelTitleColor[nivel]}`}>
              Por que verificar este aluno?
            </h3>
            <p className={`text-sm font-medium ${nivelTextColor[nivel]}`}>
              Este aluno apresenta sinais de risco de evasão. É importante entrar em contato e entender a situação para evitar o abandono escolar.
            </p>
          </div>
        </div>
      </div>

      {/* Motivos do Risco */}
      <div>
        <h3 className="font-black text-lg text-zinc-900 tracking-tight mb-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-rose-500" />
          Motivos do Risco
        </h3>
        <div className="space-y-3">
          {aluno.faltas_consecutivas > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-100">
              <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-red-900 text-base">
                  {aluno.faltas_consecutivas} falta{aluno.faltas_consecutivas > 1 ? 's' : ''} consecutiva{aluno.faltas_consecutivas > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-red-600 font-medium mt-0.5">
                  Registradas nos últimos 21 dias
                </p>
              </div>
            </div>
          )}
          {aluno.cobrancas_atrasadas > 0 && !isProfessor && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-100">
              <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <DollarSign className="h-5 w-5 text-rose-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-rose-900 text-base">
                  {aluno.cobrancas_atrasadas} cobrança{aluno.cobrancas_atrasadas > 1 ? 's' : ''} em atraso
                </p>
                <p className="text-sm text-rose-600 font-medium mt-0.5">
                  Pendência{aluno.cobrancas_atrasadas > 1 ? 's' : ''} financeira{aluno.cobrancas_atrasadas > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-zinc-100">
        <Button
          variant="outline"
          onClick={() => {
            navigate(`/alunos/${aluno.aluno_id}`)
            onClose()
          }}
          className="h-12 w-12 rounded-xl border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-indigo-600"
          title="Ver Perfil Completo"
        >
          <UserCircle className="h-6 w-6" />
        </Button>

        <Button
          variant="outline"
          onClick={handleLigar}
          disabled={!responsavel?.telefone}
          className="h-12 w-12 rounded-xl border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
          title={responsavel?.telefone ? `Ligar para ${responsavel.telefone}` : "Telefone não disponível"}
        >
          <Phone className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          onClick={handleEnviarEmail}
          disabled={!responsavel?.email}
          className="h-12 w-12 rounded-xl border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
          title={responsavel?.email ? `Enviar e-mail para ${responsavel.email}` : "E-mail não disponível"}
        >
          <Mail className="h-5 w-5" />
        </Button>

        {aluno.status === 'ativo' ? (
          <Button
            variant="outline"
            onClick={() => {
              mudarStatusAlerta(aluno, 'tratado')
              onClose()
            }}
            className="h-12 w-12 rounded-xl border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
            title="Marcar como Tratado"
          >
            <CheckCircle2 className="h-6 w-6" />
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => {
              mudarStatusAlerta(aluno, 'ativo')
              onClose()
            }}
            className="h-12 w-12 rounded-xl border-blue-100 bg-blue-50 text-blue-600 hover:bg-blue-100"
            title="Reverter para Ativo"
          >
            <RefreshCcw className="h-5 w-5" />
          </Button>
        )}

        <Button
          variant="outline"
          onClick={() => {
            mudarStatusAlerta(aluno, aluno.status === 'arquivado' ? 'ativo' : 'arquivado')
            onClose()
          }}
          className={cn(
            "h-12 w-12 rounded-xl",
            aluno.status === 'arquivado' 
              ? "border-amber-100 bg-amber-50 text-amber-600 hover:bg-amber-100" 
              : "border-zinc-200 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600"
          )}
          title={aluno.status === 'arquivado' ? "Desarquivar" : "Arquivar Alerta"}
        >
          <Archive className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

export function RadarEvasaoModal({ aluno, isOpen, onClose }: RadarEvasaoModalProps) {
  return (
    <>
      <div className="md:hidden">
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Radar de Evasão" size="full">
          {aluno && <RadarEvasaoDetailsContent aluno={aluno} onClose={onClose} />}
        </BottomSheet>
      </div>
      <div className="hidden md:block">
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0 gap-0 rounded-[2rem] border-0 shadow-2xl">
            <DialogHeader className="sr-only">
              <DialogTitle>Radar de Evasão</DialogTitle>
              <DialogDescription>Detalhes do aluno em risco</DialogDescription>
            </DialogHeader>
            <div className="p-8">
              {aluno && <RadarEvasaoDetailsContent aluno={aluno} onClose={onClose} />}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
