"use client"

import React, { useState } from "react"
import { School, User, Check, X, AlertCircle, Clock, ArrowRight, MessageSquareQuote } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface CardAprovacaoTransferenciaProps {
  transferencia: {
    id: string
    aluno_nome: string
    escola_origem_nome: string
    escola_destino_nome: string | null
    escola_destino_nome_manual: string | null
    motivo_solicitacao: string
  }
}

export function CardAprovacaoTransferencia({
  transferencia
}: CardAprovacaoTransferenciaProps) {
  const [showRecusaForm, setShowRecusaForm] = useState(false)
  const [justificativa, setJustificativa] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isStatusConcluido, setIsStatusConcluido] = useState<'aprovado' | 'recusado' | null>(null)

  const escolaDestinoDisplay = transferencia.escola_destino_nome || transferencia.escola_destino_nome_manual || "Não informada"
  const isForaRede = !transferencia.escola_destino_nome && !!transferencia.escola_destino_nome_manual

  const handleAprovar = async () => {
    setIsProcessing(true)
    try {
      // Chamada via RPC conforme arquitetura V2 (Enterprise Security)
      const { error } = await supabase.rpc('aprovar_transferencia', { 
        p_transferencia_id: transferencia.id 
      })

      if (error) throw error

      setIsStatusConcluido('aprovado')
      toast.success("Transferência aprovada!", {
        description: "A escola de origem foi notificada para iniciar o desligamento."
      })
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Erro ao aprovar transferência")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRecusar = async () => {
    if (!justificativa) return
    setIsProcessing(true)
    try {
      const { error } = await supabase.rpc('recusar_transferencia', {
        p_transferencia_id: transferencia.id,
        p_justificativa: justificativa
      })

      if (error) throw error

      setIsStatusConcluido('recusado')
      toast.info("Transferência recusada")
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Erro ao recusar transferência")
    } finally {
      setIsProcessing(false)
    }
  }

  if (isStatusConcluido) {
    return (
      <Card className="overflow-hidden border-2 border-dashed bg-muted/20">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
            isStatusConcluido === 'aprovado' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          }`}>
            {isStatusConcluido === 'aprovado' ? <Check className="h-7 w-7" /> : <X className="h-7 w-7" />}
          </div>
          <h3 className="text-xl font-bold">
            {isStatusConcluido === 'aprovado' ? 'Transferência Validada' : 'Solicitação Cancelada'}
          </h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {isStatusConcluido === 'aprovado' 
              ? `A ciência da transferência de ${transferencia.aluno_nome} foi registrada. A escola de origem possui 30 dias para liberar a documentação.`
              : 'Você optou por não prosseguir com esta transferência. A escola de destino receberá sua justificativa.'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="relative overflow-hidden border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="absolute top-0 right-0 p-4">
        {isForaRede && (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            Fora da Rede
          </Badge>
        )}
      </div>

      <CardHeader className="bg-blue-50/50 border-b">
        <CardTitle className="flex items-center gap-2 text-md">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          Aprovação de Transferência Pendente
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-5 pt-6">
        {/* Aluno */}
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Aluno</p>
            <p className="text-lg font-bold">{transferencia.aluno_nome}</p>
          </div>
        </div>

        {/* Fluxo de Escolas */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl border bg-muted/20 p-4">
          <div className="text-center sm:text-left">
            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Origem (Atual)</p>
            <p className="text-sm font-bold truncate">{transferencia.escola_origem_nome}</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground/40" />
          <div className="text-center sm:text-right">
            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Novo Destino</p>
            <p className="text-sm font-bold text-blue-700 truncate">{escolaDestinoDisplay}</p>
          </div>
        </div>

        {/* Motivo */}
        <div className="flex gap-3 rounded-lg border-l-4 border-l-blue-400 bg-muted/40 p-3 italic">
          <MessageSquareQuote className="h-5 w-5 text-blue-400 shrink-0" />
          <p className="text-sm text-muted-foreground line-clamp-2">
            "{transferencia.motivo_solicitacao}"
          </p>
        </div>

        {/* SLA ALERT */}
        <Alert className="border-amber-200 bg-amber-50/50 py-3">
          <Clock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-[11px] leading-tight text-amber-800">
            <strong>PRAZO LEGAL:</strong> Ao clicar em aprovar, você declara ciência da transferência. A escola atual tem <strong>30 dias úteis</strong> por lei para processar a documentação final.
          </AlertDescription>
        </Alert>

        <AnimatePresence>
          {showRecusaForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 pt-2"
            >
              <Label className="text-xs font-bold text-red-600">JUSTIFICATIVA OBRIGATÓRIA DA RECUSA</Label>
              <Textarea 
                placeholder="Informe o motivo para a escola de destino..."
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                className="border-red-200 focus:ring-red-100"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>

      <CardFooter className="flex gap-3 bg-muted/10 border-t p-4">
        {!showRecusaForm ? (
          <>
            <Button 
              variant="outline" 
              className="flex-1 hover:bg-red-50 hover:text-red-600 text-muted-foreground"
              onClick={() => setShowRecusaForm(true)}
              disabled={isProcessing}
            >
              Recusar
            </Button>
            <Button 
              className="flex-[2] bg-green-600 hover:bg-green-700 text-white font-bold"
              onClick={handleAprovar}
              disabled={isProcessing}
            >
              {isProcessing ? "Validando..." : "APROVAR TRANSFERÊNCIA"}
            </Button>
          </>
        ) : (
          <>
            <Button 
              variant="ghost" 
              className="flex-1"
              onClick={() => { setShowRecusaForm(false); setJustificativa(""); }}
              disabled={isProcessing}
            >
              Voltar
            </Button>
            <Button 
              variant="destructive"
              className="flex-[2] font-bold"
              onClick={handleRecusar}
              disabled={isProcessing || !justificativa}
            >
              CONFIRMAR RECUSA
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
