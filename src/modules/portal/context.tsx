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
  
  // Usar Zustand Persist para carregar instantaneamente o estado (PWA Hydration)
  const { alunoSelecionado, setAlunoSelecionado } = usePortalStore()
  const tenantId = alunoSelecionado?.tenant_id || null

  useEffect(() => {
    async function carregarDadosCompletos(vinculo: any) {
      if (!vinculo?.aluno) return

      // Tentar pegar matrícula ativa
      const { data: matricula } = await (supabase.from('matriculas' as any) as any)
         .select('turno, serie_ano, ano_letivo, valor_matricula, valor_mensalidade') // Add valor_mensalidade if exists
         .eq('aluno_id', vinculo.aluno.id)
         .eq('status', 'ativa')
         .maybeSingle()
      
      // Buscar turma que contém o aluno
      const { data: turma } = await (supabase.from('turmas' as any) as any)
        .select('id, nome, turno, valor_mensalidade')
        .eq('tenant_id', vinculo.aluno.tenant_id)
        .contains('alunos_ids', [vinculo.aluno.id])
        .maybeSingle()
      
      const valorMensalidadeFinal = turma?.valor_mensalidade || (matricula ? (matricula.valor_mensalidade || matricula.valor_matricula) : null)

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
    }

    // Só auto-seleciona se AINDA não tiver aluno persistido no cache ou se a lista de vinculos carregou e nada estava selecionado
    if (vinculos && vinculos.length > 0 && !alunoSelecionado) {
      carregarDadosCompletos(vinculos[0])
    }
  }, [vinculos, alunoSelecionado, setAlunoSelecionado])

  const selecionarAluno = async (vinculo: any) => {
    if (vinculo.aluno) {
      // Optimistic Update para UX instantânea
      setAlunoSelecionado({ 
        ...vinculo.aluno, 
        turma: null, // skeleton mode temporary
        valor_matricula: null 
      })

      // Background Fetch para obter dados da sub-entidade
      const { data: matricula } = await (supabase.from('matriculas' as any) as any)
         .select('turno, serie_ano, ano_letivo, valor_matricula, valor_mensalidade')
         .eq('aluno_id', vinculo.aluno.id)
         .eq('status', 'ativa')
         .maybeSingle()
      
      const { data: turma } = await (supabase.from('turmas' as any) as any)
        .select('id, nome, turno, valor_mensalidade')
        .eq('tenant_id', vinculo.aluno.tenant_id)
        .contains('alunos_ids', [vinculo.aluno.id])
        .maybeSingle()

      const valorMensalidadeFinal = turma?.valor_mensalidade || (matricula ? (matricula.valor_mensalidade || matricula.valor_matricula) : null)

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
    }
  }

  const isMultiAluno = (vinculos?.length || 0) > 1

  return (
    <PortalContext.Provider
      value={{
        responsavel: responsavel || null,
        alunoSelecionado,
        tenantId,
        vinculos: vinculos || [],
        selecionarAluno,
        isMultiAluno,
        isLoading: loadingResp || loadingVinculos,
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
