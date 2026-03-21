/**
 * Hook de Rate Limiting para Login
 * 
 * Implementa limite de tentativas de login para prevenir ataques de força bruta.
 * 
 * USO:
 * const { checkAttempt, resetAttempts, getWaitTime } = useLoginRateLimit()
 * 
 * if (!checkAttempt()) {
 *   setError(`Muitas tentativas. Tente novamente em ${getWaitTime()} segundos`)
 *   return
 * }
 */

import { useCallback } from 'react'

const MAX_ATTEMPTS = 5
const WINDOW_MS = 60 * 60 * 1000 // 1 hora em milissegundos
const STORAGE_KEY = 'fluxoo_login_attempts'

interface AttemptData {
  attempts: number
  lastAttempt: number
  lockedUntil?: number
}

/**
 * Hook para rate limiting de login
 */
export function useLoginRateLimit() {
  /**
   * Obtém dados das tentativas do storage
   */
  const getAttempts = useCallback((): AttemptData | null => {
    try {
      const data = sessionStorage.getItem(STORAGE_KEY)
      if (!data) return null
      return JSON.parse(data)
    } catch {
      return null
    }
  }, [])

  /**
   * Salva dados das tentativas no storage
   */
  const saveAttempts = useCallback((data: AttemptData) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // Ignora erro de storage
    }
  }, [])

  /**
   * Limpa tentativas do storage
   */
  const resetAttempts = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignora erro
    }
  }, [])

  /**
   * Verifica se pode tentar login
   * @returns true se pode tentar, false se está bloqueado
   */
  const checkAttempt = useCallback((): boolean => {
    const now = Date.now()
    const data = getAttempts()

    // Primeira tentativa
    if (!data) {
      saveAttempts({ attempts: 1, lastAttempt: now })
      return true
    }

    // Verifica se está dentro da janela de tempo
    const windowStart = now - WINDOW_MS
    if (data.lastAttempt < windowStart) {
      // Janela expirou, reseta
      saveAttempts({ attempts: 1, lastAttempt: now })
      return true
    }

    // Verifica se está bloqueado
    if (data.lockedUntil && now < data.lockedUntil) {
      return false
    }

    // Verifica se excedeu limite
    if (data.attempts >= MAX_ATTEMPTS) {
      // Bloqueia por 1 hora
      const lockedUntil = now + WINDOW_MS
      saveAttempts({ attempts: data.attempts, lastAttempt: now, lockedUntil })
      return false
    }

    // Incrementa tentativa
    saveAttempts({ attempts: data.attempts + 1, lastAttempt: now })
    return true
  }, [getAttempts, saveAttempts])

  /**
   * Registra tentativa falha
   */
  const recordFailedAttempt = useCallback(() => {
    const now = Date.now()
    const data = getAttempts()

    if (!data) {
      saveAttempts({ attempts: 1, lastAttempt: now })
      return
    }

    // Se está dentro da janela
    const windowStart = now - WINDOW_MS
    if (data.lastAttempt >= windowStart) {
      const newAttempts = data.attempts + 1
      
      // Se atingiu limite, bloqueia
      if (newAttempts >= MAX_ATTEMPTS) {
        saveAttempts({
          attempts: newAttempts,
          lastAttempt: now,
          lockedUntil: now + WINDOW_MS
        })
      } else {
        saveAttempts({ attempts: newAttempts, lastAttempt: now })
      }
    } else {
      // Janela expirou, reseta
      saveAttempts({ attempts: 1, lastAttempt: now })
    }
  }, [getAttempts, saveAttempts])

  /**
   * Retorna tempo de espera em segundos
   */
  const getWaitTime = useCallback((): number => {
    const data = getAttempts()
    if (!data || !data.lockedUntil) return 0

    const now = Date.now()
    const remaining = data.lockedUntil - now

    return Math.max(0, Math.ceil(remaining / 1000))
  }, [getAttempts])

  /**
   * Retorna número de tentativas restantes
   */
  const getRemainingAttempts = useCallback((): number => {
    const data = getAttempts()
    if (!data) return MAX_ATTEMPTS

    const now = Date.now()
    const windowStart = now - WINDOW_MS

    // Janela expirou
    if (data.lastAttempt < windowStart) {
      return MAX_ATTEMPTS
    }

    return Math.max(0, MAX_ATTEMPTS - data.attempts)
  }, [getAttempts])

  return {
    checkAttempt,
    resetAttempts,
    recordFailedAttempt,
    getWaitTime,
    getRemainingAttempts,
  }
}
