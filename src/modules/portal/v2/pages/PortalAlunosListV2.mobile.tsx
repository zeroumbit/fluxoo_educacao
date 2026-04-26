import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, AlertCircle, Copy, ArrowRightLeft } from 'lucide-react';
import { usePortalContext } from '../../context';
import { NativeHeader } from '../components/NativeHeader';
import { ModalCopyConfirm } from '../components/ModalCopyConfirm';
import { ModalSolicitarTransferenciaPortal } from '../components/ModalSolicitarTransferenciaPortal';
import { Button } from '@/components/ui/button';

// Helper to get initials
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

export function PortalAlunosListV2Mobile() {
  const navigate = useNavigate();
  const { vinculos, selecionarAluno, isLoading } = usePortalContext();
  const [transferAluno, setTransferaluno] = useState<any>(null);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyId, setCopyId] = useState('');

  // Skeleton Loader (Padrão iOS/Android)
  if (isLoading) {
    return <AlunosSkeleton />
  }

  return (
    <div className="flex flex-col gap-4 pb-12">
      <ModalCopyConfirm isOpen={showCopyModal} onClose={() => setShowCopyModal(false)} value={copyId} />
      <NativeHeader title="Alunos" showBack onCopyId={(id) => { setCopyId(id); setShowCopyModal(true); }} />
      
      <div className="px-4 flex flex-col gap-4">

      {/* Lista de Cards - Touch targets otimizados */}
      <div className="flex flex-col gap-4 pb-4">
        {vinculos.map((v) => (
          <motion.div
            key={v.aluno?.id}
            whileTap={{ scale: 0.98 }}
            className="flex flex-col bg-white border border-slate-200 rounded-[24px] p-4 shadow-sm active:scale-98 transition-transform touch-manipulation w-full text-left"
          >
            <div 
              className="flex items-center gap-4 cursor-pointer"
              onClick={() => {
                selecionarAluno(v);
                navigate(`/portal/alunos/${v.aluno?.id}`);
              }}
            >
              <div
                className="w-16 h-16 rounded-[20px] bg-teal-500 text-white flex justify-center items-center text-[22px] font-semibold shadow-sm flex-shrink-0 overflow-hidden"
              >
                {v.aluno?.foto_url ? (
                  <img
                    src={v.aluno.foto_url}
                    alt={v.aluno.nome_completo}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  v.aluno?.nome_completo ? getInitials(v.aluno.nome_completo) : 'A'
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-[17px] text-slate-900 font-bold tracking-tight leading-tight mb-1 truncate">
                  {v.aluno?.nome_completo || 'Aluno'}
                </h2>
                <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
                  <span className="text-teal-600 font-medium">
                    {v.aluno?.turma?.nome || 'Sem turma'}
                  </span>
                  {v.aluno?.codigo_transferencia && (
                    <>
                      <span className="text-slate-300">•</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCopyId(v.aluno.codigo_transferencia);
                          setShowCopyModal(true);
                        }}
                        className="flex items-center gap-1 font-mono font-bold text-[10px] uppercase bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-md border border-amber-100 active:scale-95"
                      >
                         <Copy size={10} />
                         ID: {v.aluno.codigo_transferencia}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="w-10 h-10 rounded-[12px] bg-slate-50 flex items-center justify-center text-slate-400 ml-auto flex-shrink-0">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>

            {/* Ações Mobile */}
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-50">
              {v.aluno?.status === 'inativo' ? (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-[16px] bg-rose-50 text-rose-700 border border-rose-100 w-full">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span className="text-xs font-bold uppercase tracking-widest">Matrícula Inativa</span>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTransferaluno(v.aluno);
                  }}
                  className="h-12 rounded-[18px] border border-slate-100 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 transition-all w-full"
                >
                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                  Solicitar Transferência
                </Button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      </div>

      <ModalSolicitarTransferenciaPortal
        isOpen={!!transferAluno}
        onClose={() => setTransferaluno(null)}
        aluno={transferAluno}
      />
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
