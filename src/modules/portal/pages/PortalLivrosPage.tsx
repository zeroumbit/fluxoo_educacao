import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { usePortalContext } from '../context'
import { Loader2, BookOpen, ExternalLink, Info, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

export function PortalLivrosPage() {
  const { alunoSelecionado, tenantId } = usePortalContext()
  const [busca, setBusca] = useState('')

  const { data: livros, isLoading } = useQuery({
    queryKey: ['portal', 'livros', tenantId, alunoSelecionado?.id],
    queryFn: async () => {
      // Como construímos a view vw_livros_disponiveis_aluno
      const { data, error } = await supabase
        .from('vw_livros_disponiveis_aluno' as any)
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('aluno_id', alunoSelecionado!.id)
        .order('ano_letivo', { ascending: false })
      
      if (error) throw error
      return data || []
    },
    enabled: !!tenantId && !!alunoSelecionado?.id,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    )
  }

  const livrosFiltrados = livros?.filter((l: any) => 
    l.titulo?.toLowerCase().includes(busca.toLowerCase()) || 
    l.disciplina?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-white p-8 md:p-12 rounded-[40px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8 items-center justify-between relative overflow-hidden">
        <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none">
           <BookOpen size={250} />
        </div>
        <div className="relative z-10 text-center md:text-left">
           <p className="text-[10px] font-black tracking-[0.2em] text-indigo-500 uppercase mb-2">Materiais Didáticos</p>
           <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter italic">Livros do Aluno</h2>
           <p className="text-slate-500 font-medium mt-2 max-w-md">Lista completa de materiais didáticos e referências exigidas para o ano letivo.</p>
        </div>
        <div className="relative z-10 w-full md:w-auto">
           <div className="relative max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input 
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por título ou disciplina..."
                className="pl-12 bg-slate-50 border-transparent rounded-[20px] h-14"
              />
           </div>
        </div>
      </div>

      {!livrosFiltrados || livrosFiltrados.length === 0 ? (
         <div className="bg-white rounded-[40px] p-16 text-center border border-slate-100 flex flex-col items-center justify-center space-y-4 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center text-slate-300 shadow-inner">
               <BookOpen size={32} />
            </div>
            <div>
               <h3 className="text-xl font-bold text-slate-800 tracking-tight">Nenhum livro encontrado</h3>
               <p className="text-slate-500 max-w-sm mt-1">Ainda não há materiais vinculados à turma deste aluno ou a busca não retornou resultados.</p>
            </div>
         </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {livrosFiltrados.map((livro: any, idx) => (
               <div key={idx} className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
                  <div className="flex justify-between items-start mb-4">
                     <Badge variant="outline" className="bg-indigo-50/50 text-indigo-600 border-indigo-100 font-bold uppercase tracking-widest text-[9px] py-1 px-3">
                        {livro.disciplina}
                     </Badge>
                     {livro.estado && (
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">
                           {livro.estado}
                        </span>
                     )}
                  </div>
                  
                  <h3 className="text-xl font-black text-slate-800 tracking-tighter leading-tight mb-1">{livro.titulo}</h3>
                  <p className="text-sm font-bold text-slate-500 mb-6 flex items-center gap-1.5">
                     <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                     Por {livro.autor}
                  </p>
                  
                  <div className="space-y-3 bg-slate-50/50 p-5 rounded-[24px]">
                     <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Editora</span>
                        <span className="text-sm font-bold text-slate-700">{livro.editora}</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">ISBN</span>
                        <span className="text-sm font-bold text-slate-700">{livro.isbn || 'N/I'}</span>
                     </div>
                  </div>

                  {livro.descricao && (
                     <div className="mt-4 flex items-start gap-2 text-slate-500">
                        <Info size={16} className="text-teal-500 shrink-0 mt-0.5" />
                        <p className="text-xs leading-relaxed">{livro.descricao}</p>
                     </div>
                  )}

                  {livro.link_referencia && (
                     <div className="mt-6 flex flex-col items-center">
                        <a 
                          href={livro.link_referencia} 
                          target="_blank" 
                          rel="noreferrer"
                          className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/25 transition-all active:scale-95"
                        >
                           Onde Encontrar <ExternalLink size={14} />
                        </a>
                     </div>
                  )}
               </div>
            ))}
         </div>
      )}
    </div>
  )
}
