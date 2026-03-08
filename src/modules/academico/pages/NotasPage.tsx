import { useState, useEffect } from 'react'
import { useAuth } from '@/modules/auth/AuthContext'
import { useTurmas } from '@/modules/turmas/hooks'
import { useDisciplinas } from '@/modules/livros/hooks'
import { useBoletinsPorTurma, useUpsertNota } from '../hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Save, GraduationCap, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export function NotasPage() {
  const { authUser } = useAuth()
  const { data: turmas, isLoading: isLoadingTurmas } = useTurmas()
  const { data: disciplinas, isLoading: isLoadingDisciplinas } = useDisciplinas()
  
  const [turmaId, setTurmaId] = useState<string>('')
  const [alunoId, setAlunoId] = useState<string>('all')
  const [disciplinaNome, setDisciplinaNome] = useState<string>('')
  const [bimestre, setBimestre] = useState<string>('1')
  const [anoLetivo] = useState<number>(new Date().getFullYear())
  
  const { data: boletins, isLoading: isLoadingBoletins, refetch } = useBoletinsPorTurma(
    turmaId, 
    anoLetivo, 
    Number(bimestre)
  )
  
  const { mutateAsync: upsertNota, isPending: isSaving } = useUpsertNota()

  // Estado local para as notas da tabela (para edição rápida)
  const [notasLocais, setNotasLocais] = useState<Record<string, { nota: string, faltas: string, observacoes: string }>>({})
  const [selecionados, setSelecionados] = useState<string[]>([])
  
  // Inputs globais para aplicação em massa
  const [globalNota, setGlobalNota] = useState<string>('')
  const [globalFaltas, setGlobalFaltas] = useState<string>('')
  const [globalObs, setGlobalObs] = useState<string>('')

  // Sincronizar notas locais quando os boletins carregarem
  useEffect(() => {
    if (boletins && disciplinaNome) {
      const novasNotas: Record<string, { nota: string, faltas: string, observacoes: string }> = {}
      boletins.forEach((bol: any) => {
        const disc = bol.disciplinas?.find((d: any) => d.disciplina === disciplinaNome)
        if (disc) {
          novasNotas[bol.aluno_id] = {
            nota: disc.nota.toString(),
            faltas: disc.faltas.toString(),
            observacoes: disc.observacoes || ''
          }
        }
      })
      setNotasLocais(novasNotas)
    }
  }, [boletins, disciplinaNome])

  const handleNotaChange = (alunoId: string, campo: 'nota' | 'faltas' | 'observacoes', valor: string) => {
    setNotasLocais(prev => ({
      ...prev,
      [alunoId]: {
        ...(prev[alunoId] || { nota: '', faltas: '0', observacoes: '' }),
        [campo]: valor
      }
    }))
  }

  const aplicarMassa = () => {
    if (selecionados.length === 0) {
      toast.error('Selecione ao menos um aluno')
      return
    }

    setNotasLocais(prev => {
      const novo = { ...prev }
      selecionados.forEach(id => {
        novo[id] = {
          nota: globalNota || (novo[id]?.nota || ''),
          faltas: globalFaltas || (novo[id]?.faltas || '0'),
          observacoes: globalObs || (novo[id]?.observacoes || '')
        }
      })
      return novo
    })
    toast.success(`Aplicado a ${selecionados.length} alunos`)
  }

  const alternarSelecao = (alunoId: string) => {
    setSelecionados(prev => 
      prev.includes(alunoId) ? prev.filter(id => id !== alunoId) : [...prev, alunoId]
    )
  }

  const selecionarTodosVisiveis = (alunosVisiveis: any[]) => {
    if (selecionados.length > 0 && selecionados.length === alunosVisiveis.length) {
      setSelecionados([])
    } else {
      setSelecionados(alunosVisiveis.map(a => a.id))
    }
  }

  const salvarTodas = async () => {
    if (!turmaId || !disciplinaNome) {
      toast.error('Selecione uma turma e uma disciplina')
      return
    }

    try {
      const promises = Object.entries(notasLocais).map(([alunoId, dados]) => {
        return upsertNota({
          boletimBase: {
            tenant_id: authUser?.tenantId,
            aluno_id: alunoId,
            turma_id: turmaId,
            ano_letivo: anoLetivo,
            bimestre: Number(bimestre)
          },
          disciplina: disciplinaNome,
          nota: parseFloat(dados.nota.replace(',', '.')),
          faltas: parseInt(dados.faltas),
          observacoes: dados.observacoes
        })
      })

      await Promise.all(promises)
      toast.success('Notas salvas com sucesso!')
      refetch()
    } catch (error: any) {
      toast.error('Erro ao salvar notas: ' + error.message)
    }
  }

  const { data: todosAlunos, isLoading: isLoadingAlunos } = useQuery({
    queryKey: ['alunos_turma', turmaId],
    queryFn: async (): Promise<any[]> => {
        // 1. Buscamos a turma para pegar o array de alunos_ids
        const { data: turma, error: errTurma } = await supabase
          .from('turmas')
          .select('alunos_ids')
          .eq('id', turmaId)
          .single()
          
        if (errTurma) throw errTurma
        if (!turma?.alunos_ids || turma.alunos_ids.length === 0) return []

        // 2. Buscamos os alunos que pertencem a esses IDs
        const { data, error } = await supabase
          .from('alunos')
          .select('id, nome_completo')
          .in('id', turma.alunos_ids)
          .eq('status', 'ativo')
        
        if (error) throw error
        return data as any[]
    },
    enabled: !!turmaId
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-indigo-500" />
            Notas
          </h1>
          <p className="text-slate-500 font-medium">Gestão de desempenho acadêmico e sincronização com o Portal.</p>
        </div>
        
        <div className="flex items-center gap-2">
           <Button 
            onClick={salvarTodas} 
            disabled={isSaving || !turmaId || !disciplinaNome}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 px-6 rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-95 gap-2"
           >
             {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
             Salvar Todas as Notas
           </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[32px]">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Turma</label>
              <Select value={turmaId} onValueChange={(v) => { setTurmaId(v); setAlunoId('all'); }}>
                <SelectTrigger className="w-full bg-white border-slate-200 h-12 rounded-xl">
                  <SelectValue placeholder="Selecione a Turma" />
                </SelectTrigger>
                <SelectContent>
                  {turmas?.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Aluno</label>
              <Select value={alunoId} onValueChange={setAlunoId} disabled={!turmaId}>
                <SelectTrigger className="w-full bg-white border-slate-200 h-12 rounded-xl">
                  <SelectValue placeholder={!turmaId ? "Aguardando Turma..." : "Todos os Alunos"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Alunos</SelectItem>
                  {todosAlunos?.map((aluno: any) => (
                    <SelectItem key={aluno.id} value={aluno.id}>{aluno.nome_completo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Disciplina</label>
              <Select value={disciplinaNome} onValueChange={setDisciplinaNome}>
                <SelectTrigger className="w-full bg-white border-slate-200 h-12 rounded-xl">
                  <SelectValue placeholder="Selecione a Disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {disciplinas?.map((d: any) => (
                    <SelectItem key={d.id} value={d.nome}>{d.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Bimestre</label>
              <Select value={bimestre} onValueChange={setBimestre}>
                <SelectTrigger className="w-full bg-white border-slate-200 h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1º Bimestre</SelectItem>
                  <SelectItem value="2">2º Bimestre</SelectItem>
                  <SelectItem value="3">3º Bimestre</SelectItem>
                  <SelectItem value="4">4º Bimestre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Ano Letivo</label>
              <div className="flex items-center justify-center h-12 px-4 bg-slate-100 rounded-xl text-slate-500 font-bold border border-slate-200">
                {anoLetivo}
              </div>
            </div>
          </div>

          {/* Painel de Aplicação em Massa */}
          {turmaId && disciplinaNome && (
            <div className="mt-8 p-6 bg-indigo-50/50 rounded-[24px] border border-indigo-100/50 flex flex-col md:flex-row items-end gap-4 animate-in slide-in-from-top-2 duration-300">
              <div className="flex-1 w-full space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 ml-1">Nota Global</label>
                <Input 
                  placeholder="Ex: 8,5" 
                  value={globalNota} 
                  onChange={e => setGlobalNota(e.target.value)}
                  className="bg-white border-indigo-100 rounded-xl h-11"
                />
              </div>
              <div className="flex-1 w-full space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 ml-1">Faltas Globais</label>
                <Input 
                  type="number" 
                  placeholder="0" 
                  value={globalFaltas} 
                  onChange={e => setGlobalFaltas(e.target.value)}
                  className="bg-white border-indigo-100 rounded-xl h-11"
                />
              </div>
              <div className="flex-[2] w-full space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 ml-1">Obs. Global</label>
                <Input 
                  placeholder="Ex: Excelente participação" 
                  value={globalObs} 
                  onChange={e => setGlobalObs(e.target.value)}
                  className="bg-white border-indigo-100 rounded-xl h-11"
                />
              </div>
              <Button 
                onClick={aplicarMassa}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold h-11 px-6 rounded-xl shadow-md gap-2"
              >
                <CheckCircle2 size={18} />
                Aplicar aos Selecionados ({selecionados.length})
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {!turmaId || !disciplinaNome ? (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
               <div className="w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center text-slate-200">
                  <BookOpen size={40} />
               </div>
               <div className="max-w-xs transition-all animate-in fade-in slide-in-from-bottom-2">
                  <h3 className="text-lg font-bold text-slate-700">Aguardando Seleção</h3>
                  <p className="text-slate-500 text-sm mt-1">Selecione a Turma e a Disciplina para começar a lançar as notas.</p>
               </div>
            </div>
          ) : isLoadingBoletins ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/30 border-b border-slate-100">
                    <th className="w-16 px-8 py-4">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        checked={todosAlunos?.filter(a => alunoId === 'all' || a.id === alunoId).length > 0 && selecionados.length === todosAlunos?.filter(a => alunoId === 'all' || a.id === alunoId).length}
                        onChange={() => selecionarTodosVisiveis(todosAlunos?.filter(a => alunoId === 'all' || a.id === alunoId) || [])}
                      />
                    </th>
                    <th className="text-left px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Aluno</th>
                    <th className="text-center px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-32">Nota</th>
                    <th className="text-center px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-32">Faltas</th>
                    <th className="text-left px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Observações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(todosAlunos || [])?.filter(a => alunoId === 'all' || a.id === alunoId).map((aluno: any) => (
                    <tr key={aluno.id} className={`hover:bg-slate-50/50 transition-colors group ${selecionados.includes(aluno.id) ? 'bg-indigo-50/30' : ''}`}>
                      <td className="px-8 py-4">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          checked={selecionados.includes(aluno.id)}
                          onChange={() => alternarSelecao(aluno.id)}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                            {aluno.nome_completo.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-700">{aluno.nome_completo}</p>
                            <p className="text-[10px] text-slate-400 font-medium">ID: {aluno.id.split('-')[0]}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Input 
                          type="text"
                          placeholder="0,0"
                          value={notasLocais[aluno.id]?.nota || ''}
                          onChange={(e) => handleNotaChange(aluno.id, 'nota', e.target.value)}
                          className="text-center font-black text-indigo-600 focus:ring-indigo-500 rounded-xl h-11 border-slate-200"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <Input 
                          type="number"
                          placeholder="0"
                          value={notasLocais[aluno.id]?.faltas || ''}
                          onChange={(e) => handleNotaChange(aluno.id, 'faltas', e.target.value)}
                          className="text-center font-bold text-slate-600 focus:ring-indigo-500 rounded-xl h-11 border-slate-200"
                        />
                      </td>
                      <td className="px-8 py-4">
                        <Input 
                          placeholder="Ex: Ótimo desempenho"
                          value={notasLocais[aluno.id]?.observacoes || ''}
                          onChange={(e) => handleNotaChange(aluno.id, 'observacoes', e.target.value)}
                          className="bg-slate-50 border-transparent focus:bg-white focus:border-slate-200 rounded-xl h-11 text-sm text-slate-600"
                        />
                      </td>
                    </tr>
                  ))}
                  {(!todosAlunos || todosAlunos.length === 0) && (
                    <tr>
                      <td colSpan={4} className="py-24 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2 opacity-40">
                          <AlertCircle size={48} />
                          <p className="font-bold">Nenhum aluno encontrado nesta turma.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-[24px] flex items-start gap-4">
        <div className="p-3 bg-white rounded-2xl text-indigo-500 shadow-sm">
          <CheckCircle2 size={24} />
        </div>
        <div>
          <h4 className="font-bold text-indigo-900">Dica de Produtividade</h4>
          <p className="text-sm text-indigo-700/80 leading-relaxed mt-1">
            As notas são salvas apenas quando você clica em <strong>"Salvar Todas as Notas"</strong>. 
            Você pode navegar entre os campos usando a tecla TAB para preencher rapidamente.
          </p>
        </div>
      </div>
    </div>
  )
}

// Sub-query customizada para Alunos da Turma
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
