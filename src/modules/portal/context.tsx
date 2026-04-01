import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useResponsavel, useVinculosAtivos, useDashboardFamilia } from './hooks'
import { supabase } from '@/lib/supabase'
import { usePortalStore } from './store'
import { useQueryClient } from '@tanstack/react-query'

interface AlunoVinculado {
  id: string
  nome_completo: string
  nome_social: string | null
  data_nascimento: string
  status: string
  tenant_id: string
  filial_id: string | null
  turma_id: string | null
  foto_url: string | null
  turma: { id: string; nome: string; turno: string; horario?: string | null; valor_mensalidade?: number | null } | null
  filial: { nome_unidade: string } | null
  valor_matricula: number | null
  // Campos Adicionais para Cadastro
  genero?: string | null
  cep?: string | null
  logradouro?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cidade?: string | null
  estado?: string | null
  patologias?: string[] | null
  medicamentos?: string[] | null
  observacoes_saude?: string | null
}

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
  
  // Zustand Persist
  const { alunoSelecionado, setAlunoSelecionado, clearStore } = usePortalStore()
  const tenantId = alunoSelecionado?.tenant_id || null

  // Efeito de Validação e Auto-seleção
  useEffect(() => {
    // Se não há responsável logado (sessão expirou ou limpou), garante que o store está limpo
    if (!loadingResp && !responsavel) {
      console.log('PortalContext: Nenhum responsável encontrado, limpando store.');
      clearStore()
      return
    }

    if (vinculos && vinculos.length > 0) {
      const idsVinculos = vinculos.map(v => v.aluno_id || v.aluno?.id)
      
      // Validação: Se o aluno no cache não pertence mais a este responsável, limpa e seleciona o primeiro
      const alunoNoCacheInvalido = alunoSelecionado && !idsVinculos.includes(alunoSelecionado.id)
      
      if (!alunoSelecionado || alunoNoCacheInvalido) {
        console.log('PortalContext: Aluno cache inválido ou inexistente. Selecionando primeiro vínculo.');
        carregarDadosCompletos(vinculos[0])
      } else if (!alunoSelecionado.turma) {
        // Se já está selecionado mas faltam dados (turma), reidrata
        const v = vinculos.find(v => (v.aluno_id || v.aluno?.id) === alunoSelecionado.id)
        if (v) {
          console.log('PortalContext: Reidratando dados do aluno:', v.aluno?.nome_completo);
          carregarDadosCompletos(v)
        }
      }
    }

    async function carregarDadosCompletos(vinculo: any) {
      if (!vinculo?.aluno || !vinculo?.aluno?.id) {
        console.warn('PortalContext: Vínculo ou aluno inválido fornecido para carga completa.');
        return;
      }

      console.log('PortalContext: Carregando dados completos para:', vinculo.aluno.nome_completo);
      
      try {
        // Buscar matrícula e turmas (fallback 1) em paralelo
        const [resMatricula, resTurmaFallback] = await Promise.all([
          (supabase.from('matriculas' as any) as any)
            .select('turno, serie_ano, ano_letivo, valor_matricula, turma_id')
            .eq('aluno_id', vinculo.aluno.id)
            .eq('status', 'ativa')
            .maybeSingle(),
          (supabase.from('turmas' as any) as any)
            .select('id, nome, turno, valor_mensalidade')
            .eq('tenant_id', vinculo.aluno.tenant_id)
            .contains('alunos_ids', [vinculo.aluno.id])
            .maybeSingle()
        ])

        const matricula = resMatricula.data
        let turma = resTurmaFallback.data

        // Se encontrou matricula com turma_id, e não temos turma ainda (ou queremos a prioritária)
        if (matricula?.turma_id) {
          const { data: turmaData } = await (supabase.from('turmas' as any) as any)
            .select('id, nome, turno, valor_mensalidade')
            .eq('id', matricula.turma_id)
            .maybeSingle()
          if (turmaData) turma = turmaData
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
        
        console.log('PortalContext: Dados carregados com sucesso para:', alunoCompleto.nome_completo);
        setAlunoSelecionado(alunoCompleto)
      } catch (err) {
        console.error('PortalContext: Erro crítico ao carregar dados do aluno:', err)
        setAlunoSelecionado(vinculo.aluno)
      }
    }
  }, [vinculos, responsavel, loadingResp, setAlunoSelecionado, clearStore])

  const selecionarAluno = async (vinculo: any) => {
    if (vinculo.aluno) {
      console.log('PortalContext: Usuário selecionou manualmente aluno:', vinculo.aluno.nome_completo);
      // Optimistic Update
      setAlunoSelecionado({
        ...vinculo.aluno,
        turma: null,
        valor_matricula: null
      })

      try {
        const [resMatricula, resTurmaFallback] = await Promise.all([
          (supabase.from('matriculas' as any) as any)
            .select('turno, serie_ano, ano_letivo, valor_matricula, turma_id')
            .eq('aluno_id', vinculo.aluno.id)
            .eq('status', 'ativa')
            .maybeSingle(),
          (supabase.from('turmas' as any) as any)
            .select('id, nome, turno, valor_mensalidade')
            .eq('tenant_id', vinculo.aluno.tenant_id)
            .contains('alunos_ids', [vinculo.aluno.id])
            .maybeSingle()
        ])

        const matricula = resMatricula.data
        let turma = resTurmaFallback.data

        if (matricula?.turma_id) {
          const { data: turmaData } = await (supabase.from('turmas' as any) as any)
            .select('id, nome, turno, valor_mensalidade')
            .eq('id', matricula.turma_id)
            .maybeSingle()
          if (turmaData) turma = turmaData
        }

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
        console.error('PortalContext: Erro ao selecionar aluno:', err)
      }
    }
  }

  const isMultiAluno = (vinculos?.length || 0) > 1

  // Loading estado: verdadeiro se estamos carregando o básico ou se temos vínculos mas ainda não definimos o aluno selecionado no store
  const isInitializing = !!(vinculos && vinculos.length > 0 && Array.isArray(vinculos) && !alunoSelecionado)
  const contextLoading = !!(loadingResp || loadingVinculos || isInitializing)

  const queryClient = useQueryClient()
  const refreshData = async () => {
    console.log('PortalContext: Invalidando caches (Refresh Data)...');
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
