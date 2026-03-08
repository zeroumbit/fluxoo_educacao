import React, { useState } from 'react'
import { usePortalContext } from '../context'
import { useSolicitacoesDocumento, useCriarSolicitacaoDocumento, useResponsavel, useTemplatesDocumento } from '../hooks'
import {
  FileText, Plus, CheckCircle2, Clock, Package, XCircle, AlertCircle,
  Send, FileCheck, Download, LogOut, ChevronRight, Info, Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

const vibrate = (ms: number = 30) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms);
}

const DOCUMENT_TYPE_ICONS: Record<string, any> = {
  ficha_matricula: FileText, ficha_individual: FileText, declaracao_matricula: FileCheck,
  historico: FileText, transferencia: Send, desistencia: LogOut, saida_antecipada: AlertCircle,
  termo_imagem: FileText, ficha_saude: AlertCircle, termo_material: Package,
  personalizado: FileText, contrato: Send,
}

const statusConfig: Record<string, { label: string, color: string, icon: any, bg: string }> = {
  pendente: { label: 'Pendente', color: 'text-amber-600', icon: Clock, bg: 'bg-amber-50' },
  em_analise: { label: 'Em Análise', color: 'text-blue-600', icon: AlertCircle, bg: 'bg-blue-50' },
  pronto: { label: 'Pronto', color: 'text-emerald-600', icon: CheckCircle2, bg: 'bg-emerald-50' },
  entregue: { label: 'Entregue', color: 'text-indigo-600', icon: Package, bg: 'bg-indigo-50' },
  recusado: { label: 'Recusado', color: 'text-red-600', icon: XCircle, bg: 'bg-red-50' },
}

const DocumentosSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-8 w-40 bg-slate-100 rounded-lg" />
    <div className="h-10 w-40 bg-emerald-100 rounded-xl" />
    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white border border-slate-100 rounded-2xl" />)}
  </div>
)

export function PortalDocumentosPage() {
  const { alunoSelecionado, tenantId } = usePortalContext()
  const { data: responsavel } = useResponsavel()
  const { data: solicitacoes, isLoading: loadingSolicitacoes } = useSolicitacoesDocumento()
  const { data: templates = [], isLoading: loadingTemplates } = useTemplatesDocumento()
  const criarSolicitacao = useCriarSolicitacaoDocumento()
  const isLoading = loadingSolicitacoes || loadingTemplates

  const [openSheet, setOpenSheet] = useState(false)
  const [selectedDocType, setSelectedDocType] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [enviarPeloAluno, setEnviarPeloAluno] = useState(false)

  const standardDocTypes = [
    { id: 'ficha_matricula', titulo: 'Ficha de Matrícula', tipo: 'ficha_matricula' },
    { id: 'ficha_individual', titulo: 'Ficha Individual', tipo: 'ficha_individual' },
    { id: 'declaracao_matricula', titulo: 'Declaração de Matrícula', tipo: 'declaracao_matricula' },
    { id: 'historico', titulo: 'Histórico Escolar', tipo: 'historico' },
    { id: 'transferencia', titulo: 'Transferência', tipo: 'transferencia' },
    { id: 'desistencia', titulo: 'Desistência', tipo: 'desistencia' },
    { id: 'saida_antecipada', titulo: 'Saída Antecipada', tipo: 'saida_antecipada' },
    { id: 'termo_imagem', titulo: 'Uso de Imagem', tipo: 'termo_imagem' },
    { id: 'ficha_saude', titulo: 'Ficha de Saúde', tipo: 'ficha_saude' },
    { id: 'termo_material', titulo: 'Termo de Material', tipo: 'termo_material' },
  ]
  const allDocTypes = [
    ...standardDocTypes,
    ...templates.filter((tpl: any) => !standardDocTypes.find((std: any) => std.tipo === tpl.tipo))
  ]

  if (isLoading) return <DocumentosSkeleton />

  const handleSolicitar = async () => {
    if (!alunoSelecionado || !responsavel || !tenantId) { toast.error('Dados incompletos.'); return }
    vibrate(50)
    try {
      await criarSolicitacao.mutateAsync({
        tenant_id: tenantId, aluno_id: alunoSelecionado.id, responsavel_id: responsavel.id,
        documento_tipo: selectedDocType,
        observacoes: enviarPeloAluno ? '⚠️ Enviar pelo aluno: ' + observacoes : observacoes,
      })
      toast.success('Solicitação enviada!')
      setOpenSheet(false); setSelectedDocType(''); setObservacoes(''); setEnviarPeloAluno(false)
    } catch { toast.error('Erro ao solicitar documento.') }
  }

  return (
    <div className="space-y-5 pb-20 animate-in fade-in duration-500 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">Documentos</h2>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Solicitações Acadêmicas</p>
        </div>
        <Sheet open={openSheet} onOpenChange={setOpenSheet}>
          <SheetTrigger asChild>
            <Button onClick={() => vibrate(20)} className="bg-teal-500 hover:bg-teal-600 shadow-lg shadow-teal-500/20 rounded-xl h-10 px-5 font-semibold text-xs">
              <Plus className="mr-2 h-4 w-4" /> Nova Solicitação
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl px-5 pt-6 pb-8 border-0 shadow-2xl overflow-y-auto max-h-[85vh]">
            <SheetHeader className="space-y-1">
              <SheetTitle className="text-lg font-bold text-slate-800">Solicitar Documento</SheetTitle>
              <SheetDescription className="text-sm text-slate-500">Processamento em até 48h úteis.</SheetDescription>
            </SheetHeader>
            <div className="space-y-5 py-5">
              <div className="space-y-2">
                <Label className="font-semibold text-[10px] uppercase tracking-wider text-slate-400">Tipo</Label>
                <Select value={selectedDocType} onValueChange={v => { vibrate(10); setSelectedDocType(v); }}>
                  <SelectTrigger className="w-full h-12 rounded-xl border-slate-200 bg-slate-50 font-medium">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {allDocTypes.map((doc: any) => {
                      const Icon = DOCUMENT_TYPE_ICONS[doc.tipo] || FileText
                      return (
                        <SelectItem key={doc.id} value={doc.id} className="rounded-lg">
                          <span className="flex items-center gap-2"><Icon className="h-4 w-4 text-teal-500" />{doc.titulo}</span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold text-[10px] uppercase tracking-wider text-slate-400">Observações</Label>
                <Textarea placeholder="Instruções para a secretaria..." value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  className="rounded-xl border-slate-200 bg-slate-50 font-medium min-h-[90px] p-4 text-sm" />
              </div>
              <div className="flex items-center gap-3 p-4 bg-teal-50 rounded-xl border border-teal-100">
                <input type="checkbox" id="enviar-aluno" checked={enviarPeloAluno}
                  onChange={e => { vibrate(10); setEnviarPeloAluno(e.target.checked); }}
                  className="h-5 w-5 text-teal-500 rounded border-teal-300 focus:ring-teal-500" />
                <Label htmlFor="enviar-aluno" className="text-xs font-semibold text-teal-900 cursor-pointer flex-1">
                  Enviar pelo aluno
                </Label>
              </div>
            </div>
            <SheetFooter>
              <Button onClick={handleSolicitar} disabled={criarSolicitacao.isPending || !selectedDocType}
                className="w-full h-12 rounded-xl bg-slate-900 text-white font-semibold text-xs uppercase tracking-wider">
                {criarSolicitacao.isPending ? 'Enviando...' : 'Confirmar'}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* Lista */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-1 w-5 bg-slate-900 rounded-full" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Histórico</h3>
          </div>
          <Badge variant="outline" className="text-[9px] font-semibold tracking-wider uppercase rounded-full border-slate-200 text-slate-400 px-3 py-1">
            {solicitacoes?.length || 0}
          </Badge>
        </div>
        
        <AnimatePresence mode="popLayout">
          {solicitacoes && solicitacoes.length > 0 ? (
            <div className="space-y-3">
              {solicitacoes.map((sol: any, idx: number) => {
                const config = statusConfig[sol.status] || statusConfig.pendente
                const Icon = DOCUMENT_TYPE_ICONS[sol.documento_tipo] || FileText
                return (
                  <motion.div key={sol.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }} className="group">
                    <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl overflow-hidden active:scale-[0.98] transition-transform">
                      <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", config.bg)}>
                            <Icon className={cn("h-5 w-5", config.color)} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-800 truncate">
                              {templates.find((t: any) => t.id === sol.documento_tipo)?.titulo || sol.documento_tipo?.replace(/_/g, ' ')}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge className={cn("text-[8px] font-semibold uppercase px-2 py-0.5 rounded-full border-0", config.bg, config.color)}>
                                {config.label}
                              </Badge>
                              <span className="text-[10px] text-slate-300">{new Date(sol.created_at).toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>
                        </div>
                        {sol.status === 'pronto' ? (
                          <div className="w-9 h-9 rounded-full bg-teal-500 text-white flex items-center justify-center shrink-0">
                            <Download size={16} />
                          </div>
                        ) : (
                          <ChevronRight size={16} className="text-slate-200 shrink-0" />
                        )}
                      </CardContent>
                      {sol.observacoes && (
                        <div className="bg-slate-50 px-4 py-2 border-t border-slate-100">
                          <p className="text-[10px] text-slate-400 italic truncate">"{sol.observacoes}"</p>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-50 p-10 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-4">
              <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-slate-200">
                <FileText size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800">Sem documentos</h3>
                <p className="text-sm text-slate-400">Nenhuma solicitação registrada.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white flex items-start gap-3 shadow-lg">
        <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-teal-400 shrink-0">
          <Calendar size={16} />
        </div>
        <div>
          <h4 className="text-[10px] font-semibold text-teal-400 uppercase tracking-wider mb-1">Prazos</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Documentos digitais ficam disponíveis para download após aprovação. Documentos físicos: aguarde notificação.
          </p>
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <Button variant="ghost" onClick={() => { vibrate(10); window.history.back(); }}
          className="text-slate-400 font-semibold uppercase text-[10px] tracking-widest hover:text-teal-600 h-11 px-6 rounded-full">
          Voltar ao Início
        </Button>
      </div>
    </div>
  )
}
