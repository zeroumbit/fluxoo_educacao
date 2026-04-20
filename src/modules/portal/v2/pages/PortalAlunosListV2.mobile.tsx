import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, AlertCircle, Copy } from 'lucide-react';
import { usePortalContext } from '../../context';
import { NativeHeader } from '../components/NativeHeader';
import { toast } from 'sonner';

// Helper to get initials
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

export function PortalAlunosListV2Mobile() {
  const navigate = useNavigate();
  const { vinculos, selecionarAluno, isLoading } = usePortalContext();

  // Skeleton Loader (Padrão iOS/Android)
  if (isLoading) {
    return <AlunosSkeleton />
  }

  return (
    <div className="flex flex-col gap-4 pb-12">
      <NativeHeader title="Alunos" showBack />
      
      <div className="px-4 flex flex-col gap-4">

      {/* Lista de Cards - Touch targets otimizados */}
      <div className="flex flex-col gap-4 pb-4">
        {vinculos.map((v) => (
          <motion.button
            key={v.aluno?.id}
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              selecionarAluno(v);
              navigate(`/portal/alunos/${v.aluno?.id}`);
            }}
            className="flex flex-col bg-white border border-slate-200 rounded-[20px] p-4 shadow-sm active:scale-98 transition-transform touch-manipulation w-full text-left"
            aria-label={`Ver perfil de ${v.aluno?.nome_completo || 'aluno'}`}
          >
            <div className="flex items-center gap-4">
              {/* Avatar - 64px padrão iOS Contact / Material Avatar Large */}
              <motion.div
                layoutId={`avatar-${v.aluno?.id}`}
                className="w-16 h-16 rounded-[20px] bg-teal-500 text-white flex justify-center items-center text-[22px] font-semibold shadow-sm flex-shrink-0 overflow-hidden"
                aria-hidden="true"
              >
                {v.aluno?.foto_url ? (
                  <img
                    src={v.aluno.foto_url}
                    alt={v.aluno.nome_completo}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.textContent = getInitials(v.aluno?.nome_completo || 'A');
                    }}
                  />
                ) : (
                  v.aluno?.nome_completo ? getInitials(v.aluno.nome_completo) : 'A'
                )}
              </motion.div>

              <div className="flex flex-col flex-1 min-w-0">
                {/* Title 3 - iOS Title 3 (17px Regular) / Material Title Medium (17px Regular) */}
                <h2 className="text-[17px] text-slate-900 tracking-tight leading-tight mb-1 truncate">
                  {v.aluno?.nome_completo || 'Aluno'}
                </h2>
                {/* Caption - iOS Caption 1 (13px Regular) / Material Label Medium (13px Medium) */}
                <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
                  <span className="text-teal-600 font-medium">
                    {v.aluno?.turma?.nome || 'Sem turma'}
                  </span>
                  {v.aluno?.codigo_transferencia && (
                    <>
                      <span className="text-slate-300" aria-hidden="true">•</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(v.aluno.codigo_transferencia);
                          toast.success('ID copiado!');
                        }}
                        className="flex items-center gap-1 font-mono font-bold text-[10px] uppercase bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-md border border-amber-100 active:scale-95 transition-transform"
                      >
                         <Copy size={10} />
                         ID: {v.aluno.codigo_transferencia}
                      </button>
                    </>
                  )}
                  <span className="text-slate-300" aria-hidden="true">•</span>
                  <span className="font-mono text-slate-400 text-[11px] uppercase">
                    {v.aluno?.status || 'Ativo'}
                  </span>
                </div>
              </div>

              {/* Chevron - iOS/Android navigation indicator */}
              <div
                className="w-10 h-10 rounded-[12px] bg-slate-50 flex items-center justify-center text-slate-400 ml-auto flex-shrink-0"
                aria-hidden="true"
              >
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>

            {/* Alertas/Pendências - iOS Banner / Material Alert */}
            {v.aluno?.status === 'inativo' && (
              <div
                className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100"
                role="alert"
              >
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-[12px] bg-rose-50 text-rose-700 border border-rose-200 w-full">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" aria-hidden="true" />
                  {/* Body - iOS Body (14px Regular) / Material Body Medium (14px Regular) */}
                  <span className="text-[14px] text-slate-900 leading-tight">
                    Matrícula Inativa ou Trancada
                  </span>
                </div>
              </div>
            )}
          </motion.button>
        ))}
      </div>
      </div>
    </div>
  );
}

// --- SKELETON ALUNOS ---
function AlunosSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-4 pt-safe mt-2 animate-pulse">
      <div className="space-y-4">
        <div className="h-10 w-56 bg-slate-200/60 rounded-xl" />
        <div className="h-4 w-72 bg-slate-100/80 rounded" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-slate-50 border border-slate-100 rounded-[28px]" />
        ))}
      </div>
    </div>
  )
}
