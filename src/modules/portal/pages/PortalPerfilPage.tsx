import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/modules/auth/AuthContext'
import { usePortalContext } from '@/modules/portal/context'
import { useUpdatePerfil, useUpdateParentesco } from '@/modules/portal/hooks'
import {
  User,
  Mail,
  Phone,
  Shield,
  LogOut,
  Settings,
  MapPin,
  Loader2,
  Save,
  Check,
  Users,
  ChevronRight,
  Info,
  Smartphone,
  Hash,
  X
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
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

// --- SKELETON LOADING ---
const PerfilSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-32 bg-slate-900 rounded-2xl" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
            <div className="h-64 bg-white border border-slate-100 rounded-2xl" />
            <div className="h-44 bg-white border border-slate-100 rounded-2xl" />
        </div>
        <div className="h-64 bg-white border border-slate-100 rounded-2xl" />
    </div>
  </div>
)

export function PortalPerfilPage() {
  const { authUser, signOut } = useAuth()
  const { responsavel, vinculos, alunoSelecionado } = usePortalContext()
  const updatePerfil = useUpdatePerfil()
  const updateParentesco = useUpdateParentesco()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading] = useState(false) // Simulado
  
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

  const { fetchAddressByCEP, loading: buscandoCep } = useViaCEP()

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

  const handleUpdateParentesco = async (vinculoId: string, novoParentesco: string) => {
    try {
      vibrate(20)
      await updateParentesco.mutateAsync({
        vinculoId,
        grauParentesco: novoParentesco
      })
      toast.success('Parentesco atualizado!')
    } catch (err) {
      toast.error('Erro ao atualizar parentesco')
    }
  }

  const handleSignOut = async () => {
    vibrate(40)
    await signOut()
  }

  if (isLoading) return <PerfilSkeleton />

  return (
    <div className="space-y-5 pb-20 animate-in fade-in duration-500 font-sans">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <BotaoVoltar />
          <div className="flex flex-col gap-0.5">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800">Perfil</h2>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Conta & Identidade</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          
          {/* Main Form Section */}
          <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-500 flex items-center justify-center">
                     <User size={20} />
                  </div>
                  <div>
                     <h3 className="text-base font-bold text-slate-800">Dados Cadastrais</h3>
                     <p className="text-[10px] text-slate-400">Identificação Pessoal</p>
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
               <form id="perfil-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                     <div className="space-y-1.5">
                       <Label htmlFor="nome" className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                         <User size={11} className="text-teal-500" /> Nome
                       </Label>
                       <Input 
                         id="nome" 
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
                       <Label htmlFor="cpf" className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                         <Hash size={11} className="text-teal-500" /> CPF
                       </Label>
                       <Input 
                         id="cpf" 
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
                       <Label htmlFor="email" className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Mail size={11} className="text-teal-500" /> E-mail
                       </Label>
                       <Input 
                          id="email" 
                          value={responsavel?.email || ''} 
                          readOnly 
                          className="h-11 px-4 bg-slate-100 border-0 rounded-xl text-sm font-medium text-slate-400"
                        />
                     </div>
                     <div className="space-y-1.5">
                       <Label htmlFor="telefone" className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                         <Smartphone size={11} className="text-teal-500" /> Telefone
                       </Label>
                       <Input 
                         id="telefone" 
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
                    <div className="flex items-center justify-between">
                       <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                         <MapPin className="text-teal-500" size={12} /> Localização
                       </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="cep" className="text-[9px] font-semibold text-slate-400 uppercase">CEP</Label>
                        <div className="relative">
                          <Input 
                            id="cep" 
                            {...register('cep')} 
                            onChange={handleCepChange}
                            maxLength={9}
                            readOnly={!isEditing}
                            className={cn(
                              "h-11 px-4 bg-slate-50 border-0 rounded-xl text-sm font-medium transition-all",
                              isEditing ? "bg-white ring-1 ring-slate-200 focus-visible:ring-teal-500/30" : "text-slate-400"
                            )}
                          />
                          {buscandoCep && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-teal-500" />}
                        </div>
                      </div>
                      <div className="space-y-1.5 sm:col-span-3">
                        <Label htmlFor="logradouro" className="text-[9px] font-semibold text-slate-400 uppercase">Logradouro</Label>
                        <Input 
                          id="logradouro" 
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
                        <Label htmlFor="numero" className="text-[9px] font-semibold text-slate-400 uppercase">Número</Label>
                        <Input 
                          id="numero" 
                          {...register('numero')} 
                          readOnly={!isEditing}
                          className={cn(
                            "h-11 px-4 bg-slate-50 border-0 rounded-xl text-sm font-medium transition-all",
                            isEditing ? "bg-white ring-1 ring-slate-200 focus-visible:ring-teal-500/30" : "text-slate-400"
                          )}
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="bairro" className="text-[9px] font-semibold text-slate-400 uppercase">Bairro</Label>
                        <Input 
                          id="bairro" 
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
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex gap-3 pt-4"
                      >
                        <Button 
                          type="submit" 
                          disabled={isSubmitting} 
                          className="flex-1 h-12 rounded-xl bg-slate-900 text-white font-semibold uppercase tracking-wider text-xs shadow-sm hover:bg-teal-600 active:scale-95"
                        >
                          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                          Salvar
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </form>
            </CardContent>
          </Card>

        </div>

        {/* Sidebar Context */}
        <div className="space-y-5">
          
          {/* Identity Card */}
          <Card className="border border-slate-800 shadow-lg rounded-2xl bg-slate-900 text-white overflow-hidden relative">
             <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent pointer-events-none" />
             <div className="absolute right-0 top-0 opacity-5 -mr-6 -mt-6 pointer-events-none">
                <Shield size={120} />
             </div>
             
             <CardContent className="p-5 text-center flex flex-col items-center relative z-10 gap-4">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                   <User size={32} className="text-white" />
                </div>
                <div className="space-y-0.5">
                   <h2 className="text-lg font-bold">{authUser?.nome}</h2>
                   <p className="text-teal-400 text-[10px] font-medium uppercase tracking-wider">Responsável</p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                   <Shield className="text-teal-500" size={16} />
                </div>
             </CardContent>
          </Card>

          {/* Students Link */}
          <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden">
             <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                   <Users size={14} className="text-teal-500" /> Vínculos ({vinculos.length})
                </h3>
             </div>
             <CardContent className="p-2">
                <div className="space-y-1">
                   {vinculos.map((v: any) => (
                      <div key={v.id} className="p-3 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-sm">
                               {v.aluno.nome_completo.charAt(0)}
                            </div>
                            <div>
                               <p className="font-bold text-slate-800 text-xs">{v.aluno.nome_social || v.aluno.nome_completo}</p>
                               <Badge className="bg-slate-100 text-slate-400 border-0 text-[7px] font-medium uppercase px-1.5 py-0">{v.aluno_id.slice(-6)}</Badge>
                            </div>
                         </div>
                         <Select 
                           defaultValue={v.grau_parentesco || ''} 
                           onValueChange={(val) => handleUpdateParentesco(v.id, val)}
                         >
                           <SelectTrigger className="w-8 h-8 border-0 bg-transparent flex items-center justify-center text-slate-300 p-0 focus:ring-0">
                             <ChevronRight size={14} />
                           </SelectTrigger>
                           <SelectContent className="rounded-xl border-0 shadow-lg">
                             <SelectItem value="pai">Pai</SelectItem>
                             <SelectItem value="mae">Mãe</SelectItem>
                             <SelectItem value="avo">Avô/Avó</SelectItem>
                             <SelectItem value="tio">Tio/Tia</SelectItem>
                             <SelectItem value="outro">Outro</SelectItem>
                           </SelectContent>
                         </Select>
                      </div>
                   ))}
                </div>
             </CardContent>
          </Card>

          {/* Account Actions */}
          <div className="space-y-2">
             <Button 
               variant="ghost" 
               className="w-full h-11 rounded-xl justify-between px-4 text-slate-400 hover:text-red-500 hover:bg-red-50 group border-0"
               onClick={handleSignOut}
             >
               <span className="text-[10px] font-semibold uppercase tracking-wider flex items-center gap-3">
                  <LogOut size={16} /> Sair
               </span>
               <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
             </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
