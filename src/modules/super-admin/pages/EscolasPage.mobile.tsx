import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useEscolas } from '../hooks'
import { 
  Building2, 
  Search, 
  ChevronRight, 
  Loader2,
  Calendar,
  Layers,
  Info,
  Plus,
  Filter
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function EscolasPageMobile() {
  const { data: escolas, isLoading } = useEscolas()
  const [searchTerm, setSearchTerm] = useState('')

  const filteredEscolas = escolas?.filter(e => 
    e.nome_fantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.cnpj?.includes(searchTerm)
  )

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { y: 10, opacity: 0 },
    show: { y: 0, opacity: 1 }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4">
        <motion.div
           animate={{ rotate: 360 }}
           transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-10 w-10 text-indigo-500" />
        </motion.div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Listando Parceiros...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32">
       {/* Sticky Header */}
       <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-6 space-y-5">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                   <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Escolas</h1>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Parceiros Fluxoo</p>
                </div>
             </div>
             <Button className="h-10 w-10 rounded-xl bg-indigo-600 p-0 shadow-lg shadow-indigo-100">
                <Plus className="h-5 w-5" />
             </Button>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Nome ou CNPJ..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 h-12 rounded-2xl border-0 shadow-none bg-slate-100/50 focus-visible:ring-indigo-500 font-medium"
              />
            </div>
            <Button variant="outline" className="h-12 w-12 rounded-2xl border-0 bg-slate-100/50 shadow-none">
              <Filter className="h-4 w-4 text-slate-600" />
            </Button>
          </div>
       </div>

       {/* Lista de Escolas */}
       <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="px-4 py-6 space-y-3"
       >
          <AnimatePresence>
            {filteredEscolas?.map((escola) => (
              <motion.div key={escola.id} variants={item} layout>
                <Card 
                  className="rounded-[2.5rem] border-0 shadow-sm overflow-hidden bg-white active:scale-[0.98] transition-transform border border-slate-50"
                >
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 shrink-0 border border-slate-100 overflow-hidden">
                      {escola.logo_url ? (
                        <img src={escola.logo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="h-8 w-8" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                       <h3 className="font-bold text-slate-900 text-sm truncate leading-none mb-1">{escola.nome_fantasia}</h3>
                       <p className="text-[10px] font-bold text-slate-400 truncate mb-2 uppercase tracking-tighter">CNPJ: {escola.cnpj}</p>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={`text-[8px] font-black uppercase tracking-tighter px-2 border-0 rounded-lg ${
                          escola.status_assinatura === 'ativa' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {escola.status_assinatura}
                        </Badge>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                          <Calendar className="h-3 w-3" /> 
                          <span className="truncate">{escola.plano?.nome || 'Manual'}</span>
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-slate-200" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredEscolas?.length === 0 && !isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center"
            >
              <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-100">
                 <Info className="h-8 w-8 text-slate-200" />
              </div>
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest leading-none">Rede Vazia</p>
              <p className="text-xs text-slate-300 mt-1">Experimente outro termo de busca.</p>
            </motion.div>
          )}
       </motion.div>
    </div>
  )
}
