/**
 * Utilitarios de seguranca para o Fluxoo Edu.
 * Focado em reduzir exposicao de dados sensiveis em cache local.
 */

const STORAGE_VERSION = 'v2'
const LEGACY_INTERNAL_SALT = 'fluxoo-edu-2026-secure-vault'
const KEY_CONTEXT = 'fluxoo-edu-local-drafts'

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function getDraftCryptoKey(): Promise<CryptoKey> {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'server'
  const projectUrl = import.meta.env.VITE_SUPABASE_URL || 'local'
  const material = new TextEncoder().encode(`${KEY_CONTEXT}:${origin}:${projectUrl}`)
  const digest = await crypto.subtle.digest('SHA-256', material)

  return crypto.subtle.importKey(
    'raw',
    digest,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  )
}

function decryptLegacyDraft(cipherText: string): any {
  try {
    const cleanText = cipherText
      .replace(/%[0-9A-F]{2}/gi, '')
      .replace(/[^A-Za-z0-9+/=]/g, '')
      .trim()

    if (!cleanText) return null

    const encrypted = base64ToBytes(cleanText)
    const salt = new TextEncoder().encode(LEGACY_INTERNAL_SALT)
    const decrypted = new Uint8Array(encrypted.length)
    for (let i = 0; i < encrypted.length; i++) {
      decrypted[i] = encrypted[i] ^ salt[i % salt.length]
    }

    return JSON.parse(new TextDecoder().decode(decrypted))
  } catch {
    return null
  }
}

/**
 * Criptografia de rascunhos locais com Web Crypto API.
 * Mantem leitura do formato legado para nao descartar rascunhos existentes.
 */
export const safeStorage = {
  encrypt: async (data: any): Promise<string> => {
    try {
      if (!crypto?.subtle) return ''

      const iv = crypto.getRandomValues(new Uint8Array(12))
      const key = await getDraftCryptoKey()
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        new TextEncoder().encode(JSON.stringify(data))
      )

      return `${STORAGE_VERSION}:${bytesToBase64(iv)}:${bytesToBase64(new Uint8Array(encrypted))}`
    } catch {
      return ''
    }
  },

  decrypt: async (cipherText: string): Promise<any> => {
    if (!cipherText) return null

    try {
      if (!cipherText.startsWith(`${STORAGE_VERSION}:`)) {
        return decryptLegacyDraft(cipherText)
      }

      if (!crypto?.subtle) return null

      const [, ivText, payloadText] = cipherText.split(':')
      if (!ivText || !payloadText) return null

      const key = await getDraftCryptoKey()
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: base64ToBytes(ivText) },
        key,
        base64ToBytes(payloadText)
      )

      return JSON.parse(new TextDecoder().decode(decrypted))
    } catch {
      return null
    }
  }
}

/**
 * Validador de Rate Limit Client-side.
 * Evita disparos acidentais multiplos.
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
