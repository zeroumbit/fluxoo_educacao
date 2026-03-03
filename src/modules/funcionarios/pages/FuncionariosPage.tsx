import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { useFuncionarios, useCriarFuncionario, useExcluirFuncionario, useCriarUsuarioEscola } from '../hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Loader2, UserPlus, Users, Briefcase, KeyRound, Eye, EyeOff } from 'lucide-react'
import { mascaraCPF, validarCPF } from '@/lib/validacoes'
import { MultiSelect } from '@/components/ui/multi-select'

const funcSchema = z.object({
  nome_completo: z.string().min(3, 'Nome obrigatório'),
  como_chamado: z.string().optional(),
  funcao: z.string().min(2, 'Função obrigatória'),
  salario_bruto: z.coerce.number().optional(),
  dia_pagamento: z.coerce.number().min(1).max(31).optional(),
  data_admissao: z.string().optional(),
})

const userSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Mínimo 6 caracteres'),
  areas_acesso: z.array(z.string()).default([]),
})

const PLATFORM_FUNCTIONS = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'alunos', label: 'Alunos' },
  { value: 'turmas', label: 'Turmas' },
  { value: 'frequencia', label: 'Frequência/Chamada' },
  { value: 'mural', label: 'Mural de Avisos' },
  { value: 'financeiro', label: 'Financeiro (Geral)' },
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

/**
 * Formata valor numérico para moeda brasileira (R$)
 */
function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/**
 * Converte string formatada (com pontos e vírgulas) para número
 * Ex: "1.234,56" → 1234.56
 */
function parsearMoeda(valor: string): number {
  if (!valor) return 0
  // Remove tudo que não for dígito, vírgula ou ponto
  const limpo = valor.replace(/[^\d,.-]/g, '')
  if (!limpo) return 0
  // Se tiver vírgula, substitui por ponto (formato decimal JS)
  // Remove pontos de milhar, mantendo apenas o ponto decimal
  const partes = limpo.split(',')
  if (partes.length > 1) {
    // Tem parte decimal (vírgula)
    const parteInteira = partes[0].replace(/\./g, '') // Remove pontos de milhar
    const parteDecimal = partes.slice(1).join('') // Junta tudo após a primeira vírgula
    return parseFloat(`${parteInteira}.${parteDecimal}`)
  }
  // Sem vírgula, apenas remove pontos de milhar
  return parseFloat(limpo.replace(/\./g, ''))
}

export function FuncionariosPage() {
  const { authUser } = useAuth()
  const { data: funcionarios, isLoading } = useFuncionarios()
  const criar = useCriarFuncionario()
  const excluir = useExcluirFuncionario()
  const criarUsuario = useCriarUsuarioEscola()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [selectedFunc, setSelectedFunc] = useState<any>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [salarioInput, setSalarioInput] = useState('')

  const funcForm = useForm({ resolver: zodResolver(funcSchema) })
  const userForm = useForm({ resolver: zodResolver(userSchema) })

  const handleSalarioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value
    setSalarioInput(valor)
    const valorNumerico = parsearMoeda(valor)
    funcForm.setValue('salario_bruto', valorNumerico)
  }

  const abrirNovoFuncionario = () => {
    setSalarioInput('')
    funcForm.reset({ nome_completo: '', como_chamado: '', funcao: '', salario_bruto: undefined, dia_pagamento: undefined, data_admissao: '' })
    setDialogOpen(true)
  }

  const onSubmitFunc = async (data: any) => {
    if (!authUser) return
    try {
      await criar.mutateAsync({ 
        ...data, 
        tenant_id: authUser.tenantId,
        status: 'ativo',
      })
      toast.success('Funcionário cadastrado!')
      funcForm.reset()
      setDialogOpen(false)
    } catch (err: any) { 
      console.error('Erro ao cadastrar funcionário:', err)
      toast.error(err.message || 'Erro ao cadastrar') 
    }
  }

  const onSubmitUser = async (data: any) => {
    if (!selectedFunc) return
    try {
      await criarUsuario.mutateAsync({ 
        funcionarioId: selectedFunc.id, 
        email: data.email, 
        senha: data.senha, 
        areasAcesso: data.areas_acesso || [] 
      })
      toast.success('Usuário criado com sucesso!')
      userForm.reset()
      setUserDialogOpen(false)
    } catch (err: any) { toast.error(err.message || 'Erro ao criar usuário') }
  }

  const handleDesativar = async (id: string) => {
    try {
      await excluir.mutateAsync(id)
      toast.success('Funcionário desativado.')
    } catch { toast.error('Erro') }
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>

  const ativos = funcionarios?.filter((f: any) => f.status === 'ativo') || []
  const inativos = funcionarios?.filter((f: any) => f.status === 'inativo') || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Funcionários</h1>
          <p className="text-muted-foreground">Gerencie colaboradores e seus acessos ao sistema</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={abrirNovoFuncionario} className="bg-gradient-to-r from-indigo-600 to-blue-600 shadow-md">
              <Plus className="mr-2 h-4 w-4" /> Novo Funcionário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[800px]">
            <DialogHeader><DialogTitle>Cadastro de Funcionário</DialogTitle></DialogHeader>
            <form onSubmit={funcForm.handleSubmit(onSubmitFunc)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Completo *</Label>
                  <Input placeholder="Nome completo" {...funcForm.register('nome_completo')} />
                  {funcForm.formState.errors.nome_completo && <p className="text-sm text-destructive">{funcForm.formState.errors.nome_completo.message as string}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Como é chamado</Label>
                  <Input placeholder="Apelido" {...funcForm.register('como_chamado')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Função *</Label>
                  <Input placeholder="Ex: Professor, Secretária" {...funcForm.register('funcao')} />
                  {funcForm.formState.errors.funcao && <p className="text-sm text-destructive">{funcForm.formState.errors.funcao.message as string}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Salário Bruto (R$)</Label>
                  <Input
                    type="text"
                    placeholder="0,00"
                    value={salarioInput}
                    onChange={handleSalarioChange}
                  />
                  {funcForm.formState.errors.salario_bruto && <p className="text-sm text-destructive">{funcForm.formState.errors.salario_bruto.message as string}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dia do Pagamento</Label>
                  <Input type="number" min="1" max="31" placeholder="5" {...funcForm.register('dia_pagamento')} />
                </div>
                <div className="space-y-2">
                  <Label>Data de Admissão</Label>
                  <Input type="date" {...funcForm.register('data_admissao')} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={funcForm.formState.isSubmitting}>
                  {funcForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dialog criar usuário */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="max-w-[800px]">
          <DialogHeader><DialogTitle><KeyRound className="inline mr-2 h-5 w-5" />Criar Usuário de Acesso</DialogTitle></DialogHeader>
          {selectedFunc && <p className="text-sm text-muted-foreground">Para: <strong>{selectedFunc.nome_completo}</strong></p>}
          <form onSubmit={userForm.handleSubmit(onSubmitUser)} className="space-y-4">
            <div className="space-y-2">
              <Label>E-mail (Login) *</Label>
              <Input type="email" placeholder="email@escola.com" {...userForm.register('email')} />
              {userForm.formState.errors.email && <p className="text-sm text-destructive">{userForm.formState.errors.email.message as string}</p>}
            </div>
            <div className="space-y-2">
              <Label>Senha *</Label>
              <div className="relative">
                <Input type={showPassword ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" {...userForm.register('senha')} className="pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {userForm.formState.errors.senha && <p className="text-sm text-destructive">{userForm.formState.errors.senha.message as string}</p>}
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
              <p className="text-xs text-muted-foreground">Selecione as funcionalidades que o funcionário poderá acessar</p>
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

      <Tabs defaultValue="ativos">
        <TabsList><TabsTrigger value="ativos">Ativos ({ativos.length})</TabsTrigger><TabsTrigger value="inativos">Inativos ({inativos.length})</TabsTrigger></TabsList>
        {['ativos', 'inativos'].map(tab => (
          <TabsContent key={tab} value={tab}>
            <Card className="border-0 shadow-md">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead><TableHead>Função</TableHead><TableHead>Admissão</TableHead><TableHead>Acesso</TableHead><TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(tab === 'ativos' ? ativos : inativos).map((f: any) => (
                      <TableRow key={f.id}>
                        <TableCell>
                          <div><p className="font-bold">{f.nome_completo}</p>{f.como_chamado && <p className="text-xs text-muted-foreground">{f.como_chamado}</p>}</div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{f.funcao || '—'}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{f.data_admissao || '—'}</TableCell>
                        <TableCell>{f.user_id ? <Badge className="bg-emerald-100 text-emerald-800">Com acesso</Badge> : <Badge variant="secondary">Sem acesso</Badge>}</TableCell>
                        <TableCell className="text-right space-x-1">
                          {!f.user_id && f.status === 'ativo' && (
                            <Button size="sm" variant="outline" onClick={() => { setSelectedFunc(f); setUserDialogOpen(true) }}>
                              <UserPlus className="h-3.5 w-3.5 mr-1" /> Criar Acesso
                            </Button>
                          )}
                          {f.status === 'ativo' && (
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDesativar(f.id)}>Desativar</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(tab === 'ativos' ? ativos : inativos).length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Nenhum funcionário {tab === 'ativos' ? 'ativo' : 'inativo'}.</TableCell></TableRow>
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
