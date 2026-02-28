import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { useAtividades, useCriarAtividade } from '../hooks'
import { useTurmas } from '@/modules/turmas/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Loader2, FileText, ExternalLink } from 'lucide-react'

const schema = z.object({
  titulo: z.string().min(1, 'Título obrigatório'),
  turma_id: z.string().optional(),
  disciplina: z.string().optional(),
  tipo_material: z.string().optional(),
  anexo_url: z.string().optional(),
  descricao: z.string().optional(),
})

const tipoLabels: Record<string, string> = { pdf: 'PDF', link_video: 'Vídeo', imagem: 'Imagem', outro: 'Outro' }

export function AtividadesPage() {
  const { authUser } = useAuth()
  const { data: atividades, isLoading } = useAtividades()
  const { data: turmas } = useTurmas()
  const criar = useCriarAtividade()
  const [open, setOpen] = useState(false)
  const form = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data: any) => {
    if (!authUser) return
    try {
      await criar.mutateAsync({ ...data, tenant_id: authUser.tenantId })
      toast.success('Atividade cadastrada!')
      form.reset(); setOpen(false)
    } catch { toast.error('Erro ao cadastrar') }
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold tracking-tight">Atividades & Materiais</h1><p className="text-muted-foreground">Compartilhe conteúdos e materiais com as turmas</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-gradient-to-r from-indigo-600 to-blue-600 shadow-md"><Plus className="mr-2 h-4 w-4" /> Nova Atividade</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Nova Atividade / Material</DialogTitle></DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2"><Label>Título *</Label><Input placeholder="Título da atividade" {...form.register('titulo')} />{form.formState.errors.titulo && <p className="text-sm text-destructive">{form.formState.errors.titulo.message}</p>}</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Turma / Disciplina</Label>
                  <Select onValueChange={(v) => form.setValue('turma_id', v)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{turmas?.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="space-y-2"><Label>Tipo de Material</Label>
                  <Select onValueChange={(v) => form.setValue('tipo_material', v)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="pdf">PDF</SelectItem><SelectItem value="link_video">Link de Vídeo</SelectItem><SelectItem value="imagem">Imagem</SelectItem><SelectItem value="outro">Outro</SelectItem></SelectContent></Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Anexo ou Link</Label><Input placeholder="URL do material ou link do vídeo" {...form.register('anexo_url')} /></div>
              <div className="space-y-2"><Label>Descrição</Label><Textarea placeholder="Descrição da atividade..." {...form.register('descricao')} /></div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {atividades?.map((a: any) => (
          <Card key={a.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="font-bold text-zinc-900">{a.titulo}</h3>
                {a.tipo_material && <Badge variant="outline">{tipoLabels[a.tipo_material] || a.tipo_material}</Badge>}
              </div>
              {a.turma?.nome && <p className="text-xs text-muted-foreground">Turma: {a.turma.nome}</p>}
              {a.descricao && <p className="text-sm text-zinc-600 line-clamp-2">{a.descricao}</p>}
              {a.anexo_url && <a href={a.anexo_url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 flex items-center gap-1 hover:underline"><ExternalLink className="h-3 w-3" />Abrir material</a>}
            </CardContent>
          </Card>
        ))}
        {(!atividades || atividades.length === 0) && (
          <div className="col-span-full text-center py-12 text-muted-foreground"><FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />Nenhuma atividade cadastrada.</div>
        )}
      </div>
    </div>
  )
}
