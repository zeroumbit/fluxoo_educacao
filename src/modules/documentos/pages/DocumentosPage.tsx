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
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Loader2, FileText, FileOutput, Pencil, Trash2, AlertTriangle } from 'lucide-react'

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
  const [editando, setEditando] = useState<any | null>(null)
  const form = useForm({ resolver: zodResolver(templateSchema) })

  const abrirNovoTemplate = () => {
    setEditando(null)
    form.reset({ tipo: '', titulo: '', corpo_html: '' })
    setOpenTemplate(true)
  }

  const abrirEdicao = (template: any) => {
    setEditando(template)
    form.reset({ tipo: template.tipo, titulo: template.titulo, corpo_html: template.corpo_html })
    setOpenTemplate(true)
  }

  const onSubmitTemplate = async (data: any) => {
    if (!authUser) return
    try {
      await criarTemplate.mutateAsync({ ...data, tenant_id: authUser.tenantId })
      toast.success(editando ? 'Template atualizado!' : 'Template criado!')
      setOpenTemplate(false)
    } catch { 
      toast.error('Erro ao salvar template') 
    }
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

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documentos</h1>
          <p className="text-muted-foreground">Gerencie templates e emissão de documentos</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={openEmitir} onOpenChange={setOpenEmitir}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileOutput className="mr-2 h-4 w-4" /> Emitir Documento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Emitir Documento</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="aluno">Selecionar Aluno *</Label>
                  <Select onValueChange={setSelectedAluno}>
                    <SelectTrigger id="aluno"><SelectValue placeholder="Buscar aluno..." /></SelectTrigger>
                    <SelectContent>
                      {alunos?.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.nome_completo}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template">Selecionar Template *</Label>
                  <Select onValueChange={setSelectedTemplate}>
                    <SelectTrigger id="template"><SelectValue placeholder="Selecione o modelo..." /></SelectTrigger>
                    <SelectContent>
                      {templates?.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.titulo} ({tipoLabels[t.tipo]})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">Variáveis disponíveis: {'{{nome_aluno}}'}, {'{{cpf_aluno}}'}, {'{{data_atual}}'}</p>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenEmitir(false)}>Cancelar</Button>
                  <Button onClick={handleEmitir} disabled={emitir.isPending}>
                    {emitir.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Gerar Documento'}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={openTemplate} onOpenChange={setOpenTemplate}>
            <DialogTrigger asChild>
              <Button onClick={abrirNovoTemplate} className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-md">
                <Plus className="mr-2 h-4 w-4" /> Novo Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editando ? 'Editar Template' : 'Criar Template de Documento'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmitTemplate)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo *</Label>
                    <Select defaultValue={form.watch('tipo')} onValueChange={(v) => form.setValue('tipo', v)}>
                      <SelectTrigger id="tipo"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="declaracao_matricula">Declaração de Matrícula</SelectItem>
                        <SelectItem value="historico">Histórico</SelectItem>
                        <SelectItem value="contrato">Contrato</SelectItem>
                        <SelectItem value="personalizado">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="titulo">Título *</Label>
                    <Input id="titulo" placeholder="Nome do template" {...form.register('titulo')} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="corpo_html">Corpo do Documento *</Label>
                  <Textarea id="corpo_html" rows={10} placeholder="Use {{nome_aluno}}, {{cpf_aluno}}, {{data_atual}} como variáveis..." {...form.register('corpo_html')} />
                  <p className="text-xs text-muted-foreground">Use variáveis: {'{{nome_aluno}}'}, {'{{cpf_aluno}}'}, {'{{data_atual}}'}</p>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpenTemplate(false)}>Cancelar</Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tab de Templates */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold">Templates</h2>
        </div>
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Corpo</TableHead>
                  <TableHead className="w-[100px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates?.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-bold">{t.titulo}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{tipoLabels[t.tipo]}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate text-muted-foreground">
                      {t.corpo_html}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => abrirEdicao(t)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!templates || templates.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                      Nenhum template criado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Tab de Emitidos */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileOutput className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold">Documentos Emitidos</h2>
        </div>
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emitidos?.map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-bold">{d.titulo}</TableCell>
                    <TableCell>{d.aluno?.nome_completo || '—'}</TableCell>
                    <TableCell>{d.template?.tipo ? tipoLabels[d.template.tipo] : '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{d.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {(!emitidos || emitidos.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                      <FileOutput className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                      Nenhum documento emitido.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
