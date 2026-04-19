import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, CheckCircle2, Loader2, Download, Printer } from 'lucide-react'
import DOMPurify from 'dompurify'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { portalService } from '../service'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ModalContratoEscolaProps {
  open: boolean
  onClose: () => void
  responsavel: any
  tenantId: string
  escolaNome?: string
  escolaCnpj?: string
  escolaEndereco?: string
  alunoNome?: string
}

export function ModalContratoEscola({ 
  open, 
  onClose, 
  responsavel, 
  tenantId,
  escolaNome = '[Nome da Escola]',
  escolaCnpj = '[CNPJ]',
  escolaEndereco = '[Endereço]',
  alunoNome = '[Nome do Aluno]'
}: ModalContratoEscolaProps) {
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [contratoHtml, setContratoHtml] = useState('')
  const [_escolaInfo, setEscolaInfo] = useState<any>(null)

  useEffect(() => {
    async function loadContrato() {
      if (!open || !tenantId) return
      
      try {
        setLoading(true)
        // Busca dados da escola primeiro
        const { data: school } = await supabase.from('escolas').select('*').eq('id', tenantId).maybeSingle()
        if (school) setEscolaInfo(school)

        const { data, error } = await supabase
          .from('config_financeira' as any)
          .select('contrato_modelo')
          .eq('tenant_id', tenantId)
          .maybeSingle() as any

        if (data?.contrato_modelo) {
          // Replace variables
          let html = data.contrato_modelo
          const replacements: Record<string, string> = {
            '{{escola_nome}}': school?.razao_social || escolaNome,
            '{{escola_cnpj}}': school?.cnpj || escolaCnpj,
            '{{escola_endereco}}': school ? `${school.logradouro}, ${school.numero} - ${school.bairro}` : escolaEndereco,
            '{{escola_email}}': school?.email_gestor || '',
            '{{escola_telefone}}': school?.telefone || '',
            '{{aluno_nome}}': alunoNome || '',
            '{{data_hoje}}': new Date().toLocaleDateString('pt-BR'),
            '{{cidade}}': school?.cidade || '',
            '{{estado}}': school?.estado || '',
          }

          Object.entries(replacements).forEach(([tag, value]) => {
            html = html.replace(new RegExp(tag, 'g'), value)
          })
          
          setContratoHtml(html)
        } else {
            setContratoHtml('<div class="p-20 text-center"><p class="text-slate-400 font-medium">O modelo de contrato ainda não foi configurado pela instituição.</p></div>')
        }
      } catch (err) {
        console.error('Erro ao carregar contrato:', err)
      } finally {
        setLoading(false)
      }
    }

    loadContrato()
  }, [open, tenantId])

  const handleAccept = async () => {
    setAccepting(true)
    try {
      await portalService.aceitarTermos(responsavel.id)
      toast.success('Contrato aceito com sucesso!')
      onClose()
    } catch (err) {
      console.error('Erro ao aceitar contrato:', err)
      toast.error('Erro ao registrar aceite.')
    } finally {
      setAccepting(false)
    }
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Contrato Escolar - ${escolaNome}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                .no-print { display: none; }
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            ${contratoHtml}
            <script>window.print();</script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50 relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 tracking-tight">Contrato da Escola</h3>
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Termos e Condições de Serviço</p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-xl h-10 border-slate-200">
                  <Printer className="mr-2 h-4 w-4" /> Imprimir
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-xl h-10 border-slate-200">
                  <Download className="mr-2 h-4 w-4" /> Baixar PDF
                </Button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-white scrollbar-thin scrollbar-thumb-slate-200">
              {loading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Carregando Instrumento Particular...</p>
                </div>
              ) : (
                <div 
                  className="contract-display font-serif text-zinc-800 leading-[1.4] text-sm md:text-base selection:bg-indigo-50"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contratoHtml) }}
                />
              )}

              <style dangerouslySetInnerHTML={{ __html: `
                .contract-display p { margin-bottom: 0.5em; }
                .contract-display h1 { font-size: 1.5em; font-weight: bold; margin-bottom: 0.8em; margin-top: 1em; line-height: 1.2; text-align: center; text-transform: uppercase; }
                .contract-display h2 { font-size: 1.25em; font-weight: bold; margin-bottom: 0.6em; margin-top: 0.8em; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.2em; }
                .contract-display h3 { font-size: 1.1em; font-weight: bold; margin-bottom: 0.4em; }
                .contract-display ul, .contract-display ol { margin-bottom: 1em; padding-left: 1.5em; }
                .contract-display table { width: 100%; border-collapse: collapse; margin-bottom: 1em; }
                .contract-display td, .contract-display th { border: 1px solid #e2e8f0; padding: 8px; }
              `}} />
            </div>

            {/* Footer / Accept */}
            {!responsavel.termos_aceitos && (
              <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-full border border-amber-100">
                  <CheckCircle2 size={14} className="animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Leia atentamente antes de prosseguir</span>
                </div>
                
                <Button 
                  onClick={handleAccept}
                  disabled={accepting || loading}
                  className="w-full md:w-auto h-14 md:px-20 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95"
                >
                  {accepting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                  ACEITAR E CONTINUAR
                </Button>
                
                <p className="text-[9px] text-slate-400 font-medium text-center max-w-sm">
                  Ao clicar em aceitar, você confirma que leu e concorda com todos os termos e condições apresentados neste contrato escolar.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
