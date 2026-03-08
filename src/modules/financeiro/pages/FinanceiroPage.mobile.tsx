import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCobrancas, useMarcarComoPago } from '../hooks'
import { 
  Search, 
  Filter, 
  Loader2,
  CreditCard,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Calendar,
  Check,
  RotateCcw,
  Plus,
  ArrowRight
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

export function FinanceiroPageMobile() {
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const { data: cobrancas, isLoading } = useCobrancas(filtroStatus)
  const [searchTerm, setSearchTerm] = useState('')
  const marcarComoPago = useMarcarComoPago()

  const tabs = [
    { id: 'todos', label: 'Tudo' },
    { id: 'a_vencer', label: 'Aberto' },
    { id: 'atrasado', label: 'Atrasado' },
    { id: 'pago', label: 'Pago' }
  ]

  const filteredCobrancas = cobrancas?.filter((c: any) => 
    c.alunos?.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleMarcarComoPago = async (id: string) => {
    try {
      await marcarComoPago.mutateAsync(id)
      toast.success('Pagamento baixado com sucesso!')
    } catch (err) {
      toast.error('Erro ao processar pagamento.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4">
        <motion.div
           animate={{ rotate: 360 }}
           transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-10 w-10 text-emerald-500" />
        </motion.div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Financeiro Offline</p>
      </div>
    )
  }

  const stats = {
    total: cobrancas?.reduce((acc, c) => acc + Number(c.valor), 0) || 0,
    atrasado: cobrancas?.filter(c => c.status === 'atrasado').reduce((acc, c) => acc + Number(c.valor), 0) || 0,
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  }

  const item = {
    hidden: { y: 10, opacity: 0 },
    show: { y: 0, opacity: 1 }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32">
       {/* Header Section com Stats */}
       <div className="bg-white px-4 pt-8 pb-6 space-y-6 rounded-b-[2.5rem] shadow-sm border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                  <TrendingUp className="h-5 w-5" />
               </div>
               <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Financeiro</h1>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Gestão de Fluxo</p>
               </div>
            </div>
            <button className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
               <Plus className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div className="bg-slate-900 p-5 rounded-[1.5rem] shadow-lg relative overflow-hidden group">
                <div className="absolute -right-2 -bottom-2 h-12 w-12 bg-white/5 rounded-full blur-xl group-hover:scale-150 transition-transform" />
                <p className="text-[8px] font-black text-indigo-300 uppercase tracking-widest mb-1">A Receber</p>
                <p className="text-lg font-black text-white leading-tight">R$ {stats.total.toLocaleString('pt-BR')}</p>
             </div>
             <div className="bg-rose-500 p-5 rounded-[1.5rem] shadow-lg shadow-rose-100 relative overflow-hidden group">
                <div className="absolute -right-2 -bottom-2 h-12 w-12 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform" />
                <p className="text-[8px] font-black text-rose-100 uppercase tracking-widest mb-1">Vencido</p>
                <p className="text-lg font-black text-white leading-tight">R$ {stats.atrasado.toLocaleString('pt-BR')}</p>
             </div>
          </div>
       </div>

       {/* Filtros e Busca */}
       <div className="px-4 py-6 space-y-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
             {tabs.map((tab) => (
                <button
                   key={tab.id}
                   onClick={() => setFiltroStatus(tab.id)}
                   className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border ${
                      filtroStatus === tab.id 
                      ? 'bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-100' 
                      : 'bg-white text-slate-400 border-slate-100'
                   }`}
                >
                   {tab.label}
                </button>
             ))}
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar cobrança..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-12 rounded-2xl border-0 shadow-sm bg-white focus-visible:ring-indigo-500 font-medium"
            />
          </div>
       </div>

       {/* Lista Animada */}
       <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="px-4 space-y-3"
       >
          <AnimatePresence>
            {filteredCobrancas?.map((cobranca) => (
              <motion.div key={cobranca.id} variants={item} layout>
                <Card 
                  className="rounded-[2rem] border-0 shadow-sm overflow-hidden bg-white group active:scale-[0.98] transition-all relative border border-slate-50"
                >
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 border border-slate-50 ${
                      cobranca.status === 'atrasado' ? 'bg-rose-50 text-rose-500' : 
                      cobranca.status === 'pago' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-400'
                    }`}>
                      <CreditCard className="h-7 w-7" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                         <h3 className="font-bold text-slate-900 text-sm truncate leading-none">
                            {(cobranca as any).alunos?.nome_completo || 'Avulso'}
                         </h3>
                         <p className={`font-black text-sm shrink-0 ${
                            cobranca.status === 'atrasado' ? 'text-rose-600' : 
                            cobranca.status === 'pago' ? 'text-emerald-600' : 'text-slate-900'
                         }`}>
                            R$ {Number(cobranca.valor || 0).toLocaleString('pt-BR')}
                         </p>
                      </div>
                      <p className="text-[10px] font-medium text-slate-400 truncate mb-2">{cobranca.descricao}</p>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={`text-[8px] font-black uppercase tracking-tighter px-2 border-0 rounded-lg ${
                          cobranca.status === 'atrasado' ? 'bg-rose-100 text-rose-600' : 
                          cobranca.status === 'pago' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {cobranca.status}
                        </Badge>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-300">
                          <Calendar className="h-3 w-3" /> 
                          {format(new Date(cobranca.data_vencimento), 'dd/MM/yy', { locale: ptBR })}
                        </div>
                      </div>
                    </div>

                    {cobranca.status !== 'pago' && (
                       <button 
                          onClick={(e) => {
                             e.stopPropagation()
                             handleMarcarComoPago(cobranca.id)
                          }}
                          className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center active:scale-95 transition-transform"
                       >
                          <Check className="h-5 w-5" />
                       </button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredCobrancas?.length === 0 && !isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center"
            >
              <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-100">
                 <AlertCircle className="h-8 w-8 text-slate-200" />
              </div>
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Giro Financeiro Limpo</p>
              <p className="text-xs text-slate-300 mt-1">Nenhuma cobrança encontrada neste filtro.</p>
            </motion.div>
          )}
       </motion.div>
    </div>
  )
}
