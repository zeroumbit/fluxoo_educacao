/**
 * useSessionTimeout — Hook de timeout automático de sessão
 *
 * Configuração:
 * - Timeout: 60 minutos de inatividade
 * - Warning: 5 minutos antes do logout
 * - Eventos de atividade: mouse, teclado, scroll, touch
 *
 * LGPD: Limita exposição de dados sensíveis em sessões abandonadas.
 */

import { useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'

const TIMEOUT_MS      = 60 * 60 * 1000  // 60 minutos
const WARNING_BEFORE  = 5  * 60 * 1000  // avisar 5 min antes
const WARNING_AT      = TIMEOUT_MS - WARNING_BEFORE

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove', 'mousedown', 'keydown',
  'scroll', 'touchstart', 'click', 'focus',
]

export function useSessionTimeout() {
  const { authUser, signOut } = useAuth()
  const timeoutRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningToastRef = useRef<string | number | null>(null)
  const isActiveRef   = useRef(true)

  const clearTimers = useCallback(() => {
    if (timeoutRef.current)  clearTimeout(timeoutRef.current)
    if (warningRef.current)  clearTimeout(warningRef.current)
    timeoutRef.current  = null
    warningRef.current  = null
  }, [])

  const resetTimer = useCallback(() => {
    if (!authUser || !isActiveRef.current) return

    clearTimers()

    // Descartar warning pendente se usuário voltou a ser ativo
    if (warningToastRef.current !== null) {
      toast.dismiss(warningToastRef.current)
      warningToastRef.current = null
    }

    // Timer de warning (55 min)
    warningRef.current = setTimeout(() => {
      warningToastRef.current = toast.warning(
        '⏰ Sua sessão expira em 5 minutos por inatividade.',
        {
          duration: WARNING_BEFORE,
          action: {
            label: 'Continuar',
            onClick: () => {
              resetTimer()
              warningToastRef.current = null
            },
          },
        }
      )
    }, WARNING_AT)

    // Timer de logout (60 min)
    timeoutRef.current = setTimeout(async () => {
      isActiveRef.current = false
      toast.error('Sessão encerrada por inatividade. Faça login novamente.', {
        duration: 5000,
      })
      await signOut()
    }, TIMEOUT_MS)
  }, [authUser, clearTimers, signOut])

  // Detectar atividade do usuário
  const handleActivity = useCallback(() => {
    if (authUser) resetTimer()
  }, [authUser, resetTimer])

  useEffect(() => {
    // Não ativar para usuários não logados
    if (!authUser) {
      clearTimers()
      return
    }

    isActiveRef.current = true
    resetTimer()

    // Registrar listeners de atividade
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      clearTimers()
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [authUser, resetTimer, handleActivity, clearTimers])
}
