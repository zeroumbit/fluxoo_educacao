import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, AlertCircle } from 'lucide-react';
import { usePortalContext } from '../../context';

// Helper to get initials
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

export function PortalAlunosListV2Mobile() {
  const navigate = useNavigate();
  const { vinculos, selecionarAluno } = usePortalContext();

  return (
    <div className="flex flex-col gap-6 p-4 pt-6">
      <header className="flex flex-col mb-2">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Meus Filhos</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Acesse o perfil acadêmico de cada aluno.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        {vinculos.map((v) => (
          <motion.div
            key={v.aluno?.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              selecionarAluno(v);
              navigate(`/portal/alunos/${v.aluno?.id}`);
            }}
            className="flex flex-col bg-white border border-slate-100 rounded-[32px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative cursor-pointer active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-4">
              {/* Avatar da Criança */}
              <motion.div 
                layoutId={`avatar-${v.aluno?.id}`} 
                className="w-16 h-16 rounded-full bg-teal-500 text-white flex justify-center items-center text-2xl font-black shadow-lg shadow-teal-500/20 flex-shrink-0"
              >
                {v.aluno?.nome_completo ? getInitials(v.aluno.nome_completo) : 'A'}
              </motion.div>
              
              <div className="flex flex-col flex-1">
                <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-1">
                  {v.aluno?.nome_completo || 'Aluno'}
                </h2>
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-400">
                  <span className="text-teal-600 font-bold">{v.aluno?.turma?.nome || 'Turma não informada'}</span>
                  <span>•</span>
                  <span className="font-mono">STATUS: {v.aluno?.status || 'Ativo'}</span>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 ml-auto flex-shrink-0">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>

            {/* Pendências Reais (se existirem nos metadados do aluno ou dashboard) */}
            {v.aluno?.status === 'inativo' && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold w-full bg-rose-50 text-rose-700 border-rose-100">
                  <AlertCircle className="w-4 h-4" />
                  Matrícula Inativa ou Trancada
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
