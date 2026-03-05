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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, Loader2, FileText, FileOutput, Pencil, Trash2, Search, 
  FileCheck, GraduationCap, Scale, HeartPulse, LogOut, 
  Image as ImageIcon, ClipboardCheck, ArrowRight, UserCircle, Activity
} from 'lucide-react'
import * as Docs from '../DocumentEngineComponents'

const templateSchema = z.object({
  tipo: z.string().min(1),
  titulo: z.string().min(1, 'Título obrigatório'),
  corpo_html: z.string().min(1, 'Corpo obrigatório'),
})

const CATEGORIES = [
  { id: 'secretaria', label: 'Secretaria', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'pedagogico', label: 'Pedagógico', icon: GraduationCap, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 'juridico', label: 'Jurídico', icon: Scale, color: 'text-violet-500', bg: 'bg-violet-50' },
  { id: 'saude', label: 'Saúde', icon: HeartPulse, color: 'text-red-500', bg: 'bg-red-50' },
]

const DOCUMENT_TYPES = [
  { id: 'ficha_matricula', label: 'Ficha de Matrícula', category: 'secretaria', icon: UserCircle, component: Docs.FichaMatriculaContent },
  { id: 'ficha_individual', label: 'Ficha Individual do Aluno', category: 'pedagogico', icon: ClipboardCheck, component: Docs.FichaIndividualContent },
  { id: 'declaracao_matricula', label: 'Declaração de Matrícula', category: 'secretaria', icon: FileCheck, component: Docs.DeclaracaoMatriculaContent },
  { id: 'historico', label: 'Histórico Escolar', category: 'pedagogico', icon: GraduationCap, component: Docs.HistoricoEscolarContent },
  { id: 'transferencia', label: 'Transferência', category: 'secretaria', icon: FileOutput, component: Docs.TransferenciaContent },
  { id: 'desistencia', label: 'Desistência', category: 'juridico', icon: LogOut, component: Docs.DesistenciaContent },
  { id: 'saida_antecipada', label: 'Saída Antecipada', category: 'secretaria', icon: ArrowRight, component: Docs.SaidaAntecipadaContent },
  { id: 'termo_imagem', label: 'Uso de Imagem', category: 'juridico', icon: ImageIcon, component: Docs.TermoImagemContent },
  { id: 'ficha_saude', label: 'Ficha de Saúde', category: 'saude', icon: Activity, component: Docs.FichaSaudeContent },
  { id: 'termo_material', label: 'Termo de Material', category: 'secretaria', icon: FileText, component: Docs.TermoMaterialContent },
]

const tipoLabels: Record<string, string> = DOCUMENT_TYPES.reduce((acc, doc) => ({ ...acc, [doc.id]: doc.label }), {})

export function DocumentosPage() {
  const { authUser } = useAuth()
  const { data: templates, isLoading: loadingTemplates } = useTemplates()
  const { data: emitidos, isLoading: loadingEmitidos } = useDocumentosEmitidos()
  const { data: alunos, isLoading: loadingAlunos } = useAlunos()
  const criarTemplate = useCriarTemplate()
  const emitir = useEmitirDocumento()
  
  const [activeTab, setActiveTab] = useState('central')
  const [openTemplate, setOpenTemplate] = useState(false)
  const [openEmitir, setOpenEmitir] = useState(false)
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null)
  const [selectedAluno, setSelectedAluno] = useState('')
  const [editando, setEditando] = useState<any | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const form = useForm({ resolver: zodResolver(templateSchema) })

  const isLoading = loadingTemplates || loadingEmitidos || loadingAlunos

  const abrirNovoTemplate = () => {
    setEditando(null)
    form.reset({ tipo: '', titulo: '', corpo_html: 'Conteúdo padrão...' })
    setOpenTemplate(true)
  }

  const handleEmitir = async () => {
    if (!authUser || !selectedDocType || !selectedAluno) { 
      toast.error('Selecione aluno e documento'); 
      return 
    }
    
    const docType = DOCUMENT_TYPES.find(d => d.id === selectedDocType)
    const aluno = alunos?.find((a: any) => a.id === selectedAluno)
    if (!aluno) return

    try {
      await emitir.mutateAsync({ 
        tenant_id: authUser.tenantId, 
        template_id: null, 
        aluno_id: selectedAluno, 
        titulo: docType?.label, 
        conteudo_final: JSON.stringify({ aluno_id: aluno.id, tipo: selectedDocType }), 
        status: 'emitido'
      })
      toast.success('Documento emitido com sucesso!')
      setOpenEmitir(false)
      setActiveTab('emitidos')
    } catch (error) { 
      toast.error('Erro ao emitir documento') 
    }
  }

  const renderPreview = () => {
    if (!selectedDocType || !selectedAluno) return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/50">
        <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
          <Search className="w-6 h-6" />
        </div>
        <p className="font-bold text-sm">Selecione um aluno para visualizar</p>
        <p className="text-[10px] uppercase tracking-widest font-black mt-2">Preview em tempo real</p>
      </div>
    )

    const aluno = alunos?.find((a: any) => a.id === selectedAluno) as any
    const DocComponent = DOCUMENT_TYPES.find(d => d.id === selectedDocType)?.component

    if (!DocComponent || !aluno) return null

    const previewData = {
      nome: aluno.nome_completo,
      rg: aluno.rg || '00.000.000-0',
      cpf: aluno.cpf || '000.000.000-00',
      dataNascimento: aluno.data_nascimento ? new Date(aluno.data_nascimento).toLocaleDateString('pt-BR') : '01/01/2010',
      endereco: aluno.endereco || 'Rua das Flores, 123 - Centro',
      nomeMae: aluno.nome_mae || 'Maria Silva Moraes',
      nomePai: aluno.nome_pai || 'Ricardo Alves Moraes',
      cpfResponsavel: aluno.cpf_responsavel || '111.222.333-44',
      telefoneEmergencia: aluno.telefone_contato || '(11) 98877-6655',
      naturalidade: aluno.naturalidade || 'Cidade Exemplo - EX',
      turma: aluno.turma?.nome || '4º Ano A - Fundamental',
      turno: aluno.turma?.turno || 'Matutino',
      hashValidacao: 'VIVID-8829-X12-CONFIRMED',
      parentesco: 'Mãe',
      responsavelFinanceiro: 'Maria Silva Moraes'
    }

    return (
      <div className="min-h-full flex justify-center py-4">
        <div className="bg-white p-8 md:p-12 shadow-2xl rounded-[32px] border border-slate-100 w-full max-w-[800px] transform origin-top transition-all duration-300">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-black text-xl">F</span>
              </div>
              <div>
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Fluxoo Educação</h2>
                <h1 className="text-lg font-black tracking-tighter text-slate-800">{DOCUMENT_TYPES.find(d => d.id === selectedDocType)?.label}</h1>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Emissão</p>
              <p className="text-xs font-bold text-slate-700">{new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          <DocComponent data={previewData} />
          
          <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col items-center gap-4 opacity-40">
            <div className="w-32 h-[1px] bg-slate-300" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Assinatura Digital Fluxoo</p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Iniciando Document Engine...</p>
    </div>
  )

  return (
    <div className="max-w-[1400px] mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-teal-50 text-[10px] font-black text-teal-600 uppercase tracking-widest rounded-full border border-teal-100">
              Vivid Document Engine v2.0
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-800">Cental de Documentos</h1>
          <p className="text-slate-500 text-sm font-medium">Emissão inteligente e automação de documentos oficiais.</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-slate-100/50 p-1 rounded-2xl w-fit">
          <TabsList className="bg-transparent h-12 gap-1 border-0">
            <TabsTrigger value="central" className="rounded-xl px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Emissão
            </TabsTrigger>
            <TabsTrigger value="templates" className="rounded-xl px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Modelos
            </TabsTrigger>
            <TabsTrigger value="emitidos" className="rounded-xl px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Histórico
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Tabs value={activeTab} className="mt-8">
        <TabsContent value="central" className="mt-0 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {DOCUMENT_TYPES.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => { setSelectedDocType(doc.id); setOpenEmitir(true); }}
                  className="group relative bg-white border border-slate-100 p-6 rounded-[32px] text-left hover:border-teal-200 hover:shadow-2xl hover:shadow-teal-500/10 transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                    <doc.icon className="w-12 h-12 text-teal-500" />
                  </div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-slate-50 group-hover:bg-teal-50 transition-colors`}>
                    <doc.icon className="w-6 h-6 text-slate-400 group-hover:text-teal-600 transition-colors" />
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{doc.category}</p>
                  <h3 className="font-bold text-slate-800 leading-tight pr-8">{doc.label}</h3>
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-teal-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                    Emitir agora <ArrowRight className="w-3 h-3" />
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-6">
              <Card className="rounded-[32px] border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-gradient-to-br from-indigo-600 to-blue-700 text-white overflow-hidden">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                    <Plus className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black tracking-tighter mb-2">Solicitar Novo Modelo</h3>
                  <p className="text-blue-100 text-xs mb-6 leading-relaxed">Não encontrou o documento que precisava? Nossa equipe cria para você em até 48h.</p>
                  <Button className="w-full bg-white text-blue-600 font-bold hover:bg-white/90">Solicitar Suporte</Button>
                </CardContent>
              </Card>

              <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Dica de Produtividade</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">Use as variáveis do sistema para que os dados dos alunos sejam preenchidos automaticamente em todos os documentos.</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-0">
          <Card className="rounded-[32px] border-slate-100 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    placeholder="Buscar templates..." 
                    className="pl-10 h-10 bg-slate-50 border-none rounded-xl text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={abrirNovoTemplate} className="bg-teal-500 hover:bg-teal-600 font-bold rounded-xl h-10">
                <Plus className="w-4 h-4 mr-2" /> Novo Template
              </Button>
            </div>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-8">Título do Documento</TableHead>
                    <TableHead className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tipo</TableHead>
                    <TableHead className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-right pr-8">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates?.filter((t: any) => t.titulo.toLowerCase().includes(searchTerm.toLowerCase())).map((t: any) => (
                    <TableRow key={t.id} className="hover:bg-slate-50/50 border-slate-100 transition-colors">
                      <TableCell className="font-bold text-slate-700 pl-8">{t.titulo}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none px-3 py-1 text-[10px] font-bold">
                          {tipoLabels[t.tipo] || 'Personalizado'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-indigo-50 hover:text-indigo-600" onClick={() => { setEditando(t); form.reset(t); setOpenTemplate(true); }}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emitidos" className="mt-0">
          <Card className="rounded-[32px] border-slate-100 shadow-xl overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-8">Documento</TableHead>
                    <TableHead className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Aluno</TableHead>
                    <TableHead className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-right pr-8">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emitidos?.map((d: any) => (
                    <TableRow key={d.id} className="hover:bg-slate-50/50 border-slate-100 transition-colors">
                      <TableCell className="font-bold text-slate-700 pl-8">{d.titulo}</TableCell>
                      <TableCell className="text-slate-500 font-medium">{d.aluno?.nome_completo || '—'}</TableCell>
                      <TableCell className="text-right pr-8 text-slate-400 text-xs font-bold">
                        {new Date(d.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={openEmitir} onOpenChange={setOpenEmitir}>
        <DialogContent className="max-w-[1200px] w-[95vw] h-[90vh] p-0 overflow-hidden border-none rounded-[32px]">
          <div className="flex h-full">
            <div className="w-[400px] bg-slate-50 border-r border-slate-100 p-8 flex flex-col gap-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tighter text-slate-800">Emitir Documento</DialogTitle>
                <DialogDescription className="text-slate-500 font-medium">
                  {DOCUMENT_TYPES.find(d => d.id === selectedDocType)?.label}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Selecionar Aluno</Label>
                  <Select onValueChange={setSelectedAluno}>
                    <SelectTrigger className="h-12 border-none bg-white rounded-xl shadow-sm text-sm font-bold">
                      <SelectValue placeholder="Pesquisar por nome ou CPF..." />
                    </SelectTrigger>
                    <SelectContent>
                      {alunos?.map((a: any) => (
                        <SelectItem key={a.id} value={a.id} className="font-bold">{a.nome_completo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-auto space-y-3 pt-6 border-t border-slate-200">
                <Button onClick={handleEmitir} disabled={emitir.isPending || !selectedAluno} className="w-full h-12 bg-teal-500 hover:bg-teal-600 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-teal-500/20">
                  {emitir.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Confirmar e Emitir'}
                </Button>
                <Button variant="ghost" onClick={() => setOpenEmitir(false)} className="w-full font-bold text-slate-400">Cancelar</Button>
              </div>
            </div>

            {/* Area de Preview com Rolagem */}
            <div className="flex-1 bg-slate-200/50 flex flex-col h-full overflow-hidden">
              <div className="p-6 md:px-12 md:pt-12 md:pb-6 flex items-center justify-between border-b border-slate-100/50 bg-slate-50/50">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Live Preview</h3>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-white/50 border-slate-200">A4 Vertical</Badge>
                  <Badge variant="outline" className="bg-white/50 border-slate-200 text-teal-600 font-bold">Pronto para PDF</Badge>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-12 scroll-smooth">
                {renderPreview()}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openTemplate} onOpenChange={setOpenTemplate}>
        <DialogContent className="max-w-[800px] rounded-[32px] p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black tracking-tighter text-slate-800">
              {editando ? 'Editar Template' : 'Criar Novo Template'}
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-6" onSubmit={form.handleSubmit((data) => {
             if (!authUser) return;
             criarTemplate.mutate({ ...data, tenant_id: authUser.tenantId });
             setOpenTemplate(false);
          })}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo Base</Label>
                <Select value={form.watch('tipo')} onValueChange={(v) => form.setValue('tipo', v)}>
                  <SelectTrigger className="h-12 border-slate-100 bg-slate-50 rounded-xl font-bold">
                    <SelectValue placeholder="Selecione o tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map(doc => (
                      <SelectItem key={doc.id} value={doc.id} className="font-bold">{doc.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Título Customizado</Label>
                <Input {...form.register('titulo')} className="h-12 border-slate-100 bg-slate-50 rounded-xl font-bold" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Conteúdo do Documento</Label>
              <Textarea {...form.register('corpo_html')} className="min-h-[300px] border-slate-100 bg-slate-50 rounded-3xl p-6 font-medium text-slate-700 leading-relaxed" />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpenTemplate(false)} className="font-bold">Cancelar</Button>
              <Button type="submit" className="bg-teal-500 hover:bg-teal-600 font-bold px-8 rounded-xl h-12 shadow-lg shadow-teal-500/20">
                Salvar Template
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
