import { usePortalContext } from '../context'

// Helper para obter as iniciais dos nomes dos alunos
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

export function SeletorAluno() {
  const { vinculos, alunoSelecionado, selecionarAluno } = usePortalContext()

  if (!vinculos || vinculos.length <= 1) return null

  return (
    <div className="flex items-center xl:justify-end gap-3 w-full">
      <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase whitespace-nowrap">
        Acessar Perfil:
      </span>
      <div className="flex items-center gap-2">
        {vinculos.map((v) => {
          const isSelected = alunoSelecionado?.id === v.aluno?.id;
          const nomeCompleto = v.aluno?.nome_social || v.aluno?.nome_completo || 'A';
          
          return (
            <div
              key={v.aluno?.id}
              onClick={() => selecionarAluno(v)}
              className={`w-10 h-10 rounded-full border flex items-center justify-center text-sm font-bold shadow-sm cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all relative group ${
                isSelected 
                  ? 'bg-teal-500 text-white border-teal-500 ring-2 ring-white ring-offset-2 ring-offset-slate-50' 
                  : 'bg-white text-slate-500 border-slate-200 hover:border-teal-500/50 hover:text-teal-600'
              }`}
            >
              {getInitials(nomeCompleto)}
              
              {/* Tooltip Premium */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-800 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg whitespace-nowrap z-50 shadow-lg pointer-events-none transition-all">
                {nomeCompleto}
                {v.aluno?.filial?.nome_unidade && (
                  <span className="text-[9px] text-slate-300 font-medium block mt-0.5 text-center">
                    {v.aluno.filial.nome_unidade}
                  </span>
                )}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
}
