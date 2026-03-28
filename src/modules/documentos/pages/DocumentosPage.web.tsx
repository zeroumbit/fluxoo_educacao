import { useState, useMemo } from 'react'
import { logger } from '@/lib/logger'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { useTemplates, useCriarTemplate, useAtualizarTemplate, useExcluirTemplate, useDocumentosEmitidos, useEmitirDocumento, useSolicitacoesDocumento, useAtualizarSolicitacao, useVincularDocumentoSolicitacao } from '../hooks'
import { useAlunos, useAluno } from '@/modules/alunos/hooks'
import { useMatriculaAtivaDoAluno, useHistoricoNotasAluno } from '@/modules/academico/hooks'
import { useEscola } from '@/modules/escolas/hooks'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  Plus, Loader2, FileText, FileOutput, Pencil, Trash2, Search,
  FileCheck, GraduationCap, Scale, HeartPulse, LogOut,
  Image as ImageIcon, ClipboardCheck, ArrowRight, UserCircle, Activity,
  Printer, Download, Eye, X, Inbox, CheckCircle2, Clock, Package, ShieldCheck,
  AlertTriangle
} from 'lucide-react'
import * as Docs from '../DocumentEngineComponents'
import { usePdf } from '@/hooks/usePdf'
import { FichaMatriculaPDF } from '@/lib/pdf-templates'
import { AutorizacoesAdminTab } from '@/modules/autorizacoes/components/AutorizacoesAdminTab'
import { ContratoTab } from '../components/ContratoTab'

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
const turnoLabels: Record<string, string> = { manha: 'Manhã', tarde: 'Tarde', integral: 'Integral', noturno: 'Noturno' }

export function DocumentosPage() {
  const { authUser } = useAuth()
  const { data: templates, isLoading: loadingTemplates } = useTemplates()
  const { data: emitidos, isLoading: loadingEmitidos } = useDocumentosEmitidos()
  const { data: alunos, isLoading: loadingAlunos } = useAlunos()
  const { data: solicitacoes, isLoading: loadingSolicitacoes } = useSolicitacoesDocumento()
  const atualizarSolicitacao = useAtualizarSolicitacao()
  const vincularDocumento = useVincularDocumentoSolicitacao()
  const criarTemplate = useCriarTemplate()
  const atualizarTemplate = useAtualizarTemplate()
  const excluirTemplate = useExcluirTemplate()
  const emitir = useEmitirDocumento()
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null)
  const [selectedAluno, setSelectedAluno] = useState('')
  const { data: matriculaAtiva } = useMatriculaAtivaDoAluno(selectedAluno)
  const { data: alunoCompleto } = useAluno(selectedAluno)
  const { data: historicoNotas } = useHistoricoNotasAluno(selectedAluno)
  const { data: escola } = useEscola(authUser?.tenantId || '')

  const [activeTab, setActiveTab] = useState('central')
  const [openTemplate, setOpenTemplate] = useState(false)
  const [openEmitir, setOpenEmitir] = useState(false)
  const [openVisualizar, setOpenVisualizar] = useState(false)
  const [docParaVisualizar, setDocParaVisualizar] = useState<any>(null)
  const [editando, setEditando] = useState<any | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [templateParaExcluir, setTemplateParaExcluir] = useState<{ id: string; titulo: string } | null>(null)

  const form = useForm({ resolver: zodResolver(templateSchema) })

  const isLoading = loadingTemplates || loadingEmitidos || loadingAlunos || loadingSolicitacoes

  // Desduplicação de Histórico (Mantém apenas o mais recente se forem idênticos)
  const dedupedEmitidos = useMemo(() => {
    if (!emitidos) return []
    const seen = new Set()
    return emitidos.filter((doc: any) => {
      const key = `${doc.titulo}-${doc.aluno_id}-${doc.conteudo_final}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [emitidos])

  // Desduplicação de Templates
  const dedupedTemplates = useMemo(() => {
    if (!templates) return []
    const seen = new Set()
    return templates.filter((t: any) => {
      const key = `${t.titulo}-${t.tipo}-${t.corpo_html}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [templates])

  const abrirNovoTemplate = () => {
    setEditando(null)
    form.reset({ tipo: '', titulo: '', corpo_html: 'Conteúdo padrão...' })
    setOpenTemplate(true)
  }

  const handleEditarTemplate = (template: any) => {
    setEditando(template)
    form.reset({ tipo: template.tipo, titulo: template.titulo, corpo_html: template.corpo_html })
    setOpenTemplate(true)
  }

  const handleExcluirTemplate = (template: any) => {
    setTemplateParaExcluir({ id: template.id, titulo: template.titulo })
    setDeleteDialogOpen(true)
  }

  const confirmarExclusaoTemplate = async () => {
    if (!templateParaExcluir) return
    try {
      await excluirTemplate.mutateAsync(templateParaExcluir.id)
      toast.success('Template excluído com sucesso!')
      setDeleteDialogOpen(false)
      setTemplateParaExcluir(null)
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir template')
    }
  }

  const handleSalvarTemplate = async (data: any) => {
    if (!authUser) return
    try {
      if (editando?.id) {
        await atualizarTemplate.mutateAsync({ id: editando.id, updates: data })
        toast.success('Template atualizado com sucesso!')
      } else {
        await criarTemplate.mutateAsync({ ...data, tenant_id: authUser.tenantId })
        toast.success('Template criado com sucesso!')
      }
      setOpenTemplate(false)
      setEditando(null)
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar template')
    }
  }

  const getPreviewData = (alunoId: string) => {
    // Escolhe o aluno correto: se for o selecionado no momento, usa o carregado com detalhes
    const aluno = (alunoId === selectedAluno ? alunoCompleto : alunos?.find((a: any) => a.id === alunoId)) as any
    if (!aluno) return null

    // Helper para formatar endereço
    const formatEndereco = (a: any) => {
      if (a.logradouro) return `${a.logradouro}, ${a.numero}${a.bairro ? ` - ${a.bairro}` : ''}${a.cidade ? ` - ${a.cidade}` : ''}`;
      return 'Endereço não informado';
    }

    // Extrai nomes dos pais das relações se disponíveis
    const maeRel = aluno.aluno_responsavel?.find((r: any) => r.grau_parentesco?.toLowerCase().includes('mãe'))?.responsaveis;
    const paiRel = aluno.aluno_responsavel?.find((r: any) => r.grau_parentesco?.toLowerCase().includes('pai'))?.responsaveis;
    const financeiroRel = aluno.aluno_responsavel?.find((r: any) => r.is_financeiro)?.responsaveis;

    return {
      nome: aluno.nome_completo,
      rg: aluno.rg || '—',
      cpf: aluno.cpf || '—',
      dataNascimento: aluno.data_nascimento ? new Date(aluno.data_nascimento + 'T12:00:00').toLocaleDateString('pt-BR') : '—',
      endereco: formatEndereco(aluno),
      nomeMae: maeRel?.nome || aluno.nome_mae || 'Não informado',
      nomePai: paiRel?.nome || aluno.nome_pai || 'Não informado',
      cpfResponsavel: financeiroRel?.cpf || aluno.cpf_responsavel || '—',
      telefoneEmergencia: aluno.telefone_contato || '—',
      naturalidade: aluno.naturalidade || '—',
      turma: matriculaAtiva?.serie_ano || 'Não enturmado',
      turno: matriculaAtiva?.turno ? (turnoLabels[matriculaAtiva.turno] || matriculaAtiva.turno) : '—',
      anoLetivo: matriculaAtiva?.ano_letivo || '—',
      serieAno: matriculaAtiva?.serie_ano || '—',
      dataMatricula: matriculaAtiva?.data_matricula ? new Date(matriculaAtiva.data_matricula + 'T12:00:00').toLocaleDateString('pt-BR') : '—',
      valorMatricula: matriculaAtiva?.valor_matricula || 0,
      hashValidacao: 'DOC-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      parentesco: 'Responsável',
      responsavelFinanceiro: financeiroRel?.nome || 'Principal',
      notas: historicoNotas ? historicoNotas.flatMap((b: any) => 
        (b.disciplinas || []).map((d: any) => ({
          disciplina: `${d.disciplina} (${b.bimestre}º Bim / ${b.ano_letivo})`,
          media: d.nota,
          faltas: d.faltas || 0,
          situacao: d.nota >= 7 ? 'Aprovado' : 'Em Recuperação'
        }))
      ) : [],
      sintesePedagogica: historicoNotas?.[0]?.observacoes || '',
      parecerFinal: historicoNotas?.some((b: any) => b.bimestre === 4) ? 'Aprovado para a série seguinte' : 'Em curso'
    }
  }

  const handleEmitir = async () => {
    if (!authUser || !selectedDocType || !selectedAluno) {
      toast.error('Selecione aluno e documento');
      return
    }

    const docType = DOCUMENT_TYPES.find(d => d.id === selectedDocType)
    const dataSnapshot = getPreviewData(selectedAluno)
    if (!dataSnapshot) return

    try {
      await emitir.mutateAsync({
        tenant_id: authUser.tenantId,
        template_id: null,
        aluno_id: selectedAluno,
        titulo: docType?.label,
        conteudo_final: JSON.stringify({ ...dataSnapshot, tipo_doc: selectedDocType }),
        status: 'gerado'
      })
      toast.success('Documento emitido e salvo no histórico!')
      setOpenEmitir(false)
      setActiveTab('emitidos')
    } catch (error) {
      logger.error('Erro Supabase:', error);
      toast.error('Erro ao salvar no banco de dados')
    }
  }

  const openPrintWindow = () => {
    const element = document.getElementById('printable-area-frame');
    if (!element) {
      toast.error('Documento não encontrado. Selecione um aluno primeiro.');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      toast.error('Popup bloqueado! Permita popups para esta página e tente novamente.');
      return;
    }

    // Gera o HTML da janela de impressão — isolado do Tailwind/oklch
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Documento - Fluxoo Educação</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Arial, sans-serif; }
          body { background: #f8fafc; display: flex; justify-content: center; padding: 32px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .sheet { background: white; width: 210mm; min-height: 297mm; padding: 20mm; box-shadow: 0 10px 50px rgba(0,0,0,0.1); border-radius: 20px; position: relative; }
          h1 { font-size: 24px; font-weight: 900; letter-spacing: -1px; }
          h2 { font-size: 14px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
          h3 { font-size: 16px; font-weight: 900; color: #1e293b; margin-bottom: 16px; letter-spacing: -0.5px; }
          p { font-size: 13px; color: #475569; line-height: 1.6; }
          .label { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
          .value { font-size: 14px; font-weight: 700; color: #1e293b; margin-top: 4px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 16px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 3px solid #14b8a6; }
          .logo { display: flex; align-items: center; gap: 14px; }
          .logo-box { width: 44px; height: 44px; background: #14b8a6; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 22px; }
          .section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 20px; }
          .flex { display: flex !important; }
          .flex-col { flex-direction: column !important; }
          .justify-between { justify-content: space-between !important; }
          .justify-center { justify-content: center !important; }
          .items-center { align-items: center !important; }
          .flex-1 { flex: 1 !important; }
          .text-center { text-align: center !important; }
          .w-full { width: 100% !important; }
          .gap-12 { gap: 48px !important; }
          .mt-20 { margin-top: 80px !important; }
          .mt-12 { margin-top: 48px !important; }
          .pt-8 { padding-top: 32px !important; }
          .border-t { border-top: 1px solid #e2e8f0 !important; }

          .signature-area { display: flex !important; justify-content: space-between !important; gap: 40px !important; margin-top: 80px !important; }
          .signature-box { flex: 1 !important; text-align: center !important; display: flex !important; flex-direction: column !important; align-items: center !important; }
          .signature-line { width: 100% !important; border-top: 1px solid #94a3b8 !important; margin-bottom: 8px !important; }
          .signature-name { font-size: 11px; font-weight: 800; color: #1e293b; text-transform: uppercase; }
          .signature-role { font-size: 9px; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-top: 4px; }
          
          .print-footer { display: flex !important; flex-direction: column !important; align-items: center !important; margin-top: 60px; padding-top: 32px; border-top: 1px solid #f1f5f9; text-align: center; }
          
          @media print {
            body { background: white; padding: 0; }
            .sheet { box-shadow: none; padding: 15mm; border-radius: 0; width: 100%; border: none; }
            .print-btn { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="print-btn">
          <button class="btn btn-secondary" onclick="window.close()">Fechar</button>
          <button class="btn btn-primary" onclick="window.print()">&#128438; Imprimir / Salvar PDF</button>
        </div>
        <div class="sheet">
          ${element.innerHTML}
        </div>
        <script>
          // Substitui classes do Tailwind por estilos inline equivalentes
          document.querySelectorAll('[class]').forEach(el => {
            const cls = el.className || '';
            if (cls.includes('justify-between')) el.style.justifyContent = 'space-between';
            if (cls.includes('justify-center')) el.style.justifyContent = 'center';
            if (cls.includes('items-center')) el.style.alignItems = 'center';
            if (cls.includes('flex-col')) el.style.flexDirection = 'column';
            if (cls.includes('flex-1')) el.style.flex = '1';
            if (cls.includes('text-center')) el.style.textAlign = 'center';
            if (cls.includes('hidden')) el.style.display = 'none';
          });
        <\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const { isGenerating, generateAndDownload, generateAndView } = usePdf()

  const handlePrint = () => {
    openPrintWindow()
  }

  const handleDownloadPDF = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    
    if (!selectedAluno || !selectedDocType) {
      toast.error('Selecione um aluno e tipo de documento')
      return
    }

    const dataSnapshot = getPreviewData(selectedAluno)
    if (!dataSnapshot) return

    try {
      // Usar o novo sistema de PDF com @react-pdf/renderer
      if (selectedDocType === 'ficha_matricula') {
        const pdfDoc = <FichaMatriculaPDF data={dataSnapshot} />
        await generateAndDownload(pdfDoc, `ficha_matricula_${dataSnapshot.nome.split(' ')[0]}.pdf`)
      } else {
        // Para outros documentos, usa o método antigo (window.print)
        toast.info('Documento gerado via impressão — escolha "Salvar como PDF" no destino.')
        openPrintWindow()
      }
    } catch (error) {
      logger.error('Erro ao gerar PDF:', error)
      toast.error('Erro ao gerar PDF')
    }
  }

  const handleVisualizarPDF = async () => {
    if (!selectedAluno || !selectedDocType) {
      toast.error('Selecione um aluno e tipo de documento')
      return
    }

    const dataSnapshot = getPreviewData(selectedAluno)
    if (!dataSnapshot) return

    if (selectedDocType === 'ficha_matricula') {
      const pdfDoc = <FichaMatriculaPDF data={dataSnapshot} />
      await generateAndView(pdfDoc)
    } else {
      openPrintWindow()
    }
  }

  const handleVerEmitido = (doc: any) => {
    try {
      let data = JSON.parse(doc.conteudo_final);

      // Se for formato antigo (sem campos de dados), tentamos preencher do sistema
      if (!data.nome) {
        const alunoId = data.aluno_id || doc.aluno_id;
        const currentData = getPreviewData(alunoId);
        if (currentData) {
          data = { ...currentData, ...data };
        }
      }

      const tipoReal = data.tipo_doc || data.tipo || 'ficha_matricula';
      setDocParaVisualizar({
        ...data,
        tipo_doc: tipoReal,
        titulo: doc.titulo,
        data_emissao: doc.created_at || new Date().toISOString()
      });
      setOpenVisualizar(true);
    } catch (e) {
      logger.error('Erro ao ver documento:', e);
      toast.error('Erro ao abrir documento. Os dados podem estar corrompidos.');
    }
  }

  const renderDocFrame = (data: any, type: string, date?: string) => {
    const DocComponent = DOCUMENT_TYPES.find(d => d.id === type)?.component
    if (!DocComponent) return null

    return (
      <div className="bg-white p-8 md:p-12 shadow-2xl rounded-[32px] border border-slate-100 w-full max-w-[800px] print:shadow-none print:border-none print:p-0 print:m-0 printable-frame" id="printable-area-frame">
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center print:bg-teal-500">
              <span className="text-white font-black text-xl">{escola?.razao_social?.[0] || 'E'}</span>
            </div>
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">{escola?.razao_social || 'Instituição de Ensino'}</h2>
              <h1 className="text-lg font-black tracking-tighter text-slate-800">{DOCUMENT_TYPES.find(d => d.id === type)?.label}</h1>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Emissão</p>
            <p className="text-xs font-bold text-slate-700">{date ? new Date(date).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
        <DocComponent data={data} />

        {/* Blocos de Assinatura Manual */}
        <div className="signature-area mt-20 flex justify-between gap-12 print:mt-16 sm:px-4">
          <div className="signature-box flex-1 flex flex-col items-center">
            <div className="signature-line w-full h-[1px] bg-slate-200 mb-2" />
            <p className="signature-name text-[10px] font-black text-slate-700 uppercase tracking-widest leading-none">Responsável / Aluno</p>
            <p className="signature-role text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Assinatura do Requerente</p>
          </div>
          <div className="signature-box flex-1 flex flex-col items-center">
            <div className="signature-line w-full h-[1px] bg-slate-200 mb-2" />
            <p className="signature-name text-[10px] font-black text-slate-700 uppercase tracking-widest leading-none">Direção / Secretaria</p>
            <p className="signature-role text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Carimbo e Assinatura</p>
          </div>
        </div>

        {/* Rodapé Digital Fluxoo */}
        <div className="print-footer mt-12 pt-8 border-t border-slate-100 flex flex-col items-center gap-4 opacity-40 print:opacity-100">
          <div className="w-32 h-[1px] bg-slate-300" />
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Autenticação Digital • {escola?.razao_social || 'Instituição'}</p>
          <p className="text-[8px] font-mono text-slate-300">{data?.hashValidacao || '—'}</p>
        </div>
      </div>
    )
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

    const data = getPreviewData(selectedAluno)
    if (!data) return null
    return renderDocFrame(data, selectedDocType)
  }

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Iniciando Document Engine...</p>
    </div>
  )

  return (
    <div className="max-w-[1400px] mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-teal-50 text-[10px] font-black text-teal-600 uppercase tracking-widest rounded-full border border-teal-100">
              Vivid Document Engine v2.0
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-800 whitespace-nowrap">Central de Documentos</h1>
          <p className="text-slate-500 text-sm font-medium">Emissão inteligente e automação de documentos oficiais.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-100/50 p-1 rounded-2xl h-12 gap-1 border-0 w-fit">
            <TabsTrigger value="contrato" className="rounded-xl px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-1.5 transition-all">
              <FileText className="h-3.5 w-3.5" /> Contrato
            </TabsTrigger>
            <TabsTrigger value="autorizacoes" className="rounded-xl px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-1.5 transition-all">
              <ShieldCheck className="h-3.5 w-3.5" /> Autorizações
            </TabsTrigger>
            <TabsTrigger value="central" className="rounded-xl px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
              Emissão
            </TabsTrigger>
            <TabsTrigger value="templates" className="rounded-xl px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
              Modelos
            </TabsTrigger>
            <TabsTrigger value="emitidos" className="rounded-xl px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
              Histórico
            </TabsTrigger>
            <TabsTrigger value="solicitacoes" className="rounded-xl px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm relative transition-all">
              Solicitações
              {solicitacoes && solicitacoes.filter((s: any) => s.status === 'pendente' || s.status === 'em_analise').length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-teal-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {solicitacoes.filter((s: any) => s.status === 'pendente' || s.status === 'em_analise').length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="mt-8">
            <TabsContent value="contrato" className="mt-0 focus-visible:outline-none">
              <ContratoTab />
            </TabsContent>

            <TabsContent value="autorizacoes" className="mt-0 focus-visible:outline-none">
              <AutorizacoesAdminTab />
            </TabsContent>

            <TabsContent value="central" className="mt-0 space-y-8 focus-visible:outline-none">
          {/* Documentos Padrão */}
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

          {/* Templates Personalizados da Escola */}
          {dedupedTemplates && dedupedTemplates.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-600" />
                <h2 className="text-lg font-semibold">Modelos Personalizados</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {dedupedTemplates.map((template: any) => {
                  const IconComponent = DOCUMENT_TYPES.find(d => d.id === template.tipo)?.icon || FileText
                  return (
                    <button
                      key={template.id}
                      onClick={() => { setSelectedDocType(template.tipo); setOpenEmitir(true); }}
                      className="group relative bg-white border border-slate-100 p-6 rounded-[32px] text-left hover:border-teal-200 hover:shadow-2xl hover:shadow-teal-500/10 transition-all duration-500 overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                        <IconComponent className="w-12 h-12 text-teal-500" />
                      </div>
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-teal-50 group-hover:bg-teal-100 transition-colors">
                        <IconComponent className="w-6 h-6 text-teal-600" />
                      </div>
                      <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest mb-1">PERSONALIZADO</p>
                      <h3 className="font-bold text-slate-800 leading-tight pr-8">{template.titulo}</h3>
                      <p className="text-[10px] text-slate-400 mt-2">
                        {tipoLabels[template.tipo] || 'Modelo customizado'}
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-teal-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                        Emitir agora <ArrowRight className="w-3 h-3" />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
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
                    <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-8">Título do Documento</TableHead>
                    <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</TableHead>
                    <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-8">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dedupedTemplates?.filter((t: any) => t.titulo.toLowerCase().includes(searchTerm.toLowerCase())).map((t: any) => (
                    <TableRow key={t.id} className="hover:bg-slate-50/50 border-slate-100 transition-colors">
                      <TableCell className="font-bold text-slate-700 pl-8">{t.titulo}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none px-3 py-1 text-[10px] font-bold">
                          {tipoLabels[t.tipo] || 'Personalizado'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8 rounded-lg hover:bg-indigo-50 hover:text-indigo-600" 
                            onClick={() => handleEditarTemplate(t)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8 rounded-lg hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleExcluirTemplate(t)}
                          >
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
                    <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-8">Documento</TableHead>
                    <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aluno</TableHead>
                    <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</TableHead>
                    <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-8">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dedupedEmitidos?.map((d: any) => (
                    <TableRow key={d.id} className="hover:bg-slate-50/50 border-slate-100 transition-colors">
                      <TableCell className="font-bold text-slate-700 pl-8">{d.titulo}</TableCell>
                      <TableCell className="text-slate-500 font-medium">{d.aluno?.nome_completo || '—'}</TableCell>
                      <TableCell className="text-slate-400 text-xs font-bold">
                        {new Date(d.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleVerEmitido(d)} className="w-8 h-8 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleVerEmitido(d)} className="w-8 h-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleVerEmitido(d)} className="w-8 h-8 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
                            <Download className="w-4 h-4" />
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

        <TabsContent value="solicitacoes" className="mt-0">
          <Card className="rounded-[32px] border-slate-100 shadow-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="space-y-4">
                {solicitacoes && solicitacoes.length > 0 ? (
                  solicitacoes.map((sol: any) => {
                    const statusColors: Record<string, string> = {
                      pendente: 'bg-amber-50 text-amber-700 border-amber-200',
                      em_analise: 'bg-blue-50 text-blue-700 border-blue-200',
                      pronto: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      entregue: 'bg-violet-50 text-violet-700 border-violet-200',
                      recusado: 'bg-red-50 text-red-700 border-red-200',
                    }
                    return (
                      <div
                        key={sol.id}
                        className="flex items-center justify-between p-5 rounded-2xl border hover:shadow-md transition-all bg-white"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="h-12 w-12 rounded-xl bg-teal-50 flex items-center justify-center">
                            <FileText className="h-6 w-6 text-teal-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-slate-800">
                                {DOCUMENT_TYPES.find(d => d.id === sol.documento_tipo)?.label || sol.documento_tipo}
                              </h4>
                              <Badge className={cn("text-[9px] uppercase tracking-wider font-black border", statusColors[sol.status] || statusColors.pendente)}>
                                {sol.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span className="font-medium">{sol.aluno?.nome_completo || '—'}</span>
                              <span>•</span>
                              <span>Solicitado por: {sol.responsavel?.nome || '—'}</span>
                              <span>•</span>
                              <span>{new Date(sol.created_at).toLocaleDateString('pt-BR')}</span>
                            </div>
                            {sol.observacoes && (
                              <p className="text-xs text-slate-600 mt-2 flex items-center gap-1">
                                <Inbox className="h-3 w-3" />
                                {sol.observacoes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {sol.status === 'pendente' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => atualizarSolicitacao.mutateAsync({ id: sol.id, updates: { status: 'em_analise' } })}
                                className="bg-blue-500 hover:bg-blue-600 text-white"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" /> Analisar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => atualizarSolicitacao.mutateAsync({ id: sol.id, updates: { status: 'recusado' } })}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" /> Recusar
                              </Button>
                            </>
                          )}
                          {sol.status === 'em_analise' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                // Abre modal para selecionar documento emitido ou criar novo
                                toast.info('Funcionalidade: Vincular documento emitido')
                              }}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white"
                            >
                              <Package className="h-4 w-4 mr-1" /> Marcar como Pronto
                            </Button>
                          )}
                          {sol.status === 'pronto' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => atualizarSolicitacao.mutateAsync({ id: sol.id, updates: { status: 'entregue' } })}
                              className="text-violet-600 border-violet-200 hover:bg-violet-50"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" /> Confirmar Entrega
                            </Button>
                          )}
                          {sol.status === 'entregue' && (
                            <Badge className="bg-slate-100 text-slate-600 border-slate-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Concluído
                            </Badge>
                          )}
                          {sol.status === 'recusado' && (
                            <Badge className="bg-red-100 text-red-600 border-red-200">
                              <X className="h-3 w-3 mr-1" /> Recusado
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                    <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center">
                      <Inbox className="h-10 w-10 text-slate-300" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-700">Nenhuma solicitação</p>
                      <p className="text-sm text-slate-500 mt-1">
                        As solicitações dos responsáveis aparecerão aqui
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <Dialog open={openEmitir} onOpenChange={setOpenEmitir}>
        <DialogContent className="max-w-[1200px] w-[95vw] h-[90vh] p-0 overflow-hidden border-none rounded-[32px] flex flex-col printing-dialog">
          <div className="flex flex-1 overflow-hidden">
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
                <Button
                  onClick={handleEmitir}
                  disabled={emitir.isPending || !selectedAluno}
                  className="w-full h-12 bg-teal-500 hover:bg-teal-600 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-teal-500/20"
                >
                  {emitir.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Confirmar e Salvar'}
                </Button>

                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" onClick={handleVisualizarPDF} disabled={!selectedAluno} className="border-slate-200 font-bold text-slate-600 hover:bg-slate-50 px-2 h-10 text-xs">
                    <Eye className="w-4 h-4 mr-1" /> Ver
                  </Button>
                  <Button variant="outline" onClick={handlePrint} disabled={!selectedAluno} className="border-slate-200 font-bold text-slate-600 hover:bg-slate-50 px-2 h-10 text-xs text-nowrap">
                    <Printer className="w-4 h-4 mr-1" /> Imprimir
                  </Button>
                  <Button variant="outline" onClick={() => handleDownloadPDF()} disabled={!selectedAluno} className="border-slate-200 font-bold text-slate-600 hover:bg-slate-50 px-2 h-10 text-xs text-nowrap">
                    <Download className="w-4 h-4 mr-1" /> Baixar PDF
                  </Button>
                </div>

                <Button variant="ghost" onClick={() => setOpenEmitir(false)} className="w-full font-bold text-slate-400">Cancelar</Button>
              </div>
            </div>

            {/* Area de Preview com Rolagem */}
            <div className="flex-1 bg-slate-200/50 flex flex-col overflow-hidden">
              <div className="p-6 md:px-12 md:pt-12 md:pb-6 flex items-center justify-between border-b border-slate-100/50 bg-slate-50/50">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Live Preview</h3>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-white/50 border-slate-200">A4 Vertical</Badge>
                  <Badge variant="outline" className="bg-white/50 border-slate-200 text-teal-600 font-bold">Pronto para PDF</Badge>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-200/50 custom-scrollbar scroll-smooth">
                <style>{`
                  .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                  .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 20px; border: 3px solid transparent; background-clip: content-box; }
                  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; border: 3px solid transparent; background-clip: content-box; }
                `}</style>
                <div className="p-6 md:p-12 flex justify-center pb-24">
                  {renderPreview()}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openTemplate} onOpenChange={setOpenTemplate}>
        <DialogContent className="max-w-[800px] w-[95vw] p-0 overflow-hidden border-none rounded-[32px] flex flex-col max-h-[90vh]">
          <DialogHeader className="p-8 pb-0">
            <DialogTitle className="text-2xl font-black tracking-tighter text-slate-800">
              {editando ? 'Editar Template' : 'Criar Novo Template'}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 p-8">
            <form className="space-y-6">
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
                <Textarea {...form.register('corpo_html')} className="min-vh-[40vh] min-h-[400px] border-slate-100 bg-slate-50 rounded-3xl p-6 font-medium text-slate-700 leading-relaxed" />
              </div>
            </form>
          </ScrollArea>

          <DialogFooter className="p-8 pt-4 border-t bg-slate-50/50 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setOpenTemplate(false)} className="font-bold text-slate-400">Cancelar</Button>
            <Button 
              type="button" 
              onClick={form.handleSubmit(handleSalvarTemplate)}
              className="bg-teal-500 hover:bg-teal-600 font-bold px-8 rounded-xl h-12 shadow-lg shadow-teal-500/20"
            >
              {editando ? 'Salvar Alterações' : 'Salvar Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão de Template */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900">Excluir Template</DialogTitle>
            </div>
            <DialogDescription className="text-slate-500 font-medium pt-2">
              Você está prestes a excluir o template <strong className="text-slate-700">"{templateParaExcluir?.titulo}"</strong>. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold text-rose-800">Atenção!</p>
                <p className="text-rose-700 font-medium mt-1">
                  Todos os dados relacionados a este template serão removidos permanentemente.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={excluirTemplate.isPending}
              className="flex-1 sm:flex-none h-11 font-bold border-slate-200 hover:bg-slate-50"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmarExclusaoTemplate}
              disabled={excluirTemplate.isPending}
              className="flex-1 sm:flex-none h-11 font-bold bg-rose-600 text-white hover:bg-rose-700"
            >
              {excluirTemplate.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openVisualizar} onOpenChange={setOpenVisualizar}>
        <DialogContent className="max-w-[1000px] w-[95vw] h-[90vh] p-0 overflow-hidden border-none rounded-[32px] flex flex-col printing-dialog">
          <DialogHeader className="p-8 pb-4 flex flex-row items-center justify-between border-b bg-white">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black tracking-tighter text-slate-800">
                {docParaVisualizar?.titulo}
              </DialogTitle>
              <DialogDescription className="font-bold text-teal-600">
                Emitido em {docParaVisualizar?.data_emissao && new Date(docParaVisualizar.data_emissao).toLocaleDateString('pt-BR')}
              </DialogDescription>
            </div>
            <div className="flex gap-3 pr-8">
              <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 font-bold gap-2">
                <Printer className="w-4 h-4" /> Imprimir
              </Button>
              <Button onClick={() => handleDownloadPDF()} variant="outline" className="border-slate-200 font-bold gap-2">
                <Download className="w-4 h-4" /> Baixar PDF
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto bg-slate-100/50 p-6 md:p-12 flex justify-center overflow-hidden custom-scrollbar">
            {docParaVisualizar && renderDocFrame(docParaVisualizar, docParaVisualizar.tipo_doc, docParaVisualizar.data_emissao)}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
