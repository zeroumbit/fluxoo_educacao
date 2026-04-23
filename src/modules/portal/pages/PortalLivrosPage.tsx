import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { usePortalContext } from '../context'
import { BookOpen, ExternalLink, Info, Search, Maximize2, X, AlertTriangle, Bookmark, User, Building, Fingerprint, Calendar as CalendarIcon, Tag, Link as LinkIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { SeletorAluno } from '../components/SeletorAluno'
import { Button } from '@/components/ui/button'
import { BotaoVoltar } from '../components/BotaoVoltar'

// Helper de vibração
const vibrate = (ms: number | number[] = 20) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(ms);
  }
}

// --- SKELETON LOADING ---
const LivrosSkeleton = () => (
    <div className="space-y-8 animate-pulse px-1">
        <div className="h-8 w-40 bg-slate-100 rounded-lg" />
        <div className="h-32 bg-indigo-600 rounded-[40px]" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-[380px] bg-white border border-slate-50 rounded-[32px]" />
            ))}
        </div>
    </div>
)

export function PortalLivrosPage({ hideHeader = false }: { hideHeader?: boolean }) {
  const { alunoSelecionado, tenantId, isMultiAluno } = usePortalContext()
  const [busca, setBusca] = useState('')
  const [selectedItem, setSelectedItem] = useState<any | null>(null)

  const { data: itens, isLoading } = useQuery({
    queryKey: ['portal', 'itens-escolares', tenantId, alunoSelecionado?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_itens_escolares_aluno' as any)
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('aluno_id', alunoSelecionado!.id)
        .order('ano_letivo', { ascending: false })
      
      if (error) throw error
      return data || []
    },
    enabled: !!tenantId && !!alunoSelecionado?.id,
  })

  const handleBusca = (text: string) => {
    setBusca(text);
    if (text.length % 3 === 0) vibrate(5);
  }

  if (isLoading) return <LivrosSkeleton />

  if (!alunoSelecionado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 space-y-6">
        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
            <BookOpen className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-800 tracking-tighter italic uppercase">Contexto Não Definido</h2>
          <p className="text-sm text-slate-400 font-medium">Selecione um aluno para acessar o acervo de livros.</p>
        </div>
      </div>
    )
  }

  const itensFiltrados = itens?.filter((l: any) => 
    l.titulo?.toLowerCase().includes(busca.toLowerCase()) || 
    l.disciplina?.toLowerCase().includes(busca.toLowerCase()) ||
    l.tipo?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-700 font-sans">

      {/* 1. Header & Filtro */}
      {!hideHeader && (
        <div className="flex flex-col gap-4 px-1">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <BotaoVoltar />
              <h2 className="text-3xl font-black tracking-tighter text-slate-800 italic uppercase">Livros e Materiais</h2>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Acervo de Materiais</p>
            </div>
          </div>
          {isMultiAluno && <SeletorAluno />}
        </div>
      )}

      {/* 2. Hero Section */}
      <div className="bg-indigo-600 p-8 md:p-10 rounded-[40px] shadow-xl relative overflow-hidden flex flex-col md:flex-row gap-6 items-center justify-between text-white mx-1 border border-indigo-500 shadow-indigo-200">
        <div className="absolute -top-16 -right-16 opacity-10 pointer-events-none rotate-12 transition-transform duration-1000">
           <BookOpen size={280} />
        </div>

        <div className="relative z-10 space-y-3 text-center md:text-left">
           <div className="w-12 h-12 rounded-[20px] bg-white/10 backdrop-blur-md flex items-center justify-center mb-4 mx-auto md:mx-0 border border-white/20">
              <BookOpen size={24} />
           </div>
           <h2 className="text-3xl md:text-4xl font-black tracking-tighter italic leading-none uppercase">Acervo Digital</h2>
           <p className="text-indigo-100 font-bold italic opacity-80 max-w-sm text-sm leading-relaxed">
             Centralize o acesso aos seus materiais didáticos e livros virtuais.
           </p>
        </div>

        <div className="relative z-10 w-full md:w-auto min-w-[280px]">
           <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-300 group-focus-within:text-white transition-colors" />
              <Input
                value={busca}
                onChange={(e) => handleBusca(e.target.value)}
                placeholder="Buscar por título ou disciplina..."
                className="pl-14 bg-white/10 border-white/20 text-white placeholder:text-indigo-200/50 rounded-[24px] h-12 shadow-inner focus:bg-white/20 transition-all border-2 text-sm font-bold italic focus:ring-0 focus:border-white/40"
              />
           </div>
        </div>
      </div>

      {/* 3. Grid de Livros */}
      {!itensFiltrados || itensFiltrados.length === 0 ? (
         <div className="bg-slate-50/50 rounded-[56px] border-4 border-dashed border-slate-100 p-16 text-center flex flex-col items-center justify-center space-y-4 shadow-sm mx-1">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-100 shadow-sm transition-transform duration-700 hover:rotate-12">
               <AlertTriangle size={32} />
            </div>
            <div className="space-y-1">
               <h3 className="text-xl font-black text-slate-800 italic uppercase">Sem Correspondências</h3>
               <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto italic leading-relaxed px-4">Não encontramos livros ou materiais vinculados para este termo de busca.</p>
            </div>
         </div>
      ) : (
         <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-1">
            <AnimatePresence mode="popLayout">
                {itensFiltrados.map((item: any, idx: number) => (
                   <motion.div
                     layout
                     key={item.id || idx}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: idx * 0.05 }}
                     onClick={() => {
                        vibrate(15);
                        setSelectedItem(item);
                     }}
                     className="bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-[0_20px_40px_rgba(79,70,229,0.08)] transition-all duration-500 overflow-hidden flex flex-col group cursor-pointer h-[380px]"
                   >
                      {/* Badge de Tipo */}
                      <div className="absolute top-3 left-3 z-10">
                        <Badge className={cn(
                          "border-0 font-black uppercase tracking-[0.15em] text-[8px] py-1 px-3 shadow-lg rounded-full",
                          item.tipo === 'livro' ? "bg-indigo-600 text-white" : "bg-emerald-500 text-white"
                        )}>
                          {item.tipo === 'livro' ? 'Livro' : 'Material'}
                        </Badge>
                      </div>

                      {/* Header Visual */}
                      <div className="relative h-[128px] bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-100">
                        {item.capa_url ? (
                          <img src={item.capa_url} alt={item.titulo} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" />
                        ) : (
                          <div className="flex flex-col items-center text-slate-200">
                             {item.tipo === 'livro' ? (
                               <BookOpen size={48} className="mb-2 opacity-5 rotate-12 transition-transform group-hover:rotate-0 duration-700" />
                             ) : (
                               <div className="mb-2 opacity-5 rotate-12 transition-transform group-hover:rotate-0 duration-700">
                                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                               </div>
                             )}
                             <span className="text-[9px] font-black uppercase tracking-[0.4em] italic">Detalhes Disponíveis</span>
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                           <Badge className="bg-white/90 backdrop-blur-md text-slate-800 border-0 font-black uppercase tracking-[0.15em] text-[8px] py-1.5 px-4 shadow-lg rounded-full">
                                {item.disciplina || (item.tipo === 'material' ? 'Material' : "Geral")}
                           </Badge>
                        </div>
                      </div>

                      {/* Conteúdo */}
                      <div className="p-4 space-y-2 flex-1 flex flex-col overflow-hidden">
                        <div className="flex items-center gap-2">
                           <div className={cn("h-1 w-8 rounded-full", item.tipo === 'livro' ? "bg-indigo-500" : "bg-emerald-500")} />
                           <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] italic truncate">
                             {item.tipo === 'livro' ? (item.editora || 'Edição Especial') : (item.categoria || 'Categoria Especial')}
                           </span>
                        </div>

                        <h3 className="text-base font-black text-slate-800 tracking-tight leading-tight uppercase italic group-hover:text-indigo-600 transition-colors line-clamp-2 min-h-[40px]">{item.titulo}</h3>

                        <p className="text-[10px] font-bold text-slate-400 italic truncate">
                          {item.tipo === 'livro' ? `Por ${item.autor || 'Autor Não Informado'}` : `${item.autor || 'Marca Sugerida'}`}
                        </p>

                        <div className="grid grid-cols-2 gap-2 bg-slate-50/50 p-3 rounded-[16px] border border-slate-100">
                            <div className="space-y-0.5">
                               <p className="text-[7px] font-black text-slate-300 uppercase tracking-[0.2em]">
                                 {item.tipo === 'livro' ? 'ISBN' : 'Ref'}
                               </p>
                               <p className="text-[9px] font-black text-slate-600 font-mono italic truncate">{item.isbn || '---'}</p>
                            </div>
                            <div className="space-y-0.5 text-right">
                               <p className="text-[7px] font-black text-slate-300 uppercase tracking-[0.2em]">Ano</p>
                               <p className="text-[9px] font-black text-slate-600 italic">{item.ano_letivo || '---'}</p>
                            </div>
                        </div>

                        {item.descricao && (
                            <div className="flex items-start gap-2 p-2 bg-slate-50/30 rounded-[12px] border border-slate-100 overflow-hidden">
                              <Info size={12} className="text-indigo-400 shrink-0 mt-0.5" />
                              <p className="text-[9px] leading-tight font-bold text-slate-500 italic line-clamp-2">{item.descricao}</p>
                            </div>
                        )}

                        <div className="mt-auto pt-2 flex gap-2">
                           <Button
                              className={cn(
                                "w-full h-8 rounded-[16px] font-black text-[8px] uppercase tracking-widest transition-all active:scale-95 group/btn shadow-none border-0",
                                item.tipo === 'livro'
                                  ? "bg-indigo-100 text-indigo-600 hover:bg-slate-900 hover:text-white"
                                  : "bg-emerald-100 text-emerald-600 hover:bg-slate-900 hover:text-white"
                              )}
                           >
                              VER DETALHES COMPLETOS <Info size={12} className="ml-1.5" />
                           </Button>
                        </div>
                      </div>
                   </motion.div>
                ))}
            </AnimatePresence>
         </div>
      )}

      {/* 4. Modal de Detalhes - Versão Mobile Nativa (Full Screen) */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] bg-white md:hidden flex flex-col"
          >
            {/* Header Nativo */}
            <header className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white sticky top-0 z-20 pt-safe">
              <button
                onClick={() => setSelectedItem(null)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 active:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
              <h2 className="text-[15px] font-black text-slate-800 uppercase tracking-widest">Detalhes do Material</h2>
              <div className="w-10" />
            </header>

            {/* Conteúdo Scrollable */}
            <div className="flex-1 overflow-y-auto">
               <div className={cn(
                  "w-full aspect-[4/3] flex items-center justify-center p-8",
                  selectedItem.tipo === 'livro' ? "bg-indigo-600" : "bg-emerald-600"
                )}>
                  <div className="w-full max-w-[180px] aspect-[3/4] rounded-2xl shadow-2xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20">
                    {selectedItem.capa_url ? (
                      <img src={selectedItem.capa_url} alt={selectedItem.titulo} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white/40 italic">
                        <BookOpen size={48} className="mb-2 opacity-20" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-center px-4">Imagem Indisponível</span>
                      </div>
                    )}
                  </div>
               </div>

               <div className="p-6 space-y-8">
                  <div className="space-y-3">
                    <Badge className={cn(
                      "px-3 py-1 text-[10px] font-black uppercase tracking-widest border-none",
                      selectedItem.tipo === 'livro' ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
                    )}>
                      {selectedItem.disciplina || 'Geral'}
                    </Badge>
                    <h2 className="text-2xl font-black text-slate-800 leading-tight italic uppercase tracking-tighter">
                      {selectedItem.titulo}
                    </h2>
                    <div className="flex items-center gap-2 text-slate-400 font-bold italic text-xs">
                      <User size={14} />
                      <span>{selectedItem.autor || 'Não Informado'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[8px] uppercase font-black text-slate-400 tracking-widest mb-1">{selectedItem.tipo === 'livro' ? 'Editora' : 'Categoria'}</p>
                        <p className="text-xs font-black text-slate-700 italic uppercase truncate">
                          {selectedItem.tipo === 'livro' ? (selectedItem.editora || 'N/I') : (selectedItem.categoria || 'N/I')}
                        </p>
                     </div>
                     <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[8px] uppercase font-black text-slate-400 tracking-widest mb-1">{selectedItem.tipo === 'livro' ? 'ISBN' : 'Referência'}</p>
                        <p className="text-xs font-black text-slate-700 font-mono italic truncate">
                          {selectedItem.isbn || 'N/A'}
                        </p>
                     </div>
                  </div>

                  {selectedItem.descricao && (
                    <div className="space-y-3">
                      <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest">Sobre o Material</p>
                      <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 italic font-bold text-sm text-slate-600 leading-relaxed">
                        "{selectedItem.descricao}"
                      </div>
                    </div>
                  )}

                  <div className="h-20" /> {/* Spacer para o footer fixo */}
               </div>
            </div>

            {/* Footer Fixo Mobile */}
            <div className="p-4 bg-white border-t border-slate-100 sticky bottom-0 z-20 pb-safe">
               {selectedItem.link_referencia ? (
                  <Button 
                    asChild
                    className={cn(
                      "w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest gap-3 shadow-lg",
                      selectedItem.tipo === 'livro' ? "bg-indigo-600 text-white" : "bg-emerald-600 text-white"
                    )}
                  >
                    <a href={selectedItem.link_referencia} target="_blank" rel="noreferrer">
                      <LinkIcon size={18} />
                      ACESSAR CONTEÚDO
                    </a>
                  </Button>
                ) : (
                  <div className="w-full h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center gap-3 font-black text-[9px] uppercase tracking-widest border border-dashed border-slate-200">
                    <AlertTriangle size={16} />
                    INDISPONÍVEL PARA DOWNLOAD
                  </div>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Modal de Detalhes - Versão Web (Dialog) */}
      <Dialog open={!!selectedItem && window.innerWidth >= 768} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-none rounded-[2.5rem] shadow-2xl bg-white focus-visible:ring-0 hidden md:block">
          {selectedItem && (
            <div className="flex flex-row h-full font-sans">
              
              {/* Lado Esquerdo: Capa */}
              <div className={cn(
                "w-[40%] p-12 flex flex-col items-center justify-center relative min-h-[500px]",
                selectedItem.tipo === 'livro' ? "bg-indigo-600" : "bg-emerald-600"
              )}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="relative z-10 w-full max-w-[240px] aspect-[3/4] rounded-2xl shadow-2xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20"
                >
                  {selectedItem.capa_url ? (
                    <img src={selectedItem.capa_url} alt={selectedItem.titulo} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/40 italic">
                      <BookOpen size={64} className="mb-4 opacity-20" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Sem Imagem</span>
                    </div>
                  )}
                </motion.div>

                <div className="mt-8 flex flex-col items-center gap-2 relative z-10">
                   <Badge className="bg-white text-slate-900 border-none px-4 py-1.5 uppercase text-[10px] font-black tracking-[0.2em] shadow-lg rounded-full">
                      {selectedItem.tipo || 'Material'}
                   </Badge>
                   <div className="h-1 w-12 bg-white/30 rounded-full mt-2" />
                </div>
              </div>

              {/* Lado Direito: Detalhes */}
              <div className="flex-1 p-12 bg-white flex flex-col">
                <div className="mb-8 space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className={cn(
                      "px-3 py-1 text-[10px] font-black uppercase tracking-widest border-none shadow-none",
                      selectedItem.tipo === 'livro' ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
                    )}>
                      {selectedItem.disciplina || 'Geral'}
                    </Badge>
                    <div className="h-1 w-1 bg-slate-200 rounded-full" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ano Letivo {selectedItem.ano_letivo || '---'}</span>
                  </div>

                  <h2 className="text-3xl font-black text-slate-800 tracking-tighter leading-none italic uppercase">
                    {selectedItem.titulo}
                  </h2>
                  
                  <div className="flex items-center gap-3 text-slate-500 font-bold italic">
                    <User size={16} className="text-slate-300" />
                    <span className="text-sm">
                      {selectedItem.tipo === 'livro' ? `Autor: ${selectedItem.autor || 'Não Informado'}` : `Marca: ${selectedItem.autor || 'Não Informado'}`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-10">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                        <Building size={18} className="text-slate-400" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest">{selectedItem.tipo === 'livro' ? 'Editora' : 'Categoria'}</p>
                        <p className="text-sm font-black text-slate-700 italic uppercase">
                          {selectedItem.tipo === 'livro' ? (selectedItem.editora || 'Não Informada') : (selectedItem.categoria || 'Não Categorizado')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                        <Fingerprint size={18} className="text-slate-400" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest">{selectedItem.tipo === 'livro' ? 'Código ISBN' : 'Referência'}</p>
                        <p className="text-sm font-black text-slate-700 font-mono italic">
                          {selectedItem.isbn || 'Código Não Cadastrado'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                        <Tag size={18} className="text-slate-400" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest">Matéria / Disciplina</p>
                        <p className="text-sm font-black text-slate-700 italic uppercase">
                          {selectedItem.disciplina || 'Uso Geral'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                        <CalendarIcon size={18} className="text-slate-400" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest">Ano de Adoção</p>
                        <p className="text-sm font-black text-slate-700 italic">
                          {selectedItem.ano_letivo || 'Não Definido'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedItem.descricao && (
                  <div className="space-y-3 mb-10">
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-4 bg-slate-200 rounded-full" />
                      <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest">Descrição e Observações</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      <p className="text-sm text-slate-600 leading-relaxed font-bold italic">
                        "{selectedItem.descricao}"
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-auto flex flex-row gap-4">
                  {selectedItem.link_referencia ? (
                    <Button 
                      asChild
                      className={cn(
                        "flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all gap-3",
                        selectedItem.tipo === 'livro' ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      )}
                    >
                      <a href={selectedItem.link_referencia} target="_blank" rel="noreferrer">
                        <LinkIcon size={18} />
                        ACESSAR CONTEÚDO DIGITAL
                      </a>
                    </Button>
                  ) : (
                    <div className="flex-1 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest border-2 border-dashed border-slate-200">
                      <AlertTriangle size={18} />
                      MATERIAL DISPONÍVEL APENAS NA ESCOLA
                    </div>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    className="h-14 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600" 
                    onClick={() => setSelectedItem(null)}
                  >
                    FECHAR
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
