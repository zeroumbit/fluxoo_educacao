import { useState } from 'react'
import { usePlanos, useUpsertPlano, useDeletePlano, useModulos, usePlanoModulos, useSetPlanoModulos } from '../hooks'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Pencil, Trash2, Loader2, Search, CheckCircle2, XCircle, Puzzle, Building2, Store, UserCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

const TIPOS_EMPRESA = [
  { value: 'escolas', label: 'Escolas', icon: Building2 },
  { value: 'lojistas', label: 'Lojistas', icon: Store },
  { value: 'profissionais', label: 'Profissionais', icon: UserCircle },
] as const

const VALIDADE_PLANOS = [
  { value: '1', label: '1 mês' },
  { value: '2', label: '2 meses' },
  { value: '3', label: '3 meses' },
  { value: '4', label: '4 meses' },
  { value: '5', label: '5 meses' },
  { value: '6', label: '6 meses' },
  { value: '7', label: '7 meses' },
  { value: '8', label: '8 meses' },
  { value: '9', label: '9 meses' },
  { value: '10', label: '10 meses' },
  { value: '11', label: '11 meses' },
  { value: '12', label: '12 meses' },
  { value: 'indefinido', label: 'Indefinido' },
] as const

const TIPOS_PAGAMENTO = [
  { value: 'pago', label: 'Pago', description: 'Plano com cobrança recorrente' },
  { value: 'gratuito', label: 'Gratuito', description: 'Período de teste ou 100% grátis' },
] as const

const PERIODOS_TESTE = [
  { value: '0', label: 'Sem período de teste (Cobrança imediata)' },
  { value: '7', label: '7 dias' },
  { value: '15', label: '15 dias' },
  { value: '30', label: '30 dias' },
  { value: '60', label: '60 dias' },
  { value: '90', label: '90 dias' },
] as const

export function PlanosPage() {
  const { data: planos, isLoading } = usePlanos()
  const { data: modulos } = useModulos()
  const upsertPlano = useUpsertPlano()
  const deletePlano = useDeletePlano()
  const setPlanoModulos = useSetPlanoModulos()

  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPlano, setEditingPlano] = useState<any>(null)
  const [isModulosOpen, setIsModulosOpen] = useState(false)
  const [selectedPlanoId, setSelectedPlanoId] = useState('')
  const [selectedModuloIds, setSelectedModuloIds] = useState<string[]>([])

  const [formData, setFormData] = useState({
    nome: '',
    descricao_curta: '',
    valor_por_aluno: 0,
    status: true,
    tipo_empresa: 'escolas' as 'escolas' | 'lojistas' | 'profissionais',
    tipo_pagamento: 'pago' as 'pago' | 'gratuito',
    periodo_teste_dias: 0,
    validade_meses: null as number | null
  })

  const filteredPlanos = planos?.filter((p: any) =>
    p.nome.toLowerCase().includes(search.toLowerCase())
  )

  // ===== CRUD Planos =====
  const handleOpenModal = (plano?: any) => {
    if (plano) {
      setEditingPlano(plano)
      setFormData({
        nome: plano.nome,
        descricao_curta: plano.descricao_curta || '',
        valor_por_aluno: Number(plano.valor_por_aluno),
        status: plano.status,
        tipo_empresa: plano.tipo_empresa || 'escolas',
        tipo_pagamento: plano.tipo_pagamento === 'gratuito' ? 'gratuito' : 'pago',
        periodo_teste_dias: plano.periodo_teste_dias || 0,
        validade_meses: plano.validade_meses ?? null
      })
    } else {
      setEditingPlano(null)
      setFormData({ 
        nome: '', 
        descricao_curta: '', 
        valor_por_aluno: 0, 
        status: true, 
        tipo_empresa: 'escolas', 
        tipo_pagamento: 'pago',
        periodo_teste_dias: 0,
        validade_meses: null 
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { periodo_teste_dias, ...rest } = formData
      await upsertPlano.mutateAsync({
        ...(editingPlano?.id ? { id: editingPlano.id } : {}),
        ...rest,
        // Mapeia para os valores suportados pelo banco de dados (Enum)
        tipo_pagamento: formData.tipo_pagamento === 'pago' ? 'pix' : 'gratuito',
        // Só envia o campo de dias de teste se for maior que zero 
        // (Isso ajuda a evitar erro 400 se a coluna ainda não tiver sido criada)
        ...(periodo_teste_dias > 0 ? { periodo_teste_dias } : {})
      })
      toast.success(editingPlano ? 'Plano atualizado!' : 'Plano criado!')
      setIsModalOpen(false)
    } catch (error: any) {
      // Mostra mensagem específica para conflito de plano único
      if (error.message?.includes('Já existe um plano ativo')) {
        toast.error(error.message)
      } else {
        toast.error('Erro ao salvar plano')
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Desativar este plano?')) return
    try {
      await deletePlano.mutateAsync(id)
      toast.success('Plano desativado!')
    } catch {
      toast.error('Erro ao desativar plano')
    }
  }

  // ===== Módulos =====
  const handleOpenModulos = (planoId: string) => {
    setSelectedPlanoId(planoId)
    setIsModulosOpen(true)
  }

  // Carrega módulos vinculados quando o dialog abre
  const { data: planoModulos } = usePlanoModulos(selectedPlanoId)

  const handleSaveModulos = async () => {
    try {
      await setPlanoModulos.mutateAsync({ planoId: selectedPlanoId, moduloIds: selectedModuloIds })
      toast.success('Módulos do plano atualizados!')
      setIsModulosOpen(false)
    } catch {
      toast.error('Erro ao salvar módulos.')
    }
  }

  // Sincroniza checkbox ao abrir
  const moduloIdsVinculados = planoModulos?.map((pm: any) => pm.modulo_id) || []

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Puzzle className="h-8 w-8 text-indigo-600" />
            Planos
          </h1>
          <p className="text-slate-500 font-medium">Catálogo comercial com funcionalidades atreladas a cada plano.</p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenModal()} className="bg-indigo-600 hover:bg-indigo-700 h-11 px-6 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95">
              <Plus className="mr-2 h-5 w-5" /> Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-2xl border-0 shadow-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">{editingPlano ? 'Editar Plano' : 'Criar Plano'}</DialogTitle>
                <DialogDescription className="font-medium text-slate-500">
                  Planos comerciais com funcionalidades atreladas.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-6">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-xs font-bold uppercase tracking-widest text-slate-400">Nome do Plano</Label>
                  <Input
                    id="nome"
                    placeholder="Ex: Plano Essencial"
                    value={formData.nome}
                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                    required
                    className="h-11 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Tipo de Plano</Label>
                  <Select
                    value={formData.tipo_pagamento}
                    onValueChange={(value: 'pago' | 'gratuito') =>
                      setFormData({ ...formData, tipo_pagamento: value, periodo_teste_dias: value === 'pago' ? 0 : formData.periodo_teste_dias })
                    }
                  >
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 w-full">
                      <SelectValue placeholder="Selecione o tipo de plano" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_PAGAMENTO.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          <div className="flex flex-col">
                            <span className="font-semibold">{tipo.label}</span>
                            <span className="text-xs text-muted-foreground">{tipo.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Validade do Plano</Label>
                  <Select
                    value={formData.validade_meses?.toString() || 'indefinido'}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        validade_meses: value === 'indefinido' ? null : parseInt(value)
                      })
                    }
                  >
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 w-full">
                      <SelectValue placeholder="Selecione a validade" />
                    </SelectTrigger>
                    <SelectContent>
                      {VALIDADE_PLANOS.map((validade) => (
                        <SelectItem key={validade.value} value={validade.value}>
                          {validade.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 font-medium">
                    Tempo de duração do plano. "Indefinido" = sem expiração.
                  </p>
                </div>

                {formData.tipo_pagamento === 'gratuito' && (
                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Período de Teste (Trial)</Label>
                    <Select
                      value={formData.periodo_teste_dias.toString()}
                      onValueChange={(value) => setFormData({ ...formData, periodo_teste_dias: parseInt(value) })}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 w-full">
                        <SelectValue placeholder="Selecione o período de teste" />
                      </SelectTrigger>
                      <SelectContent>
                        {PERIODOS_TESTE.map((periodo) => (
                          <SelectItem key={periodo.value} value={periodo.value}>
                            {periodo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-indigo-600 font-medium">
                      * Após este período, a escola será cobrada o valor normal do plano.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="desc" className="text-xs font-bold uppercase tracking-widest text-slate-400">Descrição Curta</Label>
                  <Textarea
                    id="desc"
                    value={formData.descricao_curta}
                    onChange={e => setFormData({ ...formData, descricao_curta: e.target.value })}
                    rows={3}
                    placeholder="Resumo para exibição no checkout..."
                    className="rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor" className="text-xs font-bold uppercase tracking-widest text-slate-400">Valor por Aluno (R$)</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    value={formData.valor_por_aluno}
                    onChange={e => setFormData({ ...formData, valor_por_aluno: parseFloat(e.target.value) })}
                    required
                    className="h-11 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Tipo de Empresa</Label>
                  <Select
                    value={formData.tipo_empresa}
                    onValueChange={(value: 'escolas' | 'lojistas' | 'profissionais') =>
                      setFormData({ ...formData, tipo_empresa: value })
                    }
                  >
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 w-full">
                      <SelectValue placeholder="Selecione o tipo de empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_EMPRESA.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          <div className="flex items-center gap-2">
                            <tipo.icon className="h-4 w-4" />
                            {tipo.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 font-medium">
                    Define quais tipos de empresas verão este plano ao pagar.
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Label className="text-sm font-bold text-slate-700">Plano Ativo</Label>
                  <Badge
                    variant={formData.status ? 'default' : 'secondary'}
                    className="cursor-pointer px-3 py-1 rounded-md font-bold uppercase text-[10px]"
                    onClick={() => setFormData({ ...formData, status: !formData.status })}
                  >
                    {formData.status ? 'Sim' : 'Não'}
                  </Badge>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl font-bold h-11 text-slate-500"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={upsertPlano.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold h-11 px-8 shadow-lg shadow-indigo-100"
                >
                  {upsertPlano.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Plano
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dialog de Módulos */}
      <Dialog open={isModulosOpen} onOpenChange={setIsModulosOpen}>
        <DialogContent className="max-w-md rounded-2xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Módulos do Plano</DialogTitle>
            <DialogDescription className="font-medium text-slate-500">
              Selecione quais módulos este plano oferece às escolas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[300px] overflow-y-auto py-4">
            {modulos?.map((m: any) => {
              const isChecked = selectedModuloIds.includes(m.id)
              return (
                <label key={m.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-all">
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      if (checked) setSelectedModuloIds([...selectedModuloIds, m.id])
                      else setSelectedModuloIds(selectedModuloIds.filter(id => id !== m.id))
                    }}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-900">{m.nome}</p>
                    <p className="text-xs text-slate-500 font-medium">{m.descricao || m.codigo}</p>
                  </div>
                </label>
              )
            })}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsModulosOpen(false)}
              className="rounded-xl font-bold h-11 text-slate-500"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveModulos}
              disabled={setPlanoModulos.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold h-11 px-8 shadow-lg shadow-indigo-100"
            >
              {setPlanoModulos.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Módulos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-50 p-8 pt-10 bg-slate-50/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black tracking-tighter text-slate-900">Todos os Planos</CardTitle>
                <CardDescription className="font-medium">Gerencie os planos comerciais e seus módulos associados.</CardDescription>
              </div>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar plano..."
                  className="pl-10 h-10 rounded-xl bg-white border-slate-200 shadow-sm focus:border-indigo-500 transition-all font-medium"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest pl-8">Nome</TableHead>
                    <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Descrição</TableHead>
                    <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Tipo de Empresa</TableHead>
                    <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Tipo de Pagamento</TableHead>
                    <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Validade</TableHead>
                    <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Valor p/ Aluno</TableHead>
                    <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest text-center">Status</TableHead>
                    <TableHead className="text-right font-bold text-slate-400 uppercase text-[10px] tracking-widest pr-8">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlanos?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-48 text-center bg-slate-50/20">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                            <Puzzle className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">Nenhum plano encontrado</p>
                            <p className="text-sm text-slate-400 font-medium">Crie planos para começar a configurar os planos disponíveis.</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPlanos?.map((plano: any) => {
                      const tipoEmpresaConfig = TIPOS_EMPRESA.find(t => t.value === plano.tipo_empresa) || TIPOS_EMPRESA[0]
                      const TipoIcon = tipoEmpresaConfig.icon

                      return (
                        <TableRow key={plano.id} className="group hover:bg-slate-50/50 transition-colors">
                          <TableCell className="pl-8 font-bold text-slate-900">{plano.nome}</TableCell>
                          <TableCell className="text-sm text-slate-500 font-medium max-w-[300px] truncate">{plano.descricao_curta || 'Nenhuma descrição informada.'}</TableCell>
                          <TableCell>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                              <TipoIcon className="h-4 w-4" />
                              {tipoEmpresaConfig.label}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-bold text-slate-700">
                                {plano.tipo_pagamento === 'gratuito' ? 'Gratuito' : 'Pago'}
                              </span>
                              {plano.periodo_teste_dias > 0 && (
                                <span className="text-[10px] text-indigo-600 font-bold">
                                  {plano.periodo_teste_dias} dias de teste
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {plano.validade_meses ? (
                              <Badge className="bg-amber-50 text-amber-700 border-amber-100 font-bold text-xs">
                                {plano.validade_meses} {plano.validade_meses === 1 ? 'mês' : 'meses'}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 font-bold text-xs">
                                Indefinido
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-bold text-indigo-700">R$ {Number(plano.valor_por_aluno).toFixed(2)}</TableCell>
                          <TableCell className="text-center">
                            {plano.status ? (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100">
                                <CheckCircle2 className="h-3.5 w-3.5" /> ATIVA
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-400 text-xs font-bold border border-slate-100">
                                <XCircle className="h-3.5 w-3.5" /> INATIVA
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  handleOpenModulos(plano.id)
                                  setSelectedModuloIds(moduloIdsVinculados)
                                }}
                                className="h-9 w-9 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 border border-transparent hover:border-indigo-100"
                              >
                                <Puzzle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenModal(plano)}
                                className="h-9 w-9 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 border border-transparent hover:border-indigo-100"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100"
                                onClick={() => handleDelete(plano.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
