import React, { useState } from 'react'
import { usePortalContext } from '../context'
import { useSolicitacoesDocumento, useCriarSolicitacaoDocumento, useResponsavel, useTemplatesDocumento } from '../hooks'
import {
  Loader2,
  FileText,
  Plus,
  CheckCircle2,
  Clock,
  Package,
  XCircle,
  AlertCircle,
  Send,
  FileCheck,
  Download,
  Eye,
  Printer,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

const DOCUMENT_TYPE_ICONS: Record<string, any> = {
  ficha_matricula: FileText,
  ficha_individual: FileText,
  declaracao_matricula: FileCheck,
  historico: FileText,
  transferencia: Send,
  desistencia: LogOut,
  saida_antecipada: AlertCircle,
  termo_imagem: FileText,
  ficha_saude: AlertCircle,
  termo_material: Package,
  personalizado: FileText,
  contrato: Send,
}

const statusConfig: Record<string, { label: string, color: string, icon: any, bg: string }> = {
  pendente: { label: 'Pendente', color: 'text-amber-600', icon: Clock, bg: 'bg-amber-50' },
  em_analise: { label: 'Em Análise', color: 'text-blue-600', icon: AlertCircle, bg: 'bg-blue-50' },
  pronto: { label: 'Pronto', color: 'text-emerald-600', icon: CheckCircle2, bg: 'bg-emerald-50' },
  entregue: { label: 'Entregue', color: 'text-violet-600', icon: Package, bg: 'bg-violet-50' },
  recusado: { label: 'Recusado', color: 'text-red-600', icon: XCircle, bg: 'bg-red-50' },
}

export function PortalDocumentosPage() {
  const { alunoSelecionado, tenantId } = usePortalContext()
  const { data: responsavel } = useResponsavel()
  const { data: solicitacoes, isLoading: loadingSolicitacoes } = useSolicitacoesDocumento()
  const { data: templates = [], isLoading: loadingTemplates } = useTemplatesDocumento()
  const criarSolicitacao = useCriarSolicitacaoDocumento()
  const navigate = useNavigate()

  const isLoading = loadingSolicitacoes || loadingTemplates

  const [openDialog, setOpenDialog] = useState(false)
  const [selectedDocType, setSelectedDocType] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [enviarPeloAluno, setEnviarPeloAluno] = useState(false)

  // Tipos padrão de documentos disponíveis para todas as escolas
  const standardDocTypes = [
    { id: 'ficha_matricula', titulo: 'Ficha de Matrícula', tipo: 'ficha_matricula' },
    { id: 'ficha_individual', titulo: 'Ficha Individual do Aluno', tipo: 'ficha_individual' },
    { id: 'declaracao_matricula', titulo: 'Declaração de Matrícula', tipo: 'declaracao_matricula' },
    { id: 'historico', titulo: 'Histórico Escolar', tipo: 'historico' },
    { id: 'transferencia', titulo: 'Transferência', tipo: 'transferencia' },
    { id: 'desistencia', titulo: 'Desistência', tipo: 'desistencia' },
    { id: 'saida_antecipada', titulo: 'Saída Antecipada', tipo: 'saida_antecipada' },
    { id: 'termo_imagem', titulo: 'Uso de Imagem', tipo: 'termo_imagem' },
    { id: 'ficha_saude', titulo: 'Ficha de Saúde', tipo: 'ficha_saude' },
    { id: 'termo_material', titulo: 'Termo de Material', tipo: 'termo_material' },
  ]

  // Combina documentos padrão + templates customizados da escola (sem duplicar)
  const allDocTypes = [
    ...standardDocTypes,
    ...templates.filter((tpl: any) => !standardDocTypes.find((std: any) => std.tipo === tpl.tipo))
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#14B8A6]" />
      </div>
    )
  }

  const handleSolicitar = async () => {
    if (!alunoSelecionado || !responsavel || !tenantId) {
      toast.error('Dados incompletos. Tente novamente.')
      return
    }

    if (!selectedDocType) {
      toast.error('Selecione um tipo de documento.')
      return
    }

    try {
      await criarSolicitacao.mutateAsync({
        tenant_id: tenantId,
        aluno_id: alunoSelecionado.id,
        responsavel_id: responsavel.id,
        documento_tipo: selectedDocType,
        observacoes: enviarPeloAluno ? '⚠️ Enviar pelo aluno: ' + observacoes : observacoes,
      })
      toast.success('Solicitação enviada! A escola será notificada.')
      setOpenDialog(false)
      setSelectedDocType('')
      setObservacoes('')
      setEnviarPeloAluno(false)
    } catch (error) {
      toast.error('Erro ao solicitar documento.')
      console.error(error)
    }
  }

  const handleVerDocumento = (solicitacao: any) => {
    if (solicitacao.documento_emitido) {
      // Navega para a página de documentos emitidos ou abre preview
      toast.info('Funcionalidade de visualização em desenvolvimento')
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Meus Documentos</h1>
          <p className="text-muted-foreground">Solicite documentos e acompanhe o status</p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button className="bg-teal-500 hover:bg-teal-600 shadow-lg shadow-teal-500/30">
              <Plus className="mr-2 h-4 w-4" />
              Solicitar Documento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-500" />
                Solicitar Documento
              </DialogTitle>
              <DialogDescription>
                Selecione o documento desejado e adicione observações se necessário.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tipo de Documento *</Label>
                <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o documento" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {allDocTypes.map((doc: any) => {
                      const Icon = DOCUMENT_TYPE_ICONS[doc.tipo] || FileText
                      return (
                        <SelectItem key={doc.id} value={doc.id}>
                          <span className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {doc.titulo}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  placeholder="Ex: Preciso com urgência, ou outras instruções..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-teal-50 border border-teal-100 rounded-lg">
                <input
                  type="checkbox"
                  id="enviar-aluno"
                  checked={enviarPeloAluno}
                  onChange={(e) => setEnviarPeloAluno(e.target.checked)}
                  className="h-4 w-4 text-teal-500 rounded border-teal-300 focus:ring-teal-500"
                />
                <Label htmlFor="enviar-aluno" className="text-sm font-medium text-teal-900 cursor-pointer flex-1">
                  Enviar assinado e impresso pelo aluno
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancelar</Button>
              <Button
                onClick={handleSolicitar}
                disabled={criarSolicitacao.isPending || !selectedDocType}
                className="bg-teal-500 hover:bg-teal-600"
              >
                {criarSolicitacao.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar Solicitação'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Solicitações */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-4 pt-8">
          <CardTitle className="text-lg">Histórico de Solicitações</CardTitle>
          <CardDescription>Acompanhe o status dos documentos solicitados</CardDescription>
        </CardHeader>
        <CardContent>
          {solicitacoes && solicitacoes.length > 0 ? (
            <div className="space-y-3">
              {solicitacoes.map((sol: any) => {
                const StatusIcon = statusConfig[sol.status]?.icon || Clock
                return (
                  <div
                    key={sol.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center",
                        statusConfig[sol.status]?.bg || 'bg-slate-50'
                      )}>
                        <StatusIcon className={cn("h-6 w-6", statusConfig[sol.status]?.color || 'text-slate-400')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-slate-800">
                            {templates.find((tpl: any) => tpl.id === sol.documento_tipo)?.titulo || sol.documento_tipo}
                          </h4>
                          <Badge className={cn(
                            "text-[9px] uppercase tracking-wider font-black",
                            statusConfig[sol.status]?.bg,
                            statusConfig[sol.status]?.color
                          )}>
                            {statusConfig[sol.status]?.label || sol.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          Solicitado em {new Date(sol.created_at).toLocaleDateString('pt-BR')}
                          {sol.observacoes && (
                            <span className="ml-2 text-slate-400">• {sol.observacoes}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {sol.status === 'pronto' && sol.documento_emitido && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerDocumento(sol)}
                            className="text-teal-600 border-teal-200 hover:bg-teal-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-teal-600 border-teal-200 hover:bg-teal-50"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {sol.status !== 'pronto' && sol.status !== 'entregue' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-slate-400"
                          disabled
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center">
                <FileText className="h-10 w-10 text-slate-300" />
              </div>
              <div>
                <p className="font-bold text-slate-700">Nenhuma solicitação ainda</p>
                <p className="text-sm text-slate-500 mt-1">
                  Clique em "Solicitar Documento" para começar
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tipos de Documentos Disponíveis */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-slate-50 to-white">
        <CardHeader className="pt-8">
          <CardTitle className="text-lg">Documentos Disponíveis</CardTitle>
          <CardDescription>Tipos de documentos que você pode solicitar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allDocTypes.map((doc: any) => {
              const Icon = DOCUMENT_TYPE_ICONS[doc.tipo] || FileText
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-100 hover:border-teal-200 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => {
                    setSelectedDocType(doc.id)
                    setOpenDialog(true)
                  }}
                >
                  <div className="h-10 w-10 rounded-lg bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                    <Icon className="h-5 w-5 text-teal-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-700">{doc.titulo}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
