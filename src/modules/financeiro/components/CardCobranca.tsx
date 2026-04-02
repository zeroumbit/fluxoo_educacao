import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Calendar, Banknote } from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { NativeCard } from '@/components/mobile/NativeCard'
import { Button } from '@/components/ui/button'
import type { CobrancaComEncargos } from '../types'

interface CardCobrancaProps {
  cobranca: CobrancaComEncargos
  onPagar?: (id: string) => void
  onExcluir?: (id: string) => void
  onVisualizar?: (cobranca: CobrancaComEncargos) => void
  className?: string
  simplified?: boolean
}

export function CardCobranca({ cobranca, onPagar, onExcluir, onVisualizar, className, simplified = false }: CardCobrancaProps) {
  const isPago = cobranca.status === 'pago'
  const isAtrasado = cobranca.status === 'atrasado'
  
  const hasEncargos = cobranca.valor_multa_projetado > 0 || cobranca.valor_juros_projetado > 0
  const showEncargos = !isPago && hasEncargos

  return (
    <NativeCard 
      swipeable={!!onExcluir}
      onDelete={onExcluir ? () => onExcluir(cobranca.id) : undefined}
      onClick={onVisualizar ? () => onVisualizar(cobranca) : undefined}
      className={cn("p-5 overflow-hidden relative", className)}
    >
      <div className="flex items-start gap-4 w-full">
        {/* Ícone */}
        <div className={cn(
          "h-16 w-16 rounded-[20px] flex items-center justify-center shrink-0 shadow-sm transition-colors",
          isPago ? "bg-emerald-50 text-emerald-600" : 
          isAtrasado ? "bg-rose-50 text-rose-600" : "bg-indigo-50 text-indigo-500"
        )}>
          {isPago ? <CheckCircle2 size={32} /> : 
           isAtrasado ? <AlertCircle size={32} /> : <Calendar size={32} />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 pt-1">
          <h3 className="font-black text-slate-900 dark:text-white leading-tight truncate text-base">
            {cobranca.descricao}
          </h3>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mt-1 truncate">
            {cobranca.alunos?.nome_completo || 'Lançamento Avulso'}
          </p>
          
          <div className="mt-3 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-[10px] font-black text-slate-300 uppercase">Total:</span>
            <p className="font-black text-indigo-600 dark:text-indigo-400 text-lg tracking-tighter">
              {formatCurrency(cobranca.valor_total_projetado || cobranca.valor || 0)}
            </p>
            {showEncargos && !simplified && (
              <span className="text-[9px] text-rose-500 font-bold uppercase ml-1">
                Com Encargos
              </span>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="shrink-0 flex flex-col justify-start pt-1 items-end">
          <div className={cn(
            "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm",
            isPago ? "bg-emerald-500 text-white" : 
            isAtrasado ? "bg-rose-500 text-white" : "bg-amber-500 text-white"
          )}>
            {isPago ? 'PAGO' : isAtrasado ? 'VENCIDO' : 'ABERTO'}
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase mt-2">
            Ven: {formatDate(cobranca.data_vencimento)}
          </span>
        </div>
      </div>

      {showEncargos && !simplified && (
        <div className="mt-4 bg-rose-50/50 border border-rose-100 rounded-xl p-3 flex justify-between items-center text-xs">
          <div>
            <span className="font-bold text-rose-700">Atraso de {cobranca.dias_atraso_calculado} dias</span>
          </div>
          <div className="text-right">
            {cobranca.valor_multa_projetado > 0 && <span className="block text-rose-600 font-medium">Multa: {formatCurrency(cobranca.valor_multa_projetado)}</span>}
            {cobranca.valor_juros_projetado > 0 && <span className="block text-rose-600 font-medium">Juros: {formatCurrency(cobranca.valor_juros_projetado)}</span>}
          </div>
        </div>
      )}

      {onPagar && !isPago && !simplified && (
        <div className="mt-4">
          <Button 
            onClick={(e) => { e.stopPropagation(); onPagar(cobranca.id); }}
            className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs"
          >
            Pagar Agora
          </Button>
        </div>
      )}
    </NativeCard>
  )
}
