const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  image: ['.jpg', '.jpeg', '.png', '.webp', '.svg'],
  document: ['.pdf', '.png', '.jpg', '.jpeg', '.webp'],
  csv: ['.csv'],
}

const MIME_MAP: Record<string, string[]> = {
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.webp': ['image/webp'],
  '.svg': ['image/svg+xml'],
  '.pdf': ['application/pdf'],
  '.csv': ['text/csv', 'application/vnd.ms-excel'],
}

function getExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 1).toLowerCase()
}

export function validateFileExtension(
  file: File,
  allowedExtensions: string[],
): { valid: true } | { valid: false; error: string } {
  let ext = getExtension(file.name)
  if (!ext.startsWith('.')) {
    ext = '.' + ext
  }
  // Se por acaso vier com múltiplos pontos iniciais (ex: ..png), removemos o excesso
  ext = '.' + ext.replace(/^\.+/, '')

  if (!allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `Tipo de arquivo "${ext}" não permitido. Permitidos: ${allowedExtensions.join(', ')}`,
    }
  }

  const expectedMimes = MIME_MAP[ext]
  // Se o tipo MIME estiver vazio, for genérico ou for uma variação conhecida (ex: image/x-png para png),
  // ou se o tipo MIME for válido, permitimos o arquivo.
  const isGenericMime = !file.type || file.type === 'application/octet-stream'
  const isPngVariation = ext === '.png' && file.type === 'image/x-png'
  
  if (expectedMimes && !isGenericMime && !isPngVariation && !expectedMimes.includes(file.type)) {
    return {
      valid: false,
      error: `Arquivo corrompido ou extensão incorreta. Esperado: ${expectedMimes.join(' ou ')}`,
    }
  }

  return { valid: true }
}
