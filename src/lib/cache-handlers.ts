import type { QueryClient } from '@tanstack/react-query'
import { cacheEvents } from './cache-events'
import { QueryKeys } from './query-keys'

/**
 * Registra os listeners que irão reagir aos eventos de negócio e 
 * invalidar cirurgicamente as query keys do TanStack Query.
 *  
 * Vantagem: As telas só dão "publish", não precisam saber como invalidar.
 */
export function setupCacheHandlers(queryClient: QueryClient) {
  
  cacheEvents.subscribe('MATRICULA_CRIADA', (event) => {
    const { tenantId, turmaId, alunoId } = event.payload

    // 1. Atualiza Dashboards
    queryClient.invalidateQueries({ queryKey: QueryKeys.DASHBOARD })
    
    // 2. Invalida as views do acadêmico
    queryClient.invalidateQueries({ queryKey: QueryKeys.TURMAS.LIST(tenantId) })
    queryClient.invalidateQueries({ queryKey: QueryKeys.TURMAS.ALUNOS_COUNT(turmaId) })
    queryClient.invalidateQueries({ queryKey: ['alunos'] }) // TODO: Levar para QueryKeys tb

    // 3. Atualiza o Portal do Aluno
    queryClient.invalidateQueries({ queryKey: QueryKeys.PORTAL.ROOT })
  })

  cacheEvents.subscribe('MATRICULA_ATUALIZADA', (event) => {
    const { tenantId, turmaId } = event.payload
    queryClient.invalidateQueries({ queryKey: QueryKeys.DASHBOARD })
    queryClient.invalidateQueries({ queryKey: QueryKeys.TURMAS.LIST(tenantId) })
    queryClient.invalidateQueries({ queryKey: QueryKeys.TURMAS.ALUNOS_COUNT(turmaId) })
  })

  cacheEvents.subscribe('ALUNO_ATUALIZADO', (event) => {
    const { tenantId, alunoId } = event.payload
    // Invalida detalhe do aluno onde quer que ele esteja sendo cacheado
    queryClient.invalidateQueries({ queryKey: QueryKeys.TURMAS.ALUNO(alunoId, tenantId) })
    queryClient.invalidateQueries({ queryKey: QueryKeys.PORTAL.ROOT })
  })

  cacheEvents.subscribe('VINCULO_CRIADO', (event) => {
    const { responsavelId } = event.payload
    queryClient.invalidateQueries({ queryKey: QueryKeys.PORTAL.VINCULOS(responsavelId) })
  })

  cacheEvents.subscribe('COBRANCA_CRIADA', (event) => {
    const { alunoId } = event.payload
    queryClient.invalidateQueries({ queryKey: QueryKeys.PORTAL.COBRANCAS(alunoId) })
    queryClient.invalidateQueries({ queryKey: QueryKeys.DASHBOARD }) // Dashboard admin financeiro
  })
}
