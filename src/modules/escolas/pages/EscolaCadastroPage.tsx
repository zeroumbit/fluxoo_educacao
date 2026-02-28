import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useCriarEscola, usePlanos, useConfigRecebimento, useCriarAssinatura, useCriarFaturaInicial } from '../hooks'
import { useCriarFilial } from '@/modules/filiais/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { GraduationCap, Loader2, Check, Building2, User, CreditCard, Lock, MapPin, Eye, EyeOff, Wallet, QrCode, Upload, Puzzle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { mascaraCNPJ, mascaraCPF, mascaraTelefone, mascaraCEP, validarCNPJ, validarCPF } from '@/lib/validacoes'
import { supabase } from '@/lib/supabase'
import { useViaCEP } from '@/hooks/use-viacep'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEffect } from 'react'

// ========== SCHEMA ==========
const cadastroSchema = z.object({
  email: z.string().email('E-mail de acesso inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  razao_social: z.string().min(3, 'Razão social é obrigatória'),
  cnpj: z.string().min(18, 'CNPJ inválido'),
  telefone: z.string().optional().or(z.literal('')),
  cep: z.string().min(9, 'CEP inválido'),
  logradouro: z.string().min(3, 'Logradouro é obrigatório'),
  numero: z.string().min(1, 'Número é obrigatório'),
  bairro: z.string().min(2, 'Bairro é obrigatório'),
  cidade: z.string().min(2, 'Cidade é obrigatória'),
  estado: z.string().length(2, 'UF deve ter 2 letras'),
  nome_gestor: z.string().min(3, 'Nome do gestor é obrigatório'),
  email_gestor: z.string().email('E-mail corporativo inválido'),
  cpf_gestor: z.string().min(14, 'CPF inválido'),
  plano_id: z.string().min(1, 'Selecione um plano'),
  limite_alunos_contratado: z.preprocess((v) => Number(v), z.number().min(1, 'Mínimo 1 aluno')),
  metodo_pagamento: z.enum(['mercado_pago', 'pix_manual']).default('mercado_pago'),
}).refine((d) => validarCNPJ(d.cnpj), { message: 'CNPJ inválido', path: ['cnpj'] })
  .refine((d) => validarCPF(d.cpf_gestor), { message: 'CPF inválido', path: ['cpf_gestor'] })

type FormValues = z.infer<typeof cadastroSchema>

const steps = [
  { title: 'Acesso', icon: Lock },
  { title: 'Empresa', icon: Building2 },
  { title: 'Endereço', icon: MapPin },
  { title: 'Gestor', icon: User },
  { title: 'Plano', icon: CreditCard },
  { title: 'Checkout', icon: Wallet },
]

export function EscolaCadastroPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [comprovante, setComprovante] = useState<File | null>(null)
  const navigate = useNavigate()
  const criarEscola = useCriarEscola()
  const criarAssinatura = useCriarAssinatura()
  const criarFatura = useCriarFaturaInicial()
  const criarFilial = useCriarFilial()
  const { data: planos } = usePlanos()
  const { data: configPix } = useConfigRecebimento()

  const { register, handleSubmit, setValue, watch, trigger, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(cadastroSchema) as any,
    mode: 'onChange',
    defaultValues: {
      limite_alunos_contratado: 50 as any,
      metodo_pagamento: 'mercado_pago',
      estado: '',
      cidade: '',
    },
  })

  const { fetchAddressByCEP, fetchCitiesByUF, cities, loadingCities, loading: buscandoCep, estados } = useViaCEP()
  const selectedEstado = watch('estado')

  const selectedPlan = (planos as any[])?.find((p: any) => p.id === watch('plano_id'))
  const qtdAlunos = Number(watch('limite_alunos_contratado')) || 0
  const valorPorAluno = selectedPlan ? Number(selectedPlan.valor_por_aluno) : 0
  const totalMensal = valorPorAluno * qtdAlunos
  const metodoPgto = watch('metodo_pagamento')
  const pixAtivo = configPix?.pix_manual_ativo === true

  // ===== Masks =====
  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => setValue('cnpj', mascaraCNPJ(e.target.value), { shouldValidate: true })
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => setValue('cpf_gestor', mascaraCPF(e.target.value), { shouldValidate: true })
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => setValue('telefone', mascaraTelefone(e.target.value), { shouldValidate: true })
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = mascaraCEP(e.target.value)
    setValue('cep', valor, { shouldValidate: true })
    if (valor.length === 9) buscarCep(valor)
  }

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
      // Pequeno delay para garantir que as cidades do estado foram carregadas antes de setar a cidade
      setTimeout(() => {
        setValue('cidade', data.cidade || '', { shouldValidate: true })
      }, 500)
      toast.success('Endereço preenchido!')
    } else if (data && 'error' in data) {
      toast.error(data.error)
    }
  }

  // ===== Steps Validation =====
  const fieldsPerStep: (keyof FormValues)[][] = [
    ['email', 'password'],
    ['razao_social', 'cnpj', 'telefone'],
    ['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado'],
    ['nome_gestor', 'email_gestor', 'cpf_gestor'],
    ['plano_id', 'limite_alunos_contratado'],
    ['metodo_pagamento'],
  ]

  const nextStep = async () => {
    const ok = await trigger(fieldsPerStep[currentStep])
    if (ok && currentStep < steps.length - 1) setCurrentStep(currentStep + 1)
  }
  const prevStep = () => currentStep > 0 && setCurrentStep(currentStep - 1)

  const generateSlug = (name: string) =>
    name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')

  // ===== Submit =====
  const onSubmit = async (data: FormValues) => {
    console.log('Iniciando submissão:', data)
    try {
      // 1. Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email, password: data.password,
        options: { data: { full_name: data.nome_gestor, role: 'gestor' } }
      })
      if (authError) throw authError
      if (!authData.user) throw new Error('Erro ao criar usuário')

      // 2. Escola
      const escola = await criarEscola.mutateAsync({
        slug: generateSlug(data.razao_social),
        razao_social: data.razao_social,
        cnpj: data.cnpj,
        email_gestor: data.email_gestor,
        nome_gestor: data.nome_gestor,
        cpf_gestor: data.cpf_gestor,
        telefone: data.telefone || null,
        cep: data.cep || null,
        logradouro: data.logradouro || null,
        numero: data.numero || null,
        bairro: data.bairro || null,
        cidade: data.cidade || null,
        estado: data.estado?.toUpperCase() || null,
        plano_id: data.plano_id,
        limite_alunos_contratado: data.limite_alunos_contratado,
        status_assinatura: 'pendente',
        metodo_pagamento: data.metodo_pagamento,
        gestor_user_id: authData.user.id,
        data_inicio: null, data_fim: null,
        data_vencimento_assinatura: null,
      })
      // 2.2. Criar Filial Matriz Automaticamente
      await criarFilial.mutateAsync({
        tenant_id: escola.id,
        nome_unidade: 'Matriz',
        is_matriz: true,
        cnpj_proprio: data.cnpj,
        cep: data.cep,
        logradouro: data.logradouro,
        bairro: data.bairro,
        numero: data.numero,
        cidade: data.cidade,
        estado: data.estado,
      })

      // 3. Assinatura contratual
      const hoje = new Date().toISOString().split('T')[0]
      const assinatura = await criarAssinatura.mutateAsync({
        tenant_id: escola.id,
        plano_id: data.plano_id,
        valor_por_aluno_contratado: valorPorAluno,
        limite_alunos_contratado: data.limite_alunos_contratado,
        valor_total_contratado: totalMensal,
        dia_vencimento: new Date().getDate() > 28 ? 28 : new Date().getDate(),
        status: 'ativa',
        data_inicio: hoje,
      })

      // 4. Fatura inicial
      let comprovanteUrl: string | undefined
      if (data.metodo_pagamento === 'pix_manual' && comprovante) {
        const ext = comprovante.name.split('.').pop()
        const path = `comprovantes/${escola.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('comprovantes')
          .upload(path, comprovante)
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('comprovantes').getPublicUrl(path)
          comprovanteUrl = urlData.publicUrl
        }
      }

      const vencimento = new Date()
      vencimento.setDate(vencimento.getDate() + 5)

      await criarFatura.mutateAsync({
        tenant_id: escola.id,
        assinatura_id: assinatura.id,
        competencia: hoje,
        valor: totalMensal,
        data_vencimento: vencimento.toISOString().split('T')[0],
        status: data.metodo_pagamento === 'mercado_pago' ? 'pendente' : 'pendente_confirmacao',
        forma_pagamento: data.metodo_pagamento,
        comprovante_url: comprovanteUrl,
      })

      if (data.metodo_pagamento === 'mercado_pago') {
        toast.success('Cadastro realizado! Redirecionando para o pagamento...')
        setTimeout(() => navigate('/login'), 2500)
      } else {
        toast.success('Cadastro enviado! Aguarde a confirmação do comprovante.')
        navigate('/login')
      }
    } catch (err) {
      console.error('Erro no checkout:', err)
      toast.error(err instanceof Error ? err.message : 'Erro ao cadastrar')
    }
  }

  const onInvalid = (errors: any) => {
    console.warn('Erros de validação:', errors)
    toast.error('Por favor, revise os campos do formulário. Alguma informação está inválida ou incompleta.')
  }

  // ===== RENDER =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex flex-col items-center justify-center p-6 lg:p-12">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-zinc-100 flex flex-col md:flex-row">
        
        {/* Sidebar */}
        <div className="hidden md:flex md:w-1/3 bg-gradient-to-b from-indigo-600 to-blue-700 p-8 flex-col justify-between text-white">
          <div>
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-xl font-bold mb-2">Seja bem-vindo!</h2>
            <p className="text-indigo-100 text-sm leading-relaxed">Modernize sua gestão escolar.</p>
          </div>
          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={i} className={cn("flex items-center gap-3 transition-opacity duration-300", i === currentStep ? "opacity-100" : "opacity-40")}>
                <div className={cn("h-8 w-8 rounded-full border flex items-center justify-center text-xs font-bold", i <= currentStep ? "bg-white text-indigo-600 border-white" : "border-white/30")}>
                  {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className="text-xs font-medium uppercase tracking-wider">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 p-8 md:p-10">
          <div className="md:hidden flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center"><GraduationCap className="h-5 w-5 text-white" /></div>
              <h1 className="font-bold text-lg">Fluxoo Educação</h1>
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase">Passo {currentStep + 1} de {steps.length}</span>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl font-bold text-zinc-900 mb-1">{steps[currentStep].title}</h3>
            <p className="text-sm text-muted-foreground">Preencha as informações necessárias</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit as any, onInvalid as any)} className="space-y-6">
            <div className="min-h-[350px] flex flex-col justify-center animate-in fade-in slide-in-from-right-4 duration-500">
              
              {/* STEP 1 - ACESSO */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail de Acesso *</Label>
                    <Input id="email" type="email" placeholder="usuario@exemplo.com" {...register('email')} />
                    {errors.email && <p className="text-xs text-destructive font-medium">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha *</Label>
                    <div className="relative">
                      <Input id="password" type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" {...register('password')} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-destructive font-medium">{errors.password.message}</p>}
                  </div>
                </div>
              )}

              {/* STEP 2 - EMPRESA */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2"><Label>Razão Social *</Label><Input placeholder="Nome jurídico" {...register('razao_social')} />{errors.razao_social && <p className="text-xs text-destructive">{errors.razao_social.message}</p>}</div>
                  <div className="space-y-2"><Label>CNPJ *</Label><Input placeholder="00.000.000/0000-00" {...register('cnpj')} onChange={handleCnpjChange} maxLength={18} />{errors.cnpj && <p className="text-xs text-destructive">{errors.cnpj.message}</p>}</div>
                  <div className="space-y-2"><Label>Telefone / WhatsApp</Label><Input placeholder="(00) 00000-0000" {...register('telefone')} onChange={handleTelefoneChange} maxLength={15} /></div>
                </div>
              )}

              {/* STEP 3 - ENDEREÇO */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2"><Label>CEP *</Label><Input placeholder="00000-000" {...register('cep')} onChange={handleCepChange} maxLength={9} /></div>
                    <div className="flex items-end"><Button type="button" variant="outline" className="w-full text-xs h-10 border-dashed" disabled={buscandoCep} onClick={() => buscarCep(watch('cep'))}>{buscandoCep ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sincronizar'}</Button></div>
                  </div>
                  {errors.cep && <p className="text-xs text-destructive">{errors.cep.message}</p>}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-3 space-y-2"><Label>Logradouro *</Label><Input placeholder="Rua, Av..." {...register('logradouro')} /></div>
                    <div className="space-y-2"><Label>Nº *</Label><Input placeholder="123" {...register('numero')} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Bairro *</Label>
                      <Input placeholder="Bairro" {...register('bairro')} />
                    </div>
                    <div className="space-y-2">
                      <Label>Estado (UF) *</Label>
                      <Select value={watch('estado')} onValueChange={(val) => setValue('estado', val, { shouldValidate: true })}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="UF" />
                        </SelectTrigger>
                        <SelectContent>
                          {estados.map((est) => (
                            <SelectItem key={est.value} value={est.value}>{est.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.estado && <p className="text-xs text-destructive">{errors.estado.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade *</Label>
                    <Select value={watch('cidade')} onValueChange={(val) => setValue('cidade', val, { shouldValidate: true })} disabled={!selectedEstado || loadingCities}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={loadingCities ? "Carregando cidades..." : "Selecione a cidade"} />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.value} value={city.value}>{city.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.cidade && <p className="text-xs text-destructive">{errors.cidade.message}</p>}
                  </div>
                </div>
              )}

              {/* STEP 4 - GESTOR */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="space-y-2"><Label>Nome Completo do Gestor *</Label><Input placeholder="Nome do responsável" {...register('nome_gestor')} />{errors.nome_gestor && <p className="text-xs text-destructive">{errors.nome_gestor.message}</p>}</div>
                  <div className="space-y-2"><Label>E-mail Corporativo *</Label><Input type="email" placeholder="gestor@escola.com" {...register('email_gestor')} />{errors.email_gestor && <p className="text-xs text-destructive">{errors.email_gestor.message}</p>}</div>
                  <div className="space-y-2"><Label>CPF do Gestor *</Label><Input placeholder="000.000.000-00" {...register('cpf_gestor')} onChange={handleCpfChange} maxLength={14} />{errors.cpf_gestor && <p className="text-xs text-destructive">{errors.cpf_gestor.message}</p>}</div>
                </div>
              )}

              {/* STEP 5 - PLANO */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Label>Escolha seu Plano *</Label>
                    <div className="grid gap-3">
                      {(planos as any[])?.map((p: any) => (
                        <div key={p.id} onClick={() => setValue('plano_id', p.id, { shouldValidate: true })}
                          className={cn("relative p-4 rounded-xl border-2 transition-all cursor-pointer hover:border-indigo-200", watch('plano_id') === p.id ? "border-indigo-600 bg-indigo-50/50" : "border-zinc-100 bg-zinc-50/30")}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-zinc-900">{p.nome}</span>
                            {watch('plano_id') === p.id && <Check className="h-4 w-4 text-indigo-600" />}
                          </div>
                          {p.descricao_curta && <p className="text-xs text-muted-foreground mb-2">{p.descricao_curta}</p>}
                          <p className="text-sm text-indigo-700 font-semibold">R$ {Number(p.valor_por_aluno).toFixed(2)} <span className="text-xs font-normal text-zinc-500">por aluno</span></p>
                          {p.modulos?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {p.modulos.map((pm: any) => (
                                <span key={pm.modulo?.id || Math.random()} className="inline-flex items-center gap-1 text-[10px] bg-indigo-100/50 text-indigo-700 rounded-md px-1.5 py-0.5 font-medium">
                                  <Puzzle className="h-2.5 w-2.5" />{pm.modulo?.nome}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2"><Label>Quantidade prevista de Alunos *</Label><Input type="number" placeholder="Ex: 100" {...register('limite_alunos_contratado')} /></div>
                  {selectedPlan && qtdAlunos > 0 && (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-lg animate-in fade-in zoom-in duration-300">
                      <div className="flex justify-between items-center opacity-80 text-xs uppercase tracking-wider font-bold mb-2"><span>Investimento Mensal</span><CreditCard className="h-4 w-4" /></div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-medium opacity-90">R$</span>
                        <span className="text-3xl font-black">{totalMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <p className="text-xs opacity-70 mt-1">{qtdAlunos} alunos × R$ {valorPorAluno.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 6 - CHECKOUT */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  {/* Resumo */}
                  <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-3">
                    <h4 className="font-bold text-zinc-900">{watch('razao_social')}</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Plano:</span> <strong>{selectedPlan?.nome}</strong></div>
                      <div><span className="text-muted-foreground">Alunos:</span> <strong>{qtdAlunos}</strong></div>
                      <div><span className="text-muted-foreground">Valor/Aluno:</span> <strong>R$ {valorPorAluno.toFixed(2)}</strong></div>
                      <div><span className="text-muted-foreground">Total Mensal:</span> <strong className="text-indigo-700">R$ {totalMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
                    </div>
                  </div>

                  {/* Meio de Pagamento */}
                  <div className="space-y-3">
                    <Label className="text-xs uppercase tracking-widest font-black text-muted-foreground">Forma de Pagamento</Label>
                    <RadioGroup 
                      value={watch('metodo_pagamento')} 
                      onValueChange={(val: string) => setValue('metodo_pagamento', val as any, { shouldValidate: true })} 
                      className="grid gap-2"
                    >
                      <label className={cn("flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer", metodoPgto === 'mercado_pago' ? "border-indigo-600 bg-indigo-50/30" : "border-zinc-100")}>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center"><CreditCard className="h-4 w-4 text-indigo-600" /></div>
                          <div><p className="text-sm font-bold text-zinc-900 leading-none mb-1">Mercado Pago</p><p className="text-[10px] text-muted-foreground">Cartão ou Saldo (Ativação automática)</p></div>
                        </div>
                        <RadioGroupItem value="mercado_pago" className="sr-only" />
                        {metodoPgto === 'mercado_pago' && <Check className="h-4 w-4 text-indigo-600" />}
                      </label>

                      {pixAtivo && (
                        <label className={cn("flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer", metodoPgto === 'pix_manual' ? "border-emerald-600 bg-emerald-50/30" : "border-zinc-100")}>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center"><QrCode className="h-4 w-4 text-emerald-600" /></div>
                            <div><p className="text-sm font-bold text-zinc-900 leading-none mb-1">PIX Manual</p><p className="text-[10px] text-muted-foreground">Transferência + comprovante (Confirmação manual)</p></div>
                          </div>
                          <RadioGroupItem value="pix_manual" className="sr-only" />
                          {metodoPgto === 'pix_manual' && <Check className="h-4 w-4 text-emerald-600" />}
                        </label>
                      )}
                    </RadioGroup>
                  </div>

                  {/* PIX Details */}
                  {metodoPgto === 'pix_manual' && configPix && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 space-y-2">
                        <p className="text-xs font-bold text-emerald-800 uppercase">Dados para Transferência PIX</p>
                        <p className="text-sm"><span className="text-muted-foreground">Tipo:</span> <strong className="capitalize">{configPix.tipo_chave_pix}</strong></p>
                        <p className="text-sm"><span className="text-muted-foreground">Chave:</span> <strong>{configPix.chave_pix}</strong></p>
                        <p className="text-sm"><span className="text-muted-foreground">Favorecido:</span> <strong>{configPix.favorecido}</strong></p>
                      </div>
                      {configPix.instrucoes_extras && (
                        <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                          <p className="text-[10px] text-amber-800 leading-relaxed font-medium">{configPix.instrucoes_extras}</p>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Upload className="h-3 w-3" /> Comprovante (Obrigatório)</Label>
                        <Input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => setComprovante(e.target.files?.[0] || null)}
                          className="file:mr-3 file:text-xs file:font-bold file:border-0 file:bg-emerald-100 file:text-emerald-700 file:rounded-lg file:px-3 file:py-1"
                        />
                        {!comprovante && <p className="text-[10px] text-amber-700 font-medium">* Upload obrigatório para PIX Manual</p>}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="pt-6 border-t border-zinc-100 flex items-center justify-between gap-4">
              <Button type="button" variant="ghost" onClick={prevStep} disabled={currentStep === 0} className="text-zinc-500 hover:bg-zinc-100">Anterior</Button>
              {currentStep < steps.length - 1 ? (
                <Button type="button" onClick={nextStep} className="bg-zinc-900 hover:bg-zinc-800 rounded-xl px-8">Continuar</Button>
              ) : (
                <Button type="submit"
                  disabled={isSubmitting || (metodoPgto === 'pix_manual' && !comprovante)}
                  className={cn("rounded-xl px-8 shadow-lg transition-all",
                    metodoPgto === 'mercado_pago' ? "bg-indigo-600 hover:bg-indigo-700" : "bg-emerald-600 hover:bg-emerald-700"
                  )}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                  {metodoPgto === 'mercado_pago' ? 'Pagar com Mercado Pago' : 'Enviar Comprovante e Finalizar'}
                </Button>
              )}
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">Powered by Fluxoo Educação &copy; 2026</p>
          </div>
        </div>
      </div>
    </div>
  )
}
