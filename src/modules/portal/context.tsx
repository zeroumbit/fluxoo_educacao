import { supabase } from '@/lib/supabase'
import type { AlunoVinculado } from '@/types/shared'
import { useQueryClient } from '@tanstack/react-query'
import { createContext,useContext,useEffect,useMemo,type ReactNode } from 'react'
import { useResponsavel,useVinculosAtivos } from './hooks'
import { portalService } from './service'
import { usePortalStore } from './store'

interface PortalContextType {
  responsavel: any | null
  responsaveis: any[]
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
  const { data: responsaveisData, isLoading: loadingResp } = useResponsavel()
  const { data: vinculos, isLoading: loadingVinculos } = useVinculosAtivos()
  const { alunoSelecionado, setAlunoSelecionado, clearStore } = usePortalStore()

  // Normaliza responsaveis para sempre ser um array
  const responsaveis = useMemo(() => {
    if (!responsaveisData) return []
    return Array.isArray(responsaveisData) ? responsaveisData : [responsaveisData]
  }, [responsaveisData])

  // Deriva o responsável "ativo" baseado no tenant do aluno selecionado
  const responsavel = useMemo(() => {
    if (responsaveis.length === 0) return null
    if (!alunoSelecionado) return responsaveis[0]
    
    // Tenta encontrar o perfil do responsável que pertence à mesma escola do aluno
    const perfilLocal = responsaveis.find(r => r.tenant_id === alunoSelecionado.tenant_id)
    return perfilLocal || responsaveis[0]
  }, [responsaveis, alunoSelecionado])

  const tenantId = alunoSelecionado?.tenant_id || null
  const alunoId = alunoSelecionado?.id || null

  useEffect(() => {
    let active = true

    async function carregarDadosCompletos(vinculo: any) {
      if (!vinculo?.aluno || !vinculo?.aluno?.id) return

      try {
        const alunoCompleto = await portalService.enriquecerVinculoAluno(vinculo)
        if (active) setAlunoSelecionado(alunoCompleto)
      } catch (err) {
        console.error('PortalContext: Erro crítico ao carregar dados do aluno:', err)
        if (active) setAlunoSelecionado(vinculo.aluno)
      }
    }

    if (!loadingResp && responsaveis.length === 0) {
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
  }, [vinculos, responsaveis, loadingResp, setAlunoSelecionado, clearStore, alunoSelecionado?.id])

  const selecionarAluno = async (vinculo: any) => {
    if (!vinculo?.aluno) return

    setAlunoSelecionado({
      ...vinculo.aluno,
      codigo_transferencia: vinculo.aluno?.codigo_transferencia || null,
      turma: vinculo.aluno.turma || null,
      valor_matricula: null
    })

    try {
        const alunoCompleto = await portalService.enriquecerVinculoAluno(vinculo)
        setAlunoSelecionado(alunoCompleto)
      } catch (err) {
        console.error('PortalContext: Erro ao selecionar aluno:', err)
      }
  }

  const isMultiAluno = (vinculos?.length || 0) > 1
  const isInitializing = !!(vinculos && vinculos.length > 0 && Array.isArray(vinculos) && !alunoSelecionado)
  const contextLoading = !!(loadingResp || loadingVinculos || isInitializing)

  const queryClient = useQueryClient()

  useEffect(() => {
    if (!tenantId || !alunoId) return

    const invalidatePortalData = () => {
      queryClient.invalidateQueries({ queryKey: ['portal'] })
    }

    const channel = supabase
      .channel(`portal-realtime-${tenantId}-${alunoId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'frequencias', filter: `aluno_id=eq.${alunoId}` }, invalidatePortalData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'boletins', filter: `aluno_id=eq.${alunoId}` }, invalidatePortalData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'avaliacoes_notas', filter: `aluno_id=eq.${alunoId}` }, invalidatePortalData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cobrancas', filter: `aluno_id=eq.${alunoId}` }, invalidatePortalData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transferencias_escolares', filter: `aluno_id=eq.${alunoId}` }, invalidatePortalData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notificacoes', filter: `tenant_id=eq.${tenantId}` }, invalidatePortalData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mural_avisos', filter: `tenant_id=eq.${tenantId}` }, invalidatePortalData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'atividades', filter: `tenant_id=eq.${tenantId}` }, invalidatePortalData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documentos_emitidos', filter: `aluno_id=eq.${alunoId}` }, invalidatePortalData)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenantId, alunoId, queryClient])

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
        responsavel,
        responsaveis,
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
