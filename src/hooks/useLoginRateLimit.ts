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

const MAX_ATTEMPTS = 30
const WARNING_ATTEMPTS = 20
const WINDOW_MS = 15 * 60 * 1000 // 15 minutos
const LOCK_MS = 15 * 60 * 1000
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
      return true
    }

    // Verifica se está dentro da janela de tempo
    const windowStart = now - WINDOW_MS
    if (data.lastAttempt < windowStart) {
      return true
    }

    // Verifica se está bloqueado
    if (data.lockedUntil && now < data.lockedUntil) {
      return false
    }

    // Verifica se excedeu limite
    if (data.attempts >= MAX_ATTEMPTS) {
      const lockedUntil = now + LOCK_MS
      saveAttempts({ attempts: data.attempts, lastAttempt: now, lockedUntil })
      return false
    }

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
          lockedUntil: now + LOCK_MS
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

  const shouldDelayAttempt = useCallback((): boolean => {
    const data = getAttempts()
    if (!data) return false

    const now = Date.now()
    const windowStart = now - WINDOW_MS
    return data.lastAttempt >= windowStart && data.attempts >= WARNING_ATTEMPTS
  }, [getAttempts])

  return {
    checkAttempt,
    resetAttempts,
    recordFailedAttempt,
    getWaitTime,
    getRemainingAttempts,
    shouldDelayAttempt,
  }
}
