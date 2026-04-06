import { useState, useMemo } from 'react'
import { useAuth } from '@/modules/auth/AuthContext'
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
  Plus, Search, Loader2, FileText, Calendar, Users, Eye, Edit, ClipboardList
} from 'lucide-react'

export function ProfessorAtividadesPage() {
  const { authUser } = useAuth()
  const [busca, setBusca] = useState('')

  // TODO: Buscar atividades reais do Supabase
  const atividades = useMemo(() => [], [])

  const atividadesFiltradas = useMemo(() => {
    return atividades.filter((a: any) =>
      a.titulo?.toLowerCase().includes(busca.toLowerCase())
    )
  }, [atividades, busca])

  return (
    <div className="space-y-6">
      {/* Busca */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar atividade..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Atividade</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Disciplina</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data Entrega</TableHead>
                <TableHead className="text-center">Entregas</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {atividadesFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <ClipboardList className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500">Suas atividades e avaliações aparecerão aqui para você gerenciar as entregas dos alunos.</p>
                  </TableCell>
                </TableRow>
              ) : (
                atividadesFiltradas.map((atividade: any) => (
                  <TableRow key={atividade.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900">{atividade.titulo}</p>
                        <p className="text-xs text-slate-500">{atividade.descricao}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{atividade.turma_nome}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-700">{atividade.disciplina_nome}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={atividade.tipo === 'prova' ? 'destructive' : 'secondary'}>
                        {atividade.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm">{atividade.data_entrega}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium">{atividade.entregas}/{atividade.total_alunos}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProfessorAtividadesPage
