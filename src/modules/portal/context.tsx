import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useResponsavel, useVinculosAtivos, useDashboardFamilia } from './hooks'
import { supabase } from '@/lib/supabase'
import { usePortalStore } from './store'
import { useQueryClient } from '@tanstack/react-query'
import type { AlunoVinculado } from '@/types/shared'

interface PortalContextType {
  responsavel: any | null
  alunoSelecionado: AlunoVinculado | null
  tenantId: string | null
  vinculos: any[]
  selecionarAluno: (vinculo: any) => void
  refreshData: () => Promise<void>
  isMultiAluno: boolean
  isLoading: boolean
}

const PortalContext = createContext<PortalContextType | undefined>(undefined)

export function PortalProvider({ children }: { children: ReactNode }) {
  const { data: responsavel, isLoading: loadingResp } = useResponsavel()
  const { data: vinculos, isLoading: loadingVinculos } = useVinculosAtivos()
  const { alunoSelecionado, setAlunoSelecionado, clearStore } = usePortalStore()
  const tenantId = alunoSelecionado?.tenant_id || null

  useEffect(() => {
    let active = true

    async function carregarDadosCompletos(vinculo: any) {
      if (!vinculo?.aluno || !vinculo?.aluno?.id) return

      try {
        const [resMatricula, resTurmaFallback] = await Promise.all([
          supabase.from('matriculas')
            .select('turno, serie_ano, ano_letivo, valor_matricula, turma_id')
            .eq('aluno_id', vinculo.aluno.id)
            .eq('status', 'ativa')
            .maybeSingle(),
          supabase.from('turmas')
            .select('id, nome, turno, valor_mensalidade')
            .eq('tenant_id', vinculo.aluno.tenant_id)
            .contains('alunos_ids', [vinculo.aluno.id])
            .maybeSingle()
        ])

        if (!active) return

        const matricula = resMatricula.data
        let turma = resTurmaFallback.data

        if (matricula?.turma_id) {
          const { data: turmaData } = await supabase.from('turmas')
            .select('id, nome, turno, valor_mensalidade')
            .eq('id', matricula.turma_id)
            .maybeSingle()
          if (active && turmaData) turma = turmaData
        }

        if (!active) return

        if (!turma && matricula) {
          const { data: turmaNome } = await supabase.from('turmas')
            .select('id, nome, turno, valor_mensalidade')
            .eq('tenant_id', vinculo.aluno.tenant_id)
            .eq('nome', matricula.serie_ano)
            .or(`turno.eq.${matricula.turno},turno.eq.${matricula.turno === 'manha' ? 'matutino' : matricula.turno === 'tarde' ? 'vespertino' : matricula.turno}`)
            .maybeSingle()
          if (active) turma = turmaNome
        }

        if (!active) return

        const valorMensalidadeFinal = turma?.valor_mensalidade || (matricula ? matricula.valor_matricula : null)

        const alunoCompleto = {
          ...vinculo.aluno,
          codigo_transferencia: vinculo.aluno?.codigo_transferencia || null,
          turma: turma || (matricula ? {
            id: '',
            nome: matricula.serie_ano,
            turno: matricula.turno,
            valor_mensalidade: valorMensalidadeFinal
          } : null),
          valor_matricula: matricula?.valor_matricula || null
        }

        if (active) setAlunoSelecionado(alunoCompleto)
      } catch (err) {
        console.error('PortalContext: Erro crítico ao carregar dados do aluno:', err)
        if (active) setAlunoSelecionado(vinculo.aluno)
      }
    }

    if (!loadingResp && !responsavel) {
      clearStore()
    } else if (vinculos && vinculos.length > 0) {
      const idsVinculos = vinculos.map(v => v.aluno_id || v.aluno?.id)
      const alunoNoCacheInvalido = alunoSelecionado && !idsVinculos.includes(alunoSelecionado.id)
      
      if (!alunoSelecionado || alunoNoCacheInvalido) {
        carregarDadosCompletos(vinculos[0])
      } else if (!alunoSelecionado.turma || !alunoSelecionado.codigo_transferencia) {
        const v = vinculos.find(v => (v.aluno_id || v.aluno?.id) === alunoSelecionado.id)
        if (v) carregarDadosCompletos(v)
      }
    }

    return () => { active = false }
  }, [vinculos, responsavel, loadingResp, setAlunoSelecionado, clearStore, alunoSelecionado?.id, alunoSelecionado?.turma])

  const selecionarAluno = async (vinculo: any) => {
    if (!vinculo?.aluno) return

    // 1. Atualização Imediata (UI Reflete na hora)
    setAlunoSelecionado({
      ...vinculo.aluno,
      codigo_transferencia: vinculo.aluno?.codigo_transferencia || null,
      turma: vinculo.aluno.turma || null,
      valor_matricula: null
    })

    try {
      // 2. Busca dados complementares em background
        const [resMatricula, resTurmaFallback] = await Promise.all([
          supabase.from('matriculas')
            .select('turno, serie_ano, ano_letivo, valor_matricula, turma_id')
            .eq('aluno_id', vinculo.aluno.id)
            .eq('status', 'ativa')
            .maybeSingle(),
          supabase.from('turmas')
            .select('id, nome, turno, valor_mensalidade')
            .eq('tenant_id', vinculo.aluno.tenant_id)
            .contains('alunos_ids', [vinculo.aluno.id])
            .maybeSingle()
        ])

        const matricula = resMatricula.data
        let turma = resTurmaFallback.data

        if (matricula?.turma_id) {
          const { data: turmaData } = await supabase.from('turmas')
            .select('id, nome, turno, valor_mensalidade')
            .eq('id', matricula.turma_id)
            .maybeSingle()
          if (turmaData) turma = turmaData
        }

        if (!turma && matricula) {
          const { data: turmaNome } = await supabase.from('turmas')
            .select('id, nome, turno, valor_mensalidade')
            .eq('tenant_id', vinculo.aluno.tenant_id)
            .eq('nome', matricula.serie_ano)
            .or(`turno.eq.${matricula.turno},turno.eq.${matricula.turno === 'manha' ? 'matutino' : matricula.turno === 'tarde' ? 'vespertino' : matricula.turno}`)
            .maybeSingle()
          turma = turmaNome
        }

        const valorMensalidadeFinal = turma?.valor_mensalidade || (matricula ? matricula.valor_matricula : null)

        const alunoCompleto = {
          ...vinculo.aluno,
          codigo_transferencia: vinculo.aluno?.codigo_transferencia || null,
          turma: turma || (matricula ? {
            id: '',
            nome: matricula.serie_ano,
            turno: matricula.turno,
            valor_mensalidade: valorMensalidadeFinal
          } : null),
          valor_matricula: matricula?.valor_matricula || null
        }

        setAlunoSelecionado(alunoCompleto)
      } catch (err) {
        console.error('PortalContext: Erro ao selecionar aluno:', err)
      }
  }

  const isMultiAluno = (vinculos?.length || 0) > 1
  const isInitializing = !!(vinculos && vinculos.length > 0 && Array.isArray(vinculos) && !alunoSelecionado)
  const contextLoading = !!(loadingResp || loadingVinculos || isInitializing)

  const queryClient = useQueryClient()
  const refreshData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['portal', 'responsavel'] }),
      queryClient.invalidateQueries({ queryKey: ['portal', 'vinculos'] }),
      queryClient.invalidateQueries({ queryKey: ['portal', 'aluno-completo'] }),
      queryClient.invalidateQueries({ queryKey: ['portal', 'dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['portal', 'dashboard-familia'] })
    ])
  }

  return (
    <PortalContext.Provider
      value={{
        responsavel: responsavel || null,
        alunoSelecionado,
        tenantId,
        vinculos: vinculos || [],
        selecionarAluno,
        refreshData,
        isMultiAluno,
        isLoading: contextLoading,
      }}
    >
      {children}
    </PortalContext.Provider>
  )
}

export function usePortalContext() {
  const context = useContext(PortalContext)
  if (!context) {
    throw new Error('usePortalContext deve ser usado dentro de PortalProvider')
  }
  return context
}
