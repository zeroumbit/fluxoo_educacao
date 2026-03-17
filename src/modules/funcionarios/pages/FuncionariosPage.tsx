import { useState, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import {
  useFuncionarios,
  useCriarFuncionario,
  useAtualizarFuncionario,
  useExcluirFuncionario,
  useCriarUsuarioEscola,
  useFuncoes,
  useCriarFuncaoCustom,
  useGerarFolhaPagamento,
} from '../hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MultiSelect } from '@/components/ui/multi-select'
import { Plus, Loader2, UserPlus, KeyRound, Eye, EyeOff, PlusCircle, Wallet, Calendar } from 'lucide-react'

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------
const funcSchema = z.object({
  nome_completo: z.string().min(3, 'Nome obrigatório'),
  como_chamado: z.string().optional(),
  funcoes: z.array(z.string()).min(1, 'Selecione ao menos uma função'),
  salario_bruto: z.coerce.number().optional(),
  dia_pagamento: z.coerce.number().min(1).max(31).optional(),
  data_admissao: z.string().optional(),
})

const userSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Mínimo 6 caracteres'),
  areas_acesso: z.array(z.string()).default([]),
})

type FuncFormData = z.infer<typeof funcSchema>
type UserFormData = z.infer<typeof userSchema>

const novaFuncaoSchema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  categoria: z.string().min(2, 'Categoria obrigatória'),
})

// ---------------------------------------------------------------------------
// Áreas de acesso da plataforma
// ---------------------------------------------------------------------------
const PLATFORM_FUNCTIONS = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'alunos', label: 'Alunos' },
  { value: 'turmas', label: 'Turmas' },
  { value: 'frequencia', label: 'Frequência/Chamada' },
  { value: 'mural', label: 'Mural de Avisos' },
  { value: 'financeiro', label: 'Financeiro (Geral)' },
  { value: 'financeiro_view', label: 'Financeiro (Somente Leitura)' },
  { value: 'contas_pagar', label: 'Contas a Pagar' },
  { value: 'config_financeira', label: 'Configuração Financeira' },
  { value: 'funcionarios', label: 'Funcionários' },
  { value: 'matriculas', label: 'Matrículas' },
  { value: 'planos_aula', label: 'Planos de Aula' },
  { value: 'atividades', label: 'Atividades' },
  { value: 'agenda', label: 'Agenda/Eventos' },
  { value: 'documentos', label: 'Documentos' },
  { value: 'almoxarifado', label: 'Almoxarifado' },
  { value: 'perfil_escola', label: 'Perfil da Escola' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function parsearMoeda(valor: string): number {
  if (!valor) return 0
  const limpo = valor.replace(/[^\d,.-]/g, '')
  if (!limpo) return 0
  const partes = limpo.split(',')
  if (partes.length > 1) {
    return parseFloat(`${partes[0].replace(/\./g, '')}.${partes.slice(1).join('')}`)
  }
  return parseFloat(limpo.replace(/\./g, ''))
}

// ---------------------------------------------------------------------------
// Componente: Modal "Nova Função"
// ---------------------------------------------------------------------------
interface NovaFuncaoDialogProps {
  tenantId: string
  categorias: string[]
  onCreated: (nome: string) => void
}

function NovaFuncaoDialog({ tenantId, categorias, onCreated }: NovaFuncaoDialogProps) {
  const [open, setOpen] = useState(false)
  const criarFuncao = useCriarFuncaoCustom()
  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(novaFuncaoSchema),
    defaultValues: { nome: '', categoria: '' },
  })

  const onSubmit = async (data: any) => {
    try {
      await criarFuncao.mutateAsync({
        tenant_id: tenantId,
        nome: data.nome.trim(),
        categoria: data.categoria,
        is_padrao: false,
        ativo: true,
      })
      toast.success(`Função "${data.nome}" criada!`)
      onCreated(data.nome.trim())
      reset()
      setOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar função')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 transition-colors"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          Nova função
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Nova Função</DialogTitle>
          <DialogDescription>
            Adicione uma função personalizada ao catálogo da sua escola.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nova-funcao-nome">Nome da função *</Label>
            <Input
              id="nova-funcao-nome"
              placeholder="Ex: Professor de Xadrez"
              {...register('nome')}
            />
            {errors.nome && <p className="text-sm text-destructive">{errors.nome.message as string}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nova-funcao-categoria">Categoria *</Label>
            <Select onValueChange={(v) => setValue('categoria', v)}>
              <SelectTrigger id="nova-funcao-categoria">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
                <SelectItem value="15. Outros Cargos Específicos">Outros</SelectItem>
              </SelectContent>
            </Select>
            {errors.categoria && <p className="text-sm text-destructive">{errors.categoria.message as string}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar Função'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Página Principal
// ---------------------------------------------------------------------------
export function FuncionariosPage() {
  const { authUser } = useAuth()
  const { data: funcionarios, isLoading } = useFuncionarios()
  const { data: funcoesCatalogo = [] } = useFuncoes()
  const criar = useCriarFuncionario()
  const atualizar = useAtualizarFuncionario()
  const excluir = useExcluirFuncionario()
  const criarUsuario = useCriarUsuarioEscola()
  const gerarFolha = useGerarFolhaPagamento()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [folhaDialogOpen, setFolhaDialogOpen] = useState(false)
  const [selectedFunc, setSelectedFunc] = useState<any>(null)
  const [editFunc, setEditFunc] = useState<any>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [salarioInput, setSalarioInput] = useState('')

  // Estados para geração de folha
  const [mesFolha, setMesFolha] = useState(new Date().getMonth() + 1)
  const [anoFolha, setAnoFolha] = useState(new Date().getFullYear())
  
  const funcForm = useForm<FuncFormData>({ 
    resolver: zodResolver(funcSchema) as any, 
    defaultValues: { 
      nome_completo: '',
      como_chamado: '',
      funcoes: [],
      data_admissao: '',
      salario_bruto: 0,
      dia_pagamento: 5
    } 
  })
  const userForm = useForm<UserFormData>({ resolver: zodResolver(userSchema) as any })

  // Ordem personalizada das categorias (grupos) solicitada pelo usuário
  const CATEGORY_ORDER = [
    '1. Direção e Gestão Geral',
    '3. Corpo Docente',
    '2. Coordenação e Supervisão Pedagógica',
    '4. Equipe Técnico-Pedagógica',
    '5. Secretaria e Administração',
    '6. Equipe de Apoio Pedagógico',
    '7. Biblioteca e Laboratórios',
    '8. Orientação e Disciplina',
    '9. Equipe de Apoio Operacional',
    '10. Tecnologia e Comunicação',
    '11. Manutenção e Infraestrutura',
    '12. Serviços Terceirizados',
    '13. Atendimento e Comunidade',
    '14. Gestão Financeira e Comercial',
    '15. Outros Cargos Específicos'
  ]

  // Transforma o catálogo em opções para o MultiSelect com ordenação customizada
  const funcaoOptions = useMemo(() => {
    const options = (funcoesCatalogo as any[]).map(f => ({ 
      value: f.nome, 
      label: f.nome, 
      group: f.categoria 
    }))

    return options.sort((a, b) => {
      const idxA = CATEGORY_ORDER.indexOf(a.group)
      const idxB = CATEGORY_ORDER.indexOf(b.group)
      
      if (idxA !== idxB) {
        if (idxA === -1) return 1
        if (idxB === -1) return -1
        return idxA - idxB
      }
      
      return a.label.localeCompare(b.label)
    })
  }, [funcoesCatalogo])

  // Categorias únicas com a mesma ordenação customizada (para o modal de nova função)
  const categorias = useMemo(() => {
    const uniqueCats = Array.from(new Set((funcoesCatalogo as any[]).map(f => f.categoria)))
    
    return uniqueCats.sort((a, b) => {
      const idxA = CATEGORY_ORDER.indexOf(a)
      const idxB = CATEGORY_ORDER.indexOf(b)
      
      if (idxA !== -1 && idxB !== -1) return idxA - idxB
      if (idxA !== -1) return -1
      if (idxB !== -1) return 1
      return a.localeCompare(b)
    })
  }, [funcoesCatalogo])

  const handleSalarioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSalarioInput(e.target.value)
    funcForm.setValue('salario_bruto', parsearMoeda(e.target.value))
  }

  const abrirNovoFuncionario = () => {
    setEditFunc(null)
    setSalarioInput('')
    funcForm.reset({ nome_completo: '', como_chamado: '', funcoes: [], salario_bruto: undefined, dia_pagamento: undefined, data_admissao: '' })
    setDialogOpen(true)
  }

  const handleEditar = (f: any) => {
    setEditFunc(f)
    setSalarioInput(f.salario_bruto ? f.salario_bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '')
    
    // Suporte a legado: se funcoes não existir, usa funcao (string única)
    const funcoesVal = Array.isArray(f.funcoes) && f.funcoes.length > 0
      ? f.funcoes
      : f.funcao ? [f.funcao] : []

    funcForm.reset({
      nome_completo: f.nome_completo,
      como_chamado: f.como_chamado || '',
      funcoes: funcoesVal,
      salario_bruto: f.salario_bruto,
      dia_pagamento: f.dia_pagamento,
      data_admissao: f.data_admissao || '',
    })
    setDialogOpen(true)
  }

  const onSubmitFunc = async (data: any) => {
    if (!authUser) return
    try {
      if (editFunc?.id) {
        await atualizar.mutateAsync({
          id: editFunc.id,
          data: {
            ...data,
            funcao: data.funcoes[0] ?? '',
            funcoes: data.funcoes,
          }
        })
        toast.success('Funcionário atualizado!')
      } else {
        await criar.mutateAsync({
          ...data,
          funcao: data.funcoes[0] ?? '',
          funcoes: data.funcoes,
          tenant_id: authUser.tenantId,
          status: 'ativo',
        })
        toast.success('Funcionário cadastrado!')
      }
      funcForm.reset()
      setDialogOpen(false)
      setEditFunc(null)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar')
    }
  }

  const onSubmitUser = async (data: any) => {
    if (!selectedFunc) return
    try {
      await criarUsuario.mutateAsync({
        funcionarioId: selectedFunc.id,
        email: data.email,
        senha: data.senha,
        areasAcesso: data.areas_acesso || [],
      })
      toast.success('Usuário criado com sucesso!')
      userForm.reset()
      setUserDialogOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar usuário')
    }
  }

  const handleDesativar = async (id: string) => {
    try {
      await excluir.mutateAsync(id)
      toast.success('Funcionário desativado.')
    } catch {
      toast.error('Erro')
    }
  }

  const handleGerarFolha = async () => {
    try {
      const res = await gerarFolha.mutateAsync({ mes: mesFolha, ano: anoFolha })
      if (res.gerados === 0 && res.pulados > 0) {
        toast.info(`Folha de ${mesFolha}/${anoFolha} já foi gerada anteriormente.`)
      } else if (res.gerados === 0) {
        toast.warning('Nenhum funcionário ativo com salário configurado encontrado.')
      } else {
        toast.success(`Sucesso! ${res.gerados} contas de salário geradas em Contas a Pagar.`)
        if (res.pulados > 0) toast.info(`${res.pulados} já existiam e foram puladas.`)
      }
      setFolhaDialogOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar folha')
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
  }

  const ativos = funcionarios?.filter((f: any) => f.status === 'ativo') || []
  const inativos = funcionarios?.filter((f: any) => f.status === 'inativo') || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Funcionários</h1>
          <p className="text-muted-foreground">Gerencie colaboradores e seus acessos ao sistema</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Modal: Gerar Folha */}
          <Dialog open={folhaDialogOpen} onOpenChange={setFolhaDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-emerald-200 hover:bg-emerald-50 text-emerald-700">
                <Wallet className="mr-2 h-4 w-4" /> Gerar Folha do Mês
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gerar Folha de Pagamento</DialogTitle>
                <DialogDescription>
                  Isso criará automaticamente lançamentos no <strong>Contas a Pagar</strong> para todos os funcionários ativos com salário cadastrado.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label>Mês de Referência</Label>
                  <Select value={String(mesFolha)} onValueChange={(v) => setMesFolha(Number(v))}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Mês" /></SelectTrigger>
                    <SelectContent>
                      {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((m, i) => (
                        <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ano</Label>
                  <Select value={String(anoFolha)} onValueChange={(v) => setAnoFolha(Number(v))}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Ano" /></SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026, 2027].map(a => (
                        <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
                <Calendar className="h-5 w-5 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  O sistema verificará o <strong>Salário Bruto</strong> e o <strong>Dia de Pagamento</strong> de cada colaborador para criar os vencimentos corretamente.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setFolhaDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleGerarFolha} disabled={gerarFolha.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {gerarFolha.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar e Gerar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modal: Novo Funcionário */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={abrirNovoFuncionario} className="bg-gradient-to-r from-indigo-600 to-blue-600 shadow-md">
              <Plus className="mr-2 h-4 w-4" /> Novo Funcionário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[800px]">
            <DialogHeader>
              <DialogTitle>{editFunc ? 'Editar Funcionário' : 'Cadastro de Funcionário'}</DialogTitle>
              <DialogDescription>
                {editFunc ? 'Atualize os dados do colaborador.' : 'Preencha os dados do novo colaborador.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={funcForm.handleSubmit(onSubmitFunc)} className="space-y-4">
              {/* Nome + Apelido */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Completo *</Label>
                  <Input placeholder="Nome completo" {...funcForm.register('nome_completo')} />
                  {funcForm.formState.errors.nome_completo && (
                    <p className="text-sm text-destructive">{funcForm.formState.errors.nome_completo.message as string}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Como é chamado</Label>
                  <Input placeholder="Apelido" {...funcForm.register('como_chamado')} />
                </div>
              </div>

              {/* Funções */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Função(ões) *</Label>
                  {authUser && (
                    <NovaFuncaoDialog
                      tenantId={authUser.tenantId}
                      categorias={categorias}
                      onCreated={(nome) => {
                        const current = funcForm.getValues('funcoes') || []
                        funcForm.setValue('funcoes', [...current, nome])
                      }}
                    />
                  )}
                </div>
                <Controller
                  control={funcForm.control}
                  name="funcoes"
                  render={({ field }) => (
                    <MultiSelect
                      options={funcaoOptions}
                      selected={field.value || []}
                      onChange={field.onChange}
                      placeholder="Selecione uma ou mais funções..."
                    />
                  )}
                />
                {funcForm.formState.errors.funcoes && (
                  <p className="text-sm text-destructive">{funcForm.formState.errors.funcoes.message as string}</p>
                )}
              </div>

              {/* Salário + Dia pagamento */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Salário Bruto (R$)</Label>
                  <Input
                    type="text"
                    placeholder="0,00"
                    value={salarioInput}
                    onChange={handleSalarioChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dia do Pagamento</Label>
                  <Input type="number" min="1" max="31" placeholder="5" {...funcForm.register('dia_pagamento')} />
                </div>
              </div>

              {/* Data Admissão */}
              <div className="space-y-2">
                <Label>Data de Admissão</Label>
                <Input type="date" {...funcForm.register('data_admissao')} />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={funcForm.formState.isSubmitting}>
                  {funcForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (editFunc ? 'Salvar Alterações' : 'Cadastrar')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Modal: Criar Usuário de Acesso */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="max-w-[800px]">
          <DialogHeader>
            <DialogTitle><KeyRound className="inline mr-2 h-5 w-5" />Criar Usuário de Acesso</DialogTitle>
            <DialogDescription>
              {selectedFunc && <>Para: <strong>{selectedFunc.nome_completo}</strong></>}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={userForm.handleSubmit(onSubmitUser)} className="space-y-4">
            <div className="space-y-2">
              <Label>E-mail (Login) *</Label>
              <Input type="email" placeholder="email@escola.com" {...userForm.register('email')} />
              {userForm.formState.errors.email && (
                <p className="text-sm text-destructive">{userForm.formState.errors.email.message as string}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Senha *</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  {...userForm.register('senha')}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {userForm.formState.errors.senha && (
                <p className="text-sm text-destructive">{userForm.formState.errors.senha.message as string}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Áreas de Acesso</Label>
              <Controller
                control={userForm.control}
                name="areas_acesso"
                render={({ field }) => (
                  <MultiSelect
                    options={PLATFORM_FUNCTIONS}
                    selected={field.value || []}
                    onChange={field.onChange}
                    placeholder="Selecione as funcionalidades..."
                  />
                )}
              />
              <p className="text-xs text-muted-foreground">Selecione as áreas que este funcionário poderá acessar no sistema.</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setUserDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={userForm.formState.isSubmitting}>
                {userForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar Acesso'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Tabela */}
      <Tabs defaultValue="ativos">
        <TabsList>
          <TabsTrigger value="ativos">Ativos ({ativos.length})</TabsTrigger>
          <TabsTrigger value="inativos">Inativos ({inativos.length})</TabsTrigger>
        </TabsList>

        {(['ativos', 'inativos'] as const).map(tab => (
          <TabsContent key={tab} value={tab}>
            <Card className="border-0 shadow-md">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Nome</TableHead>
                      <TableHead className="pl-4">Função(ões)</TableHead>
                      <TableHead className="pl-4">Admissão</TableHead>
                      <TableHead className="pl-4">Acesso</TableHead>
                      <TableHead className="text-right pr-4">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(tab === 'ativos' ? ativos : inativos).map((f: any) => {
                      // Suporte a legado: exibe funcoes[] se existir, senão exibe funcao
                      const funcoesList: string[] = Array.isArray(f.funcoes) && f.funcoes.length > 0
                        ? f.funcoes
                        : f.funcao ? [f.funcao] : []

                      return (
                        <TableRow key={f.id}>
                          <TableCell className="pl-4">
                            <div>
                              <p className="font-bold">{f.nome_completo}</p>
                              {f.como_chamado && <p className="text-xs text-muted-foreground">{f.como_chamado}</p>}
                            </div>
                          </TableCell>
                          <TableCell className="pl-4">
                            <div className="flex flex-wrap gap-1">
                              {funcoesList.length > 0
                                ? funcoesList.map(fn => (
                                    <Badge key={fn} variant="outline" className="text-xs">{fn}</Badge>
                                  ))
                                : <span className="text-muted-foreground text-xs">—</span>
                              }
                            </div>
                          </TableCell>
                          <TableCell className="pl-4 text-sm text-muted-foreground">
                            {f.data_admissao || '—'}
                          </TableCell>
                          <TableCell className="pl-4">
                            {f.user_id
                              ? <Badge className="bg-emerald-100 text-emerald-800">Com acesso</Badge>
                              : <Badge variant="secondary">Sem acesso</Badge>
                            }
                          </TableCell>
                          <TableCell className="text-right pr-4 space-x-1">
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-indigo-200 hover:bg-indigo-50 text-indigo-700"
                                onClick={() => handleEditar(f)}
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" /> Detalhes/Editar
                              </Button>
                              {!f.user_id && f.status === 'ativo' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => { setSelectedFunc(f); setUserDialogOpen(true) }}
                                >
                                  <UserPlus className="h-3.5 w-3.5 mr-1" /> Criar Acesso
                                </Button>
                              )}
                            {f.status === 'ativo' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive"
                                onClick={() => handleDesativar(f.id)}
                              >
                                Desativar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {(tab === 'ativos' ? ativos : inativos).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                          Nenhum funcionário {tab === 'ativos' ? 'ativo' : 'inativo'}.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
