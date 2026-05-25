import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useAssinaturaModulos, useAtivarModulo, useDesativarModulo, usePrecoCliente, usePrecoVigente, usePrecosModulos, useRemoverPrecoCliente, useUpsertPrecoCliente, useUpsertPrecoModuloCliente } from '@/modules/precificacao/hooks'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BadgeCheck, BadgeX, Loader2, Save, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface Props {
  tenantId: string | null
  escolaNome: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PrecoClienteDialog({ tenantId, escolaNome, open, onOpenChange }: Props) {
  const { data: precoCliente, isLoading: loadingCliente } = usePrecoCliente(tenantId)
  const { data: precoVigente } = usePrecoVigente(tenantId)
  const { data: precosModulos } = usePrecosModulos(tenantId || undefined)
  const { data: assinaturaModulos } = useAssinaturaModulos(tenantId)
  const upsertCliente = useUpsertPrecoCliente()
  const removerCliente = useRemoverPrecoCliente()
  const upsertModuloCliente = useUpsertPrecoModuloCliente()
  const ativarModulo = useAtivarModulo()
  const desativarModulo = useDesativarModulo()

  const [personalizado, setPersonalizado] = useState(false)
  const [valorMatriz, setValorMatriz] = useState(5)
  const [valorFilial, setValorFilial] = useState(4)
  const [moduloPrecos, setModuloPrecos] = useState<Record<string, { valor: number; trial_dias: number }>>({})
  const [modulosAtivos, setModulosAtivos] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (precoCliente) {
      setPersonalizado(true)
      setValorMatriz(Number(precoCliente.valor_matriz))
      setValorFilial(Number(precoCliente.valor_filial))
    } else {
      setPersonalizado(false)
      setValorMatriz(Number(precoVigente?.valor_matriz) || 5)
      setValorFilial(Number(precoVigente?.valor_filial) || 4)
    }
  }, [precoCliente, precoVigente])

  useEffect(() => {
    if (precosModulos) {
      const forms: Record<string, { valor: number; trial_dias: number }> = {}
      for (const pm of precosModulos) {
        forms[pm.modulo_id] = {
          valor: Number(pm.valor),
          trial_dias: Number(pm.trial_dias),
        }
      }
      setModuloPrecos(forms)
    }
  }, [precosModulos])

  useEffect(() => {
    if (assinaturaModulos) {
      const ativos: Record<string, boolean> = {}
      for (const am of assinaturaModulos) {
        ativos[am.modulo_id] = true
      }
      setModulosAtivos(ativos)
    }
  }, [assinaturaModulos])

  const handleSavePrecos = async () => {
    if (!tenantId) return
    try {
      if (personalizado) {
        await upsertCliente.mutateAsync({
          tenantId,
          valores: { valor_matriz: valorMatriz, valor_filial: valorFilial },
        })
      } else {
        await removerCliente.mutateAsync(tenantId)
      }
      toast.success('Preços salvos!')
    } catch {
      toast.error('Erro ao salvar preços.')
    }
  }

  const handleSaveModulo = async (moduloId: string, codigo: string) => {
    if (!tenantId) return
    const valores = moduloPrecos[moduloId]
    if (!valores) return

    try {
      if (modulosAtivos[moduloId]) {
        await upsertModuloCliente.mutateAsync({ tenantId, moduloId, valores })
      } else {
        await ativarModulo.mutateAsync({ tenantId, moduloCodigo: codigo })
      }
      toast.success('Módulo atualizado!')
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar módulo.')
    }
  }

  const handleToggleModulo = async (moduloId: string, ativo: boolean) => {
    if (!tenantId) return
    if (ativo) {
      setModulosAtivos({ ...modulosAtivos, [moduloId]: true })
    } else {
      const am = assinaturaModulos?.find((a: any) => a.modulo_id === moduloId)
      if (am) {
        await desativarModulo.mutateAsync(am.id)
      }
      setModulosAtivos({ ...modulosAtivos, [moduloId]: false })
    }
  }

  if (!tenantId) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl border-0 shadow-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Preços Personalizados</DialogTitle>
          <DialogDescription className="font-medium">
            {escolaNome}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Preço Base */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Preço Base por Aluno
              </Label>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-slate-400">Personalizado</Label>
                <Switch checked={personalizado} onCheckedChange={setPersonalizado} />
              </div>
            </div>

            {personalizado ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-400">Matriz (R$)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">R$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={valorMatriz}
                      onChange={e => setValorMatriz(parseFloat(e.target.value) || 0)}
                      className="pl-10 h-11 rounded-xl font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-400">Filial (R$)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">R$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={valorFilial}
                      onChange={e => setValorFilial(parseFloat(e.target.value) || 0)}
                      className="pl-10 h-11 rounded-xl font-bold"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-sm text-slate-500">
                  Usando preço global: <strong>R$ {Number(precoVigente?.valor_matriz).toFixed(2)}</strong> matriz / <strong>R$ {Number(precoVigente?.valor_filial).toFixed(2)}</strong> filial
                </p>
              </div>
            )}

            {personalizado && (
              <Button
                onClick={handleSavePrecos}
                disabled={upsertCliente.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold h-10 w-full"
              >
                {upsertCliente.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar Preços Personalizados
              </Button>
            )}
            {!personalizado && precoCliente && (
              <Button
                onClick={handleSavePrecos}
                variant="outline"
                className="rounded-xl font-bold h-10 w-full text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                <X className="mr-2 h-4 w-4" />
                Remover Personalização (voltar ao global)
              </Button>
            )}
          </div>

          <Separator />

          {/* Módulos */}
          <div className="space-y-4">
            <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Módulos Add-On
            </Label>

            {precosModulos?.map((pm: any) => {
              const ativo = modulosAtivos[pm.modulo_id] || false
              const form = moduloPrecos[pm.modulo_id] || { valor: 0, trial_dias: 90 }
              const am = assinaturaModulos?.find((a: any) => a.modulo_id === pm.modulo_id)

              return (
                <div key={pm.modulo_id} className="p-4 rounded-xl border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{pm.modulo_nome || pm.modulo?.nome}</p>
                      <p className="text-xs text-slate-400 font-medium">{pm.modulo_codigo || pm.modulo?.codigo}</p>
                    </div>
                    <Switch
                      checked={ativo}
                      onCheckedChange={(checked) => handleToggleModulo(pm.modulo_id, checked)}
                    />
                  </div>

                  {ativo && am && (
                    <div className="flex items-center gap-2 text-xs">
                      {am.status === 'trial' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-100">
                          <BadgeCheck className="h-3 w-3" />
                          Trial até {format(new Date(am.data_fim_trial), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      ) : am.status === 'ativo' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">
                          <BadgeCheck className="h-3 w-3" />
                          Ativo (cobrando)
                        </span>
                      ) : null}
                    </div>
                  )}

                  {ativo && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-400">Valor (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={form.valor}
                          onChange={e =>
                            setModuloPrecos({
                              ...moduloPrecos,
                              [pm.modulo_id]: { ...form, valor: parseFloat(e.target.value) || 0 },
                            })
                          }
                          className="h-9 rounded-xl font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-400">Trial (dias)</Label>
                        <Input
                          type="number"
                          value={form.trial_dias}
                          onChange={e =>
                            setModuloPrecos({
                              ...moduloPrecos,
                              [pm.modulo_id]: { ...form, trial_dias: parseInt(e.target.value) || 0 },
                            })
                          }
                          className="h-9 rounded-xl font-bold"
                        />
                      </div>
                    </div>
                  )}

                  {ativo && (
                    <Button
                      size="sm"
                      onClick={() => handleSaveModulo(pm.modulo_id, pm.modulo_codigo || pm.modulo?.codigo)}
                      disabled={upsertModuloCliente.isPending}
                      className="rounded-lg font-bold h-8 text-xs w-full bg-indigo-600 hover:bg-indigo-700"
                    >
                      {upsertModuloCliente.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                      Salvar Preço do Módulo
                    </Button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Resumo */}
          {precoVigente && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white">
              <p className="text-xs uppercase font-bold tracking-wider opacity-80 mb-1">Resumo da Precificação</p>
              <div className="flex items-baseline gap-1">
                <span className="text-sm opacity-90">R$</span>
                <span className="text-2xl font-black">{Number(precoVigente.valor_matriz).toFixed(2)}</span>
                <span className="text-xs opacity-70">/aluno (matriz)</span>
              </div>
              <p className="text-xs opacity-70 mt-1">
                Filial: R$ {Number(precoVigente.valor_filial).toFixed(2)}/aluno
                {precoVigente.tipo_preco === 'cliente' && ' (personalizado)'}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-xl font-bold h-11"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
