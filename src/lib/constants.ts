/**
 * Constantes globais do sistema
 */

export const APP_CONFIG = {
  LOCALE: import.meta.env.VITE_LOCALE || 'pt-BR',
  CURRENCY: import.meta.env.VITE_CURRENCY || 'BRL',
  TIMEZONE: 'America/Sao_Paulo',
}

export const API_URLS = {
  VIACEP: 'https://viacep.com.br/ws',
  IBGE_MUNICIPIOS: 'https://servicodados.ibge.gov.br/api/v1/localidades/estados',
}

export const UI_CONFIG = {
  TOAST_DURATION: 3000,
  ANIMATION_DURATION: 200,
  DEBOUNCE_DELAY: 500,
  STATUS_RESET_DELAY: 2000,
}
