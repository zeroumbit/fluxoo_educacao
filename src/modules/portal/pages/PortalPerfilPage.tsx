import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/modules/auth/AuthContext'
import { usePortalContext } from '@/modules/portal/context'
import { useUpdatePerfil, useUpdateParentesco } from '@/modules/portal/hooks'
import {
  User,
  Mail,
  Smartphone,
  Hash,
  X,
  Heart,
  GraduationCap,
  Shield,
  LogOut,
  Settings,
  MapPin,
  Loader2,
  Save,
  Users,
  ChevronRight,
  Calendar
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAlunoCompleto, useUpdateAlunoPortal } from '@/modules/portal/hooks'

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

// --- SKELETON LOADING ---
const PerfilSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-32 bg-slate-100 rounded-2xl" />
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
  const { responsavel, vinculos, selecionarAluno } = usePortalContext()
  const updatePerfil = useUpdatePerfil()
  const updateParentesco = useUpdateParentesco()
  const { data: alunoFull, isLoading: loadingAluno } = useAlunoCompleto()
  const updateAluno = useUpdateAlunoPortal()
  
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingAluno, setIsEditingAluno] = useState(false)
  const [activeTab, setActiveTab] = useState('responsavel')
  
  // Form Responsável
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PerfilFormValues>({
    resolver: zodResolver(perfilSchema),
  })

  // Form Aluno
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

  useEffect(() => {
    if (alunoFull) {
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
    }
  }, [alunoFull, resetAluno])

  const { fetchAddressByCEP, loading: buscandoCep } = useViaCEP()

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>, isAluno = false) => {
    const val = mascaraCEP(e.target.value)
    if (isAluno) setValAluno('cep', val)
    else setValue('cep', val)

    if (val.length === 9) {
      const dados = await fetchAddressByCEP(val)
      if (dados && !('error' in dados)) {
        if (isAluno) {
          setValAluno('logradouro', (dados as any).logradouro || '')
          setValAluno('bairro', (dados as any).bairro || '')
          setValAluno('cidade', (dados as any).cidade || '')
          setValAluno('estado', (dados as any).estado || '')
        } else {
          setValue('logradouro', (dados as any).logradouro || '')
          setValue('bairro', (dados as any).bairro || '')
          setValue('cidade', (dados as any).cidade || '')
          setValue('estado', (dados as any).estado || '')
        }
      }
    }
  }

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>, isAluno = false) => {
    const val = mascaraCPF(e.target.value)
    if (isAluno) setValAluno('cpf', val)
    else setValue('cpf', val)
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

  const onAlunoSubmit = async (data: AlunoFormValues) => {
    try {
      vibrate(30)
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
    } catch (err) {
      vibrate([50, 50, 50])
      toast.error('Erro ao atualizar dados do aluno')
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

  if (loadingAluno) return <PerfilSkeleton />

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

      <Tabs defaultValue="responsavel" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-2xl mb-5 w-fit">
          <TabsTrigger value="responsavel" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-bold uppercase tracking-wider">
            Meus Dados
          </TabsTrigger>
          <TabsTrigger value="aluno" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-bold uppercase tracking-wider">
            Ficha do Aluno
          </TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-5">
            <TabsContent value="responsavel" className="m-0 space-y-5">
              <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-500 flex items-center justify-center">
                         <User size={20} />
                      </div>
                      <div>
                         <h3 className="text-base font-bold text-slate-800">Dados do Responsável</h3>
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
                             onChange={(e) => handleCpfChange(e)}
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
                              onChange={(e) => handleCepChange(e)}
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
                              Salvar Dados Pessoais
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                   </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="aluno" className="m-0 space-y-5">
              <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                         <GraduationCap size={20} />
                      </div>
                      <div>
                         <h3 className="text-base font-bold text-slate-800">Cadastro do Aluno</h3>
                         <p className="text-[10px] text-slate-400">Dados do Estudante</p>
                      </div>
                   </div>
                   {!isEditingAluno ? (
                     <Button 
                        onClick={() => { vibrate(15); setIsEditingAluno(true); }} 
                        className="h-10 px-5 rounded-xl bg-slate-900 text-white font-semibold text-xs uppercase tracking-wider hover:bg-indigo-600 shadow-sm"
                      >
                        <Settings className="mr-2 h-4 w-4" /> Editar
                      </Button>
                   ) : (
                     <Button variant="ghost" onClick={() => setIsEditingAluno(false)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400">
                        <X size={18} />
                      </Button>
                   )}
                </div>
                
                <CardContent className="p-4">
                   <form onSubmit={handleSubAluno(onAlunoSubmit)} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                         <div className="space-y-1.5">
                           <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Nome Completo</Label>
                           <Input 
                             {...regAluno('nome_completo')} 
                             readOnly={!isEditingAluno}
                             className={cn("h-11 px-4 bg-slate-50 border-0 rounded-xl text-sm transition-all", isEditingAluno ? "bg-white ring-1 ring-slate-200" : "text-slate-400")}
                           />
                           {errAluno.nome_completo && <p className="text-[10px] text-red-500">{errAluno.nome_completo.message}</p>}
                         </div>
                         <div className="space-y-1.5">
                           <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Data de Nascimento</Label>
                           <Input 
                             type="date"
                             {...regAluno('data_nascimento')} 
                             readOnly={!isEditingAluno}
                             className={cn("h-11 px-4 bg-slate-50 border-0 rounded-xl text-sm transition-all", isEditingAluno ? "bg-white ring-1 ring-slate-200" : "text-slate-400")}
                           />
                         </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-1.5">
                           <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">CPF</Label>
                           <Input 
                             {...regAluno('cpf')} 
                             onChange={(e) => handleCpfChange(e, true)}
                             maxLength={14}
                             readOnly={!isEditingAluno}
                             className={cn("h-11 px-4 bg-slate-50 border-0 rounded-xl text-sm transition-all", isEditingAluno ? "bg-white ring-1 ring-slate-200" : "text-slate-400")}
                           />
                         </div>
                         <div className="space-y-1.5">
                           <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">RG</Label>
                           <Input 
                             {...regAluno('rg')} 
                             readOnly={!isEditingAluno}
                             className={cn("h-11 px-4 bg-slate-50 border-0 rounded-xl text-sm transition-all", isEditingAluno ? "bg-white ring-1 ring-slate-200" : "text-slate-400")}
                           />
                         </div>
                      </div>

                      <div className="pt-5 border-t border-slate-100 space-y-4">
                        <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <MapPin className="text-indigo-500" size={12} /> Endereço Residencial
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-[9px] font-semibold text-slate-400 uppercase">CEP</Label>
                            <Input 
                              {...regAluno('cep')} 
                              onChange={(e) => handleCepChange(e, true)}
                              maxLength={9}
                              readOnly={!isEditingAluno}
                              className={cn("h-11 px-4 bg-slate-50 border-0 rounded-xl text-sm", isEditingAluno ? "bg-white ring-1 ring-indigo-200" : "text-slate-400")}
                            />
                          </div>
                          <div className="space-y-1.5 sm:col-span-3">
                            <Label className="text-[9px] font-semibold text-slate-400 uppercase">Logradouro</Label>
                            <Input {...regAluno('logradouro')} readOnly={!isEditingAluno} className="h-11 px-4 bg-slate-50 border-0 rounded-xl text-sm" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                           <Label className="text-[9px] font-semibold text-slate-400 uppercase">Número</Label>
                           <Input {...regAluno('numero')} readOnly={!isEditingAluno} className="h-11 px-4 bg-slate-50 border-0 rounded-xl text-sm transition-all" />
                         </div>
                         <div className="space-y-1.5 sm:col-span-2">
                           <Label className="text-[9px] font-semibold text-slate-400 uppercase">Complemento</Label>
                           <Input {...regAluno('complemento')} readOnly={!isEditingAluno} className="h-11 px-4 bg-slate-50 border-0 rounded-xl text-sm transition-all" />
                         </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                         <div className="space-y-1.5">
                           <Label className="text-[9px] font-semibold text-slate-400 uppercase">Bairro</Label>
                           <Input {...regAluno('bairro')} readOnly={!isEditingAluno} className="h-11 px-4 bg-slate-50 border-0 rounded-xl text-sm transition-all" />
                         </div>
                         <div className="space-y-1.5">
                           <Label className="text-[9px] font-semibold text-slate-400 uppercase">Cidade</Label>
                           <Input {...regAluno('cidade')} readOnly={!isEditingAluno} className="h-11 px-4 bg-slate-50 border-0 rounded-xl text-sm transition-all" />
                         </div>
                         <div className="space-y-1.5">
                           <Label className="text-[9px] font-semibold text-slate-400 uppercase">Estado</Label>
                           <Input {...regAluno('estado')} readOnly={!isEditingAluno} className="h-11 px-4 bg-slate-50 border-0 rounded-xl text-sm transition-all" maxLength={2} />
                         </div>
                      </div>
                      
                      <div className="pt-5 border-t border-slate-100 space-y-4">
                        <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Heart className="text-red-500" size={12} /> Saúde & Atenção
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                             <Label className="text-[9px] font-semibold text-slate-400 uppercase">Patologias</Label>
                             <Input {...regAluno('patologias')} readOnly={!isEditingAluno} className="h-11 px-4 bg-slate-50 border-0 rounded-xl text-sm" placeholder="Ex: Asma, Alergias..." />
                          </div>
                          <div className="space-y-1.5">
                             <Label className="text-[9px] font-semibold text-slate-400 uppercase">Medicamentos</Label>
                             <Input {...regAluno('medicamentos')} readOnly={!isEditingAluno} className="h-11 px-4 bg-slate-50 border-0 rounded-xl text-sm" placeholder="Ex: Dipirona, Insulina..." />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                           <Label className="text-[9px] font-semibold text-slate-400 uppercase">Observações Gerais</Label>
                           <textarea {...regAluno('observacoes_saude')} readOnly={!isEditingAluno} className="w-full h-24 p-4 bg-slate-50 border-0 rounded-xl text-sm resize-none" />
                        </div>
                      </div>

                      <AnimatePresence>
                        {isEditingAluno && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="pt-4">
                             <Button type="submit" disabled={subAluno} className="w-full h-12 rounded-xl bg-indigo-600 text-white font-semibold uppercase tracking-wider text-xs hover:bg-indigo-700">
                                {subAluno ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                                Salvar Cadastro do Aluno
                             </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                   </form>
                </CardContent>
              </Card>
            </TabsContent>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-5">
            <Card className="border border-slate-800 shadow-lg rounded-2xl bg-slate-900 text-white overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent pointer-events-none" />
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

            <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden">
               <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                     <Users size={14} className="text-teal-500" /> Vínculos ({vinculos?.length || 0})
                  </h3>
               </div>
               <CardContent className="p-2">
                  <div className="space-y-1">
                     {vinculos?.map((v: any) => (
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
                           <Button 
                              variant="ghost" 
                              size="icon" 
                              className="w-8 h-8 rounded-lg text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 transition-all"
                              onClick={() => { 
                                 vibrate(10); 
                                 selecionarAluno(v);
                                 setActiveTab('ficha-aluno'); 
                               }}
                           >
                              <ChevronRight size={16} />
                           </Button>
                        </div>
                     ))}
                  </div>
               </CardContent>
            </Card>

          </div>
        </div>
      </Tabs>
    </div>
  )
}
