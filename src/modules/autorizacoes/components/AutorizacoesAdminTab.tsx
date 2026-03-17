import React, { useState, useMemo } from 'react'
import { useAuth } from '@/modules/auth/AuthContext'
import {
  useModelosAutorizacaoAdmin,
  useCriarModeloAutorizacao,
  useAtualizarModeloAutorizacao,
  useToggleAtivoAutorizacao,
} from '@/modules/autorizacoes/hooks'
import { CATEGORIA_LABELS, CATEGORIA_CORES } from '@/modules/autorizacoes/service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Plus, Search, Pencil, ShieldCheck, ShieldOff, Shield,
  Globe, Building2, Eye, EyeOff, Loader2, AlertTriangle, CheckCircle2, Copy
} from 'lucide-react'

const CATEGORIAS = [
  'matricula', 'saude', 'imagem', 'conduta', 'tecnologia',
  'transporte', 'alimentacao', 'inclusao', 'religiosidade', 'projetos', 'eventos',
]

type Modelo = {
  id: string
  tenant_id: string | null
  categoria: string
  titulo: string
  descricao_curta: string
  texto_completo: string
  obrigatoria: boolean
  ativa: boolean
  ordem: number
}

export function AutorizacoesAdminTab() {
  const { authUser } = useAuth()
  const { data: modelos = [], isLoading } = useModelosAutorizacaoAdmin()
  const criar = useCriarModeloAutorizacao()
  const atualizar = useAtualizarModeloAutorizacao()
  const toggleAtivo = useToggleAtivoAutorizacao()

  const [busca, setBusca] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [openModal, setOpenModal] = useState(false)
  const [editando, setEditando] = useState<Modelo | null>(null)
  const [openDetalhes, setOpenDetalhes] = useState<Modelo | null>(null)

  const [form, setForm] = useState({
    categoria: '',
    titulo: '',
    descricao_curta: '',
    texto_completo: '',
    obrigatoria: false,
  })

  const isGlobal = (m: Modelo) => !m.tenant_id

  const abrirCriar = () => {
    setEditando(null)
    setForm({ categoria: 'matricula', titulo: '', descricao_curta: '', texto_completo: '', obrigatoria: false })
    setOpenModal(true)
  }

  const abrirEditar = (m: Modelo) => {
    if (isGlobal(m)) {
      toast.info('Autorizações globais do sistema não podem ser editadas. Crie uma cópia personalizada.')
      return
    }
    setEditando(m)
    setForm({
      categoria: m.categoria,
      titulo: m.titulo,
      descricao_curta: m.descricao_curta,
      texto_completo: m.texto_completo,
      obrigatoria: m.obrigatoria,
    })
    setOpenModal(true)
  }

  const handleSalvar = async () => {
    if (!form.titulo.trim() || !form.descricao_curta.trim() || !form.texto_completo.trim()) {
      toast.error('Preencha todos os campos obrigatórios.')
      return
    }

    try {
      if (editando) {
        await atualizar.mutateAsync({ id: editando.id, updates: form })
        toast.success('Autorização atualizada!')
      } else {
        await criar.mutateAsync({ ...form, tenant_id: authUser!.tenantId })
        toast.success('Autorização criada e disponibilizada!')
      }
      setOpenModal(false)
    } catch {
      toast.error('Erro ao salvar. Tente novamente.')
    }
  }

  const handleDuplicar = (m: Modelo) => {
    setEditando(null)
    setForm({
      categoria: m.categoria,
      titulo: `${m.titulo} (Cópia)`,
      descricao_curta: m.descricao_curta,
      texto_completo: m.texto_completo,
      obrigatoria: m.obrigatoria,
    })
    setOpenModal(true)
    toast.info('Personalize o título e o texto antes de salvar.')
  }

  const handleToggle = async (m: Modelo) => {
    if (isGlobal(m) && m.ativa) {
      toast.info('Para desativar uma autorização global, edite-a como personalizada.')
      return
    }
    try {
      await toggleAtivo.mutateAsync({ id: m.id, ativa: !m.ativa })
      toast.success(m.ativa ? 'Autorização desativada.' : 'Autorização ativada.')
    } catch {
      toast.error('Erro ao alterar status.')
    }
  }

  const dedupedModelos = useMemo(() => {
    if (!modelos) return []
    const seen = new Set()
    // Ordenamos por ID descendente (se for UUID v4 ou similar pode não ser temporal, mas assumindo que o retorno do hook já vem ordenado ou queremos apenas um)
    // Na verdade, filtramos mantendo o primeiro que encontrarmos com a mesma chave
    return (modelos as Modelo[]).filter((m) => {
      const key = `${m.titulo}-${m.categoria}-${m.tenant_id}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [modelos])

  const modelosFiltrados = dedupedModelos.filter((m) => {
    const matchBusca = m.titulo.toLowerCase().includes(busca.toLowerCase())
    const matchCategoria = filtroCategoria === 'todas' || m.categoria === filtroCategoria
    return matchBusca && matchCategoria
  })

  const porCategoria = modelosFiltrados.reduce((acc: Record<string, Modelo[]>, m) => {
    if (!acc[m.categoria]) acc[m.categoria] = []
    acc[m.categoria].push(m)
    return acc
  }, {})

  const totalAtivas = (modelos as Modelo[]).filter(m => m.ativa).length
  const totalGlobais = (modelos as Modelo[]).filter(m => isGlobal(m)).length
  const totalCustom = (modelos as Modelo[]).filter(m => !isGlobal(m)).length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header + Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-50 border border-teal-100">
            <ShieldCheck className="h-4 w-4 text-teal-600" />
            <span className="text-sm font-bold text-teal-700">{totalAtivas} ativas</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100">
            <Globe className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-bold text-slate-600">{totalGlobais} do sistema</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-100">
            <Building2 className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-bold text-indigo-700">{totalCustom} da escola</span>
          </div>
        </div>
        <Button
          onClick={abrirCriar}
          className="bg-teal-500 hover:bg-teal-600 font-bold rounded-xl h-10 shadow-md shadow-teal-500/20"
        >
          <Plus className="h-4 w-4 mr-2" /> Nova Autorização
        </Button>
      </div>

      {/* Info box */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 leading-relaxed">
          <strong>Autorizações do sistema</strong> (ícone 🌐) são modelos legais pré-configurados. Você pode ativá-las/desativá-las, mas não editá-las diretamente. Para personalizar, crie uma nova autorização. 
          Alterações em <strong>autorizações da escola</strong> (ícone 🏫) refletem imediatamente no portal dos responsáveis.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar autorização..."
            className="pl-10 h-10 bg-slate-50 border-none rounded-xl text-sm"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
          <SelectTrigger className="w-full sm:w-56 h-10 border-none bg-slate-50 rounded-xl font-medium text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            {CATEGORIAS.map((c) => (
              <SelectItem key={c} value={c}>{CATEGORIA_LABELS[c] || c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Listagem por categoria */}
      <div className="space-y-6">
        {Object.entries(porCategoria).map(([categoria, itens]) => {
          const cores = CATEGORIA_CORES[categoria] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' }
          return (
            <div key={categoria}>
              <div className="flex items-center gap-2 mb-3">
                <Badge className={cn('text-[9px] uppercase tracking-widest font-black border', cores.bg, cores.text, cores.border)}>
                  {CATEGORIA_LABELS[categoria] || categoria}
                </Badge>
                <span className="text-xs text-slate-400">{itens.length} autorização(ões)</span>
              </div>

              <div className="space-y-2">
                {itens.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                      m.ativa
                        ? 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
                        : 'bg-slate-50 border-slate-100 opacity-60'
                    )}
                  >
                    {/* Status icon */}
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                      m.ativa ? 'bg-teal-50' : 'bg-slate-100'
                    )}>
                      {m.ativa ? (
                        <ShieldCheck className="h-5 w-5 text-teal-600" />
                      ) : (
                        <ShieldOff className="h-5 w-5 text-slate-400" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-800 text-sm">{m.titulo}</p>
                        {isGlobal(m) ? (
                          <Badge className="text-[9px] bg-slate-100 text-slate-500 border border-slate-200 font-bold gap-1">
                            <Globe className="h-2.5 w-2.5" /> Sistema
                          </Badge>
                        ) : (
                          <Badge className="text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-100 font-bold gap-1">
                            <Building2 className="h-2.5 w-2.5" /> Escola
                          </Badge>
                        )}
                        {m.obrigatoria && (
                          <Badge className="text-[9px] bg-red-50 text-red-600 border border-red-100 font-bold">
                            Obrigatório
                          </Badge>
                        )}
                        {!m.ativa && (
                          <Badge className="text-[9px] bg-slate-100 text-slate-500 border border-slate-200">
                            Inativa
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{m.descricao_curta}</p>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50"
                        title="Ver texto completo"
                        onClick={() => setOpenDetalhes(m)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                        title="Duplicar para personalizar"
                        onClick={() => handleDuplicar(m)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-8 w-8 rounded-lg",
                          isGlobal(m)
                            ? 'text-slate-200 cursor-not-allowed'
                            : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                        )}
                        title={isGlobal(m) ? 'Não editável' : 'Editar'}
                        onClick={() => abrirEditar(m)}
                        disabled={isGlobal(m)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Switch
                        checked={m.ativa}
                        onCheckedChange={() => handleToggle(m)}
                        className="data-[state=checked]:bg-teal-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {modelosFiltrados.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
              <Shield className="h-8 w-8 text-slate-200" />
            </div>
            <p className="font-bold text-slate-600">Nenhuma autorização encontrada</p>
            <p className="text-sm text-slate-400">Tente ajustar os filtros ou crie uma nova.</p>
          </div>
        )}
      </div>

      {/* Modal Criar/Editar */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-500" />
              {editando ? 'Editar Autorização' : 'Nova Autorização'}
            </DialogTitle>
            <DialogDescription>
              {editando
                ? 'Edite os dados desta autorização. As alterações refletem imediatamente no portal dos responsáveis.'
                : 'Crie uma autorização personalizada para a sua escola. Ela ficará disponível no portal dos responsáveis.'}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 space-y-5 pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Título *</Label>
                <Input
                  value={form.titulo}
                  onChange={(e) => setForm(f => ({ ...f, titulo: e.target.value }))}
                  placeholder="Ex: Autorização para Excursão Pedagógica"
                  className="rounded-xl border-slate-100 bg-slate-50"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categoria *</Label>
                <Select value={form.categoria} onValueChange={(v) => setForm(f => ({ ...f, categoria: v }))}>
                  <SelectTrigger className="rounded-xl border-slate-100 bg-slate-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((c) => (
                      <SelectItem key={c} value={c}>{CATEGORIA_LABELS[c] || c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 flex items-center gap-3 pt-6">
                <Switch
                  checked={form.obrigatoria}
                  onCheckedChange={(v) => setForm(f => ({ ...f, obrigatoria: v }))}
                  className="data-[state=checked]:bg-red-500"
                />
                <div>
                  <Label className="text-sm font-bold text-slate-700">Obrigatória</Label>
                  <p className="text-[10px] text-slate-400">Não pode ser revogada pelo responsável</p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Descrição Resumida * <span className="normal-case font-normal">(exibida na listagem)</span>
              </Label>
              <Textarea
                value={form.descricao_curta}
                onChange={(e) => setForm(f => ({ ...f, descricao_curta: e.target.value }))}
                placeholder="Descreva em uma frase o que esta autorização permite..."
                className="rounded-xl border-slate-100 bg-slate-50 resize-none"
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Texto Completo do Termo * <span className="normal-case font-normal">(o responsável deve ler antes de assinar)</span>
              </Label>
              <Textarea
                value={form.texto_completo}
                onChange={(e) => setForm(f => ({ ...f, texto_completo: e.target.value }))}
                placeholder="Texto jurídico completo que o responsável deve ler e aceitar..."
                className="rounded-xl border-slate-100 bg-slate-50 resize-none font-mono text-sm"
                rows={10}
              />
              <p className="text-[10px] text-slate-400">
                💡 O responsável precisará rolar até o final deste texto antes de poder confirmar a autorização.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 gap-2">
            <Button variant="outline" onClick={() => setOpenModal(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              onClick={handleSalvar}
              disabled={criar.isPending || atualizar.isPending}
              className="rounded-xl font-bold bg-teal-500 hover:bg-teal-600 shadow-lg shadow-teal-500/20"
            >
              {(criar.isPending || atualizar.isPending) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {editando ? 'Salvar Alterações' : 'Criar Autorização'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Detalhes (visualizar texto completo) */}
      <Dialog open={!!openDetalhes} onOpenChange={() => setOpenDetalhes(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-teal-500" />
              {openDetalhes?.titulo}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              {openDetalhes && !isGlobal(openDetalhes) && (
                <Badge className="text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-100 font-bold">
                  Autorização da Escola
                </Badge>
              )}
              {openDetalhes?.ativa ? (
                <Badge className="text-[9px] bg-teal-50 text-teal-600 border border-teal-100 font-bold">
                  ✅ Ativa
                </Badge>
              ) : (
                <Badge className="text-[9px] bg-slate-100 text-slate-500 border border-slate-200 font-bold">
                  Inativa
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Resumo</p>
              <p className="text-sm text-slate-700">{openDetalhes?.descricao_curta}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Texto Completo do Termo</p>
              <div className="bg-slate-50 rounded-xl border border-slate-100 p-5 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {openDetalhes?.texto_completo}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 gap-2">
            {openDetalhes && !isGlobal(openDetalhes) && (
              <Button
                variant="outline"
                onClick={() => { setOpenDetalhes(null); abrirEditar(openDetalhes!) }}
                className="rounded-xl"
              >
                <Pencil className="h-4 w-4 mr-2" /> Editar
              </Button>
            )}
            <Button onClick={() => setOpenDetalhes(null)} variant="outline" className="rounded-xl">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
