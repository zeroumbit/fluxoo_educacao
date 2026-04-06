import { useState, useMemo } from 'react'
import { useAuth } from '@/modules/auth/AuthContext'
import { useAlertasProfessor, useConcluirAlerta } from '@/modules/professor/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  Loader2, AlertTriangle, Search, Eye, Check, Clock
} from 'lucide-react'
import { toast } from 'sonner'

export function ProfessorAlertasPage() {
  const { authUser } = useAuth()
  const { data: alertas, isLoading } = useAlertasProfessor()
  const concluirAlertaMutation = useConcluirAlerta()
  
  const [busca, setBusca] = useState('')
  const [selectedTipo, setSelectedTipo] = useState('todos')
  const [selectedAlerta, setSelectedAlerta] = useState<any>(null)
  const [observacao, setObservacao] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const alertasFiltrados = useMemo(() => {
    if (!alertas) return []
    return alertas.filter((alerta: any) => {
      const matchesSearch = alerta.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
                           alerta.descricao?.toLowerCase().includes(busca.toLowerCase()) ||
                           alerta.aluno_nome?.toLowerCase().includes(busca.toLowerCase())
      const matchesTipo = selectedTipo === 'todos' || alerta.tipo === selectedTipo
      return matchesSearch && matchesTipo
    })
  }, [alertas, busca, selectedTipo])

  const tiposUnicos = useMemo(() => {
    if (!alertas) return []
    return Array.from(new Set(alertas.map((a: any) => a.tipo)))
  }, [alertas])

  const handleConcluirAlerta = () => {
    if (selectedAlerta) {
      concluirAlertaMutation.mutate({
        alertaId: selectedAlerta.id,
        observacao,
      })
      toast.success('Alerta concluído com sucesso!')
      setDialogOpen(false)
      setObservacao('')
      setSelectedAlerta(null)
    }
  }

  const getGravidadeBadge = (gravidade: string) => {
    switch (gravidade) {
      case 'critica':
        return <Badge variant="destructive">Crítico</Badge>
      case 'alta':
        return <Badge className="bg-orange-600">Alto</Badge>
      case 'media':
        return <Badge variant="secondary">Médio</Badge>
      case 'baixa':
        return <Badge variant="outline">Baixo</Badge>
      default:
        return <Badge variant="outline">{gravidade}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3 pt-[30px]">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Total de Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{alertas?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 pt-[30px]">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Críticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {alertas?.filter((a: any) => a.gravidade === 'critica').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 pt-[30px]">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Altos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {alertas?.filter((a: any) => a.gravidade === 'alta').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar alerta..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedTipo} onValueChange={setSelectedTipo}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todos os tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            {tiposUnicos.map((tipo) => (
              <SelectItem key={tipo} value={tipo}>
                {tipo === 'pedagogico' ? 'Pedagógico' : 
                 tipo === 'frequencia' ? 'Frequência' : 
                 tipo === 'saude' ? 'Saúde' : 
                 tipo === 'operacional_prof' ? 'Operacional' : tipo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-8">Alerta</TableHead>
              <TableHead>Aluno</TableHead>
              <TableHead>Turma</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-center">Gravidade</TableHead>
              <TableHead className="text-center">Data</TableHead>
              <TableHead className="text-right pr-8">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alertasFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500">Nenhum alerta encontrado</p>
                </TableCell>
              </TableRow>
            ) : (
              alertasFiltrados.map((alerta: any) => (
                <TableRow key={alerta.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="pl-8 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{alerta.titulo}</p>
                      <p className="text-xs text-slate-500 truncate max-w-xs">{alerta.descricao}</p>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-sm text-slate-700">{alerta.aluno_nome || '-'}</span>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge variant="outline">{alerta.turma_nome || '-'}</Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge variant="secondary">
                      {alerta.tipo === 'pedagogico' ? 'Pedagógico' :
                       alerta.tipo === 'frequencia' ? 'Frequência' :
                       alerta.tipo === 'saude' ? 'Saúde' :
                       alerta.tipo === 'operacional_prof' ? 'Operacional' : alerta.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center py-4">
                    {getGravidadeBadge(alerta.gravidade)}
                  </TableCell>
                  <TableCell className="text-center py-4">
                    <span className="text-xs text-slate-500">
                      {new Date(alerta.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </TableCell>
                  <TableCell className="text-right pr-8 py-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedAlerta(alerta)
                        setDialogOpen(true)
                      }}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Concluir
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de Conclusão */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Concluir Alerta</DialogTitle>
            <DialogDescription>
              {selectedAlerta?.titulo}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600">{selectedAlerta?.descricao}</p>
              {selectedAlerta?.aluno_nome && (
                <p className="text-xs text-slate-500 mt-2">
                  Aluno: {selectedAlerta.aluno_nome}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Observação (opcional)
              </label>
              <Textarea
                placeholder="Adicione uma observação sobre a resolução deste alerta..."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConcluirAlerta}
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={concluirAlertaMutation.isPending}
            >
              {concluirAlertaMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Concluindo...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Concluir Alerta
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProfessorAlertasPage
