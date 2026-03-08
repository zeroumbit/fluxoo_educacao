import React, { useState, useEffect } from 'react'
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
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAtualizarAluno } from '../hooks'
import { Loader2, Percent, DollarSign, Calendar } from 'lucide-react'

const descontoSchema = z.object({
  desconto_valor: z.any().transform((v) => Number(v)).pipe(z.number().min(0, 'O valor deve ser positivo')),
  desconto_tipo: z.enum(['valor', 'porcentagem']),
  desconto_inicio: z.string().min(1, 'Data de início é obrigatória'),
  desconto_fim: z.string().optional().nullable(),
})

type DescontoFormValues = z.infer<typeof descontoSchema>

interface ModalDescontoAlunoProps {
  aluno: any
  open: boolean
  onClose: () => void
}

export function ModalDescontoAluno({ aluno, open, onClose }: ModalDescontoAlunoProps) {
  const atualizarAluno = useAtualizarAluno()
  
  const { 
    register, 
    handleSubmit, 
    reset, 
    setValue, 
    watch,
    formState: { isSubmitting, errors } 
  } = useForm<DescontoFormValues>({
    resolver: zodResolver(descontoSchema),
    defaultValues: {
      desconto_tipo: 'porcentagem'
    }
  })

  useEffect(() => {
    if (aluno && open) {
      reset({
        desconto_valor: aluno.desconto_valor || 0,
        desconto_tipo: aluno.desconto_tipo || 'porcentagem',
        desconto_inicio: aluno.desconto_inicio || new Date().toISOString().split('T')[0],
        desconto_fim: aluno.desconto_fim || null,
      })
    }
  }, [aluno, open, reset])

  const onSubmit = async (data: DescontoFormValues) => {
    try {
      await atualizarAluno.mutateAsync({
        id: aluno.id,
        aluno: {
          desconto_valor: data.desconto_valor,
          desconto_tipo: data.desconto_tipo,
          desconto_inicio: data.desconto_inicio || null,
          desconto_fim: data.desconto_fim || null,
        }
      })
      toast.success('Desconto atualizado com sucesso!')
      onClose()
    } catch (err: any) {
      toast.error('Erro ao atualizar desconto: ' + err.message)
    }
  }

  const tipo = watch('desconto_tipo')

  const removerDesconto = async () => {
    try {
      await atualizarAluno.mutateAsync({
        id: aluno.id,
        aluno: {
          desconto_valor: null,
          desconto_tipo: null,
          desconto_inicio: null,
          desconto_fim: null,
        }
      })
      toast.success('Desconto removido!')
      onClose()
    } catch (err: any) {
      toast.error('Erro ao remover desconto: ' + err.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl border-0 shadow-2xl">
        <DialogHeader>
          <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
             <Percent className="h-7 w-7 text-indigo-600" />
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight">Gerenciar Desconto</DialogTitle>
          <DialogDescription className="text-zinc-500">
            Configure o desconto para o aluno <strong>{aluno?.nome_completo}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
           {/* Tipo de Desconto */}
           <div className="space-y-2">
             <Label className="text-sm font-bold uppercase tracking-wider text-zinc-400">Tipo de Desconto</Label>
             <div className="flex gap-2">
               <Button
                type="button"
                variant={tipo === 'porcentagem' ? 'default' : 'outline'}
                className={cn(
                  "flex-1 rounded-xl h-12 gap-2",
                  tipo === 'porcentagem' ? "bg-indigo-600 hover:bg-indigo-700" : ""
                )}
                onClick={() => setValue('desconto_tipo', 'porcentagem')}
               >
                 <Percent size={16} /> Porcentagem
               </Button>
               <Button
                type="button"
                variant={tipo === 'valor' ? 'default' : 'outline'}
                className={cn(
                  "flex-1 rounded-xl h-12 gap-2",
                  tipo === 'valor' ? "bg-indigo-600 hover:bg-indigo-700" : ""
                )}
                onClick={() => setValue('desconto_tipo', 'valor')}
               >
                 <DollarSign size={16} /> Valor Fixo
               </Button>
             </div>
           </div>

           {/* Valor */}
           <div className="space-y-2">
             <Label htmlFor="desconto_valor" className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                {tipo === 'porcentagem' ? 'Percentual (%)' : 'Valor em Reais (R$)'}
             </Label>
             <div className="relative">
               <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                 {tipo === 'porcentagem' ? <Percent size={16} /> : <span className="text-xs font-black">R$</span>}
               </div>
               <Input
                id="desconto_valor"
                type="number"
                step="0.01"
                className="pl-10 h-12 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                placeholder="0,00"
                {...register('desconto_valor')}
               />
             </div>
             {errors.desconto_valor && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.desconto_valor.message}</p>}
           </div>

           {/* Período */}
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="desconto_inicio" className="text-sm font-bold uppercase tracking-wider text-zinc-400">Início</Label>
                <div className="relative">
                   <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 h-4 w-4" />
                   <Input
                    id="desconto_inicio"
                    type="date"
                    className="pl-10 h-12 rounded-xl"
                    {...register('desconto_inicio')}
                   />
                </div>
                {errors.desconto_inicio && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.desconto_inicio.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="desconto_fim" className="text-sm font-bold uppercase tracking-wider text-zinc-400">Fim (Opcional)</Label>
                <div className="relative">
                   <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 h-4 w-4" />
                   <Input
                    id="desconto_fim"
                    type="date"
                    className="pl-10 h-12 rounded-xl"
                    {...register('desconto_fim')}
                   />
                </div>
              </div>
           </div>

           <DialogFooter className="pt-4 flex flex-col-reverse sm:flex-row gap-2">
             <Button 
                type="button" 
                variant="ghost" 
                onClick={removerDesconto}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
              >
               Remover Desconto
             </Button>
             <div className="flex gap-2 flex-1 justify-end">
                <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl min-w-[120px]"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
                </Button>
             </div>
           </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
