import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { usePlanosAula, useCriarPlanoAula } from '../hooks'
import { useTurmas } from '@/modules/turmas/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Loader2, BookOpen } from 'lucide-react'

const schema = z.object({
  turma_id: z.string().min(1, 'Turma obrigatória'),
  disciplina: z.string().min(1, 'Disciplina obrigatória'),
  data_aula: z.string().min(1),
  conteudo_previsto: z.string().optional(),
  conteudo_realizado: z.string().optional(),
  observacoes: z.string().optional(),
})

export function PlanoAulaPage() {
  const { authUser } = useAuth()
  const { data: planos, isLoading } = usePlanosAula()
  const { data: turmas } = useTurmas()
  const criar = useCriarPlanoAula()
  const [open, setOpen] = useState(false)
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { data_aula: new Date().toISOString().split('T')[0] } })

  const onSubmit = async (data: any) => {
    if (!authUser) return
    try {
      await criar.mutateAsync({ ...data, tenant_id: authUser.tenantId })
      toast.success('Plano de aula registrado!')
      form.reset(); setOpen(false)
    } catch { toast.error('Erro ao registrar') }
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold tracking-tight">Planos de Aula</h1><p className="text-muted-foreground">Registre e acompanhe os conteúdos ministrados</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-gradient-to-r from-indigo-600 to-blue-600 shadow-md"><Plus className="mr-2 h-4 w-4" /> Novo Plano</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Registrar Plano de Aula</DialogTitle></DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Turma *</Label>
                  <Select onValueChange={(v) => form.setValue('turma_id', v)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{turmas?.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="space-y-2"><Label>Disciplina *</Label><Input placeholder="Ex: Matemática" {...form.register('disciplina')} /></div>
              </div>
              <div className="space-y-2"><Label>Data da Aula *</Label><Input type="date" {...form.register('data_aula')} /></div>
              <div className="space-y-2"><Label>Conteúdo Previsto</Label><Textarea placeholder="O que será ensinado..." {...form.register('conteudo_previsto')} /></div>
              <div className="space-y-2"><Label>Conteúdo Realizado</Label><Textarea placeholder="O que foi efetivamente ensinado..." {...form.register('conteudo_realizado')} /></div>
              <div className="space-y-2"><Label>Observações</Label><Textarea {...form.register('observacoes')} /></div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="border-0 shadow-md"><CardContent className="p-0">
        <Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Turma</TableHead><TableHead>Disciplina</TableHead><TableHead>Conteúdo Previsto</TableHead><TableHead>Realizado</TableHead></TableRow></TableHeader>
          <TableBody>
            {planos?.map((p: any) => (<TableRow key={p.id}><TableCell>{p.data_aula}</TableCell><TableCell className="font-bold">{p.turma?.nome || '—'}</TableCell><TableCell>{p.disciplina}</TableCell><TableCell className="max-w-[200px] truncate">{p.conteudo_previsto || '—'}</TableCell><TableCell className="max-w-[200px] truncate">{p.conteudo_realizado || '—'}</TableCell></TableRow>))}
            {(!planos || planos.length === 0) && (<TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground"><BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />Nenhum plano de aula registrado.</TableCell></TableRow>)}
          </TableBody></Table></CardContent></Card>
    </div>
  )
}
