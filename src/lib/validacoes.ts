/**
 * Utilitários para máscaras e validações de campos
 */

// ==================== MÁSCARAS ====================

/**
 * Formata um valor numérico como CPF (000.000.000-00)
 */
export function mascaraCPF(valor: string): string {
  const numeros = valor.replace(/\D/g, '').slice(0, 11)
  
  if (numeros.length <= 3) return numeros
  if (numeros.length <= 6) return `${numeros.slice(0, 3)}.${numeros.slice(3)}`
  if (numeros.length <= 9) return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6)}`
  return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9)}`
}

/**
 * Formata um valor numérico como CNPJ (00.000.000/0000-00)
 */
export function mascaraCNPJ(valor: string): string {
  const numeros = valor.replace(/\D/g, '').slice(0, 14)
  
  if (numeros.length <= 2) return numeros
  if (numeros.length <= 5) return `${numeros.slice(0, 2)}.${numeros.slice(2)}`
  if (numeros.length <= 8) return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5)}`
  if (numeros.length <= 12) return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5, 8)}/${numeros.slice(8)}`
  return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5, 8)}/${numeros.slice(8, 12)}-${numeros.slice(12)}`
}

/**
 * Formata um valor numérico como telefone/celular brasileiro
 * (00) 0000-0000 ou (00) 00000-0000
 */
export function mascaraTelefone(valor: string): string {
  const numeros = valor.replace(/\D/g, '').slice(0, 11)
  
  if (numeros.length === 0) return ''
  if (numeros.length <= 2) return `(${numeros}`
  if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`
  if (numeros.length <= 11) return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`
  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`
}

/**
 * Formata um valor numérico como CEP (00000-000)
 */
export function mascaraCEP(valor: string): string {
  const numeros = valor.replace(/\D/g, '').slice(0, 8)
  
  if (numeros.length <= 5) return numeros
  return `${numeros.slice(0, 5)}-${numeros.slice(5)}`
}

/**
 * Aplica máscara de data (dd/mm/yyyy)
 */
export function mascaraData(valor: string): string {
  const numeros = valor.replace(/\D/g, '').slice(0, 8)
  
  if (numeros.length === 0) return ''
  if (numeros.length <= 2) return numeros
  if (numeros.length <= 4) return `${numeros.slice(0, 2)}/${numeros.slice(2)}`
  return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4)}`
}

// ==================== VALIDAÇÕES ====================

/**
 * Valida CPF usando algoritmo de verificação oficial
 * Retorna true se for válido
 */
export function validarCPF(cpf: string): boolean {
  const cpfLimpo = cpf.replace(/\D/g, '')
  
  if (cpfLimpo.length !== 11) return false
  
  // Verifica se todos os dígitos são iguais (ex: 111.111.111-11)
  if (/^(\d)\1+$/.test(cpfLimpo)) return false
  
  // Validação dos dígitos verificadores
  let soma = 0
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (10 - i)
  }
  let resto = 11 - (soma % 11)
  if (resto >= 10) resto = 0
  if (resto !== parseInt(cpfLimpo.charAt(9))) return false
  
  soma = 0
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (11 - i)
  }
  resto = 11 - (soma % 11)
  if (resto >= 10) resto = 0
  if (resto !== parseInt(cpfLimpo.charAt(10))) return false
  
  return true
}

/**
 * Valida CNPJ usando algoritmo de verificação oficial
 * Retorna true se for válido
 */
export function validarCNPJ(cnpj: string): boolean {
  const cnpjLimpo = cnpj.replace(/\D/g, '')
  
  if (cnpjLimpo.length !== 14) return false
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cnpjLimpo)) return false
  
  // Validação do primeiro dígito verificador
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let soma = 0
  for (let i = 0; i < 12; i++) {
    soma += parseInt(cnpjLimpo.charAt(i)) * pesos1[i]
  }
  let resto = soma % 11
  const digito1 = resto < 2 ? 0 : 11 - resto
  if (digito1 !== parseInt(cnpjLimpo.charAt(12))) return false
  
  // Validação do segundo dígito verificador
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  soma = 0
  for (let i = 0; i < 13; i++) {
    soma += parseInt(cnpjLimpo.charAt(i)) * pesos2[i]
  }
  resto = soma % 11
  const digito2 = resto < 2 ? 0 : 11 - resto
  if (digito2 !== parseInt(cnpjLimpo.charAt(13))) return false
  
  return true
}

/**
 * Valida e-mail usando expressão regular
 * Retorna true se for válido
 */
export function validarEmail(email: string): boolean {
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regexEmail.test(email)
}

/**
 * Valida telefone brasileiro
 * Aceita formatos: (XX) XXXX-XXXX, (XX) XXXXX-XXXX, XX XXXX-XXXX, XX XXXXX-XXXX
 * Retorna true se for válido (10 ou 11 dígitos)
 */
export function validarTelefone(telefone: string): boolean {
  const numeros = telefone.replace(/\D/g, '')
  return numeros.length >= 10 && numeros.length <= 11
}

/**
 * Valida CEP brasileiro
 * Retorna true se tiver 8 dígitos
 */
export function validarCEP(cep: string): boolean {
  const numeros = cep.replace(/\D/g, '')
  return numeros.length === 8
}

// ==================== HOOKS DE MÁSCARA ====================

/**
 * Hook para criar uma função de onChange com máscara
 * Exemplo: onChange={mascaraOnChange('cpf', setValue, 'cpf')}
 */
export function criarMascaraOnChange(
  tipo: 'cpf' | 'cnpj' | 'telefone' | 'cep' | 'data',
  setValue: (nome: string, valor: string) => void,
  campo: string
) {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value
    let valorMascarado = ''
    
    switch (tipo) {
      case 'cpf':
        valorMascarado = mascaraCPF(valor)
        break
      case 'cnpj':
        valorMascarado = mascaraCNPJ(valor)
        break
      case 'telefone':
        valorMascarado = mascaraTelefone(valor)
        break
      case 'cep':
        valorMascarado = mascaraCEP(valor)
        break
      case 'data':
        valorMascarado = mascaraData(valor)
        break
    }
    
    setValue(campo, valorMascarado)
  }
}
