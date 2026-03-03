import { useState, useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { 
  useMatriculas, 
  useCriarMatricula, 
  useMatriculaAtivaDoAluno,
  useAtualizarMatricula,
  useExcluirMatricula 
} from '../hooks'
import { useConfigFinanceira } from '@/modules/financeiro/hooks-avancado'
import { useAlunos } from '@/modules/alunos/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter, 
  DialogDescription 
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { 
  Plus, 
  Loader2, 
  GraduationCap, 
  User, 
  Clock, 
  Pencil, 
  Trash2, 
  Eye,
  AlertTriangle
} from 'lucide-react'

const matriculaSchema = z.object({
  tipo: z.enum(['nova', 'rematricula']),
  aluno_id: z.string().min(1, 'Selecione um aluno'),
  ano_letivo: z.coerce.number().min(2024),
  serie_ano: z.string().min(1, 'Série é obrigatória'),
  turno: z.enum(['manha', 'tarde', 'integral', 'noturno']),
  data_matricula: z.string().min(1),
  valor_matricula: z.coerce.number().min(0).optional(),
  status: z.string().optional(),
})

const turnoLabels: Record<string, string> = { manha: 'Manhã', tarde: 'Tarde', integral: 'Integral', noturno: 'Noturno' }

export function MatriculaPage() {
  const { authUser } = useAuth()
  const { data: matriculas, isLoading } = useMatriculas()
  const { data: alunos } = useAlunos()
  const criar = useCriarMatricula()
  const atualizar = useAtualizarMatricula()
  const excluir = useExcluirMatricula()
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedMatricula, setSelectedMatricula] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const form = useForm({ 
    resolver: zodResolver(matriculaSchema), 
    defaultValues: { 
      tipo: 'nova' as const, 
      data_matricula: new Date().toISOString().split('T')[0],
      ano_letivo: new Date().getFullYear(),
      aluno_id: '',
      serie_ano: '',
      turno: 'integral' as any,
      valor_matricula: 450,
      status: 'ativa'
    } 
  })

  // Assistência de preenchimento automático
  const alunoIdSelecionado = useWatch({ control: form.control, name: 'aluno_id' })
  const tipoSelecionado = useWatch({ control: form.control, name: 'tipo' })
  const serieSelecionada = useWatch({ control: form.control, name: 'serie_ano' })
  const { data: matriculaExistente } = useMatriculaAtivaDoAluno(alunoIdSelecionado)
  const { data: configFin } = useConfigFinanceira()

  useEffect(() => {
    if (matriculaExistente && tipoSelecionado === 'rematricula' && !isEditing) {
      form.setValue('serie_ano', matriculaExistente.serie_ano)
      form.setValue('turno', matriculaExistente.turno)
      form.setValue('valor_matricula', matriculaExistente.valor_matricula)
      form.setValue('ano_letivo', new Date().getFullYear() + 1)
    }
  }, [matriculaExistente, tipoSelecionado, form, isEditing])

  useEffect(() => {
    if (tipoSelecionado === 'nova' && serieSelecionada && configFin?.valores_matricula_serie && !isEditing) {
      const valorPadrao = configFin.valores_matricula_serie[serieSelecionada]
      if (valorPadrao) {
        form.setValue('valor_matricula', valorPadrao)
      }
    }
  }, [serieSelecionada, tipoSelecionado, configFin, form, isEditing])

  const onSubmit = async (data: any) => {
    if (!authUser) return
    try {
      if (isEditing && selectedMatricula) {
        await atualizar.mutateAsync({ id: selectedMatricula.id, data })
        toast.success('Matrícula atualizada com sucesso!')
      } else {
        await criar.mutateAsync({ ...data, tenant_id: authUser.tenantId })
        toast.success('Matrícula realizada com sucesso!')
      }
      handleCloseDialog()
    } catch { 
      toast.error(isEditing ? 'Erro ao atualizar matrícula' : 'Erro ao criar matrícula') 
    }
  }

  const handleEdit = (m: any) => {
    setSelectedMatricula(m)
    setIsEditing(true)
    form.reset({
      tipo: m.tipo,
      aluno_id: m.aluno_id,
      ano_letivo: m.ano_letivo,
      serie_ano: m.serie_ano,
      turno: m.turno,
      data_matricula: m.data_matricula,
      valor_matricula: m.valor_matricula,
      status: m.status
    })
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setIsEditing(false)
    setSelectedMatricula(null)
    form.reset({ 
      tipo: 'nova' as const, 
      data_matricula: new Date().toISOString().split('T')[0],
      ano_letivo: new Date().getFullYear(),
      aluno_id: '',
      serie_ano: '',
      turno: 'integral' as any,
      valor_matricula: 450,
      status: 'ativa'
    })
  }

  const handleDelete = async (id: string) => {
     try {
       await excluir.mutateAsync(id)
       toast.success('Matrícula excluída!')
       setDeleteId(null)
     } catch {
       toast.error('Erro ao excluir matrícula')
     }
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Matrículas</h1>
          <p className="text-muted-foreground">Gerencie matrículas e rematrículas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if(!open) handleCloseDialog(); else setDialogOpen(true) }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-md">
              <Plus className="mr-2 h-4 w-4" /> Nova Matrícula
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[800px]">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Editar Matrícula' : 'Nova Matrícula / Rematrícula'}</DialogTitle>
              <DialogDescription>
                Preencha as informações para {isEditing ? 'atualizar' : 'realizar'} a matrícula do aluno.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Operação</Label>
                <RadioGroup 
                  disabled={isEditing}
                  onValueChange={(v) => form.setValue('tipo', v as any)} 
                  className="flex gap-4"
                  value={form.getValues('tipo')}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nova" id="nova" />
                    <Label htmlFor="nova" className="cursor-pointer">Nova Matrícula</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="rematricula" id="rematricula" />
                    <Label htmlFor="rematricula" className="cursor-pointer">Rematrícula</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label htmlFor="aluno_id" className="font-bold">Aluno *</Label>
                <Select disabled={isEditing} value={form.getValues('aluno_id')} onValueChange={(v) => form.setValue('aluno_id', v)}>
                  <SelectTrigger id="aluno_id" className="w-full h-11">
                    <SelectValue placeholder="Selecione o aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {alunos?.map((a: any) => (
                      <SelectItem key={a.id} value={a.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {a.nome_completo}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.aluno_id && (
                  <p className="text-sm text-destructive">{form.formState.errors.aluno_id.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="ano_letivo">Ano Letivo *</Label>
                  <Input 
                    id="ano_letivo" 
                    type="number" 
                    {...form.register('ano_letivo')} 
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serie_ano">Série/Ano *</Label>
                  <Input 
                    id="serie_ano" 
                    placeholder="Ex: 1º Ano EM" 
                    {...form.register('serie_ano')} 
                    className="h-11"
                  />
                  {form.formState.errors.serie_ano && (
                    <p className="text-sm text-destructive">{form.formState.errors.serie_ano.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="turno">Turno *</Label>
                  <Select value={form.getValues('turno')} onValueChange={(v) => form.setValue('turno', v as any)}>
                    <SelectTrigger id="turno" className="w-full h-11">
                      <SelectValue placeholder="Selecione o turno" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manha">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-amber-600" />
                          Manhã
                        </div>
                      </SelectItem>
                      <SelectItem value="tarde">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          Tarde
                        </div>
                      </SelectItem>
                      <SelectItem value="integral">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-emerald-600" />
                          Integral
                        </div>
                      </SelectItem>
                      <SelectItem value="noturno">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-indigo-600" />
                          Noturno
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.turno && (
                    <p className="text-sm text-destructive">{form.formState.errors.turno.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_matricula">Data da Matrícula</Label>
                  <Input 
                    id="data_matricula" 
                    type="date" 
                    {...form.register('data_matricula')} 
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                  <Label htmlFor="valor_matricula">Valor da Matrícula (R$)</Label>
                  <Input 
                    id="valor_matricula" 
                    type="number" 
                    step="0.01" 
                    placeholder="0,00" 
                    {...form.register('valor_matricula')} 
                    className="h-11"
                  />
                </div>
                {isEditing && (
                   <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={form.getValues('status')} onValueChange={(v) => form.setValue('status', v)}>
                       <SelectTrigger id="status" className="h-11">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="ativa">Ativa</SelectItem>
                         <SelectItem value="concluida">Concluída</SelectItem>
                         <SelectItem value="cancelada">Cancelada</SelectItem>
                       </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <DialogFooter className="pt-4 border-t gap-2">
                <Button type="button" variant="ghost" onClick={handleCloseDialog} disabled={form.formState.isSubmitting}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting} className="min-w-[120px]">
                  {form.formState.isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {isEditing ? 'Salvar Alterações' : 'Matricular'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold py-4">Aluno</TableHead>
                <TableHead className="font-bold">Tipo</TableHead>
                <TableHead className="font-bold">Ano</TableHead>
                <TableHead className="font-bold">Série</TableHead>
                <TableHead className="font-bold">Turno</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right font-bold pr-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matriculas?.map((m: any) => (
                <TableRow key={m.id} className="transition-colors">
                  <TableCell className="font-bold text-slate-700 py-4">
                     <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                          <User className="h-4 w-4" />
                        </div>
                        {m.aluno?.nome_completo || '—'}
                     </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.tipo === 'nova' ? 'default' : 'outline'} className="shadow-none px-3 font-semibold tracking-tighter uppercase text-[9px]">
                      {m.tipo === 'nova' ? 'Nova' : 'Rematric.'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-slate-500">{m.ano_letivo}</TableCell>
                  <TableCell className="font-bold text-indigo-700">{m.serie_ano}</TableCell>
                  <TableCell className="text-slate-600">{turnoLabels[m.turno] || m.turno}</TableCell>
                  <TableCell>
                    <Badge className={`shadow-none font-bold text-[10px] uppercase tracking-widest px-2.5 py-0.5 border ${
                      m.status === 'ativa' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                      m.status === 'cancelada' ? 'bg-red-50 text-red-700 border-red-100' :
                      'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {m.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => handleEdit(m)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => setDeleteId(m.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!matriculas || matriculas.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-24 text-muted-foreground">
                    <GraduationCap className="h-16 w-16 mx-auto mb-4 text-slate-200" />
                    <p className="text-lg font-bold text-slate-400">Nenhuma matrícula registrada.</p>
                    <p className="text-sm mt-1">As matrículas criadas aparecerão nesta lista.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Alerta de Exclusão */}
      <Dialog open={!!deleteId} onOpenChange={(open: boolean) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
               <AlertTriangle className="h-5 w-5" /> Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja excluir esta matrícula? Esta ação não pode ser desfeita e pode afetar o histórico acadêmico do aluno.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Não, manter matrícula</Button>
            <Button 
              onClick={() => deleteId && handleDelete(deleteId)} 
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sim, excluir definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
