import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Loader2,
  User,
  ShoppingBag,
  Briefcase,
  GraduationCap,
  Building2,
  Phone,
  Mail,
  Lock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  MapPin,
  CreditCard,
  Calendar,
  Target,
  History,
  Palette,
  Eye,
  EyeOff,
  Check,
  Upload,
  Gift
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { DISPONIBILIDADE_TIPOS, AREAS_INTERESSE } from '@/modules/curriculos/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useViaCEP } from '@/hooks/use-viacep'
import { mascaraCNPJ, mascaraTelefone, mascaraCEP, validarCNPJ, mascaraCPF, validarCPF } from '@/lib/validacoes'
import { strongPasswordSchema, getPasswordStrengthTips } from '@/lib/password-validation'

// Categorias pré-definidas para Lojistas
const CATEGORIAS_LOJISTA = [
  { value: 'livraria', label: 'Livraria' },
  { value: 'papelaria', label: 'Papelaria' },
  { value: 'vestuario', label: 'Vestuário' },
  { value: 'decoracao', label: 'Decoração' },
]

// Schema para Acesso (Geral)
const acessoSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: strongPasswordSchema,
  confirmPassword: z.string(),
  termos: z.boolean().refine(val => val === true, {
    message: 'Você deve aceitar os termos'
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
})

// Schema para Profissional (todos os campos originais)
const profissionalSchema = z.object({
  // Step 2
  nome: z.string().min(3, 'Nome muito curto'),
  contato_email: z.string().email('E-mail inválido'),
  telefone: z.string().min(10, 'Telefone inválido'),
  cpf: z.string().min(11, 'CPF inválido'),
  // Step 3
  disponibilidade_tipo: z.array(z.string()).min(1, 'Selecione pelo menos um tipo'),
  // Step 4
  areas_interesse: z.array(z.string()).min(1, 'Selecione pelo menos uma área'),
  // Step 5
  pretensao_salarial: z.string().optional().default(''),
  resumo_profissional: z.string().max(2000, 'Máximo 2000 caracteres').optional().default(''),
  // Step 6 - Opcional
  formacao: z.array(z.object({
    nivel: z.string(),
    instituicao: z.string(),
    ano_conclusao: z.string(),
    area: z.string()
  })).optional().default([]),
  // Step 7 - Opcional
  experiencia: z.array(z.object({
    empresa: z.string(),
    cargo: z.string(),
    periodo: z.string(),
    atividades: z.string()
  })).optional().default([]),
  // Step 8 - Opcional
  habilidades: z.array(z.string()).optional().default([]),
  certificacoes: z.array(z.object({
    nome: z.string(),
    instituicao: z.string(),
    ano: z.string()
  })).optional().default([]),
  // Step 9
  busca_vaga: z.boolean().default(true),
  presta_servico: z.boolean().default(false),
})

// Schema para Lojista (com endereço e pagamento)
const lojistaSchema = z.object({
  // Step 2
  razao_social: z.string().min(3, 'Razão Social obrigatória'),
  nome_fantasia: z.string().optional(),
  cnpj: z.string().min(14, 'CNPJ inválido'),
  categoria: z.string().min(1, 'Selecione uma categoria'),
  // Step 3 - Endereço
  cep: z.string().min(9, 'CEP inválido'),
  logradouro: z.string().min(3, 'Logradouro obrigatório'),
  numero: z.string().min(1, 'Número obrigatório'),
  complemento: z.string().optional(),
  bairro: z.string().min(2, 'Bairro obrigatório'),
  cidade: z.string().min(2, 'Cidade obrigatória'),
  estado: z.string().length(2, 'UF obrigatória'),
  // Step 4 - Contato
  email_contato: z.string().email('E-mail inválido'),
  telefone_contato: z.string().min(10, 'Telefone inválido'),
  descricao: z.string().optional(),
  // Step 6 - Pagamento (Gratuito por enquanto)
  metodo_pagamento: z.enum(['gratuito']).default('gratuito'),
})

const baseSchema = z.object({
  acesso: acessoSchema,
})

const registrationSchema = z.discriminatedUnion('tipo', [
  baseSchema.extend({
    tipo: z.literal('profissional'),
    profissional: profissionalSchema,
    lojista: z.any().optional()
  }),
  baseSchema.extend({
    tipo: z.literal('lojista'),
    lojista: lojistaSchema,
    profissional: z.any().optional()
  })
])

type RegistrationForm = z.infer<typeof registrationSchema>

const stepsProfissional = [
  { title: 'Acesso', icon: Lock },
  { title: 'Dados Básicos', icon: User },
  { title: 'Disponibilidade', icon: Calendar },
  { title: 'Áreas de Interesse', icon: Target },
  { title: 'Pretensão e Resumo', icon: FileText },
  { title: 'Formação', icon: GraduationCap },
  { title: 'Experiência', icon: History },
  { title: 'Habilidades', icon: Palette },
  { title: 'Finalização', icon: CheckCircle2 }
]

const stepsLojista = [
  { title: 'Acesso', icon: Lock },
  { title: 'Dados da Empresa', icon: Building2 },
  { title: 'Endereço', icon: MapPin },
  { title: 'Contato', icon: Phone },
  { title: 'Pagamento', icon: CreditCard }
]

export function MarketplaceCadastroPage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tipoAtivo, setTipoAtivo] = useState<'profissional' | 'lojista'>('profissional')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    shouldUnregister: false,
    defaultValues: {
      tipo: 'profissional',
      acesso: { email: '', password: '', confirmPassword: '', termos: false },
      profissional: {
        nome: '',
        contato_email: '',
        telefone: '',
        cpf: '',
        disponibilidade_tipo: [],
        areas_interesse: [],
        pretensao_salarial: '',
        resumo_profissional: '',
        formacao: [],
        experiencia: [],
        habilidades: [],
        certificacoes: [],
        busca_vaga: true,
        presta_servico: false,
      },
      lojista: {
        razao_social: '',
        cnpj: '',
        categoria: '',
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        email_contato: '',
        telefone_contato: '',
        descricao: '',
        metodo_pagamento: 'gratuito'
      }
    }
  })

  // PERSISTÊNCIA: Recuperar dados ao carregar
  useEffect(() => {
    const savedData = localStorage.getItem('fluxoo_marketplace_cadastro_data')
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)
        // Não restauramos a senha por segurança
        if (parsedData.acesso) {
          delete parsedData.acesso.password
          delete parsedData.acesso.confirmPassword
        }
        form.reset({ ...form.getValues(), ...parsedData })
        
        // Restaurar estado da UI
        const savedStep = localStorage.getItem('fluxoo_marketplace_cadastro_step')
        const savedTipo = localStorage.getItem('fluxoo_marketplace_cadastro_tipo')
        if (savedStep) setCurrentStep(Number(savedStep))
        if (savedTipo) setTipoAtivo(savedTipo as any)
        
        console.log('Cadastro do Marketplace recuperado do LocalStorage')
      } catch (e) {
        console.error('Erro ao restaurar dados salvos:', e)
      }
    }
  }, [])

  // PERSISTÊNCIA: Salvar dados a cada mudança
  const formData = form.watch()
  useEffect(() => {
    // Clone para remover senhas antes de salvar
    const dataToSave = JSON.parse(JSON.stringify(formData))
    if (dataToSave.acesso) {
      delete dataToSave.acesso.password
      delete dataToSave.acesso.confirmPassword
    }
    
    localStorage.setItem('fluxoo_marketplace_cadastro_data', JSON.stringify(dataToSave))
    localStorage.setItem('fluxoo_marketplace_cadastro_step', currentStep.toString())
    localStorage.setItem('fluxoo_marketplace_cadastro_tipo', tipoAtivo)
  }, [formData, currentStep, tipoAtivo])

  const { fields: fieldsFormacao, append: appendFormacao, remove: removeFormacao } = useFieldArray({
    control: form.control,
    name: "profissional.formacao"
  })

  const { fields: fieldsExperiencia, append: appendExperiencia, remove: removeExperiencia } = useFieldArray({
    control: form.control,
    name: "profissional.experiencia"
  })

  const { fields: fieldsCertificacao, append: appendCertificacao, remove: removeCertificacao } = useFieldArray({
    control: form.control,
    name: "profissional.certificacoes"
  })

  const { fetchAddressByCEP, estados, cities, fetchCitiesByUF, loading: buscandoCep, loadingCities } = useViaCEP()

  const stepsSet = tipoAtivo === 'profissional' ? stepsProfissional : stepsLojista
  const selectedEstado = form.watch('lojista.estado')
  const selectedCategoria = form.watch('lojista.categoria')

  useEffect(() => {
    if (selectedEstado) {
      fetchCitiesByUF(selectedEstado)
    }
  }, [selectedEstado])

  // Máscaras
  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue('lojista.cnpj', mascaraCNPJ(e.target.value), { shouldValidate: true })
  }

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue('profissional.cpf', mascaraCPF(e.target.value), { shouldValidate: true })
  }

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const field = tipoAtivo === 'profissional' ? 'profissional.telefone' : 'lojista.telefone_contato'
    form.setValue(field as any, mascaraTelefone(e.target.value), { shouldValidate: true })
  }

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = mascaraCEP(e.target.value)
    form.setValue('lojista.cep', valor, { shouldValidate: true })
    if (valor.length === 9) buscarCep(valor)
  }

  const buscarCep = async (cep: string) => {
    const data = await fetchAddressByCEP(cep)
    if (data && !('error' in data)) {
      form.setValue('lojista.logradouro', data.logradouro || '', { shouldValidate: true })
      form.setValue('lojista.bairro', data.bairro || '', { shouldValidate: true })
      form.setValue('lojista.estado', data.estado || '', { shouldValidate: true })
      form.setValue('lojista.cidade', data.cidade || '', { shouldValidate: true })
      toast.success('Endereço preenchido automaticamente!')
    } else if (data && 'error' in data) {
      toast.error(data.error)
    }
  }

  // Validação por step
  const fieldsPerStep = [
    ['acesso.email', 'acesso.password', 'acesso.confirmPassword'],
    ...(tipoAtivo === 'profissional' ? [
      ['profissional.nome', 'profissional.contato_email', 'profissional.telefone', 'profissional.cpf'],
      ['profissional.disponibilidade_tipo'],
      ['profissional.areas_interesse'],
      [], // Resumo opcional
      [], // Formação opcional
      [], // Experiência opcional
      [], // Habilidades opcional
      []  // Finalização
    ] : [
      ['lojista.razao_social', 'lojista.cnpj', 'lojista.categoria'],
      ['lojista.cep', 'lojista.logradouro', 'lojista.numero', 'lojista.bairro', 'lojista.cidade', 'lojista.estado'],
      ['lojista.email_contato', 'lojista.telefone_contato'],
      []  // Pagamento (gratuito)
    ])
  ]

  const nextStep = async () => {
    const fieldsToValidate = fieldsPerStep[currentStep]
    const isValid = await form.trigger(fieldsToValidate as any)

    // Se for o último step, não avança, apenas submete
    if (currentStep === stepsSet.length - 1) {
      // Força validação de TODOS os campos obrigatórios do lojista/profissional
      const allValid = await form.trigger()
      if (!allValid) {
        toast.error('Preencha todos os campos obrigatórios corretamente')
        return
      }
      // Se válido, o form será submetido pelo botão
      return
    }

    if (isValid) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep === 0) {
      navigate('/login')
    } else {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleFinalSubmit = async (data: RegistrationForm) => {
    setIsSubmitting(true)
    try {
      // 1. Criar Usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.acesso.email,
        password: data.acesso.password,
        options: {
          data: {
            nome: tipoAtivo === 'profissional' ? data.profissional?.nome : data.lojista?.razao_social,
            role: tipoAtivo === 'profissional' ? 'profissional' : 'lojista'
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Erro ao criar usuário')

      const userId = authData.user.id

      // 2. Criar Perfil Específico
      if (data.tipo === 'profissional') {
        const { error: profError } = await supabase.from('curriculos').insert({
          user_id: userId,
          busca_vaga: data.profissional?.busca_vaga,
          presta_servico: data.profissional?.presta_servico,
          telefone: data.profissional?.telefone,
          cpf: data.profissional?.cpf,
          areas_interesse: data.profissional?.areas_interesse,
          disponibilidade_tipo: data.profissional?.disponibilidade_tipo,
          pretensao_salarial: data.profissional?.pretensao_salarial ? parseFloat(data.profissional.pretensao_salarial) : null,
          resumo_profissional: data.profissional?.resumo_profissional,
          formacao: data.profissional?.formacao,
          experiencia: data.profissional?.experiencia,
          certificacoes: data.profissional?.certificacoes,
          habilidades: data.profissional?.habilidades,
          is_publico: true,
          is_ativo: true,
          tenant_id: null,
          funcionario_id: null,
          disponibilidade_emprego: false,
          observacoes: null
        } as any)
        if (profError) throw profError
      } else if (data.tipo === 'lojista') {
        const { error: lojError } = await supabase.from('lojistas').insert({
          user_id: userId,
          razao_social: data.lojista?.razao_social,
          nome_fantasia: data.lojista?.nome_fantasia,
          cnpj: data.lojista?.cnpj,
          email: data.lojista?.email_contato,
          telefone: data.lojista?.telefone_contato,
          categoria: data.lojista?.categoria,
          descricao: data.lojista?.descricao,
          status: 'ativo',
          plano_id: 'free',
          metodo_pagamento: 'gratuito'
        } as any)
        if (lojError) throw lojError
      }

      toast.success('Cadastro realizado com sucesso! Verifique seu e-mail para confirmar a conta.')
      
      // Limpar persistência
      localStorage.removeItem('fluxoo_marketplace_cadastro_data')
      localStorage.removeItem('fluxoo_marketplace_cadastro_step')
      localStorage.removeItem('fluxoo_marketplace_cadastro_tipo')

      // Delay para navegação
      setTimeout(() => {
        window.location.href = '/login'
      }, 1500)
    } catch (err: any) {
      console.error('Erro no cadastro:', err)
      
      let message = err.message || 'Erro ao processar cadastro'
      
      if (message.includes('User already registered') || message.includes('already registered')) {
        message = 'Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail.'
      } else if (message.includes('password is too short')) {
        message = 'A senha deve ter pelo menos 8 caracteres.'
      }

      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handler para quando o form não é válido
  const handleInvalidSubmit = (errors: any) => {
    console.error('=== ERROS DE VALIDAÇÃO ===')
    console.error('Errors completos:', JSON.stringify(errors, null, 2))
    
    // Extrai erros aninhados (profissional, lojista, acesso)
    let errorMessage = 'Preencha todos os campos obrigatórios'
    
    if (errors.profissional) {
      console.error('Erros em profissional:', errors.profissional)
      const profErrors = errors.profissional
      const fieldNames = Object.keys(profErrors)
      if (fieldNames.length > 0) {
        const firstField = fieldNames[0]
        console.error(`Campo com erro: ${firstField}`, profErrors[firstField])
        errorMessage = profErrors[firstField]?.message || `Campo obrigatório: ${firstField}`
      }
    } else if (errors.lojista) {
      console.error('Erros em lojista:', errors.lojista)
      const lojErrors = errors.lojista
      const fieldNames = Object.keys(lojErrors)
      if (fieldNames.length > 0) {
        const firstField = fieldNames[0]
        console.error(`Campo com erro: ${firstField}`, lojErrors[firstField])
        errorMessage = lojErrors[firstField]?.message || `Campo obrigatório: ${firstField}`
      }
    } else if (errors.acesso) {
      console.error('Erros em acesso:', errors.acesso)
      const acessoErrors = errors.acesso
      const fieldNames = Object.keys(acessoErrors)
      if (fieldNames.length > 0) {
        const firstField = fieldNames[0]
        console.error(`Campo com erro: ${firstField}`, acessoErrors[firstField])
        errorMessage = acessoErrors[firstField]?.message || `Campo obrigatório: ${firstField}`
      }
    }
    
    console.error('=== FIM ERROS ===')
    toast.error(errorMessage)
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-12">
      <div className="w-full max-w-[900px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-zinc-100 flex flex-col md:flex-row">

        {/* Sidebar - Tema Preto/Zinc-900 */}
        <div className="hidden md:flex md:w-1/3 bg-gradient-to-b from-zinc-900 to-zinc-800 p-8 flex-col justify-between text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-6">
              <ShoppingBag className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-xl font-bold mb-2">Seja Parceiro!</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">Venda produtos ou ofereça seus serviços na Fluxoo.</p>
          </div>

          <div className="space-y-3 relative z-10 mt-8">
            {stepsSet.map((step, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-3 transition-opacity duration-300",
                  i === currentStep ? "opacity-100" : "opacity-40"
                )}
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-full border flex items-center justify-center text-xs font-bold transition-colors",
                    i <= currentStep ? "bg-white text-zinc-900 border-white" : "border-white/30"
                  )}
                >
                  {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">{step.title}</span>
              </div>
            ))}
          </div>

          <div className="absolute top-0 right-0 p-8 opacity-5">
            <ShoppingBag size={180} />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 md:p-10">
          {/* Mobile Header */}
          <div className="md:hidden flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-white" />
              </div>
              <h1 className="font-bold text-lg">Fluxoo Parceiro</h1>
            </div>
            <span className="text-xs font-semibold text-zinc-500 uppercase">
              Passo {currentStep + 1} de {stepsSet.length}
            </span>
          </div>

          {/* Step Header */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-zinc-900 mb-1">{stepsSet[currentStep].title}</h3>
            <p className="text-sm text-muted-foreground">Preencha as informações necessárias</p>
          </div>

          <form 
            onSubmit={form.handleSubmit(handleFinalSubmit, handleInvalidSubmit)} 
            className="space-y-6"
          >
            <div className="min-h-[350px] flex flex-col justify-center animate-in fade-in slide-in-from-right-4 duration-500">

              {/* STEP 1: Acesso + Escolha do Tipo */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  {/* Tabs para escolha do tipo */}
                  <Tabs
                    value={tipoAtivo}
                    onValueChange={(v: any) => {
                      setTipoAtivo(v)
                      form.setValue('tipo', v)
                    }}
                  >
                    <TabsList className="grid w-full grid-cols-2 h-11 bg-zinc-100 p-1">
                      <TabsTrigger value="profissional" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Briefcase size={16} /> Profissional
                      </TabsTrigger>
                      <TabsTrigger value="lojista" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Building2 size={16} /> Lojista
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-zinc-500 shrink-0 mt-0.5" />
                    <div className="text-sm text-zinc-600">
                      <p className="font-bold mb-1">E-mail de acesso</p>
                      <p>Usaremos este e-mail para acesso e comunicação. Você receberá um link de confirmação.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-zinc-700">E-mail de Acesso *</Label>
                      <Input
                        placeholder="seu@email.com"
                        {...form.register('acesso.email')}
                        className={cn("h-11 rounded-xl", form.formState.errors.acesso?.email ? 'border-red-500 bg-red-50/10' : 'border-zinc-200')}
                      />
                      {form.formState.errors.acesso?.email && (
                        <p className="text-xs text-red-500 flex items-center gap-1 font-medium mt-1">
                          {form.formState.errors.acesso.email.message}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-zinc-700">Senha *</Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="8+ caracteres"
                            {...form.register('acesso.password')}
                            className={cn("h-11 rounded-xl pr-10", form.formState.errors.acesso?.password ? 'border-red-500' : 'border-zinc-200')}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {form.formState.errors.acesso?.password && (
                          <p className="text-xs text-red-500 font-medium mt-1">
                            {form.formState.errors.acesso.password.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-zinc-700">Confirmar Senha *</Label>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Repita a senha"
                            {...form.register('acesso.confirmPassword')}
                            className={cn("h-11 rounded-xl pr-10", form.formState.errors.acesso?.confirmPassword ? 'border-red-500' : 'border-zinc-200')}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                          >
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {form.formState.errors.acesso?.confirmPassword && (
                          <p className="text-xs text-red-500 font-medium mt-1">
                            {form.formState.errors.acesso.confirmPassword.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Dicas de senha forte */}
                    <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-3 space-y-2">
                      <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-wider">Dicas de Senha Forte:</p>
                      <ul className="space-y-1">
                        {getPasswordStrengthTips().slice(0, 3).map((tip, idx) => (
                          <li key={idx} className="text-[10px] text-zinc-600 flex items-start gap-1.5">
                            <Check className="h-3 w-3 flex-shrink-0 mt-0.5" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Termos e Privacidade no Passo 1 */}
                    <div className="space-y-4 pt-2">
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="termos-cadastro"
                          checked={form.watch('acesso.termos')}
                          onCheckedChange={(checked) => form.setValue('acesso.termos', checked === true)}
                          className={form.formState.errors.acesso?.termos ? 'border-red-500' : ''}
                        />
                        <Label htmlFor="termos-cadastro" className="text-sm font-medium cursor-pointer leading-tight text-zinc-600">
                          Li e concordo com os{' '}
                          <a href="/termos-de-uso" target="_blank" className="text-indigo-600 hover:underline">Termos de Uso</a> e{' '}
                          <a href="/politica-privacidade" target="_blank" className="text-indigo-600 hover:underline">Política de Privacidade</a>.
                        </Label>
                      </div>
                      {form.formState.errors.acesso?.termos && (
                        <p className="text-xs text-red-500 flex items-center gap-1 font-medium">
                          <AlertCircle size={12} /> {form.formState.errors.acesso.termos.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Profissional Steps */}
              {tipoAtivo === 'profissional' && currentStep >= 1 && (
                <>
                  {/* Passo 2: Dados Básicos */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                          <p className="font-bold mb-1">Dados válidos são obrigatórios</p>
                          <p>Seu CPF e telefone serão verificados. Use apenas números.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nome Completo</Label>
                          <Input
                            placeholder="Seu nome"
                            {...form.register('profissional.nome')}
                            className={(form.formState.errors.profissional as any)?.nome ? 'border-red-500' : ''}
                          />
                          {(form.formState.errors.profissional as any)?.nome && (
                            <p className="text-xs text-red-500">{(form.formState.errors.profissional as any).nome.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>CPF</Label>
                          <Input
                            placeholder="000.000.000-00"
                            {...form.register('profissional.cpf')}
                            onChange={handleCpfChange}
                            className={(form.formState.errors.profissional as any)?.cpf ? 'border-red-500' : ''}
                          />
                          {(form.formState.errors.profissional as any)?.cpf && (
                            <p className="text-xs text-red-500">{(form.formState.errors.profissional as any).cpf.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Telefone / WhatsApp</Label>
                          <Input
                            placeholder="(11) 99999-9999"
                            {...form.register('profissional.telefone')}
                            onChange={handleTelefoneChange}
                            className={(form.formState.errors.profissional as any)?.telefone ? 'border-red-500' : ''}
                          />
                          {(form.formState.errors.profissional as any)?.telefone && (
                            <p className="text-xs text-red-500">{(form.formState.errors.profissional as any).telefone.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>E-mail de Contato</Label>
                          <Input
                            placeholder="email@contato.com"
                            {...form.register('profissional.contato_email')}
                            className={(form.formState.errors.profissional as any)?.contato_email ? 'border-red-500' : ''}
                          />
                          {(form.formState.errors.profissional as any)?.contato_email && (
                            <p className="text-xs text-red-500">{(form.formState.errors.profissional as any).contato_email.message}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Passo 3: Disponibilidade */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-start gap-3">
                        <GraduationCap className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-indigo-800">
                          <p className="font-bold mb-1">Selecione sua disponibilidade</p>
                          <p>Informe quando você está disponível para trabalhar.</p>
                        </div>
                      </div>

                      <Label className="text-lg font-bold">Qual sua disponibilidade?</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {DISPONIBILIDADE_TIPOS.map(tipo => (
                          <div key={tipo.value} className="flex items-center space-x-3 p-4 border rounded-xl hover:bg-indigo-50/50 transition-colors">
                            <Checkbox
                              id={tipo.value}
                              checked={form.watch('profissional.disponibilidade_tipo')?.includes(tipo.value)}
                              onCheckedChange={(checked: boolean) => {
                                const current = form.getValues('profissional.disponibilidade_tipo') || []
                                if (checked) form.setValue('profissional.disponibilidade_tipo', [...current, tipo.value])
                                else form.setValue('profissional.disponibilidade_tipo', current.filter((v: string) => v !== tipo.value))
                              }}
                            />
                            <Label htmlFor={tipo.value} className="flex-1 cursor-pointer font-medium">{tipo.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Passo 4: Áreas de Interesse */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-start gap-3">
                        <Briefcase className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-indigo-800">
                          <p className="font-bold mb-1">Selecione suas áreas de interesse</p>
                          <p>Escolha as áreas que você tem experiência ou interesse em atuar.</p>
                        </div>
                      </div>

                      <Label className="text-lg font-bold">Quais áreas de interesse?</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {AREAS_INTERESSE.map(area => (
                          <div key={area.value} className="flex items-center space-x-2 p-3 border rounded-lg hover:border-indigo-200 transition-colors">
                            <Checkbox
                              id={area.value}
                              checked={form.watch('profissional.areas_interesse')?.includes(area.value)}
                              onCheckedChange={(checked: boolean) => {
                                const current = form.getValues('profissional.areas_interesse') || []
                                if (checked) form.setValue('profissional.areas_interesse', [...current, area.value])
                                else form.setValue('profissional.areas_interesse', current.filter((v: string) => v !== area.value))
                              }}
                            />
                            <Label htmlFor={area.value} className="text-xs cursor-pointer">{area.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Passo 5: Pretensão e Resumo */}
                  {currentStep === 4 && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label>Pretensão Salarial (Opcional)</Label>
                        <Input type="text" placeholder="R$ 0,00" {...form.register('profissional.pretensao_salarial')} />
                      </div>
                      <div className="space-y-2">
                        <Label>Resumo Profissional</Label>
                        <Textarea
                          placeholder="Conte-nos um pouco sobre sua trajetória..."
                          className="h-40"
                          {...form.register('profissional.resumo_profissional')}
                        />
                        <p className="text-xs text-zinc-400 text-right">{form.watch('profissional.resumo_profissional')?.length || 0}/2000 caracteres</p>
                      </div>
                    </div>
                  )}

                  {/* Passo 6: Formação Acadêmica */}
                  {currentStep === 5 && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <Label className="text-lg font-bold">Formação Acadêmica</Label>
                        <Button type="button" variant="outline" size="sm" onClick={() => appendFormacao({ nivel: '', instituicao: '', ano_conclusao: '', area: '' })}>
                          <Plus size={16} className="mr-1" /> Adicionar
                        </Button>
                      </div>
                      {fieldsFormacao.length === 0 && (
                        <p className="text-sm text-zinc-500 italic">Nenhuma formação cadastrada. Adicione sua formação acadêmica.</p>
                      )}
                      {fieldsFormacao.map((field, index) => (
                        <div key={field.id} className="p-4 border rounded-xl space-y-4 bg-zinc-50/50">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-zinc-400 uppercase">Formação #{index + 1}</span>
                            <Button type="button" variant="ghost" size="sm" className="text-red-500" onClick={() => removeFormacao(index)}>
                              <Trash2 size={16} />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input placeholder="Nível (Ex: Superior)" {...form.register(`profissional.formacao.${index}.nivel`)} />
                            <Input placeholder="Instituição" {...form.register(`profissional.formacao.${index}.instituicao`)} />
                            <Input placeholder="Ano Conclusão" {...form.register(`profissional.formacao.${index}.ano_conclusao`)} />
                            <Input placeholder="Área / Curso" {...form.register(`profissional.formacao.${index}.area`)} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Passo 7: Experiência Profissional */}
                  {currentStep === 6 && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <Label className="text-lg font-bold">Experiência Profissional</Label>
                        <Button type="button" variant="outline" size="sm" onClick={() => appendExperiencia({ empresa: '', cargo: '', periodo: '', atividades: '' })}>
                          <Plus size={16} className="mr-1" /> Adicionar
                        </Button>
                      </div>
                      {fieldsExperiencia.length === 0 && (
                        <p className="text-sm text-zinc-500 italic">Nenhuma experiência cadastrada. Adicione sua experiência profissional.</p>
                      )}
                      {fieldsExperiencia.map((field, index) => (
                        <div key={field.id} className="p-4 border rounded-xl space-y-4 bg-zinc-50/50">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-zinc-400 uppercase">Experiência #{index + 1}</span>
                            <Button type="button" variant="ghost" size="sm" className="text-red-500" onClick={() => removeExperiencia(index)}>
                              <Trash2 size={16} />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input placeholder="Empresa" {...form.register(`profissional.experiencia.${index}.empresa`)} />
                            <Input placeholder="Cargo" {...form.register(`profissional.experiencia.${index}.cargo`)} />
                            <Input placeholder="Período (Ex: 2020 - 2022)" {...form.register(`profissional.experiencia.${index}.periodo`)} />
                            <Textarea placeholder="Atividades" {...form.register(`profissional.experiencia.${index}.atividades`)} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Passo 8: Habilidades e Certificações */}
                  {currentStep === 7 && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <Label className="text-lg font-bold">Habilidades e Competências</Label>
                        <Input
                          placeholder="Digite habilidades separadas por vírgula (Ex: Matemática, Física, Química)"
                          onBlur={(e) => {
                            const val = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                            form.setValue('profissional.habilidades', val)
                          }}
                          defaultValue={form.watch('profissional.habilidades')?.join(', ')}
                        />
                        <p className="text-xs text-zinc-500">Digite suas habilidades separadas por vírgula e clique fora do campo.</p>
                      </div>

                      <div className="space-y-6 pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <Label className="text-lg font-bold">Certificações</Label>
                          <Button type="button" variant="outline" size="sm" onClick={() => appendCertificacao({ nome: '', instituicao: '', ano: '' })}>
                            <Plus size={16} className="mr-1" /> Adicionar
                          </Button>
                        </div>
                        {fieldsCertificacao.length === 0 && (
                          <p className="text-sm text-zinc-500 italic">Nenhuma certificação cadastrada.</p>
                        )}
                        {fieldsCertificacao.map((field, index) => (
                          <div key={field.id} className="p-4 border rounded-xl space-y-4 bg-zinc-50/50">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-zinc-400 uppercase">Certificação #{index + 1}</span>
                              <Button type="button" variant="ghost" size="sm" className="text-red-500" onClick={() => removeCertificacao(index)}>
                                <Trash2 size={16} />
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <Input placeholder="Nome do Curso" {...form.register(`profissional.certificacoes.${index}.nome`)} />
                              <Input placeholder="Instituição" {...form.register(`profissional.certificacoes.${index}.instituicao`)} />
                              <Input placeholder="Ano" {...form.register(`profissional.certificacoes.${index}.ano`)} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Passo 9: Finalização */}
                  {currentStep === 8 && (
                    <div className="space-y-8">
                      <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl space-y-6">
                        <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                          <CheckCircle2 className="text-indigo-600" /> Preferências de Visibilidade
                        </h4>

                        <div className="space-y-4">
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              id="busca-vaga"
                              checked={form.watch('profissional.busca_vaga')}
                              onCheckedChange={(c) => form.setValue('profissional.busca_vaga', !!c)}
                            />
                            <div className="space-y-1">
                              <Label htmlFor="busca-vaga" className="font-bold cursor-pointer">Buscar Vaga em Escolas</Label>
                              <p className="text-sm text-zinc-500">Seu currículo aparecerá para escolas parceiras.</p>
                            </div>
                          </div>

                          <div className="flex items-start space-x-3 pt-4 border-t border-indigo-100">
                            <Checkbox
                              id="presta-servico"
                              checked={form.watch('profissional.presta_servico')}
                              onCheckedChange={(c) => form.setValue('profissional.presta_servico', !!c)}
                            />
                            <div className="space-y-1">
                              <Label htmlFor="presta-servico" className="font-bold cursor-pointer">Prestar Serviços para Famílias</Label>
                              <p className="text-sm text-zinc-500">Seu perfil aparecerá no Portal da Família como prestador de serviços.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Lojista Steps */}
              {tipoAtivo === 'lojista' && currentStep >= 1 && (
                <>
                  {/* Passo 2: Dados da Empresa */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                          <p className="font-bold mb-1">CNPJ válido é obrigatório</p>
                          <p>O CNPJ será verificado automaticamente. Preencha apenas números.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Razão Social</Label>
                          <Input
                            placeholder="Nome da Empresa"
                            {...form.register('lojista.razao_social')}
                            className={(form.formState.errors.lojista as any)?.razao_social ? 'border-red-500' : ''}
                          />
                          {(form.formState.errors.lojista as any)?.razao_social && (
                            <p className="text-xs text-red-500">{(form.formState.errors.lojista as any).razao_social.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>CNPJ</Label>
                          <Input
                            placeholder="00.000.000/0001-00"
                            {...form.register('lojista.cnpj')}
                            onChange={handleCnpjChange}
                            className={(form.formState.errors.lojista as any)?.cnpj ? 'border-red-500' : ''}
                          />
                          {(form.formState.errors.lojista as any)?.cnpj && (
                            <p className="text-xs text-red-500">{(form.formState.errors.lojista as any).cnpj.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Nome Fantasia</Label>
                          <Input
                            placeholder="Como sua loja é conhecida"
                            {...form.register('lojista.nome_fantasia')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Categoria</Label>
                          <Select
                            onValueChange={(v) => form.setValue('lojista.categoria', v)}
                            value={selectedCategoria}
                          >
                            <SelectTrigger className={cn("w-full", (form.formState.errors.lojista as any)?.categoria ? 'border-red-500' : '')}>
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIAS_LOJISTA.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>
                                  {cat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {(form.formState.errors.lojista as any)?.categoria && (
                            <p className="text-xs text-red-500">{(form.formState.errors.lojista as any).categoria.message}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Passo 3: Endereço */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                          <p className="font-bold mb-1">Endereço comercial válido</p>
                          <p>Digite o CEP para preenchimento automático via Correios.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>CEP</Label>
                          <Input
                            placeholder="00000-000"
                            {...form.register('lojista.cep')}
                            onChange={handleCepChange}
                            disabled={buscandoCep}
                            className={(form.formState.errors.lojista as any)?.cep ? 'border-red-500' : ''}
                          />
                          {buscandoCep && (
                            <p className="text-xs text-zinc-500 flex items-center gap-1">
                              <Loader2 size={12} className="animate-spin" /> Buscando endereço...
                            </p>
                          )}
                          {(form.formState.errors.lojista as any)?.cep && (
                            <p className="text-xs text-red-500">{(form.formState.errors.lojista as any).cep.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Estado (UF)</Label>
                          <Select
                            onValueChange={(v) => form.setValue('lojista.estado', v)}
                            value={form.watch('lojista.estado')}
                          >
                            <SelectTrigger className={cn("w-full", (form.formState.errors.lojista as any)?.estado ? 'border-red-500' : '')}>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {estados.map((uf) => (
                                <SelectItem key={uf.value} value={uf.value}>
                                  {uf.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {(form.formState.errors.lojista as any)?.estado && (
                            <p className="text-xs text-red-500">{(form.formState.errors.lojista as any).estado.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Cidade</Label>
                          <Select
                            onValueChange={(v) => {
                              form.setValue('lojista.cidade', v, { shouldValidate: true })
                            }}
                            value={form.watch('lojista.cidade')}
                            disabled={loadingCities || !form.watch('lojista.estado')}
                          >
                            <SelectTrigger className={cn("w-full", (form.formState.errors.lojista as any)?.cidade ? 'border-red-500' : '')}>
                              <SelectValue placeholder={loadingCities ? "Carregando cidades..." : "Selecione a cidade"} />
                            </SelectTrigger>
                            <SelectContent>
                              {cities.map((cid: any) => (
                                <SelectItem key={cid.value} value={cid.value}>
                                  {cid.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {(form.formState.errors.lojista as any)?.cidade && (
                            <p className="text-xs text-red-500">{(form.formState.errors.lojista as any).cidade.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Bairro</Label>
                          <Input
                            placeholder="Bairro"
                            {...form.register('lojista.bairro')}
                            className={(form.formState.errors.lojista as any)?.bairro ? 'border-red-500' : ''}
                          />
                          {(form.formState.errors.lojista as any)?.bairro && (
                            <p className="text-xs text-red-500">{(form.formState.errors.lojista as any).bairro.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Logradouro</Label>
                          <Input
                            placeholder="Rua, Avenida, etc."
                            {...form.register('lojista.logradouro')}
                            className={(form.formState.errors.lojista as any)?.logradouro ? 'border-red-500' : ''}
                          />
                          {(form.formState.errors.lojista as any)?.logradouro && (
                            <p className="text-xs text-red-500">{(form.formState.errors.lojista as any).logradouro.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Número</Label>
                          <Input
                            placeholder="123"
                            {...form.register('lojista.numero')}
                            className={(form.formState.errors.lojista as any)?.numero ? 'border-red-500' : ''}
                          />
                          {(form.formState.errors.lojista as any)?.numero && (
                            <p className="text-xs text-red-500">{(form.formState.errors.lojista as any).numero.message}</p>
                          )}
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Complemento (Opcional)</Label>
                          <Input
                            placeholder="Sala, conjunto, bloco, etc."
                            {...form.register('lojista.complemento')}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Passo 4: Contato */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                          <p className="font-bold mb-1">Dados de contato válidos</p>
                          <p>E-mail e telefone serão verificados. Use dados reais para contato.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2"><Mail size={16} /> E-mail Comercial</Label>
                          <Input
                            placeholder="vendas@empresa.com"
                            {...form.register('lojista.email_contato')}
                            className={(form.formState.errors.lojista as any)?.email_contato ? 'border-red-500' : ''}
                          />
                          {(form.formState.errors.lojista as any)?.email_contato && (
                            <p className="text-xs text-red-500">{(form.formState.errors.lojista as any).email_contato.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2"><Phone size={16} /> Telefone / WhatsApp</Label>
                          <Input
                            placeholder="(11) 99999-9999"
                            {...form.register('lojista.telefone_contato')}
                            onChange={handleTelefoneChange}
                            className={(form.formState.errors.lojista as any)?.telefone_contato ? 'border-red-500' : ''}
                          />
                          {(form.formState.errors.lojista as any)?.telefone_contato && (
                            <p className="text-xs text-red-500">{(form.formState.errors.lojista as any).telefone_contato.message}</p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Descrição da Loja (Opcional)</Label>
                        <Textarea
                          placeholder="Fale um pouco sobre seus produtos..."
                          className="h-32"
                          {...form.register('lojista.descricao')}
                        />
                      </div>
                    </div>
                  )}


                  {/* Passo 5: Pagamento (Gratuito) */}
                  {currentStep === 4 && (
                    <div className="space-y-8">
                      <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-8 rounded-2xl text-white space-y-4">
                        <div className="flex items-center gap-3">
                          <Gift size={32} className="text-emerald-200" />
                          <h3 className="text-2xl font-bold">Plano Gratuito</h3>
                        </div>
                        <p className="text-emerald-100">
                          Por tempo limitado, você está se cadastrando no plano <strong className="text-white">Free</strong> sem custos.
                        </p>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-white" />
                            <span className="text-sm">Cadastro de produtos ilimitado</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-white" />
                            <span className="text-sm">Visibilidade no marketplace</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-white" />
                            <span className="text-sm">Painel de vendas básico</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-white" />
                            <span className="text-sm">Sem taxa de comissão</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 border-2 border-dashed rounded-2xl text-center space-y-3">
                        <ShoppingBag size={48} className="mx-auto text-zinc-300" />
                        <h3 className="text-xl font-bold">Próximos Passos</h3>
                        <p className="text-sm text-zinc-500">
                          Após confirmar seu e-mail, você poderá:
                        </p>
                        <ul className="text-sm text-zinc-600 space-y-1">
                          <li>• Cadastrar seus produtos</li>
                          <li>• Configurar sua loja</li>
                          <li>• Gerenciar pedidos e vendas</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Navigation Footer */}
            <div className="pt-6 border-t border-zinc-100 flex items-center justify-between gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="text-zinc-500 hover:bg-zinc-100"
              >
                {currentStep === 0 ? 'Cancelar' : 'Anterior'}
              </Button>

              {currentStep < stepsSet.length - 1 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl px-8"
                >
                  Continuar
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={async () => {
                    // Valida todos os campos antes de submeter
                    const allValid = await form.trigger()
                    if (!allValid) {
                      toast.error('Preencha todos os campos obrigatórios corretamente')
                      return
                    }
                    // Submete o form manualmente
                    form.handleSubmit(handleFinalSubmit, handleInvalidSubmit)()
                  }}
                  disabled={isSubmitting}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl px-10 shadow-lg"
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando Conta...</>
                  ) : (
                    <><CheckCircle2 className="mr-2 h-4 w-4" /> Finalizar Cadastro</>
                  )}
                </Button>
              )}
            </div>

            {/* Links */}
            <div className="pt-4 flex items-center justify-center gap-6 text-xs">
              <a href="/login" className="text-muted-foreground hover:text-zinc-900 transition-colors">
                Já tenho conta
              </a>
              <span className="text-zinc-200">•</span>
              <a href="/portal/login" className="text-muted-foreground hover:text-zinc-900 transition-colors">
                Portal do aluno
              </a>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">Powered by Fluxoo Marketplace &copy; 2026</p>
          </div>
        </div>
      </div>
    </div>
  )
}
