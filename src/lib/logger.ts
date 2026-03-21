/**
 * Logger Centralizado - Segurança e Auditoria
 * 
 * Este módulo fornece uma interface segura para logging na aplicação,
 * garantindo que logs sensíveis não sejam exibidos em produção.
 * 
 * USO:
 * import { logger } from '@/lib/logger'
 * 
 * logger.info('Mensagem informativa')
 * logger.warn('Aviso importante')
 * logger.error('Erro crítico', error)
 * logger.debug('Debug detalhado')
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface Logger {
  debug: (...args: any[]) => void
  info: (...args: any[]) => void
  warn: (...args: any[]) => void
  error: (...args: any[]) => void
}

/**
 * Verifica se o logging está habilitado
 * - Em produção: apenas erros críticos
 * - Em desenvolvimento: todos os logs
 */
function isLogEnabled(level: LogLevel): boolean {
  // Em produção, apenas erros são logados
  if (import.meta.env.PROD) {
    return level === 'error'
  }
  
  // Em desenvolvimento, todos os logs são permitidos
  return true
}

/**
 * Sanitiza dados sensíveis antes de logar
 * Remove ou mascara informações sensíveis
 */
function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data
  }

  const sensitiveFields = [
    'password',
    'senha',
    'token',
    'accessToken',
    'refreshToken',
    'api_key',
    'apiKey',
    'secret',
    'cpf',
    'cnpj',
    'cartao',
    'cartão',
    'cvv',
    'codigo_seguranca',
  ]

  const sanitized = { ...data }

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '***REDACTED***'
    }
  }

  return sanitized
}

/**
 * Formata mensagem de log com timestamp e nível
 */
function formatMessage(level: LogLevel, message: string): string {
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`
  return `${prefix} ${message}`
}

/**
 * Logger centralizado
 */
export const logger: Logger = {
  debug: (...args: any[]) => {
    if (!isLogEnabled('debug')) return
    
    const [message, ...rest] = args
    console.debug(formatMessage('debug', String(message)), ...rest.map(sanitizeData))
  },

  info: (...args: any[]) => {
    if (!isLogEnabled('info')) return
    
    const [message, ...rest] = args
    console.info(formatMessage('info', String(message)), ...rest.map(sanitizeData))
  },

  warn: (...args: any[]) => {
    if (!isLogEnabled('warn')) return
    
    const [message, ...rest] = args
    console.warn(formatMessage('warn', String(message)), ...rest.map(sanitizeData))
  },

  error: (...args: any[]) => {
    if (!isLogEnabled('error')) return
    
    const [message, error, ...rest] = args
    
    // Em produção, loga apenas mensagem genérica
    if (import.meta.env.PROD) {
      console.error(formatMessage('error', 'Erro interno'))
      // Opcional: enviar para serviço de monitoramento (Sentry, etc.)
      return
    }

    // Em desenvolvimento, loga detalhes completos
    console.error(formatMessage('error', String(message)), error, ...rest.map(sanitizeData))
  },
}

/**
 * Hook para capturar erros globais e logar adequadamente
 */
export function setupErrorHandlers() {
  if (typeof window === 'undefined') return

  // Error handler global
  window.addEventListener('error', (event) => {
    logger.error('Erro global não tratado', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    })
  })

  // Promise rejection handler global
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Promise rejection não tratada', {
      reason: event.reason?.message || event.reason,
    })
  })
}
