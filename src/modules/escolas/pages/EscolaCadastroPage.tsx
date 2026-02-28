import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useCriarEscola, usePlanos } from '../hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GraduationCap, Loader2, Check, Building2, User, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { mascaraCNPJ, mascaraCPF, mascaraTelefone, mascaraCEP, validarCNPJ, validarCPF, validarEmail } from '@/lib/validacoes'

const cadastroSchema = z.object({
  razao_social: z.string().min(3, 'Razão social é obrigatória'),
  cnpj: z.string().min(18, 'CNPJ inválido'),
  cep: z.string().min(9, 'CEP inválido'),
  logradouro: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().max(2).optional(),
  email_gestor: z.string().email('E-mail inválido'),
  cpf_gestor: z.string().min(14, 'CPF inválido'),
  telefone: z.string().optional().or(z.literal('')),
  plano_id: z.string().min(1, 'Selecione um plano'),
  limite_alunos_contratado: z.coerce.number().min(1, 'Mínimo 1 aluno'),
}).refine((data) => validarCNPJ(data.cnpj), {
  message: 'CNPJ inválido',
  path: ['cnpj'],
}).refine((data) => validarCPF(data.cpf_gestor), {
  message: 'CPF inválido',
  path: ['cpf_gestor'],
}).refine((data) => validarEmail(data.email_gestor), {
  message: 'E-mail inválido',
  path: ['email_gestor'],
})

type CadastroFormValues = z.infer<typeof cadastroSchema>

const steps = [
  { title: 'Empresa', icon: Building2 },
  { title: 'Endereço', icon: Building2 },
  { title: 'Gestor', icon: User },
  { title: 'Plano', icon: CreditCard },
]

export function EscolaCadastroPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const navigate = useNavigate()
  const criarEscola = useCriarEscola()
  const { data: planos } = usePlanos()

  const { register, handleSubmit, setValue, watch, trigger, formState: { errors, isSubmitting } } = useForm<CadastroFormValues>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: { limite_alunos_contratado: 50 },
  })

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value
    setValue('cnpj', mascaraCNPJ(valor), { shouldValidate: true })
  }

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value
    setValue('cpf_gestor', mascaraCPF(valor), { shouldValidate: true })
  }

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value
    setValue('telefone', mascaraTelefone(valor), { shouldValidate: true })
  }

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value
    setValue('cep', mascaraCEP(valor), { shouldValidate: true })
  }

  const buscarCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '')
    if (cepLimpo.length !== 8) return
    setBuscandoCep(true)
    try {
      const resp = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await resp.json()
      if (!data.erro) {
        setValue('logradouro', data.logradouro || '')
        setValue('bairro', data.bairro || '')
        setValue('cidade', data.localidade || '')
        setValue('estado', data.uf || '')
      }
    } catch {
      toast.error('Erro ao buscar CEP')
    }
    setBuscandoCep(false)
  }

  const validateStep = async () => {
    const fieldsPerStep: (keyof CadastroFormValues)[][] = [
      ['razao_social', 'cnpj'],
      ['cep'],
      ['email_gestor', 'cpf_gestor'],
      ['plano_id', 'limite_alunos_contratado'],
    ]
    return await trigger(fieldsPerStep[currentStep])
  }

  const nextStep = async () => {
    const valid = await validateStep()
    if (valid && currentStep < steps.length - 1) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1)
  }

  const generateSlug = (name: string) =>
    name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')

  const onSubmit = async (data: CadastroFormValues) => {
    try {
      await criarEscola.mutateAsync({
        slug: generateSlug(data.razao_social),
        razao_social: data.razao_social,
        cnpj: data.cnpj,
        email_gestor: data.email_gestor,
        telefone: data.telefone || null,
        cep: data.cep || null,
        logradouro: data.logradouro || null,
        bairro: data.bairro || null,
        cidade: data.cidade || null,
        estado: data.estado || null,
        plano_id: data.plano_id,
        limite_alunos_contratado: data.limite_alunos_contratado,
        status_assinatura: 'pendente',
        data_inicio: null,
        data_fim: null,
      })

      toast.success('Escola cadastrada com sucesso! Aguardando ativação.')
      navigate('/login')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao cadastrar'
      toast.error(msg)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-700 to-blue-600 bg-clip-text text-transparent">
            Cadastro de Escola
          </h1>
          <p className="text-muted-foreground mt-1">Preencha os dados para começar</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((_, i) => (
            <div key={i} className="flex items-center">
              <div className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                i < currentStep ? 'bg-emerald-500 text-white' :
                i === currentStep ? 'bg-indigo-600 text-white shadow-md' :
                'bg-zinc-200 text-muted-foreground'
              )}>
                {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={cn('h-0.5 w-6 mx-1', i < currentStep ? 'bg-emerald-500' : 'bg-zinc-200')} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg">{steps[currentStep].title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Step 1 - Empresa */}
              {currentStep === 0 && (
                <>
                  <div className="space-y-2">
                    <Label>Razão Social *</Label>
                    <Input 
                      placeholder="Digite a razão social da escola" 
                      {...register('razao_social')} 
                    />
                    {errors.razao_social && <p className="text-sm text-destructive">{errors.razao_social.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>CNPJ *</Label>
                    <Input 
                      placeholder="00.000.000/0000-00" 
                      {...register('cnpj')} 
                      onChange={handleCnpjChange}
                      maxLength={18}
                    />
                    {errors.cnpj && <p className="text-sm text-destructive">{errors.cnpj.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input 
                      placeholder="(00) 00000-0000" 
                      {...register('telefone')} 
                      onChange={handleTelefoneChange}
                      maxLength={15}
                    />
                  </div>
                </>
              )}

              {/* Step 2 - Endereço */}
              {currentStep === 1 && (
                <>
                  <div className="space-y-2">
                    <Label>CEP *</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="00000-000" 
                        {...register('cep')} 
                        onChange={handleCepChange}
                        maxLength={9}
                      />
                      <Button type="button" variant="outline" size="sm" disabled={buscandoCep} onClick={() => buscarCep(watch('cep'))}>
                        {buscandoCep ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
                      </Button>
                    </div>
                    {errors.cep && <p className="text-sm text-destructive">{errors.cep.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Logradouro</Label>
                    <Input placeholder="Rua, avenida, etc." {...register('logradouro')} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Bairro</Label>
                      <Input placeholder="Bairro" {...register('bairro')} />
                    </div>
                    <div className="space-y-2">
                      <Label>Cidade</Label>
                      <Input placeholder="Cidade" {...register('cidade')} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Input 
                      maxLength={2} 
                      placeholder="UF" 
                      {...register('estado')}
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>
                </>
              )}

              {/* Step 3 - Gestor */}
              {currentStep === 2 && (
                <>
                  <div className="space-y-2">
                    <Label>E-mail Corporativo *</Label>
                    <Input 
                      type="email" 
                      placeholder="gestor@escola.com.br" 
                      {...register('email_gestor')} 
                    />
                    {errors.email_gestor && <p className="text-sm text-destructive">{errors.email_gestor.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>CPF do Gestor *</Label>
                    <Input 
                      placeholder="000.000.000-00" 
                      {...register('cpf_gestor')} 
                      onChange={handleCpfChange}
                      maxLength={14}
                    />
                    {errors.cpf_gestor && <p className="text-sm text-destructive">{errors.cpf_gestor.message}</p>}
                  </div>
                </>
              )}

              {/* Step 4 - Plano */}
              {currentStep === 3 && (
                <>
                  <div className="space-y-2">
                    <Label>Selecione o Plano *</Label>
                    <Select onValueChange={(v) => setValue('plano_id', v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {planos?.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nome} — R$ {Number(p.valor_por_aluno).toFixed(2)}/aluno
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.plano_id && <p className="text-sm text-destructive">{errors.plano_id.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Limite de alunos contratados *</Label>
                    <Input type="number" {...register('limite_alunos_contratado')} />
                    {errors.limite_alunos_contratado && <p className="text-sm text-destructive">{errors.limite_alunos_contratado.message}</p>}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between mt-6">
            <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 0}>Anterior</Button>
            {currentStep < steps.length - 1 ? (
              <Button type="button" onClick={nextStep}>Próximo</Button>
            ) : (
              <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-emerald-600 to-green-600">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Cadastrar Escola
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
