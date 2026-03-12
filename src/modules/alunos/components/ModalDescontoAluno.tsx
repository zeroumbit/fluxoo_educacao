import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useOverrideAtivo, useCriarOverride, useRevogarOverrides } from '../hooks'
import { useAuth } from '@/modules/auth/AuthContext'
import { Loader2, Percent, DollarSign, Calendar, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

const overrideSchema = z.object({
  tipo: z.enum(['desconto_pontual', 'desconto_permanente', 'acordo', 'negociacao'], { required_error: 'Selecione o tipo' }),
  motivo: z.enum(['vinculo_familiar', 'bolsa_merito', 'bolsa_atleta', 'bolsa_funcionario', 'retencao_evasao', 'promocional', 'outro'], { required_error: 'Selecione o motivo' }),
  detalhes_motivo: z.string().optional(),
  formato_desconto: z.enum(['porcentagem', 'valor']), // Helper field
  valor_desconto: z.any().transform((v) => Number(v)).pipe(z.number().min(0.01, 'Informe um valor maior que zero')),
  teto_maximo_desconto: z.any().transform((v) => Number(v)).pipe(z.number()),
  vigencia_inicio: z.string().min(1, 'Data de início é obrigatória'),
  vigencia_fim: z.string().optional().nullable(),
  recalcular_automatico_em_reajuste: z.boolean().default(false)
}).superRefine((data, ctx) => {
  if (data.motivo === 'outro' && (!data.detalhes_motivo || data.detalhes_motivo.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['detalhes_motivo'],
      message: 'Justificativa obrigatória para "Outro" motivo'
    })
  }
})

type OverrideFormValues = z.infer<typeof overrideSchema>

interface ModalDescontoAlunoProps {
  aluno: any
  open: boolean
  onClose: () => void
}

export function ModalDescontoAluno({ aluno, open, onClose }: ModalDescontoAlunoProps) {
  const { authUser } = useAuth()
  const [resetKey, setResetKey] = useState(0) // Forçar remontagem visual ao reabrir

  const activeOverrideQuery = useOverrideAtivo(aluno?.id || '')
  const criarOverride = useCriarOverride()
  const revogarOverrides = useRevogarOverrides()
  
  const { 
    register, 
    handleSubmit, 
    reset, 
    setValue, 
    watch,
    control,
    formState: { isSubmitting, errors } 
  } = useForm<OverrideFormValues>({
    resolver: zodResolver(overrideSchema),
    defaultValues: {
      formato_desconto: 'porcentagem',
      recalcular_automatico_em_reajuste: false,
      teto_maximo_desconto: 0,
      vigencia_inicio: new Date().toISOString().split('T')[0]
    }
  })

  useEffect(() => {
    if (aluno && open && activeOverrideQuery.isSuccess) {
      const active = activeOverrideQuery.data
      if (active) {
        reset({
          tipo: active.tipo,
          motivo: active.motivo,
          detalhes_motivo: active.detalhes_motivo || '',
          formato_desconto: active.percentual_desconto ? 'porcentagem' : 'valor',
          valor_desconto: active.percentual_desconto || active.valor_fixo_desconto || 0,
          teto_maximo_desconto: active.teto_maximo_desconto || 0,
          vigencia_inicio: active.vigencia_inicio,
          vigencia_fim: active.vigencia_fim || null,
          recalcular_automatico_em_reajuste: active.recalcular_automatico_em_reajuste || false
        })
      } else {
        reset({
          formato_desconto: 'porcentagem',
          recalcular_automatico_em_reajuste: false,
          teto_maximo_desconto: 0,
          vigencia_inicio: new Date().toISOString().split('T')[0]
        })
      }
      setResetKey(k => k + 1)
    }
  }, [aluno, open, activeOverrideQuery.data, activeOverrideQuery.isSuccess, reset])

  const onSubmit = async (data: OverrideFormValues) => {
    try {
      if (!authUser?.tenantId || !authUser.user?.id) return

      await criarOverride.mutateAsync({
        tenant_id: authUser.tenantId,
        aluno_id: aluno.id,
        tipo: data.tipo,
        motivo: data.motivo,
        detalhes_motivo: data.detalhes_motivo || null,
        percentual_desconto: data.formato_desconto === 'porcentagem' ? data.valor_desconto : null,
        valor_fixo_desconto: data.formato_desconto === 'valor' ? data.valor_desconto : null,
        teto_maximo_desconto: data.teto_maximo_desconto > 0 ? data.teto_maximo_desconto : null,
        vigencia_inicio: data.vigencia_inicio,
        vigencia_fim: data.vigencia_fim || null,
        recalcular_automatico_em_reajuste: data.recalcular_automatico_em_reajuste,
        aplicado_por: authUser.user.id,
        status: 'ativo'
      })
      toast.success('Desconto (Override) aplicado com sucesso e auditado!')
      onClose()
    } catch (err: any) {
      toast.error('Erro ao aplicar desconto: ' + err.message)
    }
  }

  const removerDesconto = async () => {
    try {
      await revogarOverrides.mutateAsync(aluno.id)
      toast.success('Descontos ativos foram revogados!')
      onClose()
    } catch (err: any) {
      toast.error('Erro ao revogar desconto: ' + err.message)
    }
  }

  const formato = watch('formato_desconto')
  const motivo = watch('motivo')
  const hasActive = !!activeOverrideQuery.data

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] rounded-xl border-0 shadow-2xl p-0 overflow-hidden bg-slate-50">
        <DialogHeader className="p-6 bg-white border-b border-slate-100">
          <div className="flex gap-4 items-center">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100/50">
               <Percent className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 leading-none">Descontos</DialogTitle>
              <DialogDescription className="text-xs font-semibold text-slate-500 mt-1.5 leading-none">
                Reduções manuais para <span className="text-indigo-600 font-bold">{aluno?.nome_completo}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4 pb-0 max-h-[60vh] overflow-y-auto px-6" key={resetKey}>
           
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Classificação</Label>
                <Controller
                  name="tipo"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full h-12 rounded-xl bg-white border-slate-200">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="desconto_pontual">Desconto Pontual</SelectItem>
                        <SelectItem value="desconto_permanente">Desconto Permanente</SelectItem>
                        <SelectItem value="acordo">Acordo Comercial</SelectItem>
                        <SelectItem value="negociacao">Negociação/Dívida</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.tipo && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.tipo.message}</p>}
             </div>
             
             <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Motivo Regulatório</Label>
                <Controller
                  name="motivo"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full h-12 rounded-xl bg-white border-slate-200">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="vinculo_familiar">Vínculo Familiar</SelectItem>
                        <SelectItem value="bolsa_merito">Bolsa por Mérito</SelectItem>
                        <SelectItem value="bolsa_atleta">Bolsa Atleta</SelectItem>
                        <SelectItem value="bolsa_funcionario">Dependente Funcionário</SelectItem>
                        <SelectItem value="retencao_evasao">Retenção de Evasão</SelectItem>
                        <SelectItem value="promocional">Ação Promocional</SelectItem>
                        <SelectItem value="outro">Outro (Exige Detalhe)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.motivo && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.motivo.message}</p>}
             </div>
           </div>

           {motivo === 'outro' && (
             <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Justificativa Detalhada *</Label>
                <Input
                  {...register('detalhes_motivo')}
                  placeholder="Por que este desconto excepcionalmente está sendo concedido?"
                  className="h-12 rounded-xl bg-white border-slate-200 focus:ring-2 focus:ring-amber-500/10"
                />
                {errors.detalhes_motivo && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.detalhes_motivo.message}</p>}
             </div>
           )}

           <div className="space-y-2">
             <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Dimensão do Abatimento</Label>
             <div className="flex gap-2 mb-3">
               <Button
                type="button"
                variant={formato === 'porcentagem' ? 'default' : 'outline'}
                className={cn("flex-1 rounded-xl h-10 gap-2 text-xs font-bold", formato === 'porcentagem' ? "bg-indigo-600" : "bg-white border-slate-200")}
                onClick={() => setValue('formato_desconto', 'porcentagem')}
               >
                 <Percent size={14} /> Percentual
               </Button>
               <Button
                type="button"
                variant={formato === 'valor' ? 'default' : 'outline'}
                className={cn("flex-1 rounded-xl h-10 gap-2 text-xs font-bold", formato === 'valor' ? "bg-indigo-600" : "bg-white border-slate-200")}
                onClick={() => setValue('formato_desconto', 'valor')}
               >
                 <DollarSign size={14} /> Fixo (R$)
               </Button>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {formato === 'porcentagem' ? <Percent size={16} /> : <span className="text-xs font-bold">R$</span>}
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      className="pl-10 h-12 rounded-xl bg-white border-slate-200 font-bold text-lg text-indigo-700 focus-visible:ring-indigo-500"
                      placeholder="0.00"
                      {...register('valor_desconto')}
                    />
                  </div>
                  {errors.valor_desconto && <p className="text-[10px] text-red-500 font-bold uppercase mt-1">{errors.valor_desconto.message}</p>}
               </div>
               <div>
                  <div className="relative bg-white rounded-xl border border-amber-200/40 flex flex-col justify-center px-3 h-12 shadow-sm">
                     <p className="text-[8px] font-bold uppercase tracking-widest text-amber-600/60 absolute -top-2 bg-slate-50 px-1 left-2">Teto Máximo (R$)</p>
                     <Input 
                       type="number" 
                       step="0.01" 
                       className="border-0 bg-transparent h-8 p-0 font-bold focus-visible:ring-0 text-amber-700 placeholder:text-amber-200" 
                       placeholder="Ilimitado"
                       {...register('teto_maximo_desconto')}
                     />
                  </div>
               </div>
             </div>
             <p className="text-[10px] font-medium text-slate-400 mt-2 flex items-center gap-1">
                <Info size={12} /> O teto limita o valor real do desconto em caso de reajustes futuros que fariam a escola perder dinheiro.
             </p>
           </div>

           <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Data de Início</Label>
                <div className="relative">
                   <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                   <Input
                    type="date"
                    className="pl-10 h-11 rounded-xl bg-white border-slate-200"
                    {...register('vigencia_inicio')}
                   />
                </div>
                {errors.vigencia_inicio && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.vigencia_inicio.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Data Fim (Opcional)</Label>
                <div className="relative">
                   <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                   <Input
                    type="date"
                    className="pl-10 h-11 rounded-xl bg-white border-slate-200"
                    {...register('vigencia_fim')}
                   />
                </div>
              </div>
           </div>

           <div className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-xl mt-4">
              <Controller
                name="recalcular_automatico_em_reajuste"
                control={control}
                render={({ field }) => (
                   <Switch 
                     checked={field.value} 
                     onCheckedChange={field.onChange}
                     className="data-[state=checked]:bg-indigo-600 mt-1"
                   />
                )}
              />
              <div>
                 <Label className="text-xs font-bold text-slate-800 leading-tight block mb-1">
                   Recalcular matriz no reajuste?
                 </Label>
                 <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                   Se <strong>inativo</strong>, ao mudar o valor da turma, geração do boleto será pausada esperando decisão sobre o desconto. Se <strong>ativo</strong>, será silenciosamente recalculado usando a base percentual respeitando o teto.
                 </p>
              </div>
           </div>

           <div className="h-6"></div> {/* padding-bottom fake */}
        </form>

        <DialogFooter className="p-6 bg-white border-t border-slate-100 flex flex-col-reverse sm:flex-row gap-2">
           {hasActive && (
              <Button 
                type="button" 
                variant="ghost" 
                onClick={removerDesconto}
                className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl font-bold uppercase tracking-wider text-[10px] h-11"
              >
                Revogar Overrides
              </Button>
           )}
           <div className="flex gap-2 flex-1 justify-end">
              <Button type="button" variant="outline" onClick={onClose} className="rounded-xl h-11 border-slate-200 font-bold">Fechar</Button>
              <Button 
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl h-11 min-w-[160px] shadow-md font-bold"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Registrar Override'}
              </Button>
           </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
