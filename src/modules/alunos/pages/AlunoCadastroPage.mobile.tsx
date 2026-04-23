import { useState, useEffect } from 'react'
import { useViaCEP } from '@/hooks/use-viacep'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/modules/auth/AuthContext'
import { useCriarAlunoComResponsavel, useAlunosAtivos } from '../hooks'
import { useLimiteAlunos } from '@/modules/assinatura/hooks'
import { useFiliais } from '@/modules/filiais/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  User,
  Heart,
  Users,
  Building2,
  Eye,
  EyeOff,
  CreditCard,
  Percent,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { mascaraCPF, mascaraTelefone, validarCPF, validarEmail, mascaraCEP, getProximoDiaUtil, formatDateISO } from '@/lib/validacoes'
import { motion } from 'framer-motion'
import { safeStorage, checkRateLimit } from '@/lib/security'
import { rbacService } from '@/modules/rbac/service'

const alunoSchema = z.object({
  nome_completo: z.string().min(3, 'Nome é obrigatório'),
  nome_social: z.string().optional(),
  data_nascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  cpf: z.string().optional().or(z.literal('')),
  rg: z.string().optional(),
  genero: z.string().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  patologias: z.string().optional(),
  medicamentos: z.string().optional(),
  observacoes_saude: z.string().optional(),
  filial_id: z.string().optional(),
  data_ingresso: z.string().optional(),
  responsavel_nome: z.string().min(3, 'Nome do responsável é obrigatório'),
  responsavel_cpf: z.string().min(14, 'CPF inválido'),
  responsavel_telefone: z.string().optional().or(z.literal('')),
  responsavel_email: z.string().email('E-mail obrigatório para acesso ao portal'),
  responsavel_parentesco: z.string().min(1, 'Parentesco é obrigatório'),
  responsavel_senha: z.string().optional(),
  responsavel_financeiro: z.string().min(1, 'Defina se é o responsável financeiro'),
}).refine((data) => !data.cpf || validarCPF(data.cpf), {
  message: 'CPF inválido',
  path: ['cpf'],
}).refine((data) => validarCPF(data.responsavel_cpf), {
  message: 'CPF do responsável inválido',
  path: ['responsavel_cpf'],
}).refine((data) => !data.responsavel_email || validarEmail(data.responsavel_email), {
  message: 'E-mail inválido',
  path: ['responsavel_email'],
})

type AlunoFormValues = z.infer<typeof alunoSchema>

const steps = [
  { title: 'Responsável', icon: Users, description: 'Dados do responsável' },
  { title: 'Aluno', icon: User, description: 'Dados do aluno' },
  { title: 'Endereço', icon: Building2, description: 'Endereço residencial' },
  { title: 'Saúde', icon: Heart, description: 'Informações médicas' },
]

export function AlunoCadastroPageMobile() {
  const [currentStep, setCurrentStep] = useState(() => {
    try {
      const savedStep = localStorage.getItem('aluno_cadastro_step_mobile')
      return savedStep ? parseInt(savedStep, 10) || 0 : 0
    } catch (_e) {
      return 0
    }
  })
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const criarAlunoComResponsavel = useCriarAlunoComResponsavel()
  const { data: totalAtivos } = useAlunosAtivos()
  const { data: limite } = useLimiteAlunos()
  const { data: filiais } = useFiliais()
  const [showPassword, setShowPassword] = useState(false)
  const [responsavelEncontrado, setResponsavelEncontrado] = useState(false)
  const [buscandoCpf, setBuscandoCpf] = useState(false)
  const [_irmaosExistentes, setIrmaosExistentes] = useState<any[]>([])
  
  const [showDraftModal, setShowDraftModal] = useState(false)
  const [draftStateData, setDraftStateData] = useState<any>(null)
  const [showPostCadastroModal, setShowPostCadastroModal] = useState(false)
  const [lastCreatedAluno, setLastCreatedAluno] = useState<any>(null)

  // Segurança & Auditoria
  const [showSecurityConfirm, setShowSecurityConfirm] = useState(false)
  const [formDataCache, setFormDataCache] = useState<AlunoFormValues | null>(null)
  const [lgpdAccepted, setLgpdAccepted] = useState(false)

  const limiteAtingido = limite !== undefined && totalAtivos !== undefined && totalAtivos >= limite

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<AlunoFormValues>({
    resolver: zodResolver(alunoSchema) as any,
    defaultValues: {
      responsavel_nome: '',
      responsavel_cpf: '',
      responsavel_email: '',
      responsavel_parentesco: '',
      responsavel_financeiro: 'sim',
      responsavel_senha: '',
      nome_completo: '',
      data_nascimento: '',
      cep: '',
      data_ingresso: formatDateISO(getProximoDiaUtil(new Date())),
    },
  })

  // Selecionar automaticamente a unidade se houver apenas uma ou se houver uma matriz
  useEffect(() => {
    if (filiais && filiais.length > 0) {
      const currentFilialId = watch('filial_id')
      if (!currentFilialId) {
        if (filiais.length === 1) {
          setValue('filial_id', (filiais[0] as any).id)
        } else {
          const matriz = (filiais as any[]).find(f => f.is_matriz)
          if (matriz) {
            setValue('filial_id', matriz.id)
          }
        }
      }
    }
  }, [filiais, setValue, watch])

  // 1. Interceptar rascunho do localStorage ao montar (Descriptografado)
  useEffect(() => {
    const savedDraft = localStorage.getItem('aluno_cadastro_draft_mobile')
    if (savedDraft) {
      try {
        const parsedDraft = safeStorage.decrypt(savedDraft)
        if (parsedDraft && Object.values(parsedDraft).some(val => val !== '' && val !== null && (val as any)?.length !== 0)) {
          setDraftStateData(parsedDraft)
          setShowDraftModal(true)
        }
      } catch (_e) {
        localStorage.removeItem('aluno_cadastro_draft_mobile')
      }
    }
  }, [])

  const handleContinuarRascunho = () => {
    if (draftStateData) {
      Object.entries(draftStateData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) setValue(key as any, value)
      })
    }
    const savedStep = localStorage.getItem('aluno_cadastro_step_mobile')
    if(savedStep) setCurrentStep(parseInt(savedStep, 10))
    setShowDraftModal(false)
  }

  const handleNovoCadastro = () => {
    localStorage.removeItem('aluno_cadastro_draft_mobile')
    localStorage.removeItem('aluno_cadastro_step_mobile')
    setCurrentStep(0)
    setShowDraftModal(false)
  }

  // 2. Salvar rascunho e passo atual no localStorage (Criptografado)
  const watchAllFields = watch()
  useEffect(() => {
    const draftContent = { ...watchAllFields }
    delete (draftContent as any).responsavel_senha
    
    const encryptedDraft = safeStorage.encrypt(draftContent)
    localStorage.setItem('aluno_cadastro_draft_mobile', encryptedDraft)
    localStorage.setItem('aluno_cadastro_step_mobile', currentStep.toString())
  }, [watchAllFields, currentStep])

  const resetForm = () => {
    localStorage.removeItem('aluno_cadastro_draft_mobile')
    localStorage.removeItem('aluno_cadastro_step_mobile')
    setCurrentStep(0)
    setResponsavelEncontrado(false)
    setIrmaosExistentes([])
    setShowPostCadastroModal(false)
    navigate('/alunos')
  }

  const { fetchAddressByCEP, fetchCitiesByUF, cities, loadingCities, loading: buscandoCep, estados } = useViaCEP()
  const selectedEstado = watch('estado')

  useEffect(() => {
    if (selectedEstado) fetchCitiesByUF(selectedEstado)
  }, [selectedEstado])

  const buscarCep = async (cep: string) => {
    const data = await fetchAddressByCEP(cep)
    if (data && !('error' in data)) {
      setValue('logradouro', data.logradouro || '', { shouldValidate: true })
      setValue('bairro', data.bairro || '', { shouldValidate: true })
      setValue('estado', data.estado || '', { shouldValidate: true })
      setTimeout(() => setValue('cidade', data.cidade || '', { shouldValidate: true }), 500)
      toast.success('Endereço preenchido!')
    }
  }

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = mascaraCEP(e.target.value)
    setValue('cep', valor, { shouldValidate: true })
    if (valor.length === 9) buscarCep(valor)
  }

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>, campo: 'cpf' | 'responsavel_cpf') => {
    setValue(campo, mascaraCPF(e.target.value), { shouldValidate: true })
  }

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('responsavel_telefone', mascaraTelefone(e.target.value), { shouldValidate: true })
  }

  const handleCpfResponsavelBlur = async () => {
    const cpf = watch('responsavel_cpf')
    if (!cpf || cpf.length < 14) return
    setBuscandoCpf(true)
    const cpfLimpo = cpf.replace(/\D/g, '')
    try {
      const { data: resp } = await supabase.from('responsaveis').select('id, nome, email, telefone, user_id').eq('cpf', cpfLimpo).maybeSingle()
      if (resp) {
        if (resp.user_id) {
          setResponsavelEncontrado(true)
          toast.info('Responsável identificado!')
        } else {
          setResponsavelEncontrado(false)
          toast.success('Histórico encontrado!')
        }
        setValue('responsavel_nome', resp.nome || '', { shouldValidate: true })
        setValue('responsavel_email', resp.email || '', { shouldValidate: true })
        setValue('responsavel_telefone', resp.telefone || '', { shouldValidate: true })
        const { data: vinculos } = await supabase.from('aluno_responsavel').select('aluno_id, alunos(nome_completo)').eq('responsavel_id', resp.id).eq('is_financeiro', true)
        if (vinculos && vinculos.length > 0) {
          const alunosList = vinculos.map((v: any) => v.alunos.nome_completo)
          setIrmaosExistentes(alunosList)
          toast.warning('Irmãos detectados!', { description: `Responsável paga: ${alunosList.join(', ')}`, duration: 6000 })
        }
        toast.info('Responsável identificado!')
      } else {
        setResponsavelEncontrado(false)
        setIrmaosExistentes([])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setBuscandoCpf(false)
    }
  }

  const validateStep = async () => {
    const fieldsPerStep: (keyof AlunoFormValues)[][] = [
      ['responsavel_nome', 'responsavel_cpf', 'responsavel_financeiro', 'responsavel_parentesco'],
      ['nome_completo', 'data_nascimento'],
      ['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado'],
      [],
    ]
    if (currentStep === 0 && !responsavelEncontrado) {
      const senha = watch('responsavel_senha')
      if (!senha || senha.length < 8) {
        toast.error('Defina uma senha com mínimo de 8 caracteres.')
        return false
      }
    }
    return await trigger(fieldsPerStep[currentStep])
  }

  const nextStep = async () => {
    const isValid = await validateStep()
    if (isValid && currentStep < steps.length - 1) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => { if (currentStep > 0) setCurrentStep(currentStep - 1) }

  const onSubmit = async (data: AlunoFormValues) => {
    if (currentStep !== steps.length - 1) return
    
    if (!checkRateLimit('aluno_cadastro_submit_mobile')) {
      return
    }

    // Step-up Security
    setFormDataCache(data)
    setShowSecurityConfirm(true)
  }

  const handleFinalSubmit = async () => {
    const data = formDataCache
    if (!data || !authUser || !lgpdAccepted) return
    
    setShowSecurityConfirm(false)
    const toastId = toast.loading('Processando cadastro seguro...')
    
    try {
      if (!authUser.tenantId) { toast.error('Perfil não vinculado a nenhuma escola.', { id: toastId }); return }
      const patologias = data.patologias ? data.patologias.split(',').map(p => p.trim()).filter(Boolean) : null
      const medicamentos = data.medicamentos ? data.medicamentos.split(',').map(m => m.trim()).filter(Boolean) : null
      const result = await criarAlunoComResponsavel.mutateAsync({
        responsavel: {
          cpf: data.responsavel_cpf, nome: data.responsavel_nome,
          telefone: data.responsavel_telefone || null, email: data.responsavel_email || null,
          senha_hash: data.responsavel_senha || '',
          cep: null, logradouro: null, numero: null, complemento: null, bairro: null, cidade: null, estado: null,
        },
        aluno: {
          tenant_id: authUser.tenantId,
          filial_id: data.filial_id || null, nome_completo: data.nome_completo, nome_social: data.nome_social || null,
          data_nascimento: data.data_nascimento, cpf: data.cpf || null, patologias, medicamentos,
          observacoes_saude: data.observacoes_saude || null, status: 'ativo' as const,
          cep: data.cep || null, logradouro: data.logradouro || null, numero: data.numero || null,
          complemento: data.complemento || null, bairro: data.bairro || null, cidade: data.cidade || null, estado: data.estado || null,
          data_ingresso: data.data_ingresso || formatDateISO(getProximoDiaUtil(new Date())),
        } as any,
        grauParentesco: data.responsavel_parentesco || null,
        isFinanceiro: data.responsavel_financeiro === 'sim',
      })
      toast.success('Aluno cadastrado!', { id: toastId })

      // AUDITORIA
      try {
        await rbacService.criarAuditLog({
          tenant_id: authUser.tenantId,
          user_id: authUser.id,
          acao: 'CRIAR_ALUNO',
          recurso_id: result.id,
          valor_anterior: null,
          valor_novo: { 
            nome: data.nome_completo, 
            responsavel: data.responsavel_nome 
          },
          motivo_declarado: 'Cadastro manual (Mobile)',
          ip_address: null,
          user_agent: navigator.userAgent
        })
      } catch (auditErr) {
        console.warn('Falha auditoria (mobile):', auditErr)
      }

      setLastCreatedAluno(data)
      localStorage.removeItem('aluno_cadastro_draft_mobile')
      localStorage.removeItem('aluno_cadastro_step_mobile')
      setShowPostCadastroModal(true)
    } catch (err: any) {
      toast.error('Erro: ' + (err?.message || 'Verifique os campos.'), { id: toastId })
    }
  }

  // Prevenção extra: Não permitir que o ENTER submeta o formulário em campos de input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
      e.preventDefault()
      nextStep()
    }
  }

  if (limiteAtingido) {
    return (
      <div className="min-h-screen bg-slate-50/50 pb-32">
        <div className="mx-auto w-full max-w-[640px] px-4 pt-6">
          <div className="text-center py-20 space-y-4">
            <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
              <Users className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-black text-amber-900">Limite Atingido</h2>
            <p className="text-sm text-amber-700">Atualize seu plano para continuar cadastrando.</p>
            <Button variant="outline" onClick={() => navigate('/alunos')} className="rounded-xl">Voltar</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-32">
      {/* ── Sticky Top ── */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
        <div className="mx-auto w-full max-w-[640px] px-4 py-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/alunos')} className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center">
                <ArrowLeft className="h-4 w-4 text-slate-500" />
              </motion.button>
              <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Novo Aluno</h1>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {currentStep + 1}/{steps.length}
            </span>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-2">
            {steps.map((step, index) => (
              <div key={step.title} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  "h-1.5 rounded-full flex-1 transition-all duration-300",
                  index < currentStep ? "bg-emerald-500" : index === currentStep ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"
                )} />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <Dialog open={showDraftModal} onOpenChange={setShowDraftModal}>
        <DialogContent className="w-[90%] rounded-3xl sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rascunho Detectado</DialogTitle>
            <DialogDescription>
              Encontramos um cadastro em andamento. Deseja continuar de onde parou?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button className="h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold" onClick={handleContinuarRascunho}>
              Continuar de onde parei
            </Button>
            <Button variant="outline" className="h-12 rounded-2xl font-bold" onClick={handleNovoCadastro}>
              Começar Novo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Segurança (Mobile) */}
      <Dialog open={showSecurityConfirm} onOpenChange={setShowSecurityConfirm}>
        <DialogContent className="w-[90%] rounded-3xl sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-500" />
              Confirmar Cadastro
            </DialogTitle>
            <DialogDescription>
              Esta ação registrará os dados sensíveis do aluno e responsável nos logs de auditoria.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center h-5">
                <input
                  id="lgpd_mobile"
                  type="checkbox"
                  checked={lgpdAccepted}
                  onChange={(e) => setLgpdAccepted(e.target.checked)}
                  className="h-5 w-5 rounded-lg border-slate-300 text-indigo-600"
                />
              </div>
              <Label htmlFor="lgpd_mobile" className="text-xs text-slate-600 leading-normal font-medium">
                Confirmo que os dados são verídicas e estão em conformidade com a LGPD.
              </Label>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleFinalSubmit} 
              disabled={!lgpdAccepted}
              className="h-14 rounded-2xl bg-indigo-600 text-white font-bold text-base shadow-lg shadow-indigo-100"
            >
              Confirmar e Salvar
            </Button>
            <Button variant="ghost" className="h-12 rounded-2xl font-bold text-slate-500" onClick={() => setShowSecurityConfirm(false)}>
              Revisar Dados
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Pós-Cadastro */}
      <Dialog open={showPostCadastroModal} onOpenChange={setShowPostCadastroModal}>
        <DialogContent className="w-[90%] rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <Check className="h-5 w-5" />
              Aluno Cadastrado!
            </DialogTitle>
            <DialogDescription>
              O que você deseja fazer agora com <strong>{lastCreatedAluno?.nome_completo}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 rounded-2xl text-sm font-bold"
              onClick={() => navigate('/matriculas', { state: { aluno_id: (lastCreatedAluno as any)?.id, autoOpen: true } })}
            >
              Matricular este aluno agora
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-12 rounded-2xl text-xs font-bold"
              onClick={resetForm}
            >
              Cadastrar outro novo aluno
            </Button>
            <Button 
              variant="ghost" 
              className="w-full h-12 rounded-2xl text-xs text-muted-foreground"
              onClick={() => navigate('/alunos')}
            >
              Ir para lista de alunos
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Form Content ── */}
      <div className="mx-auto w-full max-w-[640px] px-4 pt-6">
        <form 
          onSubmit={handleSubmit(onSubmit)}
          onKeyDown={handleKeyDown}
        >
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Step card title */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-1">
                {(() => { const Icon = steps[currentStep].icon; return <Icon className="h-5 w-5 text-indigo-600" /> })()}
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{steps[currentStep].title}</h2>
              </div>
              <p className="text-sm text-slate-500 ml-8">{steps[currentStep].description}</p>
            </div>

            <div className="space-y-5">
              {/* ── Step 0: Responsável ── */}
              {currentStep === 0 && (
                <>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">CPF do responsável *</Label>
                    <div className="relative">
                      <Input
                        placeholder="000.000.000-00"
                        {...register('responsavel_cpf')}
                        onChange={(e) => {
                          handleCpfChange(e, 'responsavel_cpf')
                          if (e.target.value.length === 14) setTimeout(() => document.getElementById('responsavel_cpf')?.blur(), 100)
                        }}
                        onBlur={handleCpfResponsavelBlur}
                        maxLength={14}
                        inputMode="numeric"
                        className="h-14 rounded-2xl text-base font-medium"
                        id="responsavel_cpf"
                      />
                      {buscandoCpf && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />}
                    </div>
                    {errors.responsavel_cpf && <p className="text-xs text-destructive font-bold">{errors.responsavel_cpf.message}</p>}
                  </div>

                  {responsavelEncontrado && (
                    <div className="bg-sky-50 border border-sky-200 text-sky-800 p-4 rounded-2xl flex items-start gap-3">
                      <Users className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-sm text-sky-900">Acesso Portal Ativo</h4>
                        <p className="text-xs text-sky-700 mt-0.5">Responsável já possui acesso. Não é necessário nova senha.</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome completo *</Label>
                    <Input placeholder="Nome do responsável" {...register('responsavel_nome')} className="h-14 rounded-2xl text-base font-medium" />
                    {errors.responsavel_nome && <p className="text-xs text-destructive font-bold">{errors.responsavel_nome.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Parentesco *</Label>
                    <Select value={watch('responsavel_parentesco')} onValueChange={(v) => setValue('responsavel_parentesco', v, { shouldValidate: true })}>
                      <SelectTrigger className="w-full h-14 rounded-2xl text-base font-medium"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pai">Pai</SelectItem>
                        <SelectItem value="mae">Mãe</SelectItem>
                        <SelectItem value="avo">Avô/Avó</SelectItem>
                        <SelectItem value="tio">Tio/Tia</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Telefone</Label>
                    <Input placeholder="(00) 00000-0000" {...register('responsavel_telefone')} onChange={handleTelefoneChange} maxLength={15} inputMode="tel" className="h-14 rounded-2xl text-base font-medium" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">E-mail *</Label>
                    <Input type="email" placeholder="exemplo@email.com" {...register('responsavel_email')} inputMode="email" className="h-14 rounded-2xl text-base font-medium" />
                    {errors.responsavel_email && <p className="text-xs text-destructive font-bold">{errors.responsavel_email.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <CreditCard className="h-3 w-3 text-emerald-600" /> Responsável financeiro? *
                    </Label>
                    <Select value={watch('responsavel_financeiro')} onValueChange={(v) => setValue('responsavel_financeiro', v, { shouldValidate: true })}>
                      <SelectTrigger className="w-full h-14 rounded-2xl text-base font-medium">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sim">✅ Sim</SelectItem>
                        <SelectItem value="nao">❌ Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {!responsavelEncontrado && (
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Senha de acesso *</Label>
                      <div className="relative">
                        <Input type={showPassword ? 'text' : 'password'} placeholder="Mínimo 8 caracteres" {...register('responsavel_senha')} className="h-14 rounded-2xl text-base font-medium pr-12" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 p-1">
                          {showPassword ? <EyeOff className="h-5 w-5 text-slate-400" /> : <Eye className="h-5 w-5 text-slate-400" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {filiais && filiais.length > 0 && (
                    <div className="space-y-2 pt-4 border-t border-slate-100">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unidade</Label>
                      <Select value={watch('filial_id')} onValueChange={(v) => setValue('filial_id', v)}>
                        <SelectTrigger className="w-full h-14 rounded-2xl text-base font-medium">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {(filiais as any[]).map((f: any) => (
                            <SelectItem key={f.id} value={f.id}>{f.nome_unidade} {f.is_matriz ? '(Matriz)' : ''}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {filiais.length === 1 && (
                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest px-1">Selecionada automaticamente</p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* ── Step 1: Dados do Aluno ── */}
              {currentStep === 1 && (
                <>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome completo *</Label>
                    <Input placeholder="Nome do aluno" {...register('nome_completo')} className="h-14 rounded-2xl text-base font-medium" />
                    {errors.nome_completo && <p className="text-xs text-destructive font-bold">{errors.nome_completo.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome social</Label>
                    <Input placeholder="Nome preferido" {...register('nome_social')} className="h-14 rounded-2xl text-base font-medium" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data de Nascimento *</Label>
                    <Input
                      type="date"
                      {...register('data_nascimento')}
                      onChange={(e) => {
                        const valor = e.target.value
                        if (valor) {
                          const [ano, mes, dia] = valor.split('-')
                          if (ano && ano.length > 4) {
                            setValue('data_nascimento', `${ano.slice(0, 4)}-${mes || ''}-${dia || ''}`)
                            return
                          }
                        }
                        setValue('data_nascimento', valor)
                      }}
                      className="h-14 rounded-2xl text-base font-medium"
                    />
                    {errors.data_nascimento && <p className="text-xs text-destructive font-bold">{errors.data_nascimento.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gênero</Label>
                    <Select onValueChange={(v) => setValue('genero', v)}>
                      <SelectTrigger className="h-14 rounded-2xl text-base font-medium"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                        <SelectItem value="nao_binario">Não-binário</SelectItem>
                        <SelectItem value="nao_informado">Prefiro não informar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">CPF</Label>
                      <Input placeholder="000.000.000-00" {...register('cpf')} onChange={(e) => handleCpfChange(e, 'cpf')} maxLength={14} inputMode="numeric" className="h-14 rounded-2xl text-base font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">RG</Label>
                      <Input placeholder="Nº do RG" {...register('rg')} className="h-14 rounded-2xl text-base font-medium" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data de Ingresso</Label>
                    <Input type="date" {...register('data_ingresso')} className="h-14 rounded-2xl text-base font-medium" />
                  </div>
                </>
              )}

              {/* ── Step 2: Endereço ── */}
              {currentStep === 2 && (
                <>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">CEP</Label>
                    <div className="relative">
                      <Input placeholder="00000-000" {...register('cep')} onChange={handleCepChange} maxLength={9} inputMode="numeric" className="h-14 rounded-2xl text-base font-medium" />
                      {buscandoCep && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Logradouro</Label>
                    <Input placeholder="Rua, Avenida..." {...register('logradouro')} className="h-14 rounded-2xl text-base font-medium" />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nº</Label>
                      <Input placeholder="Nº" {...register('numero')} inputMode="numeric" className="h-14 rounded-2xl text-base font-medium" />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Complemento</Label>
                      <Input placeholder="Apto, Bloco..." {...register('complemento')} className="h-14 rounded-2xl text-base font-medium" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bairro</Label>
                    <Input placeholder="Bairro" {...register('bairro')} className="h-14 rounded-2xl text-base font-medium" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado (UF)</Label>
                      <Select value={watch('estado')} onValueChange={(val) => setValue('estado', val, { shouldValidate: true })}>
                        <SelectTrigger className="h-14 rounded-2xl text-base font-medium"><SelectValue placeholder="UF" /></SelectTrigger>
                        <SelectContent>
                          {estados.map((est) => <SelectItem key={est.value} value={est.value}>{est.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cidade</Label>
                      <Select value={watch('cidade')} onValueChange={(val) => setValue('cidade', val, { shouldValidate: true })} disabled={!selectedEstado || loadingCities}>
                        <SelectTrigger className="h-14 rounded-2xl text-base font-medium"><SelectValue placeholder={loadingCities ? '...' : 'Cidade'} /></SelectTrigger>
                        <SelectContent>
                          {cities.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {/* ── Step 3: Saúde ── */}
              {currentStep === 3 && (
                <>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Patologias</Label>
                    <Textarea placeholder="Asma, rinite, diabetes... (separar por vírgula)" {...register('patologias')} className="rounded-2xl min-h-[100px] text-base" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Medicamentos</Label>
                    <Textarea placeholder="Liste os medicamentos..." {...register('medicamentos')} className="rounded-2xl min-h-[100px] text-base" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Observações de Saúde</Label>
                    <Textarea placeholder="Alergias, restrições alimentares..." {...register('observacoes_saude')} className="rounded-2xl min-h-[100px] text-base" />
                  </div>
                </>
              )}
            </div>
            {/* ── Navigation Buttons (Fixo no Bottom) ── */}
            <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 pb-safe">
              <div className="mx-auto w-full max-w-[640px] px-4 py-3 flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={prevStep} 
                  disabled={currentStep === 0}
                  className="flex-1 h-14 rounded-2xl font-bold text-base border-slate-200"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                </Button>

                {currentStep < steps.length - 1 ? (
                  <Button 
                    key="btn-next-mobile" 
                    type="button" 
                    onClick={nextStep} 
                    className="flex-1 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold text-base text-white shadow-lg shadow-indigo-100"
                  >
                    Próximo <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    key="btn-save-mobile"
                    type="submit" 
                    disabled={isSubmitting} 
                    className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-bold text-base text-white shadow-lg shadow-emerald-100"
                  >
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : <><Check className="mr-2 h-4 w-4" /> Finalizar</>}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </form>
      </div>
    </div>
  )
}
