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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  MapPin,
  Percent,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { mascaraCPF, mascaraTelefone, validarCPF, validarEmail, mascaraCEP } from '@/lib/validacoes'

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
  valor_mensalidade_atual: z.coerce.number().min(0, 'Valor inválido').optional(),
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
  { title: 'Dados do Aluno', icon: User, description: 'Informações do aluno' },
  { title: 'Endereço', icon: Building2, description: 'Endereço do aluno' },
  { title: 'Saúde', icon: Heart, description: 'Informações de saúde' },
]

export function AlunoCadastroPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const criarAlunoComResponsavel = useCriarAlunoComResponsavel()
  const { data: totalAtivos } = useAlunosAtivos()
  const { data: limite } = useLimiteAlunos()
  const { data: filiais } = useFiliais()
  const [showPassword, setShowPassword] = useState(false)
  const [responsavelEncontrado, setResponsavelEncontrado] = useState(false)
  const [buscandoCpf, setBuscandoCpf] = useState(false)
  const [irmaosExistentes, setIrmaosExistentes] = useState<any[]>([])
  const [showPostCadastroModal, setShowPostCadastroModal] = useState(false)
  const [lastCreatedAluno, setLastCreatedAluno] = useState<any>(null)

  const limiteAtingido = limite !== undefined && totalAtivos !== undefined && totalAtivos >= limite

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    reset,
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
      nome_social: '',
      data_nascimento: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      patologias: '',
      medicamentos: '',
      observacoes_saude: '',
      valor_mensalidade_atual: 0,
      data_ingresso: new Date().toISOString().split('T')[0],
    },
  })

  const resetForm = () => {
    reset({
      responsavel_nome: '',
      responsavel_cpf: '',
      responsavel_email: '',
      responsavel_parentesco: '',
      responsavel_financeiro: 'sim',
      responsavel_senha: '',
      nome_completo: '',
      nome_social: '',
      data_nascimento: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      patologias: '',
      medicamentos: '',
      observacoes_saude: '',
      valor_mensalidade_atual: 0,
      data_ingresso: new Date().toISOString().split('T')[0],
      filial_id: watch('filial_id') // Mantém a filial selecionada
    })
    setCurrentStep(0)
    setResponsavelEncontrado(false)
    setIrmaosExistentes([])
    setShowPostCadastroModal(false)
  }

  // Selecionar automaticamente a matriz se houver filiais
  useEffect(() => {
    if (filiais && filiais.length > 0) {
      const matriz = (filiais as any[]).find(f => f.is_matriz)
      if (matriz) {
        setValue('filial_id', matriz.id)
      } else if (filiais.length === 1) {
        setValue('filial_id', (filiais[0] as any).id)
      }
    }
  }, [filiais, setValue])

  const { fetchAddressByCEP, fetchCitiesByUF, cities, loadingCities, loading: buscandoCep, estados } = useViaCEP()
  const selectedEstado = watch('estado')

  useEffect(() => {
    if (selectedEstado) {
      fetchCitiesByUF(selectedEstado)
    }
  }, [selectedEstado])

  const buscarCep = async (cep: string) => {
    const data = await fetchAddressByCEP(cep)
    if (data && !('error' in data)) {
      setValue('logradouro', data.logradouro || '', { shouldValidate: true })
      setValue('bairro', data.bairro || '', { shouldValidate: true })
      setValue('estado', data.estado || '', { shouldValidate: true })
      setTimeout(() => {
        setValue('cidade', data.cidade || '', { shouldValidate: true })
      }, 500)
      toast.success('Endereço preenchido!')
    } else if (data && 'error' in data) {
      toast.error(data.error)
    }
  }

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = mascaraCEP(e.target.value)
    setValue('cep', valor, { shouldValidate: true })
    if (valor.length === 9) buscarCep(valor)
  }

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>, campo: 'cpf' | 'responsavel_cpf') => {
    const valor = e.target.value
    setValue(campo, mascaraCPF(valor), { shouldValidate: true })
  }

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value
    setValue('responsavel_telefone', mascaraTelefone(valor), { shouldValidate: true })
  }

  const handleCpfResponsavelBlur = async () => {
    const cpf = watch('responsavel_cpf')
    if (!cpf || cpf.length < 14) return
    
    setBuscandoCpf(true)
    const cpfLimpo = cpf.replace(/\D/g, '')
    try {
      // 1. Buscar responsável
      const { data: resp, error: respError } = await supabase
        .from('responsaveis')
        .select('id, nome, email, telefone, user_id')
        .eq('cpf', cpfLimpo)
        .maybeSingle()
        
      if (resp) {
        // Agora só consideramos "Identificado" se ele já tiver acesso ao Portal (user_id)
        if (resp.user_id) {
          setResponsavelEncontrado(true)
          toast.info('Responsável identificado! Ele já possui conta na plataforma.', {
            description: 'Não é necessário criar uma nova senha.',
            duration: 6000
          })
        } else {
          setResponsavelEncontrado(false)
          toast.success('Histórico encontrado!', {
            description: 'Dados básicos preenchidos. Defina uma senha para este novo acesso.'
          })
        }

        setValue('responsavel_nome', resp.nome || '', { shouldValidate: true })
        setValue('responsavel_email', resp.email || '', { shouldValidate: true })
        setValue('responsavel_telefone', resp.telefone || '', { shouldValidate: true })
        const { data: vinculos } = await supabase
          .from('aluno_responsavel')
          .select('aluno_id, alunos(nome_completo)')
          .eq('responsavel_id', resp.id)
          .eq('is_financeiro', true)

        if (vinculos && vinculos.length > 0) {
          const alunosList = vinculos.map((v: any) => v.alunos.nome_completo);
          setIrmaosExistentes(alunosList);
          toast.warning('Atenção: Irmãos detectados!', {
            description: `Este responsável já paga a mensalidade de: ${alunosList.join(', ')}. Sugerimos aplicar um desconto.`,
            duration: 8000
          })
        }
      } else {
        setResponsavelEncontrado(false)
        setIrmaosExistentes([])
      }
    } catch (err) {
      console.error('Erro ao buscar responsável:', err)
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

    // Validação extra para senha se for novo responsável
    if (currentStep === 0 && !responsavelEncontrado) {
      const senha = watch('responsavel_senha')
      if (!senha || senha.length < 6) {
        toast.error('Defina uma senha de no mínimo 6 caracteres para o novo responsável.')
        return false
      }
    }

    return await trigger(fieldsPerStep[currentStep])
  }

  // const [lastStepChangeTime, setLastStepChangeTime] = useState(0)

  const nextStep = async () => {
    const isValid = await validateStep()
    if (isValid && currentStep < steps.length - 1) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1)
  }

  const onSubmit = async (data: AlunoFormValues) => {
    // Definitive Fix: Prevent auto-submission unless we are on the HEALTH step (index 3)
    if (currentStep < steps.length - 1) {
      nextStep()
      return
    }

    if (!authUser) return
    if (limiteAtingido) {
      toast.error('Limite de alunos atingido!')
      return
    }

    try {
      if (!authUser.tenantId || authUser.tenantId === '') {
        toast.error('Seu perfil de gestor não está vinculado a nenhuma escola. Saia e entre novamente.')
        return
      }

      // Converter patologias e medicamentos em arrays
      const patologias = data.patologias
        ? data.patologias.split(',').map((p) => p.trim()).filter(Boolean)
        : null
      const medicamentos = data.medicamentos
        ? data.medicamentos.split(',').map((m) => m.trim()).filter(Boolean)
        : null

      const payloadResponsavel = {
        cpf: data.responsavel_cpf,
        nome: data.responsavel_nome,
        telefone: data.responsavel_telefone && data.responsavel_telefone !== '' ? data.responsavel_telefone : null,
        email: data.responsavel_email && data.responsavel_email !== '' ? data.responsavel_email : null,
        senha_hash: data.responsavel_senha || '',
        cep: null,
        logradouro: null,
        numero: null,
        complemento: null,
        bairro: null,
        cidade: null,
        estado: null,
      }

      const payloadAluno = {
        tenant_id: authUser.tenantId,
        filial_id: data.filial_id && data.filial_id !== '' ? data.filial_id : null,
        nome_completo: data.nome_completo,
        nome_social: data.nome_social || null,
        data_nascimento: data.data_nascimento,
        cpf: data.cpf && data.cpf !== '' ? data.cpf : null,
        patologias,
        medicamentos,
        observacoes_saude: data.observacoes_saude || null,
        status: 'ativo' as const,
        cep: data.cep && data.cep !== '' ? data.cep : null,
        logradouro: data.logradouro && data.logradouro !== '' ? data.logradouro : null,
        numero: data.numero && data.numero !== '' ? data.numero : null,
        complemento: data.complemento && data.complemento !== '' ? data.complemento : null,
        bairro: data.bairro && data.bairro !== '' ? data.bairro : null,
        cidade: data.cidade && data.cidade !== '' ? data.cidade : null,
        estado: data.estado && data.estado !== '' ? data.estado : null,
        valor_mensalidade_atual: data.valor_mensalidade_atual || 0,
        data_ingresso: data.data_ingresso || new Date().toISOString().split('T')[0],
      }

      console.log('📝 Payload Responsável:', JSON.stringify(payloadResponsavel, null, 2))
      console.log('📝 Payload Aluno:', JSON.stringify(payloadAluno, null, 2))

      const result = await criarAlunoComResponsavel.mutateAsync({
        responsavel: payloadResponsavel,
        aluno: payloadAluno as any, // Cast temporário se necessário para AlunoInsert
        grauParentesco: data.responsavel_parentesco || null,
        isFinanceiro: data.responsavel_financeiro === 'sim'
      })

      setLastCreatedAluno(result)
      toast.success('Aluno cadastrado com sucesso!')
      setShowPostCadastroModal(true)
    } catch (err: any) {
      console.error('Erro detalhado ao cadastrar aluno:', err)

      let errorMessage = 'Erro ao cadastrar aluno. '
      if (err?.message) errorMessage += err.message
      if (err?.details) errorMessage += ` (${err.details})`

      toast.error(errorMessage, { duration: 8000 })
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
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/alunos')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-100 shadow-sm text-slate-600 hover:text-teal-600 hover:border-teal-200 font-bold text-xs uppercase tracking-wider transition-all active:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Voltar
        </Button>
        <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-amber-900 mb-2">Limite de Alunos Atingido</h2>
            <p className="text-amber-700 max-w-md mx-auto">
              Limite de {limite} alunos ativos atingido. Atualize seu plano ou desative existentes.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Button
        variant="ghost"
        onClick={() => navigate('/alunos')}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-100 shadow-sm text-slate-600 hover:text-teal-600 hover:border-teal-200 font-bold text-xs uppercase tracking-wider transition-all active:bg-slate-50"
      >
        <ArrowLeft size={16} />
        Voltar
      </Button>

      {/* Stepper */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.title} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300',
                  index < currentStep
                    ? 'bg-emerald-500 text-white'
                    : index === currentStep
                    ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-200'
                    : 'bg-zinc-100 text-muted-foreground'
                )}
              >
                {index < currentStep ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              <span className={cn('text-xs mt-1.5 hidden sm:block', index === currentStep ? 'text-indigo-700 font-medium' : 'text-muted-foreground')}>
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={cn('h-0.5 w-8 sm:w-16 mx-2', index < currentStep ? 'bg-emerald-500' : 'bg-zinc-200')} />
            )}
          </div>
        ))}
      </div>

      <form 
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={handleKeyDown}
      >
        <Card className="border-0 shadow-md">
          <CardHeader className="pt-[30px]">
            <CardTitle>{steps[currentStep].title}</CardTitle>
            <CardDescription>{steps[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 2 - Dados do aluno */}
            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nome_completo">Nome completo *</Label>
                  <Input
                    id="nome_completo"
                    placeholder="Digite o nome completo do aluno"
                    {...register('nome_completo')}
                    className="w-full"
                  />
                  {errors.nome_completo && (
                    <p className="text-sm text-destructive">{errors.nome_completo.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome_social">Nome social</Label>
                    <Input
                      id="nome_social"
                      placeholder="Nome pelo qual é conhecido"
                      {...register('nome_social')}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_nascimento">Data de Nascimento *</Label>
                    <Input
                      id="data_nascimento"
                      type="date"
                      {...register('data_nascimento')}
                      className="w-full"
                    />
                    {errors.data_nascimento && (
                      <p className="text-sm text-destructive">{errors.data_nascimento.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="genero">Gênero</Label>
                    <Select onValueChange={(v) => setValue('genero', v)}>
                      <SelectTrigger id="genero" className="w-full">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                        <SelectItem value="nao_binario">Não-binário</SelectItem>
                        <SelectItem value="nao_informado">Prefiro não informar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      placeholder="000.000.000-00"
                      {...register('cpf')}
                      onChange={(e) => handleCpfChange(e, 'cpf')}
                      maxLength={14}
                      className="w-full"
                    />
                    {errors.cpf && (
                      <p className="text-sm text-destructive">{errors.cpf.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rg">RG</Label>
                    <Input
                      id="rg"
                      placeholder="Número do RG"
                      {...register('rg')}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="valor_mensalidade_atual">Valor da Mensalidade (R$)</Label>
                    <Input
                      id="valor_mensalidade_atual"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      {...register('valor_mensalidade_atual')}
                      className="w-full"
                    />
                    <p className="text-[10px] text-muted-foreground italic">Cálculo automático de proporcional no primeiro mês</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_ingresso">Data de Ingresso</Label>
                    <Input
                      id="data_ingresso"
                      type="date"
                      {...register('data_ingresso')}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Seção de Desconto no Cadastro */}
                <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Percent size={18} className="font-bold" />
                    <h4 className="font-bold text-sm uppercase tracking-wider">Desconto Especial</h4>
                  </div>
                  
                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-start gap-3 mt-4">
                      <Users className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-indigo-900 leading-tight">Sugestão: Matriz de Descontos (DSS)</p>
                        <p className="text-[10px] text-indigo-700 leading-relaxed mt-1">Conclua o cadastro e caso deseje poderá aplicar descontos para o aluno. {irmaosExistentes.length > 0 && `(Vínculo múltiplo detectado com: ${irmaosExistentes.join(', ')})`}</p>
                      </div>
                    </div>
                </div>
              </>
            )}

            {/* Step 3 - Endereço */}
            {currentStep === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP *</Label>
                  <div className="relative">
                    <Input
                      id="cep"
                      placeholder="00000-000"
                      {...register('cep')}
                      onChange={handleCepChange}
                      maxLength={9}
                      className="w-full"
                    />
                    {buscandoCep && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="space-y-2 sm:col-span-3">
                    <Label htmlFor="logradouro">Logradouro *</Label>
                    <Input
                      id="logradouro"
                      placeholder="Rua, Avenida, Alameda..."
                      {...register('logradouro')}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número *</Label>
                    <Input
                      id="numero"
                      placeholder="Nº"
                      {...register('numero')}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bairro">Bairro *</Label>
                    <Input
                      id="bairro"
                      placeholder="Bairro"
                      {...register('bairro')}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado (UF) *</Label>
                    <Select value={watch('estado')} onValueChange={(val) => setValue('estado', val, { shouldValidate: true })}>
                      <SelectTrigger id="estado" className="w-full">
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {estados.map((est) => (
                          <SelectItem key={est.value} value={est.value}>{est.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade *</Label>
                    <Select value={watch('cidade')} onValueChange={(val) => setValue('cidade', val, { shouldValidate: true })} disabled={!selectedEstado || loadingCities}>
                      <SelectTrigger id="cidade" className="w-full">
                        <SelectValue placeholder={loadingCities ? "..." : "Selecione"} />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.value} value={city.value}>{city.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    placeholder="Apto, Bloco, Ponto de referência (opcional)"
                    {...register('complemento')}
                    className="w-full"
                  />
                </div>
              </>
            )}

            {/* Step 4 - Saúde */}
            {currentStep === 3 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="patologias">Possui alguma patologia?</Label>
                  <Textarea id="patologias" placeholder="Separe por vírgula: asma, rinite, diabetes..." {...register('patologias')} />
                  <p className="text-xs text-muted-foreground">Separe cada item por vírgula</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medicamentos">Toma medicamento?</Label>
                  <Textarea id="medicamentos" placeholder="Separe por vírgula..." {...register('medicamentos')} />
                  <p className="text-xs text-muted-foreground">Separe cada item por vírgula</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observacoes_saude">Observações de Saúde / Alergias</Label>
                  <Textarea id="observacoes_saude" placeholder="Informações adicionais sobre alergias, restrições alimentares..." {...register('observacoes_saude')} />
                </div>
              </>
            )}

            {/* Step 1 - Responsável */}
            {currentStep === 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="responsavel_cpf">CPF do responsável *</Label>
                    <div className="relative">
                      <Input
                        id="responsavel_cpf"
                        placeholder="000.000.000-00"
                        {...register('responsavel_cpf')}
                        onChange={(e) => {
                          handleCpfChange(e, 'responsavel_cpf')
                          if (e.target.value.length === 14) {
                            // Pequeno timeout para garantir que o valor atualizou no form
                            setTimeout(() => {
                              const input = document.getElementById('responsavel_cpf')
                              input?.blur()
                            }, 100)
                          }
                        }}
                        onBlur={handleCpfResponsavelBlur}
                        maxLength={14}
                        className="w-full"
                      />
                      {buscandoCpf && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    {errors.responsavel_cpf && (
                      <p className="text-sm text-destructive">{errors.responsavel_cpf.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsavel_parentesco">Parentesco *</Label>
                    <Select value={watch('responsavel_parentesco')} onValueChange={(v) => setValue('responsavel_parentesco', v, { shouldValidate: true })}>
                      <SelectTrigger id="responsavel_parentesco" className="w-full">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pai">Pai</SelectItem>
                        <SelectItem value="mae">Mãe</SelectItem>
                        <SelectItem value="avo">Avô/Avó</SelectItem>
                        <SelectItem value="tio">Tio/Tia</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {responsavelEncontrado && (
                  <div className="bg-sky-50 border border-sky-200 text-sky-800 p-4 rounded-xl flex items-start gap-4 shadow-sm my-2">
                    <Users className="h-6 w-6 text-sky-600 shrink-0" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-sky-900 leading-none">Acesso Portal Ativo</h4>
                      <p className="text-sm text-sky-700 font-medium">
                        Este responsável já possui cadastro de acesso ao portal. Não é necessário definir uma nova senha.
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="responsavel_nome">Nome do responsável *</Label>
                  <Input 
                    id="responsavel_nome" 
                    placeholder="Digite o nome completo do responsável" 
                    {...register('responsavel_nome')} 
                  />
                  {errors.responsavel_nome && <p className="text-sm text-destructive">{errors.responsavel_nome.message}</p>}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="responsavel_telefone">Telefone</Label>
                    <Input 
                      id="responsavel_telefone" 
                      placeholder="(00) 00000-0000" 
                      {...register('responsavel_telefone')}
                      onChange={handleTelefoneChange}
                      maxLength={15}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsavel_email">E-mail</Label>
                    <Input 
                      id="responsavel_email" 
                      type="email" 
                      placeholder="exemplo@email.com" 
                      {...register('responsavel_email')} 
                    />
                    {errors.responsavel_email && <p className="text-sm text-destructive">{errors.responsavel_email.message}</p>}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Label className="text-sm font-bold flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-emerald-600" />
                    Responsável pelo pagamento da mensalidade? *
                  </Label>
                  <Select onValueChange={(v) => setValue('responsavel_financeiro', v)}>
                    <SelectTrigger className={`h-12 rounded-2xl ${errors.responsavel_financeiro ? 'border-destructive' : 'border-zinc-100 bg-zinc-50/50'}`}>
                      <SelectValue placeholder="Selecione Sim ou Não" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sim" className="font-bold text-emerald-600 italic">✅ Sim (Terá acesso ao financeiro no portal)</SelectItem>
                      <SelectItem value="nao">❌ Não (Sem acesso financeiro)</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.responsavel_financeiro && <p className="text-sm text-destructive font-bold">{errors.responsavel_financeiro.message}</p>}
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest px-1">Obs: Isso define quem vê boletos e faz pagamentos via portal.</p>
                </div>

                {!responsavelEncontrado && (
                  <div className="space-y-2">
                    <Label htmlFor="responsavel_senha">Senha de acesso *</Label>
                    <div className="relative">
                      <Input
                        id="responsavel_senha"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Mínimo 6 caracteres"
                        {...register('responsavel_senha')}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.responsavel_senha && <p className="text-sm text-destructive">{errors.responsavel_senha.message}</p>}
                    <p className="text-xs text-muted-foreground">Senha para o responsável acessar o portal</p>
                  </div>
                )}

                {filiais && filiais.length > 0 && (
                  <div className="space-y-2 pt-4 border-t">
                    <Label htmlFor="filial_id">Unidade / Filial</Label>
                    <Select value={watch('filial_id')} onValueChange={(v) => setValue('filial_id', v)}>
                      <SelectTrigger id="filial_id" className="w-full">
                        <SelectValue placeholder="Selecione a unidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {(filiais as any[])?.map((f: any) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.nome_unidade} {f.is_matriz ? '(Matriz)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Selecione a unidade onde o aluno será cadastrado (opcional)</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button type="button" variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
              </Button>
            )}
          </div>
          {currentStep < steps.length - 1 ? (
            <Button 
              key="btn-next-footer"
              type="button" 
              onClick={nextStep}
            >
              Próximo <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              key="btn-save-footer"
              type="submit" 
              disabled={isSubmitting}
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
              ) : (
                <><Check className="mr-2 h-4 w-4" /> Cadastrar Aluno</>
              )}
            </Button>
          )}
        </div>
      </form>

      {/* Modal Pós-Cadastro */}
      <Dialog open={showPostCadastroModal} onOpenChange={setShowPostCadastroModal}>
        <DialogContent className="sm:max-w-md">
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
              className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-sm font-bold"
              onClick={() => navigate('/matriculas', { state: { aluno_id: lastCreatedAluno?.id, autoOpen: true } })}
            >
              Matricular este aluno agora
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-11 text-xs"
              onClick={resetForm}
            >
              Cadastrar outro novo aluno
            </Button>
            <Button 
              variant="ghost" 
              className="w-full h-10 text-xs text-muted-foreground"
              onClick={() => navigate('/alunos')}
            >
              Ir para lista de alunos
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
