import { useState, useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { 
  useCobrancas, 
  useCriarCobranca, 
  useMarcarComoPago, 
  useExcluirCobranca,
  useDesfazerPagamento 
} from '../hooks'
import { useAlunos } from '@/modules/alunos/hooks'
import { useMatriculaAtivaDoAluno } from '@/modules/academico/hooks'
import { useTurmaDoAluno } from '@/modules/turmas/hooks'
import { useConfigFinanceira } from '../hooks-avancado'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Plus, 
  Loader2, 
  CreditCard, 
  Check, 
  Trash2, 
  AlertTriangle, 
  HelpCircle,
  RotateCcw
} from 'lucide-react'
import { isPast, format, isBefore, startOfDay, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const cobrancaSchema = z.object({
  aluno_id: z.string().min(1, 'Selecione um aluno'),
  descricao: z.string().min(3, 'Descrição é obrigatória'),
  valor: z.any().transform((v) => Number(v)).pipe(z.number().min(0.01, 'Valor deve ser maior que 0')),
  data_vencimento: z.string().min(1, 'Data é obrigatória'),
})

type CobrancaFormValues = z.infer<typeof cobrancaSchema>

const statusColors: Record<string, string> = {
  a_vencer: 'bg-blue-100 text-blue-800',
  pago: 'bg-emerald-100 text-emerald-800',
  atrasado: 'bg-red-100 text-red-800',
  cancelado: 'bg-zinc-100 text-zinc-600',
}

const statusLabels: Record<string, string> = {
  a_vencer: 'A Vencer',
  pago: 'Pago',
  atrasado: 'Atrasado',
  cancelado: 'Cancelado',
}

export function FinanceiroPage() {
  const { authUser } = useAuth()
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const { data: cobrancas, isLoading } = useCobrancas(filtroStatus)
  const { data: alunos } = useAlunos()
  const criarCobranca = useCriarCobranca()
  const marcarComoPago = useMarcarComoPago()
  const excluirCobranca = useExcluirCobranca()
  const desfazerPagamento = useDesfazerPagamento()
  const [dialogOpen, setDialogOpen] = useState(false)

  // Estados para diálogos de confirmação
  const [confirmPago, setConfirmPago] = useState<{ id: string; antecipado: boolean } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [confirmUndo, setConfirmUndo] = useState<string | null>(null)

  const { register, handleSubmit, reset, setValue, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(cobrancaSchema),
  })

  // Assistência de preenchimento automático
  const alunoIdSelecionado = useWatch({ control, name: 'aluno_id' })
  const { data: matriculaAtiva } = useMatriculaAtivaDoAluno(alunoIdSelecionado)
  const { data: turmaDoAluno } = useTurmaDoAluno(alunoIdSelecionado)
  const { data: configFin } = useConfigFinanceira()

  useEffect(() => {
    // 1. Tentar pegar por mensalidade da turma (configurada na config financeira)
    if (turmaDoAluno && configFin?.valores_mensalidade_turma?.[turmaDoAluno.id]) {
      setValue('valor', configFin.valores_mensalidade_turma[turmaDoAluno.id])
    } 
    // 2. Fallback para o valor da matrícula ativa (contrato individual)
    else if (matriculaAtiva && matriculaAtiva.valor_matricula) {
      setValue('valor', matriculaAtiva.valor_matricula)
    }

    // Sugerir descrição se o aluno for selecionado
    if (alunoIdSelecionado) {
       const mesAtual = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date())
       const anoAtual = new Date().getFullYear()
       setValue('descricao', `Mensalidade ${mesAtual}/${anoAtual}`)
    }
  }, [matriculaAtiva, turmaDoAluno, configFin, setValue, alunoIdSelecionado])

  const onSubmit = async (data: any) => {
    if (!authUser) return
    try {
      await criarCobranca.mutateAsync({
        tenant_id: authUser.tenantId,
        aluno_id: data.aluno_id,
        descricao: data.descricao,
        valor: data.valor,
        data_vencimento: data.data_vencimento,
        status: 'a_vencer',
      })
      toast.success('Cobrança criada!')
      reset()
      setDialogOpen(false)
    } catch {
      toast.error('Erro ao criar')
    }
  }

  const handleMarcarPago = async (id: string, antecipado: boolean) => {
    setConfirmPago({ id, antecipado })
  }

  const executarPagamento = async () => {
    if (!confirmPago) return
    try {
      await marcarComoPago.mutateAsync(confirmPago.id)
      toast.success('Marcado como pago!')
      setConfirmPago(null)
    } catch {
      toast.error('Erro ao processar pagamento')
    }
  }

  const executarExclusao = async () => {
    if (!confirmDelete) return
    try {
      await excluirCobranca.mutateAsync(confirmDelete)
      toast.success('Cobrança excluída!')
      setConfirmDelete(null)
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  const executarDesfazer = async () => {
    if (!confirmUndo) return
    try {
      await desfazerPagamento.mutateAsync(confirmUndo)
      toast.success('Pagamento desfeito!')
      setConfirmUndo(null)
    } catch {
      toast.error('Erro ao desfazer')
    }
  }

  const formatarDataBR = (dataStr: string) => {
    try {
      return format(parseISO(dataStr), 'dd/MM/yyyy')
    } catch {
      return dataStr
    }
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">Gerencie cobranças dos alunos</p>
        </div>
        <div className="flex gap-2">
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="a_vencer">A Vencer</SelectItem>
              <SelectItem value="pago">Pagos</SelectItem>
              <SelectItem value="atrasado">Atrasados</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-600 to-green-600 shadow-md">
                <Plus className="mr-2 h-4 w-4" /> Nova Cobrança
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[800px]">
              <DialogHeader>
                <DialogTitle>Nova Cobrança</DialogTitle>
                <DialogDescription>
                  Preencha as informações para criar uma nova cobrança.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="aluno_id">Aluno *</Label>
                  <Select onValueChange={(v) => setValue('aluno_id', v)}>
                    <SelectTrigger id="aluno_id" className="w-full">
                      <SelectValue placeholder="Selecione o aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {alunos?.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.nome_completo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.aluno_id && (
                    <p className="text-sm text-destructive">{errors.aluno_id.message as string}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição *</Label>
                  <Input 
                    id="descricao" 
                    placeholder="Ex: Mensalidade janeiro/2024" 
                    {...register('descricao')} 
                  />
                  {errors.descricao && (
                    <p className="text-sm text-destructive">{errors.descricao.message as string}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor (R$) *</Label>
                    <Input 
                      id="valor" 
                      type="number" 
                      step="0.01" 
                      placeholder="0,00" 
                      {...register('valor')} 
                    />
                    {errors.valor && (
                      <p className="text-sm text-destructive">{errors.valor.message as string}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_vencimento">Vencimento *</Label>
                    <Input 
                      id="data_vencimento" 
                      type="date" 
                      {...register('data_vencimento')} 
                    />
                    {errors.data_vencimento && (
                      <p className="text-sm text-destructive">{errors.data_vencimento.message as string}</p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cobrancas?.map((c) => {
                const atrasada = c.status === 'a_vencer' && isPast(new Date(c.data_vencimento))
                const statusFinal = atrasada ? 'atrasado' : c.status
                const antecipado = isBefore(new Date(), startOfDay(parseISO(c.data_vencimento))) && c.status === 'a_vencer'

                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{(c as Record<string, unknown>).alunos ? ((c as Record<string, unknown>).alunos as { nome_completo: string }).nome_completo : '—'}</TableCell>
                    <TableCell>{c.descricao}</TableCell>
                    <TableCell>R$ {Number(c.valor).toFixed(2).replace('.', ',')}</TableCell>
                    <TableCell>{formatarDataBR(c.data_vencimento)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[statusFinal] || statusColors.a_vencer}>
                        {statusLabels[statusFinal] || statusFinal}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-1">
                        {c.status !== 'pago' ? (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" 
                            onClick={() => handleMarcarPago(c.id, antecipado)}
                            title="Marcar como Pago"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-amber-600 hover:bg-amber-50" 
                            onClick={() => setConfirmUndo(c.id)}
                            title="Desfazer Pagamento"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-600 hover:bg-red-50" 
                          onClick={() => setConfirmDelete(c.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          {(!cobrancas || cobrancas.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p>Nenhuma cobrança encontrada.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DIÁLOGO: CONFIRMAR PAGAMENTO */}
      <Dialog open={!!confirmPago} onOpenChange={(open) => !open && setConfirmPago(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
               {confirmPago?.antecipado ? <AlertTriangle className="h-5 w-5 text-amber-500" /> : <HelpCircle className="h-5 w-5 text-blue-500" />}
               Confirmar Pagamento
            </DialogTitle>
            <DialogDescription>
              {confirmPago?.antecipado 
                ? "Atenção: A data de vencimento desta cobrança é futura. Deseja realmente dar quitação antecipada para este registro?" 
                : "Você confirma que recebeu o pagamento desta cobrança?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
             <Button variant="outline" onClick={() => setConfirmPago(null)}>Cancelar</Button>
             <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={executarPagamento}>
               Sim, Confirmar
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO: CONFIRMAR EXCLUSÃO */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
               <AlertTriangle className="h-5 w-5" /> Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Atenção: Esta cobrança será removida permanentemente. Caso o aluno já tenha pago, você deve "Marcar como Pago" em vez de excluir. Deseja continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
             <Button variant="outline" onClick={() => setConfirmDelete(null)}>Não, cancelar</Button>
             <Button className="bg-red-600 hover:bg-red-700" onClick={executarExclusao}>
               Sim, Excluir Registro
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO: CONFIRMAR DESFAZER PAGAMENTO */}
      <Dialog open={!!confirmUndo} onOpenChange={(open) => !open && setConfirmUndo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
               <RotateCcw className="h-5 w-5" /> Desfazer Pagamento
            </DialogTitle>
            <DialogDescription>
              Você deseja cancelar a aprovação deste pagamento? A cobrança voltará ao estado original (A Vencer ou Atrasada) e o saldo será atualizado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
             <Button variant="outline" onClick={() => setConfirmUndo(null)}>Cancelar</Button>
             <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={executarDesfazer}>
               Sim, Desfazer Aprovação
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
