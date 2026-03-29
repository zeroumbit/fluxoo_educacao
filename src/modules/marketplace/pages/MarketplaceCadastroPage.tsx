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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
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
  Upload
} from 'lucide-react'
import { toast } from 'sonner'
import { DISPONIBILIDADE_TIPOS, AREAS_INTERESSE } from '@/modules/curriculos/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useViaCEP } from '@/hooks/use-viacep'
import { mascaraCNPJ, mascaraTelefone, mascaraCEP, validarCNPJ } from '@/lib/validacoes'
import { strongPasswordSchema } from '@/lib/password-validation'

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
  confirmPassword: z.string()
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
  pretensao_salarial: z.string().optional(),
  resumo_profissional: z.string().max(2000, 'Máximo 2000 caracteres'),
  // Step 6
  formacao: z.array(z.object({
    nivel: z.string(),
    instituicao: z.string(),
    ano_conclusao: z.string(),
    area: z.string()
  })),
  // Step 7
  experiencia: z.array(z.object({
    empresa: z.string(),
    cargo: z.string(),
    periodo: z.string(),
    atividades: z.string()
  })),
  // Step 8
  habilidades: z.array(z.string()),
  certificacoes: z.array(z.object({
    nome: z.string(),
    instituicao: z.string(),
    ano: z.string()
  })),
  // Step 9
  busca_vaga: z.boolean(),
  presta_servico: z.boolean(),
  termos: z.literal(true, {
    errorMap: () => ({ message: 'Você deve aceitar os termos' })
  })
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
  // Step 5 - Termos
  termos: z.literal(true, {
    errorMap: () => ({ message: 'Você deve aceitar os termos' })
  }),
  // Step 6 - Pagamento
  metodo_pagamento: z.enum(['mercado_pago', 'pix_manual']).default('mercado_pago'),
})

const registrationSchema = z.object({
  acesso: acessoSchema,
  tipo: z.enum(['profissional', 'lojista']),
  profissional: profissionalSchema.optional(),
  lojista: lojistaSchema.optional()
})

type RegistrationForm = z.infer<typeof registrationSchema>

export function MarketplaceCadastroPage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tipoAtivo, setTipoAtivo] = useState<'profissional' | 'lojista'>('profissional')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      tipo: 'profissional',
      acesso: { email: '', password: '', confirmPassword: '' },
      profissional: {
        disponibilidade_tipo: [],
        areas_interesse: [],
        formacao: [],
        experiencia: [],
        habilidades: [],
        certificacoes: [],
        busca_vaga: true,
        presta_servico: false
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
        termos: true,
        metodo_pagamento: 'mercado_pago'
      }
    }
  })

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

  const stepsProfissional = [
    'Acesso',
    'Dados Básicos',
    'Disponibilidade',
    'Áreas de Interesse',
    'Pretensão e Resumo',
    'Formação',
    'Experiência',
    'Habilidades',
    'Finalização'
  ]

  const stepsLojista = [
    'Acesso',
    'Dados da Empresa',
    'Endereço',
    'Contato',
    'Termos',
    'Pagamento'
  ]

  const steps = tipoAtivo === 'profissional' ? stepsProfissional : stepsLojista

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

  const nextStep = async () => {
    let fieldsToValidate: any[] = []

    if (currentStep === 1) {
      fieldsToValidate = ['acesso.email', 'acesso.password', 'acesso.confirmPassword']
    } else if (tipoAtivo === 'profissional') {
      if (currentStep === 2) fieldsToValidate = ['profissional.nome', 'profissional.contato_email', 'profissional.telefone', 'profissional.cpf']
      if (currentStep === 3) fieldsToValidate = ['profissional.disponibilidade_tipo']
      if (currentStep === 4) fieldsToValidate = ['profissional.areas_interesse']
      if (currentStep === 5) fieldsToValidate = ['profissional.resumo_profissional']
      // Steps 6, 7, 8 são opcionais (formação, experiência, certificações)
      if (currentStep === 9) fieldsToValidate = ['profissional.termos']
    } else {
      if (currentStep === 2) fieldsToValidate = ['lojista.razao_social', 'lojista.cnpj', 'lojista.categoria']
      if (currentStep === 3) fieldsToValidate = ['lojista.cep', 'lojista.logradouro', 'lojista.numero', 'lojista.bairro', 'lojista.cidade', 'lojista.estado']
      if (currentStep === 4) fieldsToValidate = ['lojista.email_contato', 'lojista.telefone_contato']
      if (currentStep === 5) fieldsToValidate = ['lojista.termos']
      if (currentStep === 6) fieldsToValidate = ['lojista.metodo_pagamento']
    }

    const isValid = await form.trigger(fieldsToValidate)
    if (isValid) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep === 1) {
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
      if (tipoAtivo === 'profissional') {
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
      } else {
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
          plano_id: 'free'
        } as any)
        if (lojError) throw lojError
      }

      toast.success('Cadastro realizado com sucesso! Verifique seu e-mail para confirmar a conta.')
      navigate('/login')
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Erro ao realizar cadastro')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl border border-zinc-200 overflow-hidden">

        {/* Header */}
        <div className="bg-zinc-900 p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">Seja um Parceiro Fluxoo</h1>
            <p className="text-zinc-400">Venda seus produtos ou ofereça seus serviços para nossa comunidade escolar.</p>
          </div>
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <ShoppingBag size={120} />
          </div>
        </div>

        {/* Steps Progress */}
        <div className="px-8 pt-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentStep > i ? 'bg-indigo-600 w-8' :
                  currentStep === i + 1 ? 'bg-indigo-400 w-12' : 'bg-zinc-200 w-4'
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-medium text-zinc-500">
            Passo {currentStep} de {steps.length}: <span className="text-zinc-900">{steps[currentStep-1]}</span>
          </span>
        </div>

        <Tabs
          value={tipoAtivo}
          onValueChange={(v: any) => {
            setTipoAtivo(v)
            setCurrentStep(1)
            form.setValue('tipo', v)
          }}
          className="mt-4"
        >
          <div className="px-8">
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="profissional" className="gap-2">
                <Briefcase size={18} /> Sou Profissional
              </TabsTrigger>
              <TabsTrigger value="lojista" className="gap-2">
                <Building2 size={18} /> Sou Lojista
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[60vh] px-8 py-6">
            <form id="registration-form" onSubmit={form.handleSubmit(handleFinalSubmit)}>

              {/* Passo 1: Acesso (Comum) */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-bold mb-1">E-mail válido é obrigatório</p>
                      <p>Usaremos este e-mail para acesso e comunicação. Você receberá um link de confirmação.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Mail size={16} /> E-mail de Acesso</Label>
                      <Input 
                        placeholder="seu@email.com" 
                        {...form.register('acesso.email')}
                        className={form.formState.errors.acesso?.email ? 'border-red-500' : ''}
                      />
                      {form.formState.errors.acesso?.email && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle size={12} /> {form.formState.errors.acesso.email.message}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Lock size={16} /> Senha</Label>
                        <div className="relative">
                          <Input 
                            type={showPassword ? 'text' : 'password'} 
                            placeholder="Mínimo 8 caracteres" 
                            {...form.register('acesso.password')}
                            className={form.formState.errors.acesso?.password ? 'border-red-500' : ''}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                          >
                            {showPassword ? <Lock size={16} className="rotate-180" /> : <Lock size={16} />}
                          </button>
                        </div>
                        {form.formState.errors.acesso?.password && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle size={12} /> {form.formState.errors.acesso.password.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Lock size={16} /> Confirmar Senha</Label>
                        <div className="relative">
                          <Input 
                            type={showConfirmPassword ? 'text' : 'password'} 
                            placeholder="Repita a senha" 
                            {...form.register('acesso.confirmPassword')}
                            className={form.formState.errors.acesso?.confirmPassword ? 'border-red-500' : ''}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                          >
                            {showConfirmPassword ? <Lock size={16} className="rotate-180" /> : <Lock size={16} />}
                          </button>
                        </div>
                        {form.formState.errors.acesso?.confirmPassword && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle size={12} /> {form.formState.errors.acesso.confirmPassword.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Profissional Steps */}
              {tipoAtivo === 'profissional' && (
                <>
                  {/* Passo 2: Dados Básicos */}
                  {currentStep === 2 && (
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
                            className={form.formState.errors.profissional?.nome ? 'border-red-500' : ''}
                          />
                          {form.formState.errors.profissional?.nome && (
                            <p className="text-xs text-red-500">{form.formState.errors.profissional.nome.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>CPF</Label>
                          <Input 
                            placeholder="000.000.000-00" 
                            {...form.register('profissional.cpf')}
                            className={form.formState.errors.profissional?.cpf ? 'border-red-500' : ''}
                          />
                          {form.formState.errors.profissional?.cpf && (
                            <p className="text-xs text-red-500">{form.formState.errors.profissional.cpf.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Telefone / WhatsApp</Label>
                          <Input 
                            placeholder="(11) 99999-9999" 
                            {...form.register('profissional.telefone')}
                            onChange={handleTelefoneChange}
                            className={form.formState.errors.profissional?.telefone ? 'border-red-500' : ''}
                          />
                          {form.formState.errors.profissional?.telefone && (
                            <p className="text-xs text-red-500">{form.formState.errors.profissional.telefone.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>E-mail de Contato</Label>
                          <Input 
                            placeholder="email@contato.com" 
                            {...form.register('profissional.contato_email')}
                            className={form.formState.errors.profissional?.contato_email ? 'border-red-500' : ''}
                          />
                          {form.formState.errors.profissional?.contato_email && (
                            <p className="text-xs text-red-500">{form.formState.errors.profissional.contato_email.message}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Passo 3: Disponibilidade */}
                  {currentStep === 3 && (
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
                              onCheckedChange={(checked) => {
                                const current = form.getValues('profissional.disponibilidade_tipo') || []
                                if (checked) form.setValue('profissional.disponibilidade_tipo', [...current, tipo.value])
                                else form.setValue('profissional.disponibilidade_tipo', current.filter(v => v !== tipo.value))
                              }}
                            />
                            <Label htmlFor={tipo.value} className="flex-1 cursor-pointer font-medium">{tipo.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Passo 4: Áreas de Interesse */}
                  {currentStep === 4 && (
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
                              onCheckedChange={(checked) => {
                                const current = form.getValues('profissional.areas_interesse') || []
                                if (checked) form.setValue('profissional.areas_interesse', [...current, area.value])
                                else form.setValue('profissional.areas_interesse', current.filter(v => v !== area.value))
                              }}
                            />
                            <Label htmlFor={area.value} className="text-xs cursor-pointer">{area.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Passo 5: Pretensão e Resumo */}
                  {currentStep === 5 && (
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
                  {currentStep === 6 && (
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
                  {currentStep === 7 && (
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
                  {currentStep === 8 && (
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
                  {currentStep === 9 && (
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

                      <div className="space-y-4">
                        <div className="p-4 border rounded-xl space-y-3">
                          <div className="flex items-center gap-2">
                            <FileText size={18} className="text-zinc-400" />
                            <h4 className="font-bold text-zinc-700">Documentos Legais</h4>
                          </div>
                          <div className="flex flex-col gap-2 pl-10">
                            <a 
                              href="/termos-de-uso" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
                            >
                              <FileText size={14} /> Termos de Uso
                            </a>
                            <a 
                              href="/politica-privacidade" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
                            >
                              <FileText size={14} /> Política de Privacidade
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-4 bg-zinc-50 rounded-xl">
                          <Checkbox
                            id="termos-prof"
                            {...form.register('profissional.termos')}
                            className={form.formState.errors.profissional?.termos ? 'border-red-500' : ''}
                          />
                          <Label htmlFor="termos-prof" className="text-sm font-medium cursor-pointer">
                            Li e concordo com os termos de uso e política de privacidade.
                          </Label>
                        </div>
                        {form.formState.errors.profissional?.termos && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle size={12} /> {form.formState.errors.profissional.termos.message}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Lojista Steps */}
              {tipoAtivo === 'lojista' && (
                <>
                  {/* Passo 2: Dados da Empresa */}
                  {currentStep === 2 && (
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
                            className={form.formState.errors.lojista?.razao_social ? 'border-red-500' : ''}
                          />
                          {form.formState.errors.lojista?.razao_social && (
                            <p className="text-xs text-red-500">{form.formState.errors.lojista.razao_social.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>CNPJ</Label>
                          <Input 
                            placeholder="00.000.000/0001-00" 
                            {...form.register('lojista.cnpj')}
                            onChange={handleCnpjChange}
                            className={form.formState.errors.lojista?.cnpj ? 'border-red-500' : ''}
                          />
                          {form.formState.errors.lojista?.cnpj && (
                            <p className="text-xs text-red-500">{form.formState.errors.lojista.cnpj.message}</p>
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
                            <SelectTrigger className={form.formState.errors.lojista?.categoria ? 'border-red-500' : ''}>
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
                          {form.formState.errors.lojista?.categoria && (
                            <p className="text-xs text-red-500">{form.formState.errors.lojista.categoria.message}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Passo 3: Endereço */}
                  {currentStep === 3 && (
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
                            className={form.formState.errors.lojista?.cep ? 'border-red-500' : ''}
                          />
                          {buscandoCep && (
                            <p className="text-xs text-zinc-500 flex items-center gap-1">
                              <Loader2 size={12} className="animate-spin" /> Buscando endereço...
                            </p>
                          )}
                          {form.formState.errors.lojista?.cep && (
                            <p className="text-xs text-red-500">{form.formState.errors.lojista.cep.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Estado (UF)</Label>
                          <Select 
                            onValueChange={(v) => form.setValue('lojista.estado', v)}
                            value={form.watch('lojista.estado')}
                          >
                            <SelectTrigger className={form.formState.errors.lojista?.estado ? 'border-red-500' : ''}>
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
                          {form.formState.errors.lojista?.estado && (
                            <p className="text-xs text-red-500">{form.formState.errors.lojista.estado.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Cidade</Label>
                          <Select 
                            onValueChange={(v) => form.setValue('lojista.cidade', v)}
                            value={form.watch('lojista.cidade')}
                            disabled={loadingCities || !form.watch('lojista.estado')}
                          >
                            <SelectTrigger className={form.formState.errors.lojista?.cidade ? 'border-red-500' : ''}>
                              <SelectValue placeholder={loadingCities ? 'Carregando...' : 'Selecione'} />
                            </SelectTrigger>
                            <SelectContent>
                              {cities.map((cid: any) => (
                                <SelectItem key={cid.nome} value={cid.nome}>
                                  {cid.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {form.formState.errors.lojista?.cidade && (
                            <p className="text-xs text-red-500">{form.formState.errors.lojista.cidade.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Bairro</Label>
                          <Input 
                            placeholder="Bairro" 
                            {...form.register('lojista.bairro')}
                            className={form.formState.errors.lojista?.bairro ? 'border-red-500' : ''}
                          />
                          {form.formState.errors.lojista?.bairro && (
                            <p className="text-xs text-red-500">{form.formState.errors.lojista.bairro.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Logradouro</Label>
                          <Input 
                            placeholder="Rua, Avenida, etc." 
                            {...form.register('lojista.logradouro')}
                            className={form.formState.errors.lojista?.logradouro ? 'border-red-500' : ''}
                          />
                          {form.formState.errors.lojista?.logradouro && (
                            <p className="text-xs text-red-500">{form.formState.errors.lojista.logradouro.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Número</Label>
                          <Input 
                            placeholder="123" 
                            {...form.register('lojista.numero')}
                            className={form.formState.errors.lojista?.numero ? 'border-red-500' : ''}
                          />
                          {form.formState.errors.lojista?.numero && (
                            <p className="text-xs text-red-500">{form.formState.errors.lojista.numero.message}</p>
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
                  {currentStep === 4 && (
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
                            className={form.formState.errors.lojista?.email_contato ? 'border-red-500' : ''}
                          />
                          {form.formState.errors.lojista?.email_contato && (
                            <p className="text-xs text-red-500">{form.formState.errors.lojista.email_contato.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2"><Phone size={16} /> Telefone / WhatsApp</Label>
                          <Input 
                            placeholder="(11) 99999-9999" 
                            {...form.register('lojista.telefone_contato')}
                            onChange={handleTelefoneChange}
                            className={form.formState.errors.lojista?.telefone_contato ? 'border-red-500' : ''}
                          />
                          {form.formState.errors.lojista?.telefone_contato && (
                            <p className="text-xs text-red-500">{form.formState.errors.lojista.telefone_contato.message}</p>
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

                  {/* Passo 5: Termos */}
                  {currentStep === 5 && (
                    <div className="space-y-8">
                      <div className="p-8 border-2 border-dashed rounded-2xl text-center space-y-4">
                        <CheckCircle2 size={48} className="mx-auto text-indigo-300" />
                        <h3 className="text-xl font-bold">Quase lá!</h3>
                        <p className="text-sm text-zinc-500">Leia e aceite os termos para finalizar seu cadastro.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 border rounded-xl space-y-3">
                          <div className="flex items-center gap-2">
                            <FileText size={18} className="text-zinc-400" />
                            <h4 className="font-bold text-zinc-700">Documentos Legais</h4>
                          </div>
                          <div className="flex flex-col gap-2 pl-10">
                            <a 
                              href="/termos-de-uso" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
                            >
                              <FileText size={14} /> Termos de Uso
                            </a>
                            <a 
                              href="/politica-privacidade" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
                            >
                              <FileText size={14} /> Política de Privacidade
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-4 bg-zinc-50 rounded-xl">
                          <Checkbox
                            id="termos-loj"
                            {...form.register('lojista.termos')}
                            className={form.formState.errors.lojista?.termos ? 'border-red-500' : ''}
                          />
                          <Label htmlFor="termos-loj" className="text-sm font-medium cursor-pointer">
                            Li e concordo com os termos de uso e política de privacidade para lojistas.
                          </Label>
                        </div>
                        {form.formState.errors.lojista?.termos && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle size={12} /> {form.formState.errors.lojista.termos.message}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Passo 6: Pagamento */}
                  {currentStep === 6 && (
                    <div className="space-y-8">
                      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-2xl text-white space-y-4">
                        <div className="flex items-center gap-3">
                          <CreditCard size={32} className="text-indigo-200" />
                          <h3 className="text-2xl font-bold">Plano Free</h3>
                        </div>
                        <p className="text-indigo-100">
                          Você está se cadastrando no plano <strong className="text-white">Free</strong> por tempo limitado.
                        </p>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-300" />
                            <span className="text-sm">Cadastro de produtos ilimitado</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-300" />
                            <span className="text-sm">Visibilidade no marketplace</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-300" />
                            <span className="text-sm">Painel de vendas básico</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-lg font-bold">Forma de Pagamento</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div 
                            className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                              form.watch('lojista.metodo_pagamento') === 'mercado_pago' 
                                ? 'border-indigo-600 bg-indigo-50' 
                                : 'border-zinc-200 hover:border-zinc-300'
                            }`}
                            onClick={() => form.setValue('lojista.metodo_pagamento', 'mercado_pago')}
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
                                <CreditCard className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="font-bold text-zinc-900">Mercado Pago</p>
                                <p className="text-xs text-zinc-500">Cartão de crédito e boleto</p>
                              </div>
                            </div>
                            <p className="text-sm text-zinc-600">
                              Pagamento automático mensal. Você receberá um link de pagamento por e-mail.
                            </p>
                          </div>

                          <div 
                            className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                              form.watch('lojista.metodo_pagamento') === 'pix_manual' 
                                ? 'border-indigo-600 bg-indigo-50' 
                                : 'border-zinc-200 hover:border-zinc-300'
                            }`}
                            onClick={() => form.setValue('lojista.metodo_pagamento', 'pix_manual')}
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div className="h-10 w-10 rounded-lg bg-emerald-600 flex items-center justify-center">
                                <Upload className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="font-bold text-zinc-900">PIX Manual</p>
                                <p className="text-xs text-zinc-500">Envio de comprovante</p>
                              </div>
                            </div>
                            <p className="text-sm text-zinc-600">
                              Você receberá a chave PIX e deverá enviar o comprovante de pagamento mensalmente.
                            </p>
                          </div>
                        </div>
                        {form.formState.errors.lojista?.metodo_pagamento && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle size={12} /> {form.formState.errors.lojista.metodo_pagamento.message}
                          </p>
                        )}
                      </div>

                      <div className="p-6 border-2 border-dashed rounded-2xl text-center space-y-3">
                        <ShoppingBag size={48} className="mx-auto text-zinc-300" />
                        <h3 className="text-xl font-bold">Próximos Passos</h3>
                        <p className="text-sm text-zinc-500">
                          Após confirmar seu e-mail, você poderá:
                        </p>
                        <ul className="text-sm text-zinc-600 space-y-1">
                          <li>• Cadastrar seus produtos</li>
                          <li>• Configurar formas de pagamento</li>
                          <li>• Gerenciar pedidos e entregas</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </>
              )}

            </form>
          </ScrollArea>

          {/* Footer Navigation */}
          <div className="p-8 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              className="px-6"
              disabled={isSubmitting}
            >
              <ChevronLeft size={20} className="mr-1" />
              {currentStep === 1 ? 'Cancelar' : 'Anterior'}
            </Button>

            {currentStep < steps.length ? (
              <Button
                onClick={nextStep}
                className="bg-zinc-900 hover:bg-zinc-800 text-white px-8"
                disabled={isSubmitting}
              >
                Próximo <ChevronRight size={20} className="ml-1" />
              </Button>
            ) : (
              <Button
                type="submit"
                form="registration-form"
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 shadow-lg shadow-indigo-100"
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando Conta...</>
                ) : (
                  <><CheckCircle2 className="mr-2 h-4 w-4" /> Finalizar Cadastro</>
                )}
              </Button>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  )
}
