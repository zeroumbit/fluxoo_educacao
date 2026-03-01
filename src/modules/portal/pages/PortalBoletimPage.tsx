import { useState } from 'react'
import { usePortalContext } from '../context'
import { useBoletins } from '../hooks'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2,
  BookOpen,
  GraduationCap,
  TrendingUp,
  AlertCircle,
  FileText,
  Calendar,
  ChevronRight,
} from 'lucide-react'
import type { DisciplinaBoletim } from '@/lib/database.types'

export function PortalBoletimPage() {
  const { alunoSelecionado, tenantId } = usePortalContext()
  const { data: boletins, isLoading } = useBoletins()
  
  const [anoSelecionado, setAnoSelecionado] = useState<string>(
    new Date().getFullYear().toString()
  )
  const [bimestreSelecionado, setBimestreSelecionado] = useState<string>('todos')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#14B8A6]" />
      </div>
    )
  }

  if (!alunoSelecionado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <BookOpen className="h-16 w-16 text-slate-300" />
        <h2 className="text-xl font-bold text-[#1E293B]">Nenhum aluno selecionado</h2>
        <p className="text-slate-500">Selecione um aluno para visualizar o boletim.</p>
      </div>
    )
  }

  // Filtrar boletins pelo ano selecionado
  const boletinsFiltrados = (boletins || []).filter(
    (b) => b.ano_letivo.toString() === anoSelecionado
  )

  // Filtrar por bimestre específico ou mostrar todos
  const boletimExibido = bimestreSelecionado === 'todos'
    ? boletinsFiltrados
    : boletinsFiltrados.filter((b) => b.bimestre.toString() === bimestreSelecionado)

  // Calcular média geral do aluno
  const calcularMediaGeral = () => {
    if (boletinsFiltrados.length === 0) return 0
    let totalNotas = 0
    let totalDisciplinas = 0
    
    boletinsFiltrados.forEach((boletim) => {
      boletim.disciplinas.forEach((disc) => {
        totalNotas += disc.nota
        totalDisciplinas++
      })
    })
    
    return totalDisciplinas > 0 ? (totalNotas / totalDisciplinas).toFixed(1) : '0'
  }

  // Calcular total de faltas
  const calcularTotalFaltas = () => {
    let totalFaltas = 0
    boletinsFiltrados.forEach((boletim) => {
      boletim.disciplinas.forEach((disc) => {
        totalFaltas += disc.faltas
      })
    })
    return totalFaltas
  }

  const mediaGeral = calcularMediaGeral()
  const totalFaltas = calcularTotalFaltas()

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#134E4A] flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-[#14B8A6]" />
            Boletim Escolar
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Acompanhe o desempenho acadêmico de {alunoSelecionado.nome_social || alunoSelecionado.nome_completo}
          </p>
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          <Select value={anoSelecionado} onValueChange={setAnoSelecionado}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
            </SelectContent>
          </Select>

          <Select value={bimestreSelecionado} onValueChange={setBimestreSelecionado}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos bimestres</SelectItem>
              <SelectItem value="1">1º Bimestre</SelectItem>
              <SelectItem value="2">2º Bimestre</SelectItem>
              <SelectItem value="3">3º Bimestre</SelectItem>
              <SelectItem value="4">4º Bimestre</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards de Resumo */}
      {boletinsFiltrados.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border border-[#E2E8F0] shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">
                Média Geral
              </CardTitle>
              <div className="h-9 w-9 rounded-lg bg-[#CCFBF1] flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-[#14B8A6]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-[#134E4A]">{mediaGeral}</div>
              <p className="text-[10px] text-[#64748B] mt-1 font-medium">
                {Number(mediaGeral) >= 7 ? (
                  <span className="text-emerald-600 font-bold">✓ Excelente</span>
                ) : Number(mediaGeral) >= 5 ? (
                  <span className="text-amber-600 font-bold">! Atenção</span>
                ) : (
                  <span className="text-red-600 font-bold">✗ Reforço</span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="border border-[#E2E8F0] shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">
                Total de Faltas
              </CardTitle>
              <div className="h-9 w-9 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-[#1E293B]">{totalFaltas}</div>
              <p className="text-[10px] text-[#64748B] mt-1 font-medium">
                {totalFaltas > 10 ? (
                  <span className="text-red-600 font-bold">Limite crítico</span>
                ) : totalFaltas > 5 ? (
                  <span className="text-amber-600 font-bold">Atenção</span>
                ) : (
                  <span className="text-emerald-600 font-bold">✓ Dentro do limite</span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="border border-[#E2E8F0] shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">
                Boletins
              </CardTitle>
              <div className="h-9 w-9 rounded-lg bg-[#CCFBF1] flex items-center justify-center">
                <FileText className="h-5 w-5 text-[#14B8A6]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-[#134E4A]">{boletinsFiltrados.length}</div>
              <p className="text-[10px] text-[#64748B] mt-1 font-medium">
                {bimestreSelecionado === 'todos' ? 'bimestres' : 'bimestre(s)'} cadastrados
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Boletins */}
      {boletimExibido.length === 0 ? (
        <Card className="border border-dashed border-slate-300 bg-slate-50">
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <GraduationCap className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700">Nenhum boletim encontrado</h3>
            <p className="text-sm text-slate-500 mt-1">
              Não há boletins cadastrados para {anoSelecionado}
              {bimestreSelecionado !== 'todos' && ` no ${bimestreSelecionado}º bimestre`}.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(boletimExibido as any[]).map((boletim) => (
            <Card key={boletim.id} className="border border-[#E2E8F0] shadow-md overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-[#134E4A]/5 to-[#14B8A6]/5 border-b border-[#E2E8F0]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[#14B8A6] flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-[#134E4A]">
                        {boletim.bimestre}º Bimestre - {boletim.ano_letivo}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Emitido em: {new Date(boletim.data_emissao || boletim.created_at).toLocaleDateString('pt-BR')}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs font-bold uppercase tracking-widest ${
                      boletim.status === 'ativo' || !boletim.status
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {boletim.status || 'Ativo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-[#E2E8F0]">
                      <tr>
                        <th className="text-left text-[10px] font-bold text-[#64748B] uppercase tracking-widest px-4 py-3">
                          Disciplina
                        </th>
                        <th className="text-center text-[10px] font-bold text-[#64748B] uppercase tracking-widest px-4 py-3">
                          Nota
                        </th>
                        <th className="text-center text-[10px] font-bold text-[#64748B] uppercase tracking-widest px-4 py-3">
                          Faltas
                        </th>
                        <th className="text-left text-[10px] font-bold text-[#64748B] uppercase tracking-widest px-4 py-3">
                          Observações
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(boletim.disciplinas as DisciplinaBoletim[]).map((disciplina, idx) => (
                        <tr
                          key={idx}
                          className={`border-b border-[#E2E8F0] last:border-0 hover:bg-slate-50 transition-colors ${
                            disciplina.nota < 5 ? 'bg-red-50/50' : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <span className="text-sm font-semibold text-[#1E293B]">
                              {disciplina.disciplina}
                            </span>
                          </td>
                          <td className="text-center px-4 py-3">
                            <Badge
                              className={`text-xs font-bold ${
                                disciplina.nota >= 7
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : disciplina.nota >= 5
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {disciplina.nota.toFixed(1)}
                            </Badge>
                          </td>
                          <td className="text-center px-4 py-3">
                            <span
                              className={`text-sm font-bold ${
                                disciplina.faltas > 10
                                  ? 'text-red-600'
                                  : disciplina.faltas > 5
                                  ? 'text-amber-600'
                                  : 'text-emerald-600'
                              }`}
                            >
                              {disciplina.faltas}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {disciplina.observacoes ? (
                              <span className="text-xs text-[#64748B] italic">
                                {disciplina.observacoes}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-300">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Observações Gerais */}
                {boletim.observacoes_gerais && (
                  <div className="bg-slate-50 border-t border-[#E2E8F0] px-4 py-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-[#14B8A6] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-1">
                          Observações Gerais
                        </p>
                        <p className="text-sm text-[#1E293B]">{boletim.observacoes_gerais}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Botão Voltar */}
      <div className="flex justify-center pt-4">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          className="border-[#14B8A6] text-[#14B8A6] hover:bg-[#14B8A6]/10"
        >
          Voltar ao Dashboard
        </Button>
      </div>
    </div>
  )
}
