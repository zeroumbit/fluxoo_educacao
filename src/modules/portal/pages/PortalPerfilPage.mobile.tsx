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
  Save,
  ArrowLeft,
  FileText,
  Eye,
  Download,
  Printer,
  CheckCircle
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
import { ModalContratoEscola } from '../components/ModalContratoEscola'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'

// Helper de vibração (Haptic Feedback - padrão nativo)
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

export function PortalPerfilPageMobile() {
  const { authUser } = useAuth()
  const { responsavel, alunoSelecionado, isLoading } = usePortalContext()
  const updatePerfil = useUpdatePerfil()

  const [isEditing, setIsEditing] = useState(false)
  const [showContratoModal, setShowContratoModal] = useState(false)
  const [escolaInfo, setEscolaInfo] = useState<any>(null)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)

  // Carregar informações da escola para o contrato
  useEffect(() => {
    async function fetchEscola() {
      if (!alunoSelecionado?.tenant_id) return
      const { data } = await supabase.from('escolas').select('*').eq('id', alunoSelecionado.tenant_id).maybeSingle()
      if (data) setEscolaInfo(data)
    }
    fetchEscola()
  }, [alunoSelecionado?.tenant_id])

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
      
      // Feedback visual de sucesso (padrão nativo)
      setShowSaveSuccess(true)
      vibrate([30, 50, 30])
      toast.success('Perfil atualizado!')
      setIsEditing(false)
      
      setTimeout(() => setShowSaveSuccess(false), 2000)
    } catch (err) {
      vibrate([50, 50, 50])
      toast.error('Erro ao atualizar')
      console.error(err)
    }
  }

  // Loading State - Skeleton
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse p-4 pt-[env(safe-area-inset-top,24px)]">
        <div className="h-8 w-32 bg-slate-100 rounded-lg" />
        <div className="h-32 bg-white rounded-[24px]" />
        <div className="h-40 bg-white rounded-[24px]" />
      </div>
    )
  }

  // Empty State
  if (!responsavel) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-20 h-20 rounded-[28px] bg-red-50 flex items-center justify-center mb-6">
          <User className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-[18px] font-bold text-slate-800 mb-2">
          Responsável não encontrado
        </h3>
        <p className="text-[14px] font-medium text-slate-400">
          Não foi possível carregar os dados.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-6 px-4 pt-[env(safe-area-inset-top,24px)] pb-32 mt-4">
        
        {/* 1. Header - Padrão iOS Large Title / Material Top App Bar */}
        <header className="flex items-center gap-4 pt-4 pb-2">
          {/* Back Button - 48px touch target */}
          <button
            onClick={() => window.history.back()}
            className="w-12 h-12 flex items-center justify-center rounded-[16px] bg-slate-50 text-slate-500 active:bg-slate-100 transition-colors touch-manipulation min-h-[48px] min-w-[48px]"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-6 h-6" aria-hidden="true" />
          </button>
          
          <div className="flex flex-col flex-1">
            {/* Large Title - iOS / Headline Small - Material */}
            <h1 className="text-[28px] font-bold text-slate-800 tracking-tight leading-[34px]">
              Meus Dados
            </h1>
            {/* Caption - iOS Caption 1 / Material Body Small */}
            <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
              Informações do Responsável
            </p>
          </div>
        </header>

        {/* 2. Profile Card - Padrão iOS/Android */}
        <Card className="border border-slate-800 shadow-lg rounded-[28px] bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent pointer-events-none" />
          <CardContent className="p-6 text-center flex flex-col items-center gap-4 relative z-10">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shadow-xl">
              <User size={36} className="text-white" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-[18px] font-bold">{authUser?.nome || responsavel?.nome}</h2>
              <Badge className="bg-teal-500/10 text-teal-400 border-teal-500/20 text-[10px] font-bold uppercase tracking-wider px-3 py-1">
                Responsável
              </Badge>
            </div>

            {/* Shield Icon */}
            <div className="w-12 h-12 rounded-[16px] bg-white/5 border border-white/10 flex items-center justify-center">
              <Shield className="text-teal-500" size={20} />
            </div>
          </CardContent>
        </Card>

        {/* 3. Card de Dados Pessoais */}
        <Card className="border border-slate-100 shadow-sm rounded-[24px] bg-white overflow-hidden">
          {/* Header do Card */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[16px] bg-teal-50 text-teal-500 flex items-center justify-center">
                <User size={22} aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-slate-800 leading-tight">Dados Pessoais</h3>
                <p className="text-[11px] text-slate-400 font-medium">Identificação & Contato</p>
              </div>
            </div>
            
            {/* Botão Editar/Cancelar - 48px touch target */}
            {!isEditing ? (
              <Button
                onClick={() => { vibrate(15); setIsEditing(true); }}
                className="w-12 h-12 rounded-[16px] bg-slate-900 text-white flex items-center justify-center shadow-sm active:scale-95 transition-transform touch-manipulation min-h-[48px] min-w-[48px]"
                aria-label="Editar dados"
              >
                <Settings size={20} aria-hidden="true" />
              </Button>
            ) : (
              <Button
                onClick={() => setIsEditing(false)}
                className="w-12 h-12 rounded-[16px] bg-slate-50 text-slate-500 flex items-center justify-center active:bg-slate-100 transition-colors touch-manipulation min-h-[48px] min-w-[48px]"
                aria-label="Cancelar edição"
              >
                <X size={20} aria-hidden="true" />
              </Button>
            )}
          </div>

          {/* Formulário */}
          <CardContent className="p-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Nome e CPF */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    <User size={12} className="text-teal-500" aria-hidden="true" /> Nome
                  </Label>
                  <Input
                    {...register('nome')}
                    readOnly={!isEditing}
                    className={cn(
                      "h-12 px-4 bg-slate-50 border-0 rounded-[16px] text-[15px] font-medium transition-all",
                      isEditing 
                        ? "bg-white ring-1 ring-slate-200 focus-visible:ring-teal-500/30" 
                        : "text-slate-400"
                    )}
                  />
                  {errors.nome && (
                    <p className="text-[12px] text-red-500 font-medium">{errors.nome.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Hash size={12} className="text-teal-500" aria-hidden="true" /> CPF
                  </Label>
                  <Input
                    {...register('cpf')}
                    onChange={handleCpfChange}
                    maxLength={14}
                    readOnly={!isEditing}
                    className={cn(
                      "h-12 px-4 bg-slate-50 border-0 rounded-[16px] text-[15px] font-medium transition-all",
                      isEditing 
                        ? "bg-white ring-1 ring-slate-200 focus-visible:ring-teal-500/30" 
                        : "text-slate-400"
                    )}
                  />
                  {errors.cpf && (
                    <p className="text-[12px] text-red-500 font-medium">{errors.cpf.message}</p>
                  )}
                </div>
              </div>

              {/* Email e Telefone */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Mail size={12} className="text-teal-500" aria-hidden="true" /> E-mail
                  </Label>
                  <Input
                    value={responsavel?.email || ''}
                    readOnly
                    className="h-12 px-4 bg-slate-100 border-0 rounded-[16px] text-[15px] font-medium text-slate-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Smartphone size={12} className="text-teal-500" aria-hidden="true" /> Telefone
                  </Label>
                  <Input
                    {...register('telefone')}
                    onChange={handleTelefoneChange}
                    maxLength={15}
                    readOnly={!isEditing}
                    className={cn(
                      "h-12 px-4 bg-slate-50 border-0 rounded-[16px] text-[15px] font-medium transition-all",
                      isEditing 
                        ? "bg-white ring-1 ring-slate-200 focus-visible:ring-teal-500/30" 
                        : "text-slate-400"
                    )}
                  />
                  {errors.telefone && (
                    <p className="text-[12px] text-red-500 font-medium">{errors.telefone.message}</p>
                  )}
                </div>
              </div>

              {/* Endereço */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="text-teal-500" size={16} aria-hidden="true" />
                  <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    Localização
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                      CEP
                    </Label>
                    <Input
                      {...register('cep')}
                      onChange={handleCepChange}
                      maxLength={9}
                      readOnly={!isEditing}
                      className={cn(
                        "h-12 px-4 bg-slate-50 border-0 rounded-[16px] text-[15px] font-medium transition-all",
                        isEditing 
                          ? "bg-white ring-1 ring-slate-200 focus-visible:ring-teal-500/30" 
                          : "text-slate-400"
                      )}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                      Logradouro
                    </Label>
                    <Input
                      {...register('logradouro')}
                      readOnly={!isEditing}
                      className={cn(
                        "h-12 px-4 bg-slate-50 border-0 rounded-[16px] text-[15px] font-medium transition-all",
                        isEditing 
                          ? "bg-white ring-1 ring-slate-200 focus-visible:ring-teal-500/30" 
                          : "text-slate-400"
                      )}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1 space-y-2">
                    <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                      Número
                    </Label>
                    <Input
                      {...register('numero')}
                      readOnly={!isEditing}
                      className={cn(
                        "h-12 px-4 bg-slate-50 border-0 rounded-[16px] text-[15px] font-medium transition-all",
                        isEditing 
                          ? "bg-white ring-1 ring-slate-200 focus-visible:ring-teal-500/30" 
                          : "text-slate-400"
                      )}
                    />
                  </div>
                  
                  <div className="col-span-2 space-y-2">
                    <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                      Bairro
                    </Label>
                    <Input
                      {...register('bairro')}
                      readOnly={!isEditing}
                      className={cn(
                        "h-12 px-4 bg-slate-50 border-0 rounded-[16px] text-[15px] font-medium transition-all",
                        isEditing 
                          ? "bg-white ring-1 ring-slate-200 focus-visible:ring-teal-500/30" 
                          : "text-slate-400"
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Botão Salvar - Feedback visual */}
              <AnimatePresence>
                {isEditing && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    className="pt-2"
                  >
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-12 rounded-[16px] bg-slate-900 text-white font-bold uppercase tracking-wide text-[11px] shadow-sm active:scale-98 transition-transform touch-manipulation"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                      ) : (
                        <Save className="w-5 h-5 mr-2" aria-hidden="true" />
                      )}
                      {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </CardContent>
        </Card>

        {/* 4. Card do Contrato - Padrão Material Design */}
        <Card className="border border-indigo-100 shadow-sm rounded-[24px] bg-white overflow-hidden">
          <CardContent className="p-6 flex flex-col items-center gap-4">
            {/* Ícone */}
            <div className="w-14 h-14 rounded-[20px] bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-inner">
              <FileText className="w-7 h-7" aria-hidden="true" />
            </div>
            
            <div className="text-center">
              <h3 className="text-[16px] font-bold text-slate-800 tracking-tight">
                Contrato da Escola
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Ano Letivo 2026
              </p>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-2 w-full">
              <Button
                onClick={() => {
                  vibrate(40);
                  setShowContratoModal(true);
                }}
                className="flex-1 h-12 rounded-[16px] bg-slate-50 text-slate-600 hover:bg-indigo-600 hover:text-white border border-slate-100 transition-all font-bold text-[10px] uppercase tracking-wider active:scale-98 touch-manipulation"
              >
                <Eye className="w-4 h-4 mr-2" aria-hidden="true" /> Ver
              </Button>
              <Button
                onClick={() => {
                  vibrate(40);
                  setShowContratoModal(true);
                }}
                className="w-12 h-12 rounded-[16px] border border-slate-100 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all active:scale-95 touch-manipulation"
                aria-label="Baixar contrato"
              >
                <Download className="w-5 h-5" aria-hidden="true" />
              </Button>
              <Button
                onClick={() => {
                  vibrate(40);
                  setShowContratoModal(true);
                }}
                className="w-12 h-12 rounded-[16px] border border-slate-100 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-95 touch-manipulation"
                aria-label="Imprimir contrato"
              >
                <Printer className="w-5 h-5" aria-hidden="true" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Toast Animation - Padrão iOS/Android */}
      <AnimatePresence>
        {showSaveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-24 left-0 right-0 flex justify-center px-4 z-50 pointer-events-none"
          >
            <div className="bg-emerald-500 text-white px-6 py-4 rounded-[20px] shadow-2xl flex items-center gap-3">
              <CheckCircle size={24} aria-hidden="true" />
              <span className="text-[15px] font-bold">Perfil atualizado!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal do Contrato */}
      <ModalContratoEscola
        open={showContratoModal}
        onClose={() => setShowContratoModal(false)}
        responsavel={responsavel}
        tenantId={alunoSelecionado?.tenant_id || ''}
        escolaNome={escolaInfo?.razao_social}
        escolaCnpj={escolaInfo?.cnpj}
        escolaEndereco={escolaInfo?.logradouro}
        alunoNome={alunoSelecionado?.nome_social || alunoSelecionado?.nome_completo}
      />
    </>
  )
}
