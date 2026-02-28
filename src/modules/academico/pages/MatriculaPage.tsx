import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { useMatriculas, useCriarMatricula } from '../hooks'
import { useAlunos } from '@/modules/alunos/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Plus, Loader2, GraduationCap } from 'lucide-react'

const matriculaSchema = z.object({
  tipo: z.enum(['nova', 'rematricula']),
  aluno_id: z.string().min(1, 'Selecione um aluno'),
  ano_letivo: z.coerce.number().min(2024),
  serie_ano: z.string().min(1, 'Série é obrigatória'),
  turno: z.enum(['manha', 'tarde', 'integral', 'noturno']),
  data_matricula: z.string().min(1),
  valor_matricula: z.coerce.number().min(0).optional(),
})

const turnoLabels: Record<string, string> = { manha: 'Manhã', tarde: 'Tarde', integral: 'Integral', noturno: 'Noturno' }

export function MatriculaPage() {
  const { authUser } = useAuth()
  const { data: matriculas, isLoading } = useMatriculas()
  const { data: alunos } = useAlunos()
  const criar = useCriarMatricula()
  const [dialogOpen, setDialogOpen] = useState(false)

  const form = useForm({ resolver: zodResolver(matriculaSchema), defaultValues: { tipo: 'nova' as const, data_matricula: new Date().toISOString().split('T')[0] } })

  const onSubmit = async (data: any) => {
    if (!authUser) return
    try {
      await criar.mutateAsync({ ...data, tenant_id: authUser.tenantId })
      toast.success('Matrícula realizada com sucesso!')
      form.reset()
      setDialogOpen(false)
    } catch { toast.error('Erro ao criar matrícula') }
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Matrículas</h1>
          <p className="text-muted-foreground">Gerencie matrículas e rematrículas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-indigo-600 to-blue-600 shadow-md"><Plus className="mr-2 h-4 w-4" /> Nova Matrícula</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Nova Matrícula / Rematrícula</DialogTitle></DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Operação</Label>
                <RadioGroup defaultValue="nova" onValueChange={(v) => form.setValue('tipo', v as any)} className="flex gap-4">
                  <div className="flex items-center space-x-2"><RadioGroupItem value="nova" id="nova" /><Label htmlFor="nova">Nova Matrícula</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="rematricula" id="rematricula" /><Label htmlFor="rematricula">Rematrícula</Label></div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Aluno *</Label>
                <Select onValueChange={(v) => form.setValue('aluno_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Buscar aluno..." /></SelectTrigger>
                  <SelectContent>{alunos?.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.nome_completo}</SelectItem>)}</SelectContent>
                </Select>
                {form.formState.errors.aluno_id && <p className="text-sm text-destructive">{form.formState.errors.aluno_id.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ano Letivo *</Label>
                  <Input type="number" defaultValue={new Date().getFullYear()} {...form.register('ano_letivo')} />
                </div>
                <div className="space-y-2">
                  <Label>Série/Ano *</Label>
                  <Input placeholder="Ex: 1º Ano EM" {...form.register('serie_ano')} />
                  {form.formState.errors.serie_ano && <p className="text-sm text-destructive">{form.formState.errors.serie_ano.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Turno *</Label>
                  <Select onValueChange={(v) => form.setValue('turno', v as any)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manha">Manhã</SelectItem>
                      <SelectItem value="tarde">Tarde</SelectItem>
                      <SelectItem value="integral">Integral</SelectItem>
                      <SelectItem value="noturno">Noturno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data da Matrícula</Label>
                  <Input type="date" {...form.register('data_matricula')} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Valor da Matrícula (R$)</Label>
                <Input type="number" step="0.01" placeholder="0,00" {...form.register('valor_matricula')} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Matricular'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Aluno</TableHead><TableHead>Tipo</TableHead><TableHead>Ano</TableHead><TableHead>Série</TableHead><TableHead>Turno</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {matriculas?.map((m: any) => (
                <TableRow key={m.id}>
                  <TableCell className="font-bold">{m.aluno?.nome_completo || '—'}</TableCell>
                  <TableCell><Badge variant={m.tipo === 'nova' ? 'default' : 'outline'}>{m.tipo === 'nova' ? 'Nova' : 'Rematrícula'}</Badge></TableCell>
                  <TableCell>{m.ano_letivo}</TableCell>
                  <TableCell>{m.serie_ano}</TableCell>
                  <TableCell>{turnoLabels[m.turno] || m.turno}</TableCell>
                  <TableCell><Badge className={m.status === 'ativa' ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-600'}>{m.status}</Badge></TableCell>
                </TableRow>
              ))}
              {(!matriculas || matriculas.length === 0) && (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground"><GraduationCap className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />Nenhuma matrícula registrada.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
