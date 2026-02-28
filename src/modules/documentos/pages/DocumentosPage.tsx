import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { useTemplates, useCriarTemplate, useDocumentosEmitidos, useEmitirDocumento } from '../hooks'
import { useAlunos } from '@/modules/alunos/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Loader2, FileText, FileOutput } from 'lucide-react'

const templateSchema = z.object({
  tipo: z.string().min(1),
  titulo: z.string().min(1, 'Título obrigatório'),
  corpo_html: z.string().min(1, 'Corpo obrigatório'),
})

const tipoLabels: Record<string, string> = { declaracao_matricula: 'Declaração de Matrícula', historico: 'Histórico', contrato: 'Contrato', personalizado: 'Personalizado' }

export function DocumentosPage() {
  const { authUser } = useAuth()
  const { data: templates, isLoading } = useTemplates()
  const { data: emitidos } = useDocumentosEmitidos()
  const { data: alunos } = useAlunos()
  const criarTemplate = useCriarTemplate()
  const emitir = useEmitirDocumento()
  const [openTemplate, setOpenTemplate] = useState(false)
  const [openEmitir, setOpenEmitir] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [selectedAluno, setSelectedAluno] = useState('')
  const form = useForm({ resolver: zodResolver(templateSchema) })

  const onSubmitTemplate = async (data: any) => {
    if (!authUser) return
    try {
      await criarTemplate.mutateAsync({ ...data, tenant_id: authUser.tenantId })
      toast.success('Template criado!')
      form.reset(); setOpenTemplate(false)
    } catch { toast.error('Erro ao criar template') }
  }

  const handleEmitir = async () => {
    if (!authUser || !selectedTemplate || !selectedAluno) { toast.error('Selecione aluno e template'); return }
    const template = templates?.find((t: any) => t.id === selectedTemplate)
    const aluno = alunos?.find((a: any) => a.id === selectedAluno)
    if (!template || !aluno) return
    const conteudo = template.corpo_html
      .replace(/\{\{nome_aluno\}\}/g, aluno.nome_completo)
      .replace(/\{\{cpf_aluno\}\}/g, aluno.cpf || '')
      .replace(/\{\{data_atual\}\}/g, new Date().toLocaleDateString('pt-BR'))
    try {
      await emitir.mutateAsync({ tenant_id: authUser.tenantId, template_id: selectedTemplate, aluno_id: selectedAluno, titulo: template.titulo, conteudo_final: conteudo })
      toast.success('Documento emitido!')
      setOpenEmitir(false)
    } catch { toast.error('Erro ao emitir') }
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Documentos</h1>
      <Tabs defaultValue="templates">
        <TabsList><TabsTrigger value="templates"><FileText className="h-4 w-4 mr-1" />Templates</TabsTrigger><TabsTrigger value="emitidos"><FileOutput className="h-4 w-4 mr-1" />Emitidos</TabsTrigger></TabsList>
        <TabsContent value="templates">
          <div className="flex justify-end mb-4 gap-2">
            <Dialog open={openEmitir} onOpenChange={setOpenEmitir}>
              <DialogTrigger asChild><Button variant="outline"><FileOutput className="mr-2 h-4 w-4" />Emitir Documento</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Emitir Documento</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2"><Label>Selecionar Aluno *</Label>
                    <Select onValueChange={setSelectedAluno}><SelectTrigger><SelectValue placeholder="Buscar aluno..." /></SelectTrigger><SelectContent>{alunos?.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.nome_completo}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div className="space-y-2"><Label>Selecionar Template *</Label>
                    <Select onValueChange={setSelectedTemplate}><SelectTrigger><SelectValue placeholder="Selecione o modelo..." /></SelectTrigger><SelectContent>{templates?.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.titulo} ({tipoLabels[t.tipo]})</SelectItem>)}</SelectContent></Select>
                  </div>
                  <p className="text-xs text-muted-foreground">Variáveis disponíveis: {'{{nome_aluno}}'}, {'{{cpf_aluno}}'}, {'{{data_atual}}'}</p>
                  <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpenEmitir(false)}>Cancelar</Button><Button onClick={handleEmitir} disabled={emitir.isPending}>{emitir.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Gerar Documento'}</Button></div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={openTemplate} onOpenChange={setOpenTemplate}>
              <DialogTrigger asChild><Button className="bg-gradient-to-r from-indigo-600 to-blue-600 shadow-md"><Plus className="mr-2 h-4 w-4" />Novo Template</Button></DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Criar Template de Documento</DialogTitle></DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmitTemplate)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Tipo *</Label>
                      <Select onValueChange={(v) => form.setValue('tipo', v)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="declaracao_matricula">Declaração de Matrícula</SelectItem><SelectItem value="historico">Histórico</SelectItem><SelectItem value="contrato">Contrato</SelectItem><SelectItem value="personalizado">Personalizado</SelectItem></SelectContent></Select>
                    </div>
                    <div className="space-y-2"><Label>Título *</Label><Input placeholder="Nome do template" {...form.register('titulo')} /></div>
                  </div>
                  <div className="space-y-2"><Label>Corpo do Documento *</Label><Textarea rows={10} placeholder="Use {{nome_aluno}}, {{cpf_aluno}}, {{data_atual}} como variáveis..." {...form.register('corpo_html')} /><p className="text-xs text-muted-foreground">Use variáveis: {'{{nome_aluno}}'}, {'{{cpf_responsavel}}'}, {'{{data_atual}}'}</p></div>
                  <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpenTemplate(false)}>Cancelar</Button><Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar'}</Button></div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates?.map((t: any) => (
              <Card key={t.id} className="border-0 shadow-md"><CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between"><h3 className="font-bold">{t.titulo}</h3><Badge variant="outline">{tipoLabels[t.tipo]}</Badge></div>
                <p className="text-sm text-zinc-600 line-clamp-3">{t.corpo_html}</p>
              </CardContent></Card>
            ))}
            {(!templates || templates.length === 0) && <div className="col-span-full text-center py-12 text-muted-foreground"><FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />Nenhum template criado.</div>}
          </div>
        </TabsContent>
        <TabsContent value="emitidos">
          <Card className="border-0 shadow-md"><CardContent className="p-0">
            <Table><TableHeader><TableRow><TableHead>Documento</TableHead><TableHead>Aluno</TableHead><TableHead>Tipo</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {emitidos?.map((d: any) => (<TableRow key={d.id}><TableCell className="font-bold">{d.titulo}</TableCell><TableCell>{d.aluno?.nome_completo || '—'}</TableCell><TableCell>{d.template?.tipo ? tipoLabels[d.template.tipo] : '—'}</TableCell><TableCell><Badge variant="outline">{d.status}</Badge></TableCell></TableRow>))}
                {(!emitidos || emitidos.length === 0) && <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">Nenhum documento emitido.</TableCell></TableRow>}
              </TableBody></Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
