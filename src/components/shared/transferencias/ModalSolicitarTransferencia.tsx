"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Search, UserCheck, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { supabase } from "@/lib/supabase"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const solicitacaoSchema = z.object({
  codigoAluno: z.string()
    .length(8, "O ID deve conter exatamente 8 caracteres")
    .regex(/^[A-Z0-9]+$/, "Apenas letras maiúsculas e números"),
  verificacaoResponsavel: z.string().min(3, "Informe para dupla checagem"),
  motivo: z.string().min(10, "Mínimo 10 caracteres"),
})

// Função auxiliar para limpar CPF
const limparCPF = (cpf: string) => cpf.replace(/\D/g, '')

type SolicitacaoFormValues = z.infer<typeof solicitacaoSchema>

interface ModalSolicitarTransferenciaProps {
  isOpen: boolean
  onClose: () => void
}

export function ModalSolicitarTransferencia({
  isOpen,
  onClose,
}: ModalSolicitarTransferenciaProps) {
  const [isSuccess, setIsSuccess] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  const form = useForm<SolicitacaoFormValues>({
    resolver: zodResolver(solicitacaoSchema),
    defaultValues: {
      codigoAluno: "",
      verificacaoResponsavel: "",
      motivo: "",
    },
  })

  const [alunoData, setAlunoData] = useState<any>(null)
  const [responsavelEncontrado, setResponsavelEncontrado] = useState<any>(null)
  const [cpfErro, setCpfErro] = useState<string | null>(null)

  // Observa mudanças nos campos para conferência em tempo real
  const codigoValue = form.watch("codigoAluno")
  const verificacaoValue = form.watch("verificacaoResponsavel")

  // Busca o aluno e seus responsáveis quando o código de 8 dígitos é preenchido
  React.useEffect(() => {
    if (codigoValue?.length === 8) {
      const buscarAlunoEresponsaveis = async () => {
        setIsSearching(true)
        try {
          const { data, error } = await supabase
            .rpc('buscar_aluno_transferencia', { p_codigo: codigoValue.toUpperCase() })

          if (!error && data) {
            // A RPC retorna um array (SET OF), pegamos o primeiro
            const aluno = Array.isArray(data) ? data[0] : data
            // Remapeamos para manter compatibilidade com o resto do código
            setAlunoData({
              ...aluno,
              aluno_responsavel: aluno.responsaveis?.map((r: any) => ({ responsaveis: r }))
            })
          } else {
            setAlunoData(null)
          }
        } catch (err) {
          setAlunoData(null)
        } finally {
          setIsSearching(false)
        }
      }
      buscarAlunoEresponsaveis()
    } else {
      setAlunoData(null)
    }
  }, [codigoValue])

  // Valida o CPF/Documento contra os responsáveis vinculados ao aluno encontrado
  React.useEffect(() => {
    if (!alunoData) {
      setResponsavelEncontrado(null)
      setCpfErro(null)
      return
    }

    const docLimpo = limparCPF(verificacaoValue)
    
    // Se parece um CPF (11 dígitos) ou CNPJ (14 dígitos)
    if (docLimpo.length >= 11) {
      const respVinculado = alunoData.aluno_responsavel?.find((v: any) => 
        limparCPF(v.responsaveis?.cpf || '') === docLimpo
      )

      if (respVinculado) {
        setResponsavelEncontrado(respVinculado.responsaveis)
        setCpfErro(null)
      } else {
        setResponsavelEncontrado(null)
        setCpfErro("CPF não confere com ID do aluno informado.")
      }
    } else {
      setResponsavelEncontrado(null)
      setCpfErro(null)
    }
  }, [verificacaoValue, alunoData])

  const onSubmit = async (data: SolicitacaoFormValues) => {
    setIsSearching(true)
    try {
      // 1. Verificar se o ID existe
      if (!alunoData) {
        form.setError("codigoAluno", { 
          message: "ID de transferência não localizado. Verifique com a escola de origem." 
        })
        setIsSearching(false)
        return
      }

      if (!responsavelEncontrado && cpfErro) {
         form.setError("verificacaoResponsavel", {
            message: cpfErro
         })
         setIsSearching(false)
         return
      }

      // 2. Inserir solicitação (v2 com Destino Híbrido)
      const { error: insertError } = await supabase
        .from('transferencias_escolares')
        .insert({
          aluno_id: alunoData.id,
          escola_origem_id: alunoData.tenant_id,
          responsavel_id: responsavelEncontrado?.id || alunoData.aluno_responsavel?.[0]?.responsaveis?.id, // Usa o validado ou o primeiro
          motivo_solicitacao: data.motivo,
          status: 'pendente_pais'
        })

      if (insertError) throw insertError

      setIsSuccess(true)
      toast.success("Solicitação enviada!", {
        description: "O responsável será notificado para aprovação via app."
      })
    } catch (error) {
      console.error(error)
      toast.error("Erro ao processar solicitação. Tente novamente.")
    } finally {
      setIsSearching(false)
    }
  }

  const handleClose = () => {
    setIsSuccess(false)
    form.reset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Search className="h-5 w-5" />
            Solicitar Transferência
          </DialogTitle>
          <DialogDescription>
            Use o código alfanumérico fornecido pelo responsável/aluno.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="space-y-4 py-4">
            <Alert className="border-green-500 bg-green-50 text-green-700">
              <CheckCircle2 className="h-4 w-4 stroke-green-600" />
              <AlertTitle className="font-bold">Protocolo Iniciado</AlertTitle>
              <AlertDescription className="text-green-600">
                O responsável recebeu uma notificação push. A escola de origem terá 30 dias para liberação após a ciência do responsável.
              </AlertDescription>
            </Alert>
            <Button onClick={handleClose} className="w-full bg-green-600 hover:bg-green-700">
              Ok, entendi
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="codigoAluno"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID de Transferência (Máscara 8-char)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="ABC12345"
                          className="uppercase font-mono tracking-widest text-lg h-12"
                          maxLength={8}
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                        {isSearching ? (
                          <Loader2 className="absolute right-3 top-3.5 h-5 w-5 animate-spin text-muted-foreground" />
                        ) : (
                          <CheckCircle2 className={`absolute right-3 top-3.5 h-5 w-5 ${field.value?.length === 8 ? 'text-green-500' : 'text-muted-foreground/30'}`} />
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="verificacaoResponsavel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmação: Nome do Responsável ou CPF</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Digite o CPF para validar"
                          className={`h-11 ${responsavelEncontrado ? 'border-green-500 bg-green-50/30' : cpfErro ? 'border-rose-500 bg-rose-50/30' : ''}`}
                          {...field}
                        />
                        {responsavelEncontrado ? (
                          <UserCheck className="absolute right-3 top-3 h-5 w-5 text-green-600" />
                        ) : (
                          <UserCheck className="absolute right-3 top-3 h-5 w-5 text-muted-foreground/50" />
                        )}
                      </div>
                    </FormControl>
                    {responsavelEncontrado && (
                      <p className="text-xs font-bold text-green-600 mt-1.5 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Confere: {responsavelEncontrado.nome}
                      </p>
                    )}
                    {cpfErro && (
                      <p className="text-xs font-bold text-rose-600 mt-1.5 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {cpfErro}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="motivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo da Solicitação</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva brevemente o motivo"
                        className="min-h-[80px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={handleClose} disabled={isSearching}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSearching}>
                  {isSearching ? "Verificando..." : "Confirmar Solicitação"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
