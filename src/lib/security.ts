/**
 * Utilitários de Segurança para o Fluxoo Edu
 * Focado em conformidade com LGPD para dados sensíveis em cache local.
 */

// Chave interna para ofuscação (Base para o XOR)
const INTERNAL_SALT = 'fluxoo-edu-2026-secure-vault'

/**
 * Criptografia simples (Síncrona) para rascunhos.
 * Nota: Protege contra leitura acidental e acesso físico casual.
 * Para segurança máxima em produção, recomenda-se Web Crypto API (Assíncrona).
 */
export const safeStorage = {
  encrypt: (data: any): string => {
    try {
      const text = JSON.stringify(data)
      const encoded = new TextEncoder().encode(text)
      const salt = new TextEncoder().encode(INTERNAL_SALT)
      
      const encrypted = encoded.map((byte, i) => byte ^ salt[i % salt.length])
      
      // Converte para Base64 de forma segura para rascunhos grandes
      let binary = ''
      for (let i = 0; i < encrypted.length; i++) {
        binary += String.fromCharCode(encrypted[i])
      }
      return btoa(binary)
    } catch (error) {
      console.error('Erro ao criptografar rascunho:', error)
      return ''
    }
  },

  decrypt: (cipherText: string): any => {
    if (!cipherText) return null
    try {
      // Limpa caracteres inválidos antes de decodificar
      const cleanText = cipherText
        .replace(/%[0-9A-F]{2}/gi, '') // Remove sequências URL-encoded
        .replace(/[^A-Za-z0-9+/=]/g, '') // Remove caracteres não-base64
        .trim()
      
      if (!cleanText) return null
      
      const binaryString = atob(cleanText)
      const encrypted = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        encrypted[i] = binaryString.charCodeAt(i)
      }
      
      const salt = new TextEncoder().encode(INTERNAL_SALT)
      const decrypted = new Uint8Array(encrypted.length)
      for (let i = 0; i < encrypted.length; i++) {
        decrypted[i] = encrypted[i] ^ salt[i % salt.length]
      }
      
      const text = new TextDecoder().decode(decrypted)
      return JSON.parse(text)
    } catch (error) {
      // Retorna null em vez de logar erro para dados corrompidos
      return null
    }
  }
}

/**
 * Validador de Rate Limit Client-side
 * Evita disparos acidentais múltiplos.
 */
const lastExecution: Record<string, number> = {}

export const checkRateLimit = (key: string, cooldownMs: number = 2000): boolean => {
  const now = Date.now()
  if (lastExecution[key] && now - lastExecution[key] < cooldownMs) {
    return false
  }
  lastExecution[key] = now
  return true
}
