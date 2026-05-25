import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { usePrecoGlobal, usePrecosModulos, useUpsertPrecoGlobal, useUpsertPrecoModuloGlobal, useModulosDisponiveis } from '@/modules/precificacao/hooks'
import { DollarSign, Loader2, Puzzle, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function PrecosPage() {
  const { data: precoGlobal, isLoading: loadingPreco } = usePrecoGlobal()
  const { data: precosModulos, isLoading: loadingModulos } = usePrecosModulos()
  const { data: modulosDisponiveis } = useModulosDisponiveis()
  const upsertPrecoGlobal = useUpsertPrecoGlobal()
  const upsertPrecoModulo = useUpsertPrecoModuloGlobal()

  const [precoForm, setPrecoForm] = useState({ valor_matriz: 5, valor_filial: 4 })
  const [moduloForms, setModuloForms] = useState<Record<string, { valor: number; trial_dias: number }>>({})

  useEffect(() => {
    if (precoGlobal) {
      setPrecoForm({
        valor_matriz: Number(precoGlobal.valor_matriz),
        valor_filial: Number(precoGlobal.valor_filial),
      })
    }
  }, [precoGlobal])

  useEffect(() => {
    if (precosModulos) {
      const forms: Record<string, { valor: number; trial_dias: number }> = {}
      for (const pm of precosModulos) {
        forms[pm.modulo_id] = {
          valor: Number(pm.valor),
          trial_dias: Number(pm.trial_dias),
        }
      }
      setModuloForms(forms)
    }
  }, [precosModulos])

  const handleSavePrecoGlobal = async () => {
    try {
      await upsertPrecoGlobal.mutateAsync(precoForm)
      toast.success('Preço global atualizado!')
    } catch {
      toast.error('Erro ao salvar preço global.')
    }
  }

  const handleSaveModulo = async (moduloId: string) => {
    const valores = moduloForms[moduloId]
    if (!valores) return
    try {
      await upsertPrecoModulo.mutateAsync({ moduloId, valores })
      toast.success('Preço do módulo atualizado!')
    } catch {
      toast.error('Erro ao salvar preço do módulo.')
    }
  }

  if (loadingPreco || loadingModulos) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
          <DollarSign className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Precificação</h1>
          <p className="text-slate-500 font-medium">Configure os preços globais e por módulo.</p>
        </div>
      </div>

      {/* Preço Base */}
      <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-2xl">
        <CardHeader className="border-b border-slate-50 p-8">
          <CardTitle className="text-xl font-black text-slate-900">Preço Base por Aluno</CardTitle>
          <CardDescription className="font-medium">
            Matriz: R$5,00 | Filial: R$4,00. Clientes sem filial pagam valor da matriz para todos.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-lg">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Valor Matriz (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={precoForm.valor_matriz}
                onChange={e => setPrecoForm({ ...precoForm, valor_matriz: parseFloat(e.target.value) || 0 })}
                className="h-12 text-lg font-bold rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Valor Filial (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={precoForm.valor_filial}
                onChange={e => setPrecoForm({ ...precoForm, valor_filial: parseFloat(e.target.value) || 0 })}
                className="h-12 text-lg font-bold rounded-xl"
              />
            </div>
          </div>
          <Button
            onClick={handleSavePrecoGlobal}
            disabled={upsertPrecoGlobal.isPending}
            className="mt-6 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold h-11 px-8"
          >
            {upsertPrecoGlobal.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Preços Globais
          </Button>
        </CardContent>
      </Card>

      {/* Preços dos Módulos */}
      <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-2xl">
        <CardHeader className="border-b border-slate-50 p-8">
          <div className="flex items-center gap-3">
            <Puzzle className="h-6 w-6 text-indigo-600" />
            <div>
              <CardTitle className="text-xl font-black text-slate-900">Módulos Add-On</CardTitle>
              <CardDescription className="font-medium">
                Preços e trial para módulos contratados avulsamente.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest pl-8">Módulo</TableHead>
                <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Valor (R$)</TableHead>
                <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Trial (dias)</TableHead>
                <TableHead className="text-right font-bold text-slate-400 uppercase text-[10px] tracking-widest pr-8">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modulosDisponiveis?.filter((m: any) => ['contas_pagar', 'fila_virtual'].includes(m.codigo)).map((modulo: any) => {
                const form = moduloForms[modulo.id] || { valor: 0, trial_dias: 90 }
                return (
                  <TableRow key={modulo.id} className="group hover:bg-slate-50/50">
                    <TableCell className="pl-8">
                      <div>
                        <p className="font-bold text-slate-900">{modulo.nome}</p>
                        <p className="text-xs text-slate-400 font-medium">{modulo.codigo}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.valor}
                        onChange={e =>
                          setModuloForms({
                            ...moduloForms,
                            [modulo.id]: { ...form, valor: parseFloat(e.target.value) || 0 },
                          })
                        }
                        className="w-28 h-10 rounded-xl font-bold"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={form.trial_dias}
                        onChange={e =>
                          setModuloForms({
                            ...moduloForms,
                            [modulo.id]: { ...form, trial_dias: parseInt(e.target.value) || 0 },
                          })
                        }
                        className="w-24 h-10 rounded-xl font-bold"
                      />
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <Button
                        onClick={() => handleSaveModulo(modulo.id)}
                        disabled={upsertPrecoModulo.isPending}
                        size="sm"
                        className="rounded-xl font-bold h-9 bg-indigo-600 hover:bg-indigo-700"
                      >
                        {upsertPrecoModulo.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                        Salvar
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {(!modulosDisponiveis || modulosDisponiveis.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-slate-400 font-medium">
                    Nenhum módulo encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
