"use client"

import React, { useState } from "react"
import { FileText, Download, Eye, Printer, Calendar, User, School, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

import { useAuth } from "@/modules/auth/AuthContext"
import { useEmitirHistorico, useListarHistoricosAluno } from "@/modules/academico/hooks/historicoDigital"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

interface EmitirHistoricoModalProps {
  isOpen: boolean
  onClose: () => void
  transferencia: {
    transferencia_id: string
    aluno_id: string
    aluno_nome: string
    escola_origem: string
    escola_destino: string
  } | null
  tenantId: string
}

export function EmitirHistoricoModal({
  isOpen,
  onClose,
  transferencia,
  tenantId
}: EmitirHistoricoModalProps) {
  const emitirHistorico = useEmitirHistorico()
  const { data: historicos, isLoading: isLoadingHistoricos } = useListarHistoricosAluno(
    transferencia?.aluno_id || '',
    tenantId
  )
  
  const [incluirDadosSaude, setIncluirDadosSaude] = useState(false)
  const [showConfirmacao, setShowConfirmacao] = useState(false)

  if (!transferencia) return null

  const handleEmitir = async () => {
    const result = await emitirHistorico.mutateAsync({
      alunoId: transferencia.aluno_id,
      tenantId: tenantId,
      transferenciaId: transferencia.transferencia_id,
      incluirDadosSaude
    })

    if (result.sucesso) {
      toast.success('Histórico emittedo com sucesso!', {
        description: `Hash: ${result.validation_hash.substring(0, 12)}...`
      })
      setShowConfirmacao(false)
      onClose()
    } else {
      toast.error('Erro ao emitir histórico', {
        description: result.message
      })
    }
  }

  const handleDownload = (url: string) => {
    window.open(url, '_blank')
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-indigo-700">
            <FileText className="h-5 w-5" />
            Emitir Histórico Escolar
          </DialogTitle>
          <DialogDescription>
            Gere o histórico escolar oficial para transferência do aluno
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-slate-50 rounded-xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <User className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">{transferencia.aluno_nome}</p>
                <p className="text-xs text-slate-500">Aluno</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <p className="text-[10px] font-bold uppercase text-amber-500">Escola Origem</p>
                <p className="text-xs font-semibold text-amber-800 truncate">{transferencia.escola_origem}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <p className="text-[10px] font-bold uppercase text-blue-500">Escola Destino</p>
                <p className="text-xs font-semibold text-blue-800 truncate">{transferencia.escola_destino}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm font-semibold text-slate-700 mb-3">Históricos Anteriores</p>
            
            {isLoadingHistoricos ? (
              <div className="space-y-2">
                <Skeleton className="h-16 rounded-lg" />
                <Skeleton className="h-16 rounded-lg" />
              </div>
            ) : historicos && historicos.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {historicos.map((h: any) => (
                  <div key={h.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <div>
                        <p className="text-xs font-medium text-slate-700">
                          {new Date(h.criado_em).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {h.validation_hash?.substring(0, 8)}...
                        </p>
                      </div>
                    </div>
                    {h.pdf_url && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDownload(h.pdf_url)}
                        className="h-7 text-indigo-600"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Baixar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-slate-400 text-sm">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                Nenhum histórico emitido anteriormente
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="incluirSaude" 
              checked={incluirDadosSaude}
              onCheckedChange={(checked) => setIncluirDadosSaude(checked as boolean)}
            />
            <Label htmlFor="incluirSaude" className="text-sm cursor-pointer">
              Incluir dados de saúde (alergias, NEE)
            </Label>
          </div>

          <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg">
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Atenção:</strong> O histórico será gerado com base nos dados acadêmicos 
              cadastrados no sistema (notas e frequência). Verifique se os dados estão atualizados 
              antes de emitir.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={() => setShowConfirmacao(true)}
            disabled={emitirHistorico.isPending}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {emitirHistorico.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Emitir Histórico
          </Button>
        </DialogFooter>

        <Dialog open={showConfirmacao} onOpenChange={setShowConfirmacao}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-amber-600 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Confirmar Emissão
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-slate-600">
              Tem certeza que deseja emitir o histórico escolar oficial para <strong>{transferencia.aluno_nome}</strong>?
              Esta ação será registrada para fins de auditoria.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmacao(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleEmitir}
                disabled={emitirHistorico.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {emitirHistorico.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}