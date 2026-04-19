"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { School, ArrowRight, Info, Building2 } from "lucide-react"
import { toast } from "sonner"

import { supabase } from "@/lib/supabase"
import { useAuth } from "@/modules/auth/AuthContext"
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
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Máscara de CNPJ: 00.000.000/0000-00
const maskCNPJ = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1")
}

const desligamentoSchema = z.object({
  escolaDestinoId: z.string().optional(),
  nomeEscolaManual: z.string().optional(),
  cnpjEscolaManual: z.string().optional(),
  isForaDoSistema: z.boolean().default(false),
  motivo: z.string().min(10, "Informe o motivo do desligamento"),
}).refine((data) => {
  if (data.isForaDoSistema) {
    return !!data.nomeEscolaManual && !!data.cnpjEscolaManual
  }
  return !!data.escolaDestinoId || !!data.nomeEscolaManual // Flexível para teste
}, {
  message: "Preencha os dados da escola de destino",
  path: ["nomeEscolaManual"]
})

type DesligamentoFormValues = z.infer<typeof desligamentoSchema>

interface ModalIniciarDesligamentoProps {
  isOpen: boolean
  onClose: () => void
  alunoId: string
  alunoNome: string
}

export function ModalIniciarDesligamento({
  isOpen,
  onClose,
  alunoId,
  alunoNome,
}: ModalIniciarDesligamentoProps) {
  const { authUser } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<DesligamentoFormValues>({
    resolver: zodResolver(desligamentoSchema),
    defaultValues: {
      escolaDestinoId: "",
      nomeEscolaManual: "",
      cnpjEscolaManual: "",
      isForaDoSistema: false,
      motivo: "",
    },
  })

  const isForaDoSistema = form.watch("isForaDoSistema")

  const onSubmit = async (data: DesligamentoFormValues) => {
    setIsSubmitting(true)
    try {
      const { error } = await (supabase
        .from('transferencias_escolares' as any) as any)
        .insert({
          aluno_id: alunoId,
          escola_origem_id: authUser?.tenantId,
          escola_destino_id: data.isForaDoSistema ? null : (data.escolaDestinoId || null),
          escola_destino_nome_manual: data.isForaDoSistema ? data.nomeEscolaManual : null,
          escola_destino_cnpj_manual: data.isForaDoSistema ? data.cnpjEscolaManual : null,
          responsavel_id: null, // será configurado após busca pelos responsáveis do aluno
          iniciado_por: 'origem',
          status: 'aguardando_responsavel',
          motivo_solicitacao: data.motivo,
        })

      if (error) throw error

      toast.success("Transferência iniciada!", {
        description: "O responsável será notificado para validar o processo."
      })
      form.reset()
      onClose()
    } catch (error) {
      console.error(error)
      toast.error("Erro ao iniciar transferência.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <School className="h-5 w-5" />
            Transferência de Saída
          </DialogTitle>
          <DialogDescription>
            Inicie a transferência de saída de <strong>{alunoNome}</strong>.
            Lembre-se: após a concordância do responsável, a escola possui a obrigação legal de liberar o aluno em até 30 dias.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-blue-900">Prazo de Documentação</p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Este processo notificará os pais para aprovação. Uma vez aprovado, sua escola terá <strong>30 dias</strong> para regularizar a documentação e confirmar a liberação definitiva.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between space-x-2 rounded-lg border p-3 bg-muted/30">
              <div className="flex flex-col space-y-0.5">
                <Label className="text-sm font-semibold">Escola Fora do Sistema</Label>
                <p className="text-xs text-muted-foreground">O destino não utiliza o Fluxoo EDU</p>
              </div>
              <FormField
                control={form.control}
                name="isForaDoSistema"
                render={({ field }) => (
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                )}
              />
            </div>

            {!isForaDoSistema ? (
              <FormField
                control={form.control}
                name="escolaDestinoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Buscar Escola de Destino</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Digite o nome ou CNPJ da escola..."
                          className="h-11 pl-10"
                          {...field}
                        />
                        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                <FormField
                  control={form.control}
                  name="nomeEscolaManual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Escola de Destino</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo da instituição" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cnpjEscolaManual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ da Instituição</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="00.000.000/0000-00" 
                            className="h-11"
                            {...field}
                            onChange={(e) => field.onChange(maskCNPJ(e.target.value))}
                          />
                          <Building2 className="absolute right-3 top-3 h-5 w-5 text-muted-foreground/30" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="motivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo do Desligamento</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o motivo da saída do aluno"
                      className="min-h-[80px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Alert className="bg-amber-50 border-amber-200">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-xs text-amber-800">
                Após a aprovação do responsável, sua escola terá o prazo legal de <strong>30 dias</strong> para concluir a emissão dos documentos de transferência.
              </AlertDescription>
            </Alert>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-amber-600 hover:bg-amber-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processando..." : (
                  <>Iniciar Processo <ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
