#!/usr/bin/env node

/**
 * Script de Verificação do Ambiente de Desenvolvimento
 * 
 * Executa: node scripts/check-env.js
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const ROOT_DIR = join(import.meta.dirname, '..')

console.log('🔍 Verificando ambiente de desenvolvimento...\n')

let hasErrors = false

// 1. Verificar Node.js version
const nodeVersion = process.version
const nodeMajor = parseInt(nodeVersion.slice(1))
if (nodeMajor < 18) {
  console.error(`❌ Node.js versão ${nodeVersion} - Requerido: v18+`)
  hasErrors = true
} else {
  console.log(`✅ Node.js: ${nodeVersion}`)
}

// 2. Verificar arquivo .env
const envPath = join(ROOT_DIR, '.env')
if (!existsSync(envPath)) {
  console.error(`❌ Arquivo .env não encontrado`)
  console.log(`   → Copie .env.example para .env`)
  hasErrors = true
} else {
  console.log(`✅ Arquivo .env: encontrado`)
  
  // 3. Verificar variáveis obrigatórias
  const envContent = readFileSync(envPath, 'utf-8')
  const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']
  
  requiredVars.forEach(varName => {
    const regex = new RegExp(`^${varName}=`, 'm')
    if (!regex.test(envContent)) {
      console.error(`❌ Variável ${varName} não definida`)
      hasErrors = true
    } else {
      const value = envContent.match(new RegExp(`^${varName}=(.+)$`, 'm'))?.[1]
      if (!value || value.includes('seu-') || value === 'sua-chave-anon-aqui') {
        console.warn(`⚠️  ${varName}: parece ser um valor padrão`)
      } else {
        console.log(`✅ ${varName}: configurada`)
      }
    }
  })
}

// 4. Verificar node_modules
const nodeModulesPath = join(ROOT_DIR, 'node_modules')
if (!existsSync(nodeModulesPath)) {
  console.error(`❌ node_modules não encontrado`)
  console.log(`   → Execute: npm install`)
  hasErrors = true
} else {
  console.log(`✅ node_modules: instalado`)
}

// 5. Verificar package.json
const packagePath = join(ROOT_DIR, 'package.json')
if (existsSync(packagePath)) {
  const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'))
  console.log(`✅ Projeto: ${pkg.name || 'sem nome'} v${pkg.version || '0.0.0'}`)
}

console.log('\n' + '='.repeat(50))

if (hasErrors) {
  console.error('\n❌ Foram encontrados erros na configuração do ambiente.')
  console.log('   Siga as instruções acima para corrigir.\n')
  process.exit(1)
} else {
  console.log('\n✅ Ambiente configurado corretamente!')
  console.log('   → Execute: npm run dev\n')
  process.exit(0)
}
