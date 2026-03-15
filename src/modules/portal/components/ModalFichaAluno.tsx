import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { usePortalContext } from '@/modules/portal/context'
import { useAlunoCompleto, useUpdateAlunoPortal } from '@/modules/portal/hooks'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User,
  MapPin,
  Heart,
  Save,
  Loader2,
  X,
  GraduationCap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { mascaraCPF, mascaraCEP } from '@/lib/validacoes'
import { useViaCEP } from '@/hooks/use-viacep'
import { AnimatePresence, motion } from 'framer-motion'

const alunoSchema = z.object({
  nome_completo: z.string().min(3, 'Nome muito curto'),
  cpf: z.string().optional().or(z.literal('')),
  rg: z.string().optional().or(z.literal('')),
  data_nascimento: z.string().min(10, 'Data inválida'),
  genero: z.string().optional().or(z.literal('')),
  cep: z.string().min(9, 'CEP incompleto').optional().or(z.literal('')),
  logradouro: z.string().optional().or(z.literal('')),
  numero: z.string().optional().or(z.literal('')),
  complemento: z.string().optional().or(z.literal('')),
  bairro: z.string().optional().or(z.literal('')),
  cidade: z.string().optional().or(z.literal('')),
  estado: z.string().optional().or(z.literal('')),
  patologias: z.string().optional().or(z.literal('')),
  medicamentos: z.string().optional().or(z.literal('')),
  observacoes_saude: z.string().optional().or(z.literal('')),
})

type AlunoFormValues = z.infer<typeof alunoSchema>

interface ModalFichaAlunoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ModalFichaAluno({ open, onOpenChange }: ModalFichaAlunoProps) {
  const { responsavel } = usePortalContext()
  const { data: alunoFull, isLoading: loadingAluno } = useAlunoCompleto()
  const updateAluno = useUpdateAlunoPortal()
  const [isEditingAluno, setIsEditingAluno] = useState(false)
  
  const {
    register: regAluno,
    handleSubmit: handleSubAluno,
    setValue: setValAluno,
    reset: resetAluno,
    formState: { errors: errAluno, isSubmitting: subAluno },
  } = useForm<AlunoFormValues>({
    resolver: zodResolver(alunoSchema),
  })

  useEffect(() => {
    if (alunoFull && open) {
      resetAluno({
        nome_completo: alunoFull.nome_completo || '',
        cpf: alunoFull.cpf || '',
        rg: alunoFull.rg || '',
        data_nascimento: alunoFull.data_nascimento || '',
        genero: alunoFull.genero || '',
        cep: alunoFull.cep || '',
        logradouro: alunoFull.logradouro || '',
        numero: alunoFull.numero || '',
        complemento: alunoFull.complemento || '',
        bairro: alunoFull.bairro || '',
        cidade: alunoFull.cidade || '',
        estado: alunoFull.estado || '',
        patologias: Array.isArray(alunoFull.patologias) ? alunoFull.patologias.join(', ') : (alunoFull.patologias || ''),
        medicamentos: Array.isArray(alunoFull.medicamentos) ? alunoFull.medicamentos.join(', ') : (alunoFull.medicamentos || ''),
        observacoes_saude: alunoFull.observacoes_saude || '',
      })
      setIsEditingAluno(false)
    }
  }, [alunoFull, resetAluno, open])

  const { fetchAddressByCEP } = useViaCEP()

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = mascaraCEP(e.target.value)
    setValAluno('cep', val)

    if (val.length === 9) {
      const dados = await fetchAddressByCEP(val)
      if (dados && !('error' in dados)) {
        setValAluno('logradouro', (dados as any).logradouro || '')
        setValAluno('bairro', (dados as any).bairro || '')
        setValAluno('cidade', (dados as any).cidade || '')
        setValAluno('estado', (dados as any).estado || '')
      }
    }
  }

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValAluno('cpf', mascaraCPF(e.target.value))
  }

  const onAlunoSubmit = async (data: AlunoFormValues) => {
    try {
      if (!alunoFull?.id || !responsavel?.id) return
      const payload = {
        ...data,
        cpf: data.cpf ? data.cpf.replace(/\D/g, '') : null,
        patologias: data.patologias ? data.patologias.split(',').map(p => p.trim()).filter(Boolean) : [],
        medicamentos: data.medicamentos ? data.medicamentos.split(',').map(m => m.trim()).filter(Boolean) : [],
      }
      await updateAluno.mutateAsync({
        alunoId: alunoFull.id,
        responsavelId: responsavel.id,
        dados: {
          ...payload,
          updated_at: new Date().toISOString()
        }
      })
      toast.success('Dados do aluno atualizados!')
      setIsEditingAluno(false)
      onOpenChange(false)
    } catch (err) {
      toast.error('Erro ao atualizar dados do aluno')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-2xl p-0 overflow-hidden bg-white h-[100dvh] sm:h-auto sm:max-h-[90vh] flex flex-col border-0 sm:border rounded-none sm:rounded-3xl">
        <div className="bg-indigo-600 p-6 sm:p-8 text-white shrink-0 relative">
          <div className="mx-auto w-12 h-1.5 bg-white/20 rounded-full mb-4 sm:hidden" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <GraduationCap size={24} className="text-indigo-200" />
                <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight">Ficha do Aluno</DialogTitle>
              </div>
              <DialogDescription className="text-indigo-100 text-[10px] sm:text-xs font-medium uppercase tracking-wider">
                Cadastro Completo do Estudante
              </DialogDescription>
            </div>
            <button 
              onClick={() => onOpenChange(false)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors -mr-2"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {loadingAluno ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="text-sm text-slate-400 font-medium">Carregando ficha...</p>
            </div>
          ) : (
            <form id="form-aluno-modal" onSubmit={handleSubAluno(onAlunoSubmit)} className="space-y-6">
              <div className="flex justify-end">
                {!isEditingAluno ? (
                  <Button 
                    type="button"
                    onClick={() => setIsEditingAluno(true)} 
                    className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-0 rounded-xl font-bold text-[10px] uppercase tracking-wider"
                  >
                    Habilitar Edição
                  </Button>
                ) : (
                  <Button 
                    type="button"
                    variant="ghost" 
                    onClick={() => setIsEditingAluno(false)}
                    className="text-slate-400 font-bold text-[10px] uppercase tracking-wider"
                  >
                    Cancelar
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nome Completo</Label>
                  <Input 
                    {...regAluno('nome_completo')} 
                    readOnly={!isEditingAluno}
                    className={cn("h-11 px-4 bg-slate-50 border-0 rounded-xl text-sm transition-all", isEditingAluno ? "bg-white ring-1 ring-slate-200" : "text-slate-400")}
                  />
                  {errAluno.nome_completo && <p className="text-[10px] text-red-500">{errAluno.nome_completo.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data de Nascimento</Label>
                  <Input 
                    type="date"
                    {...regAluno('data_nascimento')} 
                    readOnly={!isEditingAluno}
                    className={cn("h-11 px-4 bg-slate-50 border-0 rounded-xl text-sm transition-all", isEditingAluno ? "bg-white ring-1 ring-slate-200" : "text-slate-400")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CPF</Label>
                  <Input 
                    {...regAluno('cpf')} 
                    onChange={handleCpfChange}
                    maxLength={14}
                    readOnly={!isEditingAluno}
                    className={cn("h-11 px-4 bg-slate-50 border-0 rounded-xl text-sm transition-all", isEditingAluno ? "bg-white ring-1 ring-slate-200" : "text-slate-400")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RG</Label>
                  <Input 
                    {...regAluno('rg')} 
                    readOnly={!isEditingAluno}
                    className={cn("h-11 px-4 bg-slate-50 border-0 rounded-xl text-sm transition-all", isEditingAluno ? "bg-white ring-1 ring-slate-200" : "text-slate-400")}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="text-indigo-500" size={12} /> Endereço Residencial
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold text-slate-400 uppercase">CEP</Label>
                    <Input 
                      {...regAluno('cep')} 
                      onChange={handleCepChange}
                      maxLength={9}
                      readOnly={!isEditingAluno}
                      className={cn("h-11 px-4 bg-slate-50 border-0 rounded-xl text-sm", isEditingAluno ? "bg-white ring-1 ring-indigo-200" : "text-slate-400")}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-3">
                    <Label className="text-[9px] font-bold text-slate-400 uppercase">Logradouro</Label>
                    <Input {...regAluno('logradouro')} readOnly={!isEditingAluno} className="h-11 px-4 bg-slate-50 border-0 rounded-xl text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold text-slate-400 uppercase">Número</Label>
                    <Input {...regAluno('numero')} readOnly={!isEditingAluno} className="h-11 px-4 bg-slate-50 border-0 rounded-xl text-sm" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-[9px] font-bold text-slate-400 uppercase">Bairro</Label>
                    <Input {...regAluno('bairro')} readOnly={!isEditingAluno} className="h-11 px-4 bg-slate-50 border-0 rounded-xl text-sm" />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Heart className="text-red-500" size={12} /> Saúde & Atenção
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold text-slate-400 uppercase">Patologias</Label>
                    <Input {...regAluno('patologias')} readOnly={!isEditingAluno} className="h-11 px-4 bg-slate-50 border-0 rounded-xl text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold text-slate-400 uppercase">Medicamentos</Label>
                    <Input {...regAluno('medicamentos')} readOnly={!isEditingAluno} className="h-11 px-4 bg-slate-50 border-0 rounded-xl text-sm" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-slate-400 uppercase">Observações Gerais</Label>
                  <textarea {...regAluno('observacoes_saude')} readOnly={!isEditingAluno} className="w-full h-24 p-4 bg-slate-50 border-0 rounded-xl text-sm resize-none" />
                </div>
              </div>
            </form>
          )}
        </div>

        <AnimatePresence>
          {isEditingAluno && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-6 border-t border-slate-100 bg-slate-50 shrink-0"
            >
              <Button 
                form="form-aluno-modal" 
                type="submit" 
                disabled={subAluno} 
                className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]"
              >
                {subAluno ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-3" />}
                Salvar Alterações
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
