import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useResponsavel, useVinculosAtivos } from './hooks'
import { supabase } from '@/lib/supabase'
import { usePortalStore } from './store'

interface AlunoVinculado {
  id: string
  nome_completo: string
  nome_social: string | null
  data_nascimento: string
  status: string
  tenant_id: string
  filial_id: string | null
  turma_id: string | null
  turma: { id: string; nome: string; turno: string; horario?: string | null; valor_mensalidade?: number | null } | null
  filial: { nome_unidade: string } | null
  valor_matricula: number | null
}

interface PortalContextType {
  responsavel: any | null
  alunoSelecionado: AlunoVinculado | null
  tenantId: string | null
  vinculos: any[]
  selecionarAluno: (vinculo: any) => void
  isMultiAluno: boolean
  isLoading: boolean
}

const PortalContext = createContext<PortalContextType | undefined>(undefined)

export function PortalProvider({ children }: { children: ReactNode }) {
  const { data: responsavel, isLoading: loadingResp } = useResponsavel()
  const { data: vinculos, isLoading: loadingVinculos } = useVinculosAtivos()
  
  // Zustand Persist
  const { alunoSelecionado, setAlunoSelecionado, clearStore } = usePortalStore()
  const tenantId = alunoSelecionado?.tenant_id || null

  // Efeito de Validação e Auto-seleção
  useEffect(() => {
    // Se não há responsável logado (sessão expirou ou limpou), garante que o store está limpo
    if (!loadingResp && !responsavel) {
      clearStore()
      return
    }

    if (vinculos && vinculos.length > 0) {
      const idsVinculos = vinculos.map(v => v.aluno_id || v.aluno?.id)
      
      // Validação: Se o aluno no cache não pertence mais a este responsável, limpa e seleciona o primeiro
      const alunoNoCacheInvalido = alunoSelecionado && !idsVinculos.includes(alunoSelecionado.id)
      
      if (!alunoSelecionado || alunoNoCacheInvalido) {
        carregarDadosCompletos(vinculos[0])
      } else if (!alunoSelecionado.turma) {
        // Se já está selecionado mas faltam dados (turma), reidrata
        const v = vinculos.find(v => (v.aluno_id || v.aluno?.id) === alunoSelecionado.id)
        if (v) carregarDadosCompletos(v)
      }
    }

    async function carregarDadosCompletos(vinculo: any) {
      if (!vinculo?.aluno) return

      try {
        // Tentar pegar matrícula ativa COM TURMA_VINCULO
        const { data: matricula } = await (supabase.from('matriculas' as any) as any)
           .select('turno, serie_ano, ano_letivo, valor_matricula, turma_id')
           .eq('aluno_id', vinculo.aluno.id)
           .eq('status', 'ativa')
           .maybeSingle()

        let turma = null

        // PRIORIDADE 1: Buscar turma pelo turma_id da matrícula (migration 046)
        if (matricula?.turma_id) {
          const { data: turmaData } = await (supabase.from('turmas' as any) as any)
            .select('id, nome, turno, valor_mensalidade')
            .eq('id', matricula.turma_id)
            .maybeSingle()
          turma = turmaData
        }

        // PRIORIDADE 2: Fallback - buscar turma que contém o aluno no alunos_ids
        if (!turma) {
          const { data: turmaFallback } = await (supabase.from('turmas' as any) as any)
            .select('id, nome, turno, valor_mensalidade')
            .eq('tenant_id', vinculo.aluno.tenant_id)
            .contains('alunos_ids', [vinculo.aluno.id])
            .maybeSingle()
          turma = turmaFallback
        }

        // PRIORIDADE 3: Fallback final - buscar turma por nome/turno
        if (!turma && matricula) {
          const { data: turmaNome } = await (supabase.from('turmas' as any) as any)
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
        console.error('Erro ao carregar dados do aluno:', err)
        // Em caso de erro, pelo menos define o básico
        setAlunoSelecionado(vinculo.aluno)
      }
    }
  }, [vinculos, responsavel, loadingResp, alunoSelecionado?.id, setAlunoSelecionado, clearStore])

  const selecionarAluno = async (vinculo: any) => {
    if (vinculo.aluno) {
      // Optimistic Update
      setAlunoSelecionado({
        ...vinculo.aluno,
        turma: null,
        valor_matricula: null
      })

      try {
        const { data: matricula } = await (supabase.from('matriculas' as any) as any)
           .select('turno, serie_ano, ano_letivo, valor_matricula, turma_id')
           .eq('aluno_id', vinculo.aluno.id)
           .eq('status', 'ativa')
           .maybeSingle()

        let turma = null

        // PRIORIDADE 1: Buscar turma pelo turma_id da matrícula (migration 046)
        if (matricula?.turma_id) {
          const { data: turmaData } = await (supabase.from('turmas' as any) as any)
            .select('id, nome, turno, valor_mensalidade')
            .eq('id', matricula.turma_id)
            .maybeSingle()
          turma = turmaData
        }

        // PRIORIDADE 2: Fallback - buscar turma que contém o aluno no alunos_ids
        if (!turma) {
          const { data: turmaFallback } = await (supabase.from('turmas' as any) as any)
            .select('id, nome, turno, valor_mensalidade')
            .eq('tenant_id', vinculo.aluno.tenant_id)
            .contains('alunos_ids', [vinculo.aluno.id])
            .maybeSingle()
          turma = turmaFallback
        }

        // PRIORIDADE 3: Fallback final - buscar turma por nome/turno
        if (!turma && matricula) {
          const { data: turmaNome } = await (supabase.from('turmas' as any) as any)
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
        console.error('Erro ao selecionar aluno:', err)
      }
    }
  }

  const isMultiAluno = (vinculos?.length || 0) > 1
  
  // Loading estado: verdadeiro se estamos carregando o básico ou se temos vínculos mas ainda não selecionamos nada
  const isInitializing = !!(vinculos && vinculos.length > 0 && !alunoSelecionado)
  const contextLoading = !!(loadingResp || loadingVinculos || isInitializing)

  return (
    <PortalContext.Provider
      value={{
        responsavel: responsavel || null,
        alunoSelecionado,
        tenantId,
        vinculos: vinculos || [],
        selecionarAluno,
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
