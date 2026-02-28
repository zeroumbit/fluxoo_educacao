import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { useCriarAlunoComResponsavel, useAlunosAtivos } from '../hooks'
import { useLimiteAlunos } from '@/modules/assinatura/hooks'
import { useFiliais } from '@/modules/filiais/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { mascaraCPF, mascaraTelefone, validarCPF, validarEmail } from '@/lib/validacoes'

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
  responsavel_nome: z.string().min(3, 'Nome do responsável é obrigatório'),
  responsavel_cpf: z.string().min(14, 'CPF inválido'),
  responsavel_telefone: z.string().optional().or(z.literal('')),
  responsavel_email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  responsavel_parentesco: z.string().optional(),
  responsavel_senha: z.string().min(6, 'Senha mínima de 6 caracteres'),
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
  { title: 'Dados Pessoais', icon: User, description: 'Informações do aluno' },
  { title: 'Endereço', icon: Building2, description: 'Endereço do aluno' },
  { title: 'Saúde', icon: Heart, description: 'Informações de saúde' },
  { title: 'Responsável', icon: Users, description: 'Dados do responsável' },
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

  const limiteAtingido = limite !== undefined && totalAtivos !== undefined && totalAtivos >= limite

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<AlunoFormValues>({
    resolver: zodResolver(alunoSchema),
    defaultValues: { nome_completo: '', data_nascimento: '' },
  })

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

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>, campo: 'cpf' | 'responsavel_cpf') => {
    const valor = e.target.value
    setValue(campo, mascaraCPF(valor), { shouldValidate: true })
  }

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value
    setValue('responsavel_telefone', mascaraTelefone(valor), { shouldValidate: true })
  }

  const validateStep = async () => {
    const fieldsPerStep: (keyof AlunoFormValues)[][] = [
      ['nome_completo', 'data_nascimento'],
      [],
      [],
      ['responsavel_nome', 'responsavel_cpf', 'responsavel_senha'],
    ]
    return await trigger(fieldsPerStep[currentStep])
  }

  const nextStep = async () => {
    const isValid = await validateStep()
    if (isValid && currentStep < steps.length - 1) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1)
  }

  const onSubmit = async (data: AlunoFormValues) => {
    if (!authUser) return
    if (limiteAtingido) {
      toast.error('Limite de alunos atingido!')
      return
    }

    try {
      // Converter patologias e medicamentos em arrays
      const patologias = data.patologias
        ? data.patologias.split(',').map((p) => p.trim()).filter(Boolean)
        : null
      const medicamentos = data.medicamentos
        ? data.medicamentos.split(',').map((m) => m.trim()).filter(Boolean)
        : null

      await criarAlunoComResponsavel.mutateAsync({
        responsavel: {
          cpf: data.responsavel_cpf,
          nome: data.responsavel_nome,
          telefone: data.responsavel_telefone || null,
          email: data.responsavel_email || null,
          senha_hash: data.responsavel_senha, // Em produção, hash no servidor
        },
        aluno: {
          tenant_id: authUser.tenantId,
          filial_id: data.filial_id || null,
          nome_completo: data.nome_completo,
          nome_social: data.nome_social || null,
          data_nascimento: data.data_nascimento,
          cpf: data.cpf || null,
          patologias,
          medicamentos,
          observacoes_saude: data.observacoes_saude || null,
          status: 'ativo',
        },
        grauParentesco: data.responsavel_parentesco || null,
      })

      toast.success('Aluno cadastrado com sucesso!')
      navigate('/alunos')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao cadastrar aluno'
      toast.error(message)
    }
  }

  if (limiteAtingido) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/alunos')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
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
    <div className="space-y-6 max-w-2xl mx-auto">
      <Button variant="ghost" onClick={() => navigate('/alunos')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
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

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>{steps[currentStep].title}</CardTitle>
            <CardDescription>{steps[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1 - Dados Pessoais */}
            {currentStep === 0 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nome_completo">Nome completo *</Label>
                  <Input id="nome_completo" placeholder="Digite o nome completo do aluno" {...register('nome_completo')} />
                  {errors.nome_completo && <p className="text-sm text-destructive">{errors.nome_completo.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome_social">Como quer ser chamado (Nome Social) *</Label>
                  <Input id="nome_social" placeholder="Nome social pelo qual o aluno é conhecido" {...register('nome_social')} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data_nascimento">Data de Nascimento *</Label>
                    <Input id="data_nascimento" type="date" {...register('data_nascimento')} />
                    {errors.data_nascimento && <p className="text-sm text-destructive">{errors.data_nascimento.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="genero">Gênero</Label>
                    <Select onValueChange={(v) => setValue('genero', v)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="masculino">Masculino</SelectItem><SelectItem value="feminino">Feminino</SelectItem><SelectItem value="nao_binario">Não-binário</SelectItem><SelectItem value="nao_informado">Prefiro não informar</SelectItem></SelectContent></Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input id="cpf" placeholder="000.000.000-00" {...register('cpf')} onChange={(e) => handleCpfChange(e, 'cpf')} maxLength={14} />
                    {errors.cpf && <p className="text-sm text-destructive">{errors.cpf.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rg">RG</Label>
                    <Input id="rg" placeholder="Número do RG" {...register('rg')} />
                  </div>
                </div>
              </>
            )}

            {/* Step 2 - Endereço */}
            {currentStep === 1 && (
              <>
                <div className="flex gap-2">
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="cep">CEP *</Label>
                    <Input id="cep" placeholder="00000-000" {...register('cep')} maxLength={9} />
                  </div>
                  <Button type="button" variant="outline" className="mt-7" onClick={async () => {
                    const cepVal = (document.getElementById('cep') as HTMLInputElement)?.value?.replace(/\D/g, '')
                    if (cepVal?.length === 8) {
                      try {
                        const res = await fetch(`https://viacep.com.br/ws/${cepVal}/json/`)
                        const d = await res.json()
                        if (!d.erro) { setValue('logradouro', d.logradouro || ''); setValue('bairro', d.bairro || ''); setValue('cidade', d.localidade || ''); setValue('estado', d.uf || '') }
                      } catch {}
                    }
                  }}>Buscar</Button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2 col-span-2"><Label>Rua *</Label><Input placeholder="Logradouro" {...register('logradouro')} /></div>
                  <div className="space-y-2"><Label>Número</Label><Input placeholder="Nº" {...register('numero')} /></div>
                </div>
                <div className="space-y-2"><Label>Complemento</Label><Input placeholder="Apto, Bloco..." {...register('complemento')} /></div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>Bairro *</Label><Input {...register('bairro')} /></div>
                  <div className="space-y-2"><Label>Cidade *</Label><Input {...register('cidade')} /></div>
                  <div className="space-y-2"><Label>Estado *</Label><Input maxLength={2} {...register('estado')} /></div>
                </div>
              </>
            )}

            {/* Step 3 - Saúde */}
            {currentStep === 2 && (
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

            {/* Step 4 - Responsável */}
            {currentStep === 3 && (
              <>
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
                    <Label htmlFor="responsavel_cpf">CPF do responsável *</Label>
                    <Input 
                      id="responsavel_cpf" 
                      placeholder="000.000.000-00" 
                      {...register('responsavel_cpf')}
                      onChange={(e) => handleCpfChange(e, 'responsavel_cpf')}
                      maxLength={14}
                    />
                    {errors.responsavel_cpf && <p className="text-sm text-destructive">{errors.responsavel_cpf.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsavel_parentesco">Parentesco</Label>
                    <Select onValueChange={(v) => setValue('responsavel_parentesco', v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione o parentesco" /></SelectTrigger>
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
              </>
            )}

            {/* Unidade - dentro do step 4 (Responsável) */}
            {currentStep === 3 && filiais && filiais.length > 0 && (
              <div className="space-y-2 pt-4 border-t">
                <Label>Unidade / Filial (Opcional)</Label>
                <Select value={watch('filial_id')} onValueChange={(v) => setValue('filial_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione a unidade" /></SelectTrigger>
                  <SelectContent>
                    {(filiais as any[])?.map((f: any) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nome_unidade} {f.is_matriz ? '(Matriz)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 0}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
          </Button>
          {currentStep < steps.length - 1 ? (
            <Button type="button" onClick={nextStep}>
              Próximo <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700">
              {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>) : (<><Check className="mr-2 h-4 w-4" /> Cadastrar Aluno</>)}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
