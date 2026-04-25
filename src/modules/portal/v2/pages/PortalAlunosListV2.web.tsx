import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, AlertCircle, ArrowRightLeft } from 'lucide-react';
import { usePortalContext } from '../../context';
import { ModalSolicitarTransferenciaPortal } from '../components/ModalSolicitarTransferenciaPortal';

// Helper to get initials
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

export function PortalAlunosListV2Web() {
  const navigate = useNavigate();
  const { vinculos, selecionarAluno } = usePortalContext();
  const [transferAluno, setTransferaluno] = React.useState<any>(null);

  return (
    <div className="flex flex-col gap-8 w-full">
      <header className="flex flex-col border-b border-slate-200 pb-8 mt-2">
        <h1 className="text-4xl font-black text-slate-800 tracking-tight">Alunos</h1>
        <p className="text-base font-semibold text-slate-500 mt-2">
          Acesse o perfil acadêmico de cada aluno.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {vinculos.map((v: any) => (
          <div
            key={v.aluno?.id}
            onClick={() => {
              selecionarAluno(v);
              navigate(`/portal/alunos/${v.aluno?.id}`);
            }}
            className="flex flex-col bg-white border border-slate-100 rounded-[40px] p-8 shadow-[0_4px_30px_rgba(0,0,0,0.03)] cursor-pointer hover:border-teal-200 hover:-translate-y-2 transition-all hover:shadow-xl"
          >
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-teal-500 text-white flex justify-center items-center text-3xl font-black shadow-lg shadow-teal-500/20 flex-shrink-0 overflow-hidden">
                {v.aluno?.foto_url ? (
                  <img src={v.aluno.foto_url} alt={v.aluno.nome_completo} className="w-full h-full object-cover" />
                ) : (
                  v.aluno?.nome_completo ? getInitials(v.aluno.nome_completo) : 'A'
                )}
              </div>
              <div className="flex flex-col flex-1">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-2">
                  {v.aluno?.nome_completo || 'Aluno'}
                </h2>
                <div className="flex flex-col gap-1 text-sm font-semibold text-slate-400">
                  <span className="text-teal-600 font-bold">{v.aluno?.turma?.nome || 'Sem turma'}</span>
                  <span className="font-mono tracking-widest text-[11px] uppercase">STATUS: {v.aluno?.status || 'Ativo'}</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 ml-auto border border-slate-100 hover:bg-teal-50 hover:text-teal-600 transition-colors">
                <ChevronRight className="w-6 h-6" />
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-8 pt-6 border-t border-slate-100">
              {v.aluno?.status === 'inativo' ? (
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border text-sm font-bold w-full bg-rose-50 text-rose-700 border-rose-100">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  Matrícula Inativa
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTransferaluno(v.aluno);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-slate-100 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all w-full"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  Solicitar Transferência
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <ModalSolicitarTransferenciaPortal
        isOpen={!!transferAluno}
        onClose={() => setTransferaluno(null)}
        aluno={transferAluno}
      />
    </div>
  );
}
