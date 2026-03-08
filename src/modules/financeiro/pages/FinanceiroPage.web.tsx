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
  useDesfazerPagamento,
  useAtualizarCobranca 
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
  RotateCcw,
  Pencil
} from 'lucide-react'
import { isPast, format, isBefore, startOfDay, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

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

export function FinanceiroPageWeb() {
  const { authUser } = useAuth()
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const { data: cobrancas, isLoading } = useCobrancas(filtroStatus)
  const { data: alunos } = useAlunos()
  const criarCobranca = useCriarCobranca()
  const marcarComoPago = useMarcarComoPago()
  const excluirCobranca = useExcluirCobranca()
  const desfazerPagamento = useDesfazerPagamento()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [cobrancaEditando, setCobrancaEditando] = useState<any>(null)
  const atualizarCobranca = useAtualizarCobranca()

  // Estados para diálogos de confirmação
  const [confirmPago, setConfirmPago] = useState<{ id: string; antecipado: boolean } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [confirmUndo, setConfirmUndo] = useState<string | null>(null)

  const { register, handleSubmit, reset, setValue, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(cobrancaSchema),
    defaultValues: {
      aluno_id: '',
      descricao: '',
      valor: 0,
      data_vencimento: '',
    }
  })

  // Assistência de preenchimento automático
  const alunoIdSelecionado = useWatch({ control, name: 'aluno_id' })
  const { data: matriculaAtiva } = useMatriculaAtivaDoAluno(alunoIdSelecionado)
  const { data: turmaDoAluno } = useTurmaDoAluno(alunoIdSelecionado)
  const { data: configFin } = useConfigFinanceira()

  useEffect(() => {
    if (cobrancaEditando) return // Não sugerir valores se estiver editando

    if (matriculaAtiva && configFin) {
      const hoje = new Date()
      let mes = hoje.getMonth() + 1
      let ano = hoje.getFullYear()
      
      // Se hoje for após o dia de vencimento, sugere para o próximo mês
      if (hoje.getDate() > (configFin.dia_vencimento_padrao || 10)) {
        mes++
        if (mes > 12) {
          mes = 1
          ano++
        }
      }

      const dataSugerida = `${ano}-${String(mes).padStart(2, '0')}-${String(configFin.dia_vencimento_padrao || 10).padStart(2, '0')}`
      setValue('data_vencimento', dataSugerida)
      setValue('valor', Number(matriculaAtiva.valor_matricula || 0)) // Valor da mensalidade gravado no campo
      setValue('descricao', `Mensalidade ${mes}/${ano} - ${turmaDoAluno?.nome || ''}`)
    }
  }, [matriculaAtiva, configFin, setValue, turmaDoAluno, cobrancaEditando])

  const onSubmit = async (data: CobrancaFormValues) => {
    try {
      if (cobrancaEditando) {
        await atualizarCobranca.mutateAsync({
          id: cobrancaEditando.id,
          cobranca: {
             ...data,
             valor: Number(data.valor)
          }
        })
        toast.success('Cobrança atualizada com sucesso!')
      } else {
        await criarCobranca.mutateAsync({
          ...data,
          tenant_id: authUser!.tenantId,
          status: 'a_vencer',
          valor: Number(data.valor)
        })
        toast.success('Cobrança criada com sucesso!')
      }
      setDialogOpen(false)
      setCobrancaEditando(null)
      reset()
    } catch (error) {
      toast.error('Erro ao salvar cobrança')
    }
  }

  const handleEdit = (cobranca: any) => {
    setCobrancaEditando(cobranca)
    setValue('aluno_id', cobranca.aluno_id)
    setValue('descricao', cobranca.descricao)
    setValue('valor', cobranca.valor)
    setValue('data_vencimento', cobranca.data_vencimento)
    setDialogOpen(true)
  }

  // Estatísticas Rápidas
  const stats = {
     totalReceber: cobrancas?.filter(c => c.status !== 'pago' && c.status !== 'cancelado').reduce((acc, c) => acc + Number(c.valor), 0) || 0,
     totalAtrasado: cobrancas?.filter(c => c.status === 'atrasado').reduce((acc, c) => acc + Number(c.valor), 0) || 0,
     qtdAbertas: cobrancas?.filter(c => c.status === 'a_vencer' || c.status === 'atrasado').length || 0
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Cobranças</h1>
          <p className="text-zinc-500 font-medium">Gestão financeira e controle de mensalidades</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-[180px] bg-white rounded-xl border-zinc-200">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="a_vencer">A Vencer</SelectItem>
              <SelectItem value="atrasado">Atrasados</SelectItem>
              <SelectItem value="pago">Pagos</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) {
              setCobrancaEditando(null)
              reset()
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl h-10 font-bold shadow-lg shadow-indigo-100">
                <Plus className="mr-2 h-4 w-4" /> Nova Cobrança
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl border-0 shadow-2xl max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-zinc-900 tracking-tight">
                  {cobrancaEditando ? 'Editar Cobrança' : 'Nova Cobrança'}
                </DialogTitle>
                <DialogDescription className="text-zinc-500 font-medium">
                  {cobrancaEditando ? 'Atualize os dados da cobrança selecionada.' : 'Preencha os dados abaixo para gerar uma nova cobrança avulsa ou mensal.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Aluno</Label>
                  <Select 
                    value={alunoIdSelecionado} 
                    onValueChange={(val) => setValue('aluno_id', val)}
                    disabled={!!cobrancaEditando}
                  >
                    <SelectTrigger className="bg-zinc-50 border-0 rounded-2xl h-12 font-medium focus:ring-2 focus:ring-indigo-500/20">
                      <SelectValue placeholder="Selecione o aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {alunos?.map((aluno) => (
                        <SelectItem key={aluno.id} value={aluno.id}>
                          {aluno.nome_completo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.aluno_id && <p className="text-xs text-rose-500 font-bold">{errors.aluno_id.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Descrição</Label>
                  <Input 
                    {...register('descricao')}
                    placeholder="Ex: Mensalidade Julho/2024"
                    className="bg-zinc-50 border-0 rounded-2xl h-12 font-medium focus-visible:ring-2 focus-visible:ring-indigo-500/20"
                  />
                  {errors.descricao && <p className="text-xs text-rose-500 font-bold">{errors.descricao.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Valor (R$)</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      {...register('valor')}
                      className="bg-zinc-50 border-0 rounded-2xl h-12 font-bold text-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500/20"
                    />
                    {errors.valor && <p className="text-xs text-rose-500 font-bold">{errors.valor.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Vencimento</Label>
                    <Input 
                      type="date"
                      {...register('data_vencimento')}
                      className="bg-zinc-50 border-0 rounded-2xl h-12 font-medium focus-visible:ring-2 focus-visible:ring-indigo-500/20"
                    />
                    {errors.data_vencimento && <p className="text-xs text-rose-500 font-bold">{errors.data_vencimento.message}</p>}
                  </div>
                </div>

                <DialogFooter className="pt-4">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-12 font-black uppercase tracking-widest shadow-xl shadow-indigo-100"
                  >
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (cobrancaEditando ? 'Salvar Alterações' : 'Gerar Cobrança')}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Grid de Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-[2.5rem] border-0 bg-white shadow-sm p-6 ring-1 ring-zinc-50">
             <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-[1.5rem] bg-indigo-50 flex items-center justify-center">
                   <CreditCard className="h-7 w-7 text-indigo-600" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Total a Receber</p>
                   <p className="text-2xl font-black text-zinc-900 tracking-tight">R$ {stats.totalReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
             </div>
          </Card>

          <Card className="rounded-[2.5rem] border-0 bg-rose-50/50 shadow-sm p-6 ring-1 ring-rose-100">
             <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-[1.5rem] bg-rose-100 flex items-center justify-center">
                   <AlertTriangle className="h-7 w-7 text-rose-600" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-rose-600/50 mb-1">Total em Atraso</p>
                   <p className="text-2xl font-black text-rose-900 tracking-tight">R$ {stats.totalAtrasado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
             </div>
          </Card>

          <Card className="rounded-[2.5rem] border-0 bg-emerald-50/50 shadow-sm p-6 ring-1 ring-emerald-100">
             <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-[1.5rem] bg-emerald-100 flex items-center justify-center">
                   <Check className="h-7 w-7 text-emerald-600" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/50 mb-1">Cobranças Abertas</p>
                   <p className="text-2xl font-black text-emerald-900 tracking-tight">{stats.qtdAbertas} unidades</p>
                </div>
             </div>
          </Card>
      </div>

      <Card className="border border-zinc-100 shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="hover:bg-transparent border-zinc-50">
                <TableHead className="py-5 font-black uppercase tracking-widest text-[10px] text-zinc-400 pl-8">Aluno</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] text-zinc-400">Descrição / Título</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] text-zinc-400">Valor</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] text-zinc-400">Vencimento</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] text-zinc-400 text-center">Status</TableHead>
                <TableHead className="text-right py-5 font-black uppercase tracking-widest text-[10px] text-zinc-400 pr-8">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-zinc-200 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : cobrancas?.map((cobranca) => {
                const vencido = cobranca.status === 'atrasado' || (cobranca.status === 'a_vencer' && isBefore(startOfDay(parseISO(cobranca.data_vencimento)), startOfDay(new Date())))
                
                return (
                  <TableRow key={cobranca.id} className="group hover:bg-zinc-50/50 transition-colors border-zinc-50">
                    <TableCell className="py-5 font-bold text-zinc-800 pl-8">
                       <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400">
                             <CreditCard className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-black text-zinc-900 leading-none">{(cobranca as any).alunos?.nome_completo || 'Avulso'}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mt-1">ID: {cobranca.id.split('-')[0]}</p>
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="font-medium text-zinc-500 max-w-[200px] truncate">{cobranca.descricao}</TableCell>
                    <TableCell className="font-black text-zinc-900">R$ {Number(cobranca.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className={cn("font-bold text-sm", vencido && "text-rose-600")}>
                          {format(parseISO(cobranca.data_vencimento), 'dd/MM/yyyy')}
                        </span>
                        {vencido && <span className="text-[8px] font-black uppercase text-rose-500 tracking-wider">Vencida</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        "rounded-xl px-4 py-1.5 text-[10px] font-black uppercase border-0 tracking-widest shadow-none",
                        statusColors[cobranca.status]
                      )}>
                        {statusLabels[cobranca.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex items-center justify-end gap-2">
                        {cobranca.status !== 'pago' ? (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 text-emerald-600 hover:bg-emerald-50 rounded-xl"
                              onClick={() => setConfirmPago({ id: cobranca.id, antecipado: isBefore(new Date(), parseISO(cobranca.data_vencimento)) })}
                              title="Marcar como Pago"
                            >
                              <Check className="h-5 w-5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 text-indigo-500 hover:bg-indigo-50 rounded-xl"
                              onClick={() => handleEdit(cobranca)}
                              title="Editar Cobrança"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 text-rose-600 hover:bg-rose-50 rounded-xl"
                              onClick={() => setConfirmDelete(cobranca.id)}
                              title="Excluir Cobrança"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 text-zinc-400 hover:bg-zinc-100 rounded-xl"
                            onClick={() => setConfirmUndo(cobranca.id)}
                            title="Desfazer Pagamento"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-10 w-10 text-zinc-400 hover:bg-zinc-100 rounded-xl"
                          title="Ajuda / Informações"
                        >
                          <HelpCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {!isLoading && cobrancas?.length === 0 && (
            <div className="py-24 text-center">
              <CreditCard className="h-16 w-16 text-zinc-100 mx-auto mb-4" />
              <p className="text-xl font-black text-zinc-300">Nenhuma cobrança encontrada.</p>
              <p className="text-zinc-400 mt-1 italic">Crie uma nova cobrança acima.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAIS DE CONFIRMAÇÃO */}
      <Dialog open={!!confirmPago} onOpenChange={() => setConfirmPago(null)}>
        <DialogContent className="rounded-3xl border-0 shadow-2xl">
          <DialogHeader>
            <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
               <Check className="h-7 w-7 text-emerald-600" />
            </div>
            <DialogTitle className="text-2xl font-black text-zinc-900 tracking-tight">Baixar Cobrança</DialogTitle>
            <DialogDescription className="text-zinc-500 font-medium pt-2">
              Deseja confirmar o recebimento desta cobrança? O status será atualizado para <strong>Pago</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-8 flex gap-3">
             <Button variant="ghost" className="flex-1 rounded-2xl h-12 font-bold" onClick={() => setConfirmPago(null)}>Cancelar</Button>
             <Button 
                className="flex-1 rounded-2xl bg-emerald-600 hover:bg-emerald-700 h-12 font-bold shadow-xl shadow-emerald-100"
                onClick={async () => {
                   await marcarComoPago.mutateAsync(confirmPago!.id)
                   toast.success('Pagamento registrado!')
                   setConfirmPago(null)
                }}
             >
                Confirmar Recebimento
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="rounded-3xl border-0 shadow-2xl">
          <DialogHeader>
            <div className="h-14 w-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
               <AlertTriangle className="h-7 w-7 text-rose-600" />
            </div>
            <DialogTitle className="text-2xl font-black text-zinc-900 tracking-tight">Excluir Cobrança</DialogTitle>
            <DialogDescription className="text-zinc-500 font-medium pt-2">
              Esta ação removerá permanentemente o registro da cobrança. Esta ação é irreversível.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-8 flex gap-3">
             <Button variant="ghost" className="flex-1 rounded-2xl h-12 font-bold" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
             <Button 
                className="flex-1 rounded-2xl bg-rose-600 hover:bg-rose-700 h-12 font-bold shadow-xl shadow-rose-100"
                onClick={async () => {
                   await excluirCobranca.mutateAsync(confirmDelete!)
                   toast.success('Cobrança excluída!')
                   setConfirmDelete(null)
                }}
             >
                Excluir Definitivamente
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmUndo} onOpenChange={() => setConfirmUndo(null)}>
        <DialogContent className="rounded-3xl border-0 shadow-2xl">
          <DialogHeader>
            <div className="h-14 w-14 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
               <RotateCcw className="h-7 w-7 text-zinc-600" />
            </div>
            <DialogTitle className="text-2xl font-black text-zinc-900 tracking-tight">Desfazer Pagamento</DialogTitle>
            <DialogDescription className="text-zinc-500 font-medium pt-2">
              A cobrança voltará para o status <strong>Em Aberto (A Vencer)</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-8 flex gap-3">
             <Button variant="ghost" className="flex-1 rounded-2xl h-12 font-bold" onClick={() => setConfirmUndo(null)}>Cancelar</Button>
             <Button 
                className="flex-1 rounded-2xl bg-zinc-900 hover:bg-black text-white h-12 font-bold shadow-xl"
                onClick={async () => {
                   await desfazerPagamento.mutateAsync(confirmUndo!)
                   toast.success('Status da cobrança revertido!')
                   setConfirmUndo(null)
                }}
             >
                Confirmar Reversão
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
