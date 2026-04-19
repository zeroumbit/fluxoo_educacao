import React, { useState } from "react"
import { 
  PartyPopper, 
  ChevronDown, 
  HelpCircle, 
  Download, 
  CheckCircle2,
  Wallet,
  Calendar,
  Info
} from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { portalService } from "../service"
import { toast } from "sonner"

interface WelcomeNotifData {
  nome_responsavel: string
  nome_aluno: string
  valor_matricula: number
  dias_proporcionais: number
  valor_proporcional: number
  periodo_pro_rata: string
  valor_mensalidade_integral: number
}

interface WelcomeAnnouncementCardProps {
  notification: {
    id: string
    titulo: string
    conteudo_json: WelcomeNotifData
    lida: boolean
  }
  whatsappNumber?: string
}

export const WelcomeAnnouncementCard: React.FC<WelcomeAnnouncementCardProps> = ({ 
  notification,
  whatsappNumber 
}) => {
  const [isLida, setIsLida] = useState(notification.lida)
  const data = notification.conteudo_json

  const handleExpand = async (value: string) => {
    if (value === "item-1" && !isLida) {
      try {
        await portalService.marcarNotificacaoFamiliaLida(notification.id)
        setIsLida(true)
      } catch (error) {
        console.error("Erro ao marcar como lida:", error)
      }
    }
  }

  const openWhatsApp = () => {
    if (!whatsappNumber) {
      toast.error("Número de suporte não configurado.")
      return
    }
    const message = encodeURIComponent(`Olá, sou ${data.nome_responsavel}. Tenho dúvidas sobre o informativo financeiro do aluno(a) ${data.nome_aluno}.`)
    window.open(`https://wa.me/${whatsappNumber.replace(/\D/g, "")}/?text=${message}`, "_blank")
  }

  return (
    <div className={cn(
      "w-full overflow-hidden transition-all duration-500",
      "rounded-[32px] border border-indigo-100/50 shadow-xl shadow-indigo-100/20",
      "bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/50",
      "animate-in fade-in slide-in-from-top-4"
    )}>
      <Accordion type="single" collapsible className="w-full" onValueChange={handleExpand}>
        <AccordionItem value="item-1" className="border-none">
          {/* HEADER - ESTADO FECHADO */}
          <div className="flex items-center justify-between p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200">
                <PartyPopper className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-indigo-950 md:text-2xl">
                  {notification.titulo}
                </h3>
                <p className="mt-1 text-sm text-indigo-600/80 md:text-base">
                  Matrícula confirmada para <span className="font-semibold">{data.nome_aluno}</span>
                </p>
                {!isLida && (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                    Novo
                  </span>
                )}
              </div>
            </div>
            <AccordionTrigger className="hover:no-underline [&[data-state=open]>svg]:rotate-180">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/50 border border-indigo-100 shadow-sm transition-transform duration-300">
                <ChevronDown className="h-5 w-5 text-indigo-600" />
              </div>
            </AccordionTrigger>
          </div>

          {/* CONTEÚDO - ESTADO EXPANDIDO */}
          <AccordionContent className="px-6 pb-8 md:px-8">
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
              {/* Mensagem de Boas-vindas */}
              <div className="rounded-3xl bg-white/60 p-6 border border-white/50 backdrop-blur-sm">
                <p className="text-indigo-900 leading-relaxed text-lg">
                  Olá, <span className="font-bold">{data.nome_responsavel}</span>! É um prazer ter vocês conosco neste ano letivo.
                  Preparamos este resumo para garantir total transparência sobre a sua contratação e as mensalidades parciais do mês de ingresso.
                </p>
              </div>

              {/* Detalhamento Financeiro */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Card Mensalidade Integral */}
                <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <span className="font-semibold text-indigo-950 uppercase tracking-wider text-xs">Mensalidade Integral</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-indigo-950">{formatCurrency(data.valor_mensalidade_integral)}</span>
                    <span className="text-sm text-indigo-600">/mês</span>
                  </div>
                </div>

                {/* Card Taxa de Matrícula */}
                <div className="relative overflow-hidden rounded-3xl border border-green-100 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-green-50 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <span className="font-semibold text-green-950 uppercase tracking-wider text-xs">Taxa de Matrícula</span>
                  </div>
                  <div className="text-3xl font-bold text-green-950">{formatCurrency(data.valor_matricula)}</div>
                </div>

                {/* Card Pro-Rata (Destaque) */}
                <div className="md:col-span-2 relative overflow-hidden rounded-3xl border-2 border-indigo-200 bg-indigo-600 p-8 text-white shadow-xl">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-white/20">
                          <Info className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold">Resumo do Primeiro Mês (Proporcional)</h4>
                          <p className="text-indigo-100 text-sm">{data.periodo_pro_rata}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-indigo-50 text-base">
                          Cálculo baseado em <span className="font-bold underline underline-offset-4">{data.dias_proporcionais} dias</span> restantes no mês.
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-indigo-200 font-medium text-sm mb-1">Valor do Pro-Rata</p>
                      <div className="text-4xl font-black">{formatCurrency(data.valor_proporcional)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-indigo-100">
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto rounded-2xl h-12 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 transition-colors"
                  onClick={() => window.open(`/api/matricula/comprovante/${notification.id}`, "_blank")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Comprovante de Matrícula (PDF)
                </Button>
                <Button 
                  className="w-full sm:w-auto rounded-2xl h-12 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                  onClick={openWhatsApp}
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Dúvidas? Fale com o suporte
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
