import { useState } from 'react'
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
  CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'
import { DISPONIBILIDADE_TIPOS, AREAS_INTERESSE } from '@/modules/curriculos/types'

// Schema Schema para Acesso (Geral)
const acessoSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
})

// Schema para Profissional
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

// Schema para Lojista
const lojistaSchema = z.object({
  razao_social: z.string().min(3, 'Razão Social obrigatória'),
  nome_fantasia: z.string().optional(),
  cnpj: z.string().min(14, 'CNPJ inválido'),
  categoria: z.string().min(1, 'Selecione uma categoria'),
  email_contato: z.string().email('E-mail inválido'),
  telefone_contato: z.string().min(10, 'Telefone inválido'),
  descricao: z.string().optional(),
  termos: z.literal(true, {
    errorMap: () => ({ message: 'Você deve aceitar os termos' })
  })
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
        email_contato: '',
        telefone_contato: ''
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
    'Contato',
    'Finalização'
  ]

  const steps = tipoAtivo === 'profissional' ? stepsProfissional : stepsLojista

  const nextStep = async () => {
    // Validação parcial por step
    let fieldsToValidate: any[] = []
    
    if (currentStep === 1) {
      fieldsToValidate = ['acesso.email', 'acesso.password', 'acesso.confirmPassword']
    } else if (tipoAtivo === 'profissional') {
      if (currentStep === 2) fieldsToValidate = ['profissional.nome', 'profissional.contato_email', 'profissional.telefone', 'profissional.cpf']
      if (currentStep === 3) fieldsToValidate = ['profissional.disponibilidade_tipo']
      if (currentStep === 4) fieldsToValidate = ['profissional.areas_interesse']
      // ... steps sem validação obrigatória rígida podem passar
    } else {
      if (currentStep === 2) fieldsToValidate = ['lojista.razao_social', 'lojista.cnpj', 'lojista.categoria']
      if (currentStep === 3) fieldsToValidate = ['lojista.email_contato', 'lojista.telefone_contato']
    }

    const isValid = await form.trigger(fieldsToValidate)
    if (isValid) setCurrentStep(prev => prev + 1)
  }

  const prevStep = () => setCurrentStep(prev => prev - 1)

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
          is_ativo: true
        })
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
        })
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
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-zinc-200 overflow-hidden">
        
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
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Mail size={16} /> E-mail de Acesso</Label>
                      <Input placeholder="seu@email.com" {...form.register('acesso.email')} />
                      {form.formState.errors.acesso?.email && (
                        <p className="text-xs text-red-500">{form.formState.errors.acesso.email.message}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Lock size={16} /> Senha</Label>
                        <Input type="password" placeholder="******" {...form.register('acesso.password')} />
                        {form.formState.errors.acesso?.password && (
                          <p className="text-xs text-red-500">{form.formState.errors.acesso.password.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Lock size={16} /> Confirmar Senha</Label>
                        <Input type="password" placeholder="******" {...form.register('acesso.confirmPassword')} />
                        {form.formState.errors.acesso?.confirmPassword && (
                          <p className="text-xs text-red-500">{form.formState.errors.acesso.confirmPassword.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Profissional Specific Steps */}
              {tipoAtivo === 'profissional' && (
                <>
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nome Completo</Label>
                          <Input placeholder="Seu nome" {...form.register('profissional.nome')} />
                        </div>
                        <div className="space-y-2">
                          <Label>CPF</Label>
                          <Input placeholder="000.000.000-00" {...form.register('profissional.cpf')} />
                        </div>
                        <div className="space-y-2">
                          <Label>Telefone / WhatsApp</Label>
                          <Input placeholder="(11) 99999-9999" {...form.register('profissional.telefone')} />
                        </div>
                        <div className="space-y-2">
                          <Label>E-mail de Contato</Label>
                          <Input placeholder="email@contato.com" {...form.register('profissional.contato_email')} />
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <Label className="text-lg font-bold">Qual sua disponibilidade?</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {DISPONIBILIDADE_TIPOS.map(tipo => (
                          <div key={tipo.value} className="flex items-center space-x-3 p-4 border rounded-xl hover:bg-zinc-50 transition-colors">
                            <Checkbox 
                              title={tipo.label}
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

                  {currentStep === 4 && (
                    <div className="space-y-6">
                      <Label className="text-lg font-bold">Quais áreas de interesse?</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {AREAS_INTERESSE.map(area => (
                          <div key={area.value} className="flex items-center space-x-2 p-3 border rounded-lg hover:border-indigo-200 transition-colors">
                            <Checkbox 
                              title={area.label}
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

                  {currentStep === 6 && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <Label className="text-lg font-bold">Formação Acadêmica</Label>
                        <Button type="button" variant="outline" size="sm" onClick={() => appendFormacao({ nivel: '', instituicao: '', ano_conclusao: '', area: '' })}>
                          <Plus size={16} className="mr-1" /> Adicionar
                        </Button>
                      </div>
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

                  {currentStep === 7 && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <Label className="text-lg font-bold">Experiência Profissional</Label>
                        <Button type="button" variant="outline" size="sm" onClick={() => appendExperiencia({ empresa: '', cargo: '', periodo: '', atividades: '' })}>
                          <Plus size={16} className="mr-1" /> Adicionar
                        </Button>
                      </div>
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

                  {currentStep === 8 && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <Label className="text-lg font-bold">Habilidades e Competências</Label>
                        <Input 
                          placeholder="Digite habilidades separadas por vírgula" 
                          onBlur={(e) => {
                            const val = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                            form.setValue('profissional.habilidades', val)
                          }}
                        />
                      </div>
                      
                      <div className="space-y-6 pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <Label className="text-lg font-bold">Certificações</Label>
                          <Button type="button" variant="outline" size="sm" onClick={() => appendCertificacao({ nome: '', instituicao: '', ano: '' })}>
                            <Plus size={16} className="mr-1" /> Adicionar
                          </Button>
                        </div>
                        {fieldsCertificacao.map((field, index) => (
                          <div key={field.id} className="p-4 border rounded-xl space-y-4 bg-zinc-50/50">
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

                  {currentStep === 9 && (
                    <div className="space-y-8">
                      <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl space-y-6">
                        <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                          <CheckCircle2 className="text-indigo-600" /> Preferências de Visibilidade
                        </h4>
                        
                        <div className="space-y-4">
                          <div className="flex items-start space-x-3">
                            <Checkbox 
                              title="Configuração de visibilidade para vagas"
                              id="busca-vaga" 
                              checked={form.watch('profissional.busca_vaga')}
                              onCheckedChange={(c) => form.setValue('profissional.busca_vaga', !!c)}
                            />
                            <div className="space-y-1">
                              <Label htmlFor="busca-vaga" className="font-bold">Buscar Vaga em Escolas</Label>
                              <p className="text-sm text-zinc-500">Seu currículo ficará visível para escolas buscarem candidatos.</p>
                            </div>
                          </div>

                          <div className="flex items-start space-x-3 pt-4 border-t border-indigo-100">
                            <Checkbox 
                              title="Configuração de visibilidade para serviços"
                              id="presta-servico" 
                              checked={form.watch('profissional.presta_servico')}
                              onCheckedChange={(c) => form.setValue('profissional.presta_servico', !!c)}
                            />
                            <div className="space-y-1">
                              <Label htmlFor="presta-servico" className="font-bold">Prestar Serviços para Famílias</Label>
                              <p className="text-sm text-zinc-500">Seu perfil aparecerá no Portal da Família como prestador de serviços.</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-4">
                        <Checkbox 
                          title="Aceite de termos e condições"
                          id="termos-prof" 
                          {...form.register('profissional.termos')}
                        />
                        <Label htmlFor="termos-prof" className="text-sm">Concordo com os termos de uso e política de privacidade.</Label>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Lojista Specific Steps */}
              {tipoAtivo === 'lojista' && (
                <>
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Razão Social</Label>
                          <Input placeholder="Nome da Empresa" {...form.register('lojista.razao_social')} />
                        </div>
                        <div className="space-y-2">
                          <Label>CNPJ</Label>
                          <Input placeholder="00.000.000/0001-00" {...form.register('lojista.cnpj')} />
                        </div>
                        <div className="space-y-2">
                          <Label>Nome Fantasia</Label>
                          <Input placeholder="Como sua loja é conhecida" {...form.register('lojista.nome_fantasia')} />
                        </div>
                        <div className="space-y-2">
                          <Label>Categoria</Label>
                          <Input placeholder="Ex: Uniformes, Papelaria, etc." {...form.register('lojista.categoria')} />
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>E-mail Comercial</Label>
                          <Input placeholder="vendas@empresa.com" {...form.register('lojista.email_contato')} />
                        </div>
                        <div className="space-y-2">
                          <Label>Telefone / WhatsApp</Label>
                          <Input placeholder="(11) 99999-9999" {...form.register('lojista.telefone_contato')} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Descrição da Loja (Opcional)</Label>
                        <Textarea placeholder="Fale um pouco sobre seus produtos..." className="h-32" {...form.register('lojista.descricao')} />
                      </div>
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className="space-y-8">
                      <div className="p-8 border-2 border-dashed rounded-2xl text-center space-y-4">
                        <ShoppingBag size={48} className="mx-auto text-zinc-300" />
                        <h3 className="text-xl font-bold">Quase lá!</h3>
                        <p className="text-sm text-zinc-500">Ao finalizar seu cadastro, você entrará no plano Free por tempo limitado.</p>
                      </div>

                      <div className="flex items-center space-x-3 p-4">
                        <Checkbox 
                          title="Aceite de termos para lojistas"
                          id="termos-loj" 
                          {...form.register('lojista.termos')}
                        />
                        <Label htmlFor="termos-loj" className="text-sm">Concordo com os termos de uso e política de privacidade para lojistas.</Label>
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
              title="Voltar para o passo anterior"
              variant="outline" 
              onClick={currentStep === 1 ? () => navigate('/login') : prevStep}
              className="px-6"
            >
              <ChevronLeft size={20} className="mr-1" /> 
              {currentStep === 1 ? 'Cancelar' : 'Anterior'}
            </Button>

            {currentStep < steps.length ? (
              <Button 
                title="Ir para o próximo passo"
                onClick={nextStep} 
                className="bg-zinc-900 hover:bg-zinc-800 text-white px-8"
              >
                Próximo <ChevronRight size={20} className="ml-1" />
              </Button>
            ) : (
              <Button 
                title="Finalizar e criar conta"
                type="submit" 
                form="registration-form"
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 shadow-lg shadow-indigo-100"
              >
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando Conta...</> : 'Finalizar Cadastro'}
              </Button>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  )
}
