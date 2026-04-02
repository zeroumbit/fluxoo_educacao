import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Plus,
  CheckCircle2,
  Clock,
  Package,
  XCircle,
  AlertCircle,
  Send,
  Download,
  Eye,
  Loader2,
  ChevronRight,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePortalContext } from '../../context'
import {
  useSolicitacoesDocumento,
  useCriarSolicitacaoDocumento,
  useResponsavel,
  useTemplatesDocumento
} from '../../hooks'
import { NativeHeader } from '../components/NativeHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const DOCUMENT_TYPE_ICONS: Record<string, any> = {
  ficha_matricula: FileText,
  ficha_individual: FileText,
  declaracao_matricula: FileText,
  historico: FileText,
  transferencia: Send,
  desistencia: XCircle,
  saida_antecipada: AlertCircle,
  termo_imagem: FileText,
  ficha_saude: AlertCircle,
  termo_material: Package,
  personalizado: FileText,
  contrato: Send,
}

const statusConfig: Record<string, { label: string, color: string, icon: any, bg: string, border: string }> = {
  pendente: { label: 'Pendente', color: 'text-amber-600', icon: Clock, bg: 'bg-amber-50', border: 'border-amber-100' },
  em_analise: { label: 'Em Análise', color: 'text-blue-600', icon: AlertCircle, bg: 'bg-blue-50', border: 'border-blue-100' },
  pronto: { label: 'Pronto', color: 'text-emerald-600', icon: CheckCircle2, bg: 'bg-emerald-50', border: 'border-emerald-100' },
  entregue: { label: 'Entregue', color: 'text-violet-600', icon: Package, bg: 'bg-violet-50', border: 'border-violet-100' },
  recusado: { label: 'Recusado', color: 'text-red-600', icon: XCircle, bg: 'bg-red-50', border: 'border-red-100' },
}

export function PortalDocumentosPageV2Mobile() {
  const { alunoSelecionado, tenantId } = usePortalContext()
  const { data: responsavel } = useResponsavel()
  const { data: solicitacoes, isLoading: loadingSolicitacoes } = useSolicitacoesDocumento()
  const { data: templates = [], isLoading: loadingTemplates } = useTemplatesDocumento()
  const criarSolicitacao = useCriarSolicitacaoDocumento()

  const [openRequestSheet, setOpenRequestSheet] = useState(false)
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null)
  const [observacoes, setObservacoes] = useState('')
  const [enviarPeloAluno, setEnviarPeloAluno] = useState(false)

  const isLoading = loadingSolicitacoes || loadingTemplates

  // Standard document types
  const standardDocTypes = [
    { id: 'ficha_matricula', titulo: 'Ficha de Matrícula', tipo: 'ficha_matricula' },
    { id: 'ficha_individual', titulo: 'Ficha Individual', tipo: 'ficha_individual' },
    { id: 'declaracao_matricula', titulo: 'Declaração de Matrícula', tipo: 'declaracao_matricula' },
    { id: 'historico', titulo: 'Histórico Escolar', tipo: 'historico' },
    { id: 'transferencia', titulo: 'Transferência', tipo: 'transferencia' },
  ]

  const allDocTypes = [
    ...standardDocTypes,
    ...templates.filter((tpl: any) => !standardDocTypes.find((std: any) => std.tipo === tpl.tipo))
  ]

  const handleSolicitar = async () => {
    if (!alunoSelecionado || !responsavel || !tenantId || !selectedDocType) {
      toast.error('Selecione um documento.')
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
      toast.success('Solicitação enviada!')
      setOpenRequestSheet(false)
      setSelectedDocType(null)
      setObservacoes('')
      setEnviarPeloAluno(false)
    } catch (error) {
      toast.error('Erro ao solicitar documento.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen">
        <NativeHeader title="Documentos" />
        <div className="flex-1 flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50/50 overflow-hidden">
      <NativeHeader title="Documentos" />

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Banner CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-[24px] p-6 text-white shadow-lg shadow-teal-900/10 relative overflow-hidden"
        >
          <div className="relative z-10 flex flex-col gap-1">
            <h2 className="text-[20px] font-bold leading-tight">Precisa de algum documento?</h2>
            <p className="text-[14px] text-teal-50/80 mb-4">Solicite agora via App sem custos e acompanhe o status.</p>
            <Button
              onClick={() => setOpenRequestSheet(true)}
              className="bg-white text-teal-700 hover:bg-teal-50 w-fit rounded-full px-6 font-bold text-[13px] h-11 active:scale-95 transition-transform"
            >
              Nova Solicitação
            </Button>
          </div>
          <FileText className="absolute -right-4 -bottom-6 w-32 h-32 text-white/10 rotate-12" />
        </motion.div>

        {/* Histórico Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[17px] font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" />
              Solicitações Recentes
            </h3>
          </div>

          {!solicitacoes || solicitacoes.length === 0 ? (
            <div className="bg-white rounded-[24px] border border-slate-100 p-8 flex flex-col items-center text-center gap-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                <FileText className="w-8 h-8 text-slate-300" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-slate-700">Tudo em dia!</p>
                <p className="text-[13px] text-slate-400">Você não possui solicitações pendentes no momento.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {solicitacoes.map((sol: any, idx: number) => {
                const config = statusConfig[sol.status] || statusConfig.pendente
                const DocIcon = DOCUMENT_TYPE_ICONS[sol.documento_tipo] || FileText
                return (
                  <motion.div
                    key={sol.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm flex items-start gap-4 active:scale-[0.98] transition-transform"
                  >
                    <div className={cn("w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center", config.bg)}>
                      <DocIcon className={cn("w-6 h-6", config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-[14px] font-bold text-slate-900 truncate">
                          {templates.find((tpl: any) => tpl.id === sol.documento_tipo)?.titulo || sol.documento_tipo}
                        </h4>
                        <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                          {new Date(sol.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={cn("text-[8px] uppercase font-black px-2 py-0.5 border-0 shadow-none", config.bg, config.color)}>
                          {config.label}
                        </Badge>
                        {sol.observacoes && (
                          <span className="text-[11px] text-slate-400 italic truncate flex-1">
                            {sol.observacoes}
                          </span>
                        )}
                      </div>
                      
                      {sol.status === 'pronto' && (
                        <div className="flex gap-2 mt-4">
                           <Button size="sm" variant="outline" className="flex-1 h-9 rounded-xl text-teal-600 border-teal-100 bg-teal-50 font-bold text-[11px] gap-2 active:bg-teal-100">
                             <Eye size={14} /> Visualizar
                           </Button>
                           <Button size="sm" variant="outline" className="flex-1 h-9 rounded-xl text-slate-600 border-slate-200 bg-slate-50 font-bold text-[11px] gap-2 active:bg-slate-100">
                             <Download size={14} /> Baixar
                           </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </section>

        {/* Informative Tip */}
        <section className="bg-amber-50 border border-amber-100 rounded-[20px] p-4 flex gap-3">
          <Info className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-[12px] text-amber-800 leading-snug">
            Alguns documentos como **Histórico Escolar** podem levar até 5 dias úteis para serem processados pela secretaria.
          </p>
        </section>
      </main>

      {/* Nova Solicitação Sheet */}
      <Sheet open={openRequestSheet} onOpenChange={setOpenRequestSheet}>
        <SheetContent side="bottom" className="h-[92vh] rounded-t-[32px] p-0 overflow-hidden border-0 shadow-2xl flex flex-col">
          <div className="w-12 h-1 bg-slate-200 rounded-full absolute top-3 left-1/2 -translate-x-1/2 shrink-0" />

          <SheetHeader className="p-6 pt-4 text-left border-b border-slate-50 shrink-0">
            <SheetTitle className="text-[20px] font-bold text-slate-900 tracking-tight">Solicitar Documento</SheetTitle>
            <SheetDescription className="text-[14px]">Selecione o documento e finalize o pedido.</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-4">
              <Label className="text-[13px] font-bold text-slate-700 uppercase tracking-wide">Qual documento deseja?</Label>
              <div className="grid grid-cols-2 gap-3">
                {allDocTypes.map((doc: any) => {
                  const Icon = DOCUMENT_TYPE_ICONS[doc.tipo] || FileText
                  const isSelected = selectedDocType === doc.id
                  return (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDocType(doc.id)}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-[20px] border gap-3 transition-all active:scale-95 text-center",
                        isSelected
                          ? "bg-teal-50 border-teal-500 shadow-[0_0_0_1px_rgba(20,184,166,1)]"
                          : "bg-white border-slate-100"
                      )}
                    >
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isSelected ? "bg-teal-500 text-white" : "bg-slate-50 text-slate-400")}>
                        <Icon size={20} />
                      </div>
                      <span className={cn("text-[11px] font-bold leading-tight", isSelected ? "text-teal-900" : "text-slate-600")}>
                        {doc.titulo}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-4">
              <Label htmlFor="observacoes" className="text-[13px] font-bold text-slate-700 uppercase tracking-wide">Observações (Opcional)</Label>
              <Textarea
                id="observacoes"
                placeholder="Algo específico que a escola deve saber?"
                className="rounded-2xl border-slate-200 p-4 focus:ring-teal-500 resize-none min-h-[100px]"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </div>

            <label className="flex items-start gap-3 p-4 bg-teal-50/50 border border-teal-100/50 rounded-2xl cursor-pointer active:bg-teal-100 transition-colors">
              <input
                type="checkbox"
                checked={enviarPeloAluno}
                onChange={(e) => setEnviarPeloAluno(e.target.checked)}
                className="mt-1 h-5 w-5 rounded-lg border-teal-300 text-teal-600 focus:ring-teal-500"
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-[14px] font-bold text-teal-900">Assinado pelo aluno</span>
                <span className="text-[12px] text-teal-700/70">Enviar impresso e assinado via agenda do aluno.</span>
              </div>
            </label>
          </div>

          <SheetFooter className="p-6 pt-4 border-t border-slate-50 bg-white shrink-0">
            <Button
              onClick={handleSolicitar}
              disabled={!selectedDocType || criarSolicitacao.isPending}
              className="w-full h-14 rounded-2xl bg-teal-600 hover:bg-teal-700 font-bold uppercase tracking-widest text-[12px] shadow-lg shadow-teal-200"
            >
              {criarSolicitacao.isPending
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : 'Confirmar Solicitação'
              }
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
