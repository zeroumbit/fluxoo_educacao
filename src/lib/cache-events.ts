/**
 * Dicionário de eventos do sistema e seus payloads.
 * Garantia em tempo de compilação de que não esqueceremos dados cruciais.
 */
export type CacheEvents = {
  MATRICULA_CRIADA: { matriculaId: string; tenantId: string; turmaId: string; alunoId: string }
  MATRICULA_ATUALIZADA: { matriculaId: string; tenantId: string; turmaId: string; status: string }
  ALUNO_CRIADO: { alunoId: string; tenantId: string }
  ALUNO_ATUALIZADO: { alunoId: string; tenantId: string; camposAlterados?: string[] }
  COBRANCA_CRIADA: { cobrancaId: string; tenantId: string; alunoId: string }
  COBRANCA_ATUALIZADA: { cobrancaId: string; tenantId: string; alunoId: string }
  VINCULO_CRIADO: { alunoId: string; responsavelId: string; tenantId: string }
}

export type CacheEventType = keyof CacheEvents

export interface CacheEventMessage<K extends CacheEventType> {
  type: K
  payload: CacheEvents[K]
  timestamp: number
}

type EventCallback<K extends CacheEventType> = (event: CacheEventMessage<K>) => void

class TypedCacheEventBus {
  private listeners = new Map<CacheEventType, Set<Function>>()

  subscribe<K extends CacheEventType>(type: K, callback: EventCallback<K>) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)!.add(callback)
    
    // Retorna função de unsubscribe
    return () => {
      this.listeners.get(type)?.delete(callback)
    }
  }

  publish<K extends CacheEventType>(type: K, payload: CacheEvents[K]) {
    const eventMessage: CacheEventMessage<K> = {
      type,
      payload,
      timestamp: Date.now()
    }
    
    // Opcional: Console log para dev mode ajuda a debugar "invalidações fantasmas"
    if (import.meta.env.DEV) {
      console.log(`[CacheEventBus] 🚀 Evento Disparado: ${type}`, payload)
    }

    this.listeners.get(type)?.forEach(cb => cb(eventMessage))
  }
}

export const cacheEvents = new TypedCacheEventBus()
