import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'

const args = new Set(process.argv.slice(2))
const stagedOnly = args.has('--staged')

const allowedEnvExamplePattern = /(^|[\\/])\.env\.(example|sample|template)$/i

function isBlockedEnvPath(file) {
  return /(^|[\\/])\.env($|\.)/i.test(file)
    && !allowedEnvExamplePattern.test(file)
}

const secretPatterns = [
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    pattern: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*['"]?eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/i,
  },
  {
    name: 'DATABASE_URL with password',
    pattern: /postgres(?:ql)?:\/\/[^:\s/@]+:[^@\s]+@[^/\s]+\/[^\s'"]+/i,
  },
  {
    name: 'JWT-like secret',
    pattern: /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/,
  },
  {
    name: 'Supabase service role mention with assignment',
    pattern: /\b(service_role|service-role)\b.{0,40}\beyJ[A-Za-z0-9_-]+\./i,
  },
]

const binaryExtensions = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.pdf', '.woff', '.woff2',
  '.ttf', '.eot', '.zip', '.gz', '.lockb',
])

function git(args) {
  const candidates = process.platform === 'win32'
    ? ['git.exe', 'git.cmd', 'git']
    : ['git']

  let lastError
  for (const candidate of candidates) {
    try {
      return execFileSync(candidate, args, { encoding: 'utf8' }).trim()
    } catch (error) {
      lastError = error
    }
  }

  throw lastError
}

function listFilesFromGitIndex() {
  const indexPath = join('.git', 'index')
  if (!existsSync(indexPath)) {
    throw new Error('Git index not found and git executable could not be invoked.')
  }

  const buffer = readFileSync(indexPath)
  if (buffer.toString('utf8', 0, 4) !== 'DIRC') {
    throw new Error('Unsupported Git index format.')
  }

  const version = buffer.readUInt32BE(4)
  const entries = buffer.readUInt32BE(8)
  if (version !== 2 && version !== 3) {
    throw new Error(`Unsupported Git index version ${version}.`)
  }

  const files = []
  let offset = 12

  for (let i = 0; i < entries; i += 1) {
    const entryStart = offset
    const flags = buffer.readUInt16BE(offset + 60)
    offset += 62

    const hasExtendedFlags = (flags & 0x4000) !== 0
    if (hasExtendedFlags) {
      offset += 2
    }

    let nameEnd = offset
    while (nameEnd < buffer.length && buffer[nameEnd] !== 0) {
      nameEnd += 1
    }

    const path = buffer.toString('utf8', offset, nameEnd)
    if (path) {
      files.push(path)
    }

    offset = nameEnd + 1
    while ((offset - entryStart) % 8 !== 0) {
      offset += 1
    }
  }

  return files
}

function listFiles() {
  try {
    const output = stagedOnly
      ? git(['diff', '--cached', '--name-only', '--diff-filter=ACMR'])
      : git(['ls-files'])

    return output
      .split(/\r?\n/)
      .map((file) => file.trim())
      .filter(Boolean)
  } catch (error) {
    console.warn('Warning: git executable could not be invoked; scanning tracked index entries instead.')
    return listFilesFromGitIndex()
  }
}

function isBinaryFile(file) {
  const lower = basename(file).toLowerCase()
  return [...binaryExtensions].some((ext) => lower.endsWith(ext))
}

const findings = []

for (const file of listFiles()) {
  const normalized = file.replace(/\\/g, '/')

  if (isBlockedEnvPath(normalized)) {
    findings.push(`${file}: blocked env file is tracked or staged`)
    continue
  }

  if (!existsSync(file) || isBinaryFile(file)) continue

  let content = ''
  try {
    content = readFileSync(file, 'utf8')
  } catch {
    continue
  }

  for (const { name, pattern } of secretPatterns) {
    if (pattern.test(content)) {
      findings.push(`${file}: possible ${name}`)
    }
  }
}

if (findings.length > 0) {
  console.error('\nSecret check failed:')
  for (const finding of findings) {
    console.error(`- ${finding}`)
  }
  console.error('\nRemove secrets from git, rotate exposed credentials, and keep real values outside the repository.\n')
  process.exit(1)
}

console.log('Secret check passed.')
