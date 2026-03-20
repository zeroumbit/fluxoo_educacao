import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { usePortalContext } from '../context'
import { BookOpen, ExternalLink, Info, Search, Maximize2, X, AlertTriangle } from 'lucide-react'
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
    <div className="space-y-12 animate-pulse px-1">
        <div className="h-10 w-48 bg-slate-100 rounded-lg" />
        <div className="h-44 bg-indigo-600 rounded-[48px]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-[450px] bg-white border border-slate-50 rounded-[48px]" />
            ))}
        </div>
    </div>
)

export function PortalLivrosPage({ hideHeader = false }: { hideHeader?: boolean }) {
  const { alunoSelecionado, tenantId, isMultiAluno } = usePortalContext()
  const [busca, setBusca] = useState('')
  const [capaAberta, setCapaAberta] = useState<string | null>(null)

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

  const handleVerCapa = (url: string) => {
    vibrate(15);
    setCapaAberta(url);
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
    <div className="space-y-12 pb-20 animate-in fade-in duration-700 font-sans">

      {/* 1. Header & Filtro */}
      {!hideHeader && (
        <div className="flex flex-col gap-6 px-1">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <BotaoVoltar />
              <h2 className="text-4xl font-black tracking-tighter text-slate-800 italic uppercase">Biblioteca</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Acervo de Materiais</p>
            </div>
          </div>
          {isMultiAluno && <SeletorAluno />}
        </div>
      )}

      {/* 2. Hero Section - Modern Search Gradient Shell */}
      <div className="bg-indigo-600 p-12 md:p-16 rounded-[56px] shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-10 items-center justify-between text-white mx-1 border border-indigo-500 shadow-indigo-200">
        <div className="absolute -top-24 -right-24 opacity-10 pointer-events-none rotate-12 transition-transform duration-1000 group-hover:rotate-0">
           <BookOpen size={450} />
        </div>
        
        <div className="relative z-10 space-y-4 text-center md:text-left">
           <div className="w-16 h-16 rounded-[24px] bg-white/10 backdrop-blur-md flex items-center justify-center mb-6 mx-auto md:mx-0 border border-white/20">
              <BookOpen size={32} />
           </div>
           <h2 className="text-5xl font-black tracking-tighter italic leading-none uppercase">Acervo Digital</h2>
           <p className="text-indigo-100 font-bold italic opacity-80 max-w-sm text-base leading-relaxed">
             Centralize o acesso aos seus materiais didáticos, referências recomendadas e livros virtuais.
           </p>
        </div>

        <div className="relative z-10 w-full md:w-auto min-w-[320px]">
           <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-indigo-300 group-focus-within:text-white transition-colors" />
              <Input 
                value={busca}
                onChange={(e) => handleBusca(e.target.value)}
                placeholder="Buscar por título ou disciplina..."
                className="pl-16 bg-white/10 border-white/20 text-white placeholder:text-indigo-200/50 rounded-[28px] h-16 shadow-inner focus:bg-white/20 transition-all border-2 font-bold italic focus:ring-0 focus:border-white/40"
              />
           </div>
        </div>
      </div>

      {/* 3. Grid de Livros com AnimatePresence */}
      {!itensFiltrados || itensFiltrados.length === 0 ? (
         <div className="bg-slate-50/50 rounded-[56px] border-4 border-dashed border-slate-100 p-24 text-center flex flex-col items-center justify-center space-y-8 shadow-sm mx-1">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-slate-100 shadow-sm transition-transform duration-700 hover:rotate-12">
               <AlertTriangle size={48} />
            </div>
            <div className="space-y-2">
               <h3 className="text-2xl font-black text-slate-800 italic uppercase">Sem Correspondências</h3>
               <p className="text-sm text-slate-400 font-medium max-w-xs mx-auto italic leading-relaxed px-4">Não encontramos livros ou materiais vinculados para este termo de busca ou para este perfil no momento.</p>
            </div>
         </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 px-1">
            <AnimatePresence mode="popLayout">
                {itensFiltrados.map((item: any, idx: number) => (
                   <motion.div 
                     layout
                     key={item.id || idx} 
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: idx * 0.05 }}
                     className="bg-white rounded-[48px] border border-slate-50 shadow-sm hover:shadow-[0_40px_80px_rgba(79,70,229,0.12)] transition-all duration-700 overflow-hidden flex flex-col group cursor-pointer"
                   >
                      {/* Badge de Tipo */}
                      <div className="absolute top-8 left-8 z-10">
                        <Badge className={cn(
                          "border-0 font-black uppercase tracking-[0.15em] text-[9px] py-1.5 px-4 shadow-xl rounded-full",
                          item.tipo === 'livro' ? "bg-indigo-600 text-white" : "bg-emerald-500 text-white"
                        )}>
                          {item.tipo === 'livro' ? 'Livro' : 'Material'}
                        </Badge>
                      </div>

                      {/* Header Visual */}
                      <div 
                        className="relative aspect-[16/11] bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-50 group/image"
                        onClick={() => item.capa_url && handleVerCapa(item.capa_url)}
                      >
                        {item.capa_url ? (
                          <>
                            <img src={item.capa_url} alt={item.titulo} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-1000" />
                            <div className="absolute inset-0 bg-indigo-950/0 group-hover/image:bg-indigo-950/40 transition-all duration-500 flex items-center justify-center backdrop-blur-0 group-hover/image:backdrop-blur-sm">
                              <div className="h-16 w-16 rounded-full bg-white/20 border border-white/30 backdrop-blur-md flex items-center justify-center text-white scale-50 opacity-0 group-hover/image:scale-100 group-hover/image:opacity-100 transition-all duration-500">
                                <Maximize2 size={24} />
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center text-slate-200">
                             {item.tipo === 'livro' ? (
                               <BookOpen size={64} className="mb-4 opacity-5 rotate-12 transition-transform group-hover:rotate-0 duration-700" />
                             ) : (
                               <div className="mb-4 opacity-5 rotate-12 transition-transform group-hover:rotate-0 duration-700">
                                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                               </div>
                             )}
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">Imagem Indisponível</span>
                          </div>
                        )}
                        <div className="absolute top-8 right-8">
                           <Badge className="bg-white/90 backdrop-blur-md text-slate-800 border-0 font-black uppercase tracking-[0.15em] text-[9px] py-2 px-5 shadow-2xl rounded-full">
                                {item.disciplina || (item.tipo === 'material' ? 'Material' : "Geral")}
                           </Badge>
                        </div>
                      </div>

                      <div className="p-10 space-y-8 flex-1 flex flex-col">
                        <div className="space-y-3">
                           <div className="flex items-center gap-3">
                              <div className={cn("h-1.5 w-10 rounded-full", item.tipo === 'livro' ? "bg-indigo-500" : "bg-emerald-500")} />
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic truncate">
                                {item.tipo === 'livro' ? (item.editora || 'Edição Especial') : (item.editora || 'Categoria Especial')}
                              </span>
                           </div>
                           <h3 className="text-3xl font-black text-slate-800 tracking-tighter leading-tight uppercase italic group-hover:text-indigo-600 transition-colors">{item.titulo}</h3>
                           <p className="text-sm font-bold text-slate-400 italic">
                             {item.tipo === 'livro' ? `Por ${item.autor || 'Autor Não Informado'}` : `${item.autor || 'Marca Sugerida'}`}
                           </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-6 rounded-[32px] border border-slate-100/50 shadow-inner">
                            <div className="space-y-1">
                               <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
                                 {item.tipo === 'livro' ? 'Registro ISBN' : 'Código/Ref'}
                               </p>
                               <p className="text-xs font-black text-slate-600 font-mono italic">{item.isbn || '---'}</p>
                            </div>
                            <div className="space-y-1 text-right">
                               <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Ano Letivo</p>
                               <p className="text-xs font-black text-slate-600 italic">{item.ano_letivo || '---'}</p>
                            </div>
                        </div>

                        {item.descricao && (
                            <div className="flex items-start gap-4 p-6 bg-slate-50/30 rounded-[28px] border border-slate-50">
                              <Info size={18} className="text-indigo-400 shrink-0 mt-0.5" />
                              <p className="text-xs leading-relaxed font-bold text-slate-500 italic line-clamp-3">{item.descricao}</p>
                            </div>
                        )}

                        <div className="mt-auto pt-6 flex gap-4">
                           {item.link_referencia ? (
                             <Button 
                                asChild
                                className={cn(
                                  "w-full h-16 rounded-[24px] font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 group/btn shadow-none border-0",
                                  item.tipo === 'livro' 
                                    ? "bg-indigo-100 text-indigo-600 hover:bg-slate-900 hover:text-white" 
                                    : "bg-emerald-100 text-emerald-600 hover:bg-slate-900 hover:text-white"
                                )}
                                onClick={() => vibrate(10)}
                             >
                               <a href={item.link_referencia} target="_blank" rel="noreferrer">
                                 Ver Referência <ExternalLink size={16} className="ml-3 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                               </a>
                             </Button>
                           ) : (
                             <div className="w-full flex items-center justify-center bg-slate-50/50 text-slate-400 h-16 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] italic border-2 border-dashed border-slate-100">
                                {item.tipo === 'livro' ? 'Disponível em Sala' : 'Consultar na Escola'}
                             </div>
                           )}
                        </div>
                      </div>
                   </motion.div>
                ))}
            </AnimatePresence>
         </div>
      )}

      {/* 4. Modal Capa - Full Screen Immersive Pro Max */}
      <Dialog open={!!capaAberta} onOpenChange={(open) => { if(!open) setCapaAberta(null); vibrate(10); }}>
        <DialogContent className="max-w-4xl border-none bg-slate-950/90 backdrop-blur-2xl shadow-none p-0 overflow-hidden focus:ring-0">
          <div className="relative w-full h-full flex flex-col items-center justify-center p-12 min-h-[70vh]">
              <button 
                onClick={() => setCapaAberta(null)}
                className="absolute top-10 right-10 w-16 h-16 rounded-[24px] bg-white/10 text-white flex items-center justify-center hover:bg-red-500 transition-all z-50 active:scale-90"
              >
                <X size={32} />
              </button>
              <AnimatePresence mode="wait">
                {capaAberta && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, rotateY: 45 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", damping: 20 }}
                    className="relative group"
                  >
                    <img 
                      src={capaAberta} 
                      alt="Full Book Cover" 
                      className="max-w-full max-h-[75vh] rounded-[48px] shadow-[0_60px_120px_rgba(0,0,0,0.6)] object-contain border-8 border-white/5" 
                    />
                    <div className="absolute inset-0 rounded-[48px] shadow-[inset_0_0_100px_rgba(0,0,0,0.2)] pointer-events-none" />
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="mt-12 flex flex-col items-center gap-2">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em] italic">Visualizador High Resolution</p>
                <div className="h-1 w-20 bg-indigo-500 rounded-full opacity-50" />
              </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
