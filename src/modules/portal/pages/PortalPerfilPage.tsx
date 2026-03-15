import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/modules/auth/AuthContext'
import { usePortalContext } from '@/modules/portal/context'
import { useUpdatePerfil } from '@/modules/portal/hooks'
import {
  User,
  Mail,
  Smartphone,
  Hash,
  X,
  Shield,
  Settings,
  MapPin,
  Loader2,
  Save
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { mascaraCPF, mascaraTelefone, validarCPF, mascaraCEP } from '@/lib/validacoes'
import { useViaCEP } from '@/hooks/use-viacep'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { BotaoVoltar } from '../components/BotaoVoltar'

// Helper de vibração
const vibrate = (pattern: number | number[] = 20) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

const perfilSchema = z.object({
  nome: z.string().min(3, 'Nome muito curto'),
  cpf: z.string().min(14, 'CPF incompleto'),
  telefone: z.string().min(14, 'Telefone incompleto'),
  cep: z.string().min(9, 'CEP incompleto').optional().or(z.literal('')),
  logradouro: z.string().optional().or(z.literal('')),
  numero: z.string().optional().or(z.literal('')),
  bairro: z.string().optional().or(z.literal('')),
  cidade: z.string().optional().or(z.literal('')),
  estado: z.string().optional().or(z.literal('')),
}).refine((data) => !data.cpf || validarCPF(data.cpf), {
  message: 'CPF inválido',
  path: ['cpf'],
})

type PerfilFormValues = z.infer<typeof perfilSchema>

export function PortalPerfilPage() {
  const { authUser } = useAuth()
  const { responsavel } = usePortalContext()
  const updatePerfil = useUpdatePerfil()
  
  const [isEditing, setIsEditing] = useState(false)
  
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PerfilFormValues>({
    resolver: zodResolver(perfilSchema),
  })

  useEffect(() => {
    if (responsavel) {
      reset({
        nome: responsavel.nome || '',
        cpf: responsavel.cpf || '',
        telefone: responsavel.telefone || '',
        cep: responsavel.cep || '',
        logradouro: responsavel.logradouro || '',
        numero: responsavel.numero || '',
        bairro: responsavel.bairro || '',
        cidade: responsavel.cidade || '',
        estado: responsavel.estado || '',
      })
    }
  }, [responsavel, reset])

  const { fetchAddressByCEP } = useViaCEP()

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = mascaraCEP(e.target.value)
    setValue('cep', val)

    if (val.length === 9) {
      const dados = await fetchAddressByCEP(val)
      if (dados && !('error' in dados)) {
        setValue('logradouro', (dados as any).logradouro || '')
        setValue('bairro', (dados as any).bairro || '')
        setValue('cidade', (dados as any).cidade || '')
        setValue('estado', (dados as any).estado || '')
      }
    }
  }

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('cpf', mascaraCPF(e.target.value))
  }

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('telefone', mascaraTelefone(e.target.value))
  }

  const onSubmit = async (data: PerfilFormValues) => {
    try {
      vibrate(30)
      if (!responsavel?.id) return
      await updatePerfil.mutateAsync({
        responsavelId: responsavel.id,
        dados: {
          ...data,
          cpf: data.cpf.replace(/\D/g, ''),
          updated_at: new Date().toISOString()
        }
      })
      toast.success('Perfil atualizado com sucesso!')
      setIsEditing(false)
    } catch (err) {
      vibrate([50, 50, 50])
      toast.error('Erro ao atualizar perfil')
      console.error(err)
    }
  }

  return (
    <div className="space-y-5 pb-20 animate-in fade-in duration-500 font-sans">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <BotaoVoltar />
          <div className="flex flex-col gap-0.5">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800">Meus Dados</h2>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Informações do Responsável</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-500 flex items-center justify-center">
                     <User size={20} />
                  </div>
                  <div>
                     <h3 className="text-base font-bold text-slate-800">Dados Pessoais</h3>
                     <p className="text-[10px] text-slate-400">Identificação & Contato</p>
                  </div>
               </div>
               {!isEditing ? (
                 <Button 
                    onClick={() => { vibrate(15); setIsEditing(true); }} 
                    className="h-10 px-5 rounded-xl bg-slate-900 text-white font-semibold text-xs uppercase tracking-wider hover:bg-teal-600 shadow-sm"
                  >
                    <Settings className="mr-2 h-4 w-4" /> Editar
                  </Button>
               ) : (
                 <Button 
                    variant="ghost"
                    onClick={() => setIsEditing(false)} 
                    className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center"
                  >
                    <X size={18} />
                  </Button>
               )}
            </div>
            
            <CardContent className="p-4">
               <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                     <div className="space-y-1.5">
                       <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                         <User size={11} className="text-teal-500" /> Nome
                       </Label>
                       <Input 
                         {...register('nome')} 
                         readOnly={!isEditing}
                         className={cn(
                           "h-11 px-4 bg-slate-50 border-0 rounded-xl text-sm font-medium transition-all",
                           isEditing ? "bg-white ring-1 ring-slate-200 focus-visible:ring-teal-500/30" : "text-slate-400"
                         )}
                       />
                       {errors.nome && <p className="text-[10px] text-red-500">{errors.nome.message}</p>}
                     </div>
                     <div className="space-y-1.5">
                       <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                         <Hash size={11} className="text-teal-500" /> CPF
                       </Label>
                       <Input 
                         {...register('cpf')} 
                         onChange={handleCpfChange}
                         maxLength={14}
                         readOnly={!isEditing}
                         className={cn(
                           "h-11 px-4 bg-slate-50 border-0 rounded-xl text-sm font-medium transition-all",
                           isEditing ? "bg-white ring-1 ring-slate-200 focus-visible:ring-teal-500/30" : "text-slate-400"
                         )}
                       />
                       {errors.cpf && <p className="text-[10px] text-red-500">{errors.cpf.message}</p>}
                     </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                     <div className="space-y-1.5">
                       <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Mail size={11} className="text-teal-500" /> E-mail
                       </Label>
                       <Input 
                          value={responsavel?.email || ''} 
                          readOnly 
                          className="h-11 px-4 bg-slate-100 border-0 rounded-xl text-sm font-medium text-slate-400"
                        />
                     </div>
                     <div className="space-y-1.5">
                       <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                         <Smartphone size={11} className="text-teal-500" /> Telefone
                       </Label>
                       <Input 
                         {...register('telefone')} 
                         onChange={handleTelefoneChange}
                         maxLength={15}
                         readOnly={!isEditing}
                         className={cn(
                           "h-11 px-4 bg-slate-50 border-0 rounded-xl text-sm font-medium transition-all",
                           isEditing ? "bg-white ring-1 ring-slate-200 focus-visible:ring-teal-500/30" : "text-slate-400"
                         )}
                       />
                       {errors.telefone && <p className="text-[10px] text-red-500">{errors.telefone.message}</p>}
                     </div>
                  </div>

                  <div className="pt-5 border-t border-slate-100 space-y-4">
                    <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="text-teal-500" size={12} /> Localização
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-semibold text-slate-400 uppercase">CEP</Label>
                        <Input 
                          {...register('cep')} 
                          onChange={handleCepChange}
                          maxLength={9}
                          readOnly={!isEditing}
                          className={cn(
                            "h-11 px-4 bg-slate-50 border-0 rounded-xl text-sm font-medium transition-all",
                            isEditing ? "bg-white ring-1 ring-slate-200 focus-visible:ring-teal-500/30" : "text-slate-400"
                          )}
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-3">
                        <Label className="text-[9px] font-semibold text-slate-400 uppercase">Logradouro</Label>
                        <Input 
                          {...register('logradouro')} 
                          readOnly={!isEditing}
                          className={cn(
                            "h-11 px-4 bg-slate-50 border-0 rounded-xl text-sm font-medium transition-all",
                            isEditing ? "bg-white ring-1 ring-slate-200 focus-visible:ring-teal-500/30" : "text-slate-400"
                          )}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-semibold text-slate-400 uppercase">Número</Label>
                        <Input 
                          {...register('numero')} 
                          readOnly={!isEditing}
                          className={cn(
                            "h-11 px-4 bg-slate-50 border-0 rounded-xl text-sm font-medium transition-all",
                            isEditing ? "bg-white ring-1 ring-slate-200 focus-visible:ring-teal-500/30" : "text-slate-400"
                          )}
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                         <Label className="text-[9px] font-semibold text-slate-400 uppercase">Bairro</Label>
                         <Input 
                           {...register('bairro')} 
                           readOnly={!isEditing}
                           className={cn(
                             "h-11 px-4 bg-slate-50 border-0 rounded-xl text-sm font-medium transition-all",
                             isEditing ? "bg-white ring-1 ring-slate-200 focus-visible:ring-teal-500/30" : "text-slate-400"
                           )}
                         />
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isEditing && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="pt-4">
                        <Button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-xl bg-slate-900 text-white font-semibold uppercase tracking-wider text-xs hover:bg-teal-600">
                          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                          Salvar Alterações
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Area */}
        <div className="space-y-5">
          <Card className="border border-slate-800 shadow-lg rounded-2xl bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent pointer-events-none" />
            <CardContent className="p-8 text-center flex flex-col items-center relative z-10 gap-4">
               <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shadow-xl">
                  <User size={40} className="text-white" />
               </div>
               <div className="space-y-1">
                  <h2 className="text-xl font-bold">{authUser?.nome}</h2>
                  <p className="text-teal-400 text-[10px] font-bold uppercase tracking-widest bg-teal-500/10 px-3 py-1 rounded-full">Responsável</p>
               </div>
               <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mt-2">
                  <Shield className="text-teal-500" size={18} />
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
