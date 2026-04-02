import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import {
  FileText,
  Download,
  Printer,
  X,
  Building2,
  User,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Percent,
  QrCode,
  Copy,
  Share2,
  GraduationCap,
  TrendingDown,
  Info,
  Mail,
  Smartphone,
  MapPin,
  Key
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface InvoiceDetailProps {
  open: boolean
  onClose: () => void
  cobranca: any
  escola: any
  aluno: any
  responsavel: any
  configPix: any
  calcularValorCobranca: (c: any) => number
  onPagar?: () => void
}

const vibrate = (ms: number | number[] = 20) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(ms);
  }
}

export function InvoiceDetail({
  open,
  onClose,
  cobranca,
  escola,
  aluno,
  responsavel,
  configPix,
  calcularValorCobranca,
  onPagar
}: InvoiceDetailProps) {
  const [copiado, setCopiado] = useState(false)

  if (!open || !cobranca) return null

  const valorOriginal = Number(cobranca.valor)
  const valorAtualizado = valorOriginal // Desativado cálculo automático
  const diferenca = 0
  const dataVencimento = new Date(cobranca.data_vencimento + 'T12:00:00')
  const hoje = new Date()
  const diasAtraso = Math.floor((hoje.getTime() - dataVencimento.getTime()) / (1000 * 60 * 60 * 24))
  const carencia = configPix?.dias_carencia || 0

  // Determina status
  const getStatusInfo = () => {
    if (cobranca.status === 'pago') {
      return { label: 'Paga', color: 'bg-emerald-500', icon: CheckCircle2 }
    }
    if (diasAtraso > carencia) {
      return { label: 'Atrasada', color: 'bg-red-500', icon: AlertCircle }
    }
    if (diasAtraso > 0) {
      return { label: 'Vencida', color: 'bg-orange-500', icon: AlertCircle }
    }
    return { label: 'A Vencer', color: 'bg-amber-500', icon: Calendar }
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon

  // Número da fatura (hash curto)
  const invoiceNumber = `FAT-${cobranca.id.split('-')[0].toUpperCase()}`

  const handlePrint = () => {
    vibrate(30)
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Fatura ${invoiceNumber} - ${escola?.razao_social || 'Escola'}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                .no-print { display: none; }
                body { padding: 0; margin: 0; }
                .print-container { padding: 40px; }
              }
              @page { margin: 10mm; }
            </style>
          </head>
          <body>
            <div class="print-container">
              <div class="max-w-5xl mx-auto bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <!-- Header -->
                <div class="bg-gradient-to-r from-indigo-600 to-blue-700 p-8 text-white">
                  <div class="flex justify-between items-start">
                    <div>
                      <h1 class="text-2xl font-bold mb-1">${escola?.razao_social || '---'}</h1>
                      <p class="text-sm text-indigo-100">CNPJ: ${escola?.cnpj || '---'}</p>
                      <p class="text-xs text-indigo-200 mt-1">${escola?.logradouro || ''}, ${escola?.numero || ''} - ${escola?.bairro || ''}</p>
                      <p class="text-xs text-indigo-200">${escola?.cidade || ''}/${escola?.estado || ''} • CEP: ${escola?.cep || ''}</p>
                      <div class="flex items-center gap-3 mt-2 text-xs text-indigo-200">
                        ${escola?.email_gestor ? `<span class="flex items-center gap-1">📧 ${escola.email_gestor}</span>` : ''}
                        ${escola?.telefone ? `<span class="flex items-center gap-1">📱 ${escola.telefone}</span>` : ''}
                      </div>
                    </div>
                    <div class="text-right">
                      <h2 class="text-lg font-bold">FATURA</h2>
                      <p class="text-indigo-100">${invoiceNumber}</p>
                      <p class="text-xs text-indigo-200 mt-2">Vencimento: ${formatDate(cobranca.data_vencimento)}</p>
                    </div>
                  </div>
                </div>

                <!-- Corpo da Fatura -->
                <div class="p-6">
                  <h3 class="text-sm font-bold text-slate-700 mb-4">Detalhamento</h3>
                  <div class="space-y-3">
                    <div class="flex justify-between items-center py-2 border-b border-slate-100">
                      <div>
                        <p class="font-semibold text-slate-800">${cobranca.descricao}</p>
                        <p class="text-xs text-slate-400">${cobranca.tipo_cobranca === 'mensalidade' ? 'Mensalidade Escolar' : 'Cobrança Avulsa'} • ${cobranca.ano_letivo || '2026'}</p>
                      </div>
                      <p class="font-bold text-slate-800">${formatCurrency(valorOriginal)}</p>
                    </div>
                    {/* Encargos removidos (Cálculo Manual) */}
                  </div>
                  <div class="flex justify-between items-center bg-slate-50 p-4 rounded-xl mt-4">
                    <div>
                      <p class="text-xs text-slate-500 uppercase tracking-wider">Valor Total</p>
                      <p class="text-2xl font-bold text-slate-800">${formatCurrency(valorAtualizado)}</p>
                    </div>
                    <Badge class="${statusInfo.color} text-white">${statusInfo.label}</Badge>
                  </div>
                </div>
              </div>
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  const handleCompartilhar = () => {
    vibrate(30)
    const texto = `
📄 *Fatura ${invoiceNumber}*
${escola?.razao_social}

💰 Valor: ${formatCurrency(valorAtualizado)}
📅 Vencimento: ${formatDate(cobranca.data_vencimento)}
👤 Aluno: ${aluno?.nome_completo}

${cobranca.status === 'pago' ? '✅ Pago' : statusInfo.label}
    `.trim()

    navigator.clipboard.writeText(texto)
    toast.success('Fatura copiada para compartilhar!')
  }

  const handleCopiarChave = () => {
    vibrate(40)
    if (configPix?.chave_pix) {
      navigator.clipboard.writeText(configPix.chave_pix)
      setCopiado(true)
      toast.success('Chave PIX copiada!')
      setTimeout(() => setCopiado(false), 2000)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
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
            className="relative bg-white w-full max-w-6xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header Gradient */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-700 p-6 md:p-8 text-white relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 opacity-10 -mr-8 -mt-8 pointer-events-none">
                <CreditCard size={150} />
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-indigo-200" />
                    <h2 className="text-xl md:text-2xl font-bold">{escola?.razao_social || 'Escola'}</h2>
                  </div>
                  <p className="text-xs md:text-sm text-indigo-100 flex items-center gap-1">
                    <span className="font-semibold">CNPJ:</span> {escola?.cnpj || '---'}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] md:text-xs text-indigo-200">
                    {escola?.logradouro && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {escola.logradouro}, {escola.numero} - {escola.bairro}
                      </span>
                    )}
                    {escola?.cidade && (
                      <span>{escola.cidade}/{escola.estado} • {escola.cep}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] md:text-xs text-indigo-200">
                    {escola?.email_gestor && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {escola.email_gestor}
                      </span>
                    )}
                    {escola?.telefone && (
                      <span className="flex items-center gap-1">
                        <Smartphone className="h-3 w-3" />
                        {escola.telefone}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right space-y-1 shrink-0">
                  <div className="flex items-center gap-2 justify-end">
                    <FileText className="h-5 w-5 text-indigo-200" />
                    <div>
                      <p className="text-xs text-indigo-200 uppercase tracking-wider">Fatura</p>
                      <p className="text-lg font-bold">{invoiceNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <Calendar className="h-3.5 w-3.5 text-indigo-300" />
                    <p className="text-xs text-indigo-100">{formatDate(cobranca.data_vencimento)}</p>
                  </div>
                  <Badge className={cn("text-white text-[10px] font-bold px-2.5 py-1", statusInfo.color)}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusInfo.label}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Main Content - Two Columns */}
            <div className="flex-1 overflow-y-auto bg-slate-50/50">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                
                {/* Coluna Esquerda: Dados e Detalhamento (2/3) */}
                <div className="lg:col-span-2 p-6 border-r border-slate-100">
                  
                  {/* Dados do Responsável */}
                  <div className="mb-6">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-teal-500" />
                      Dados do Responsável
                    </h3>
                    <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[9px] text-slate-400 uppercase tracking-wider">Nome</p>
                          <p className="text-sm font-bold text-slate-800">{responsavel?.nome || '---'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] text-slate-400 uppercase tracking-wider">CPF</p>
                          <p className="text-sm font-bold text-slate-800">{responsavel?.cpf || '---'}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider">E-mail</p>
                        <p className="text-sm font-bold text-slate-800">{responsavel?.email || '---'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Dados do Aluno */}
                  <div className="mb-6">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <GraduationCap className="h-3.5 w-3.5 text-teal-500" />
                      Dados do Aluno
                    </h3>
                    <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 space-y-2">
                      <p className="text-sm font-bold text-slate-800">{aluno?.nome_completo || '---'}</p>
                      {aluno?.data_nascimento && (
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Nascimento: {formatDate(aluno.data_nascimento)}
                          </span>
                        </div>
                      )}
                      {aluno?.cpf && (
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            CPF: {aluno.cpf}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Detalhamento da Cobrança */}
                  <div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <CreditCard className="h-3.5 w-3.5 text-indigo-500" />
                      Detalhamento da Cobrança
                    </h3>

                    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                      {/* Item Principal */}
                      <div className="p-4 border-b border-slate-100">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-800">{cobranca.descricao}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {cobranca.tipo_cobranca === 'mensalidade' ? '📚 Mensalidade Escolar' : '💳 Cobrança Avulsa'} • 
                              Referência: {cobranca.ano_letivo || '2026'}
                            </p>
                          </div>
                          <p className="text-base font-bold text-slate-800">{formatCurrency(valorOriginal)}</p>
                        </div>
                      </div>

                      {/* Encargos (se houver) */}
                      {/* Encargos Removidos (Escola calcula na mão) */}

                      {/* Desconto (se houver) */}
                      {configPix?.desconto_pontualidade && diferenca === 0 && cobranca.status !== 'pago' && (
                        <div className="p-4 border-b border-slate-100 bg-emerald-50">
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                              <TrendingDown className="h-4 w-4" />
                              Desconto Pontualidade
                            </p>
                            <p className="text-sm font-bold text-emerald-700">
                              -{formatCurrency(valorOriginal * (configPix.desconto_pontualidade / 100))}
                            </p>
                          </div>
                          <p className="text-[10px] text-emerald-600 mt-1">
                            {configPix.desconto_pontualidade}% de desconto para pagamento até o vencimento
                          </p>
                        </div>
                      )}

                      {/* Total */}
                      <div className="p-5 bg-slate-50">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Valor Total</p>
                            <p className="text-2xl font-bold text-slate-800 mt-0.5">{formatCurrency(valorAtualizado)}</p>
                          </div>
                          <Badge className={cn("text-white text-[10px] font-bold px-3 py-1.5 h-auto", statusInfo.color)}>
                            <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Instruções Gerais */}
                  {/* Instruções Removidas */}
                </div>

                {/* Coluna Direita: Pagamento PIX (1/3) */}
                <div className="lg:col-span-1 p-6 bg-gradient-to-b from-indigo-50 to-blue-50">
                  <h3 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <QrCode className="h-3.5 w-3.5" />
                    Pagamento PIX
                  </h3>

                  {configPix?.pix_habilitado ? (
                    <div className="space-y-4">
                      {/* QR Code */}
                      <div className="bg-white rounded-2xl p-4 border border-indigo-100 shadow-sm">
                        {configPix.qr_code_url ? (
                          <div className="aspect-square bg-white rounded-xl p-2 mb-3">
                            <img 
                              src={configPix.qr_code_url} 
                              alt="QR Code PIX" 
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="aspect-square bg-slate-50 rounded-xl flex items-center justify-center mb-3">
                            <QrCode className="h-16 w-16 text-slate-200" />
                          </div>
                        )}
                        <p className="text-[10px] text-center text-slate-400">Escaneie para pagar</p>
                      </div>

                      {/* Chave PIX */}
                      <div className="bg-white rounded-xl p-4 border border-indigo-100 space-y-3">
                        <div>
                          <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-1">Chave PIX</p>
                          <div className="flex items-center gap-2">
                            <Key className="h-4 w-4 text-indigo-400" />
                            <p className="text-sm font-bold text-slate-800 break-all">{configPix.chave_pix || '---'}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopiarChave}
                          className="w-full h-10 rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                        >
                          {copiado ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              Copiar Chave
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Favorecido */}
                      <div className="bg-white rounded-xl p-4 border border-indigo-100 space-y-2">
                        <div>
                          <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-1">Favorecido</p>
                          <p className="text-sm font-bold text-slate-800">{configPix.nome_favorecido || escola?.razao_social || '---'}</p>
                        </div>
                        {configPix?.cpf_cnpj_favorecido && (
                          <div>
                            <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-1">CPF/CNPJ</p>
                            <p className="text-sm font-bold text-slate-800">{configPix.cpf_cnpj_favorecido}</p>
                          </div>
                        )}
                        {configPix?.banco_favorecido && (
                          <div>
                            <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-1">Banco</p>
                            <p className="text-sm font-bold text-slate-800">{configPix.banco_favorecido}</p>
                          </div>
                        )}
                      </div>

                      {/* Instruções Extras */}
                      {configPix?.instrucoes_extras && (
                        <div className="bg-white/50 rounded-xl p-3 border border-indigo-100">
                          <p className="text-xs text-indigo-700">{configPix.instrucoes_extras}</p>
                        </div>
                      )}

                      {/* Botão Pagar */}
                      {cobranca.status !== 'pago' && (
                        <Button
                          className="w-full h-14 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-700 font-bold text-base shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all"
                          onClick={() => {
                            vibrate(40)
                            onClose()
                            onPagar?.()
                          }}
                        >
                          <QrCode className="h-5 w-5 mr-2" />
                          Pagar via PIX Agora
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="p-10 text-center space-y-3 bg-red-50 rounded-2xl border-2 border-dashed border-red-200">
                      <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
                      <div className="space-y-1">
                        <h4 className="text-base font-bold text-red-900">PIX Não Disponível</h4>
                        <p className="text-xs text-red-800/80">A escola não configurou o pagamento via PIX.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions Modificada: Removido Imprimir e Baixar Recibo */}
            <div className="p-4 md:p-6 bg-white border-t border-slate-100 shrink-0">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCompartilhar}
                  className="flex-1 h-12 rounded-xl border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all font-semibold text-sm"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </Button>
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="h-12 w-12 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// Ícones auxiliares
function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  )
}
