#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const rootDir = join(import.meta.dirname, '..')
const envFiles = ['.env.local', '.env'].map((name) => join(rootDir, name))
const envPath = envFiles.find((file) => existsSync(file))
const envContent = envPath ? readFileSync(envPath, 'utf8') : ''
const nodeMajor = Number.parseInt(process.version.slice(1), 10)
const findings = []
const warnings = []

function getEnvValue(name) {
  if (process.env[name]) return process.env[name]
  const match = envContent.match(new RegExp(`^${name}=(.+)$`, 'm'))
  return match?.[1]?.trim() || ''
}

if (nodeMajor !== 24) {
  findings.push(`Node ${process.version} detectado; producao deve usar Node 24.x.`)
}

const requiredPublicVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']

for (const name of requiredPublicVars) {
  if (!getEnvValue(name)) {
    findings.push(`${name} ausente.`)
  }
}

if (/^VITE_.*SERVICE_ROLE.*=/mi.test(envContent) || Object.keys(process.env).some((key) => /^VITE_.*SERVICE_ROLE/i.test(key))) {
  findings.push('Service role key com prefixo VITE_ detectada. Isso exporia a chave no bundle.')
}

if (getEnvValue('SUPABASE_SERVICE_ROLE_KEY')) {
  warnings.push('SUPABASE_SERVICE_ROLE_KEY existe localmente. Confirme que ela nao esta versionada e rotacione se ja foi exposta.')
}

if (!getEnvValue('VITE_SENTRY_DSN')) {
  warnings.push('VITE_SENTRY_DSN ausente. Sentry esta desabilitado; ative antes de operar com monitoramento remoto de erros.')
}

if (findings.length) {
  console.error('\nCheck de producao falhou:')
  for (const finding of findings) console.error(`- ${finding}`)
  if (warnings.length) {
    console.warn('\nAvisos:')
    for (const warning of warnings) console.warn(`- ${warning}`)
  }
  process.exit(1)
}

console.log('Check de producao sem bloqueios.')
if (warnings.length) {
  console.warn('\nAvisos:')
  for (const warning of warnings) console.warn(`- ${warning}`)
}
