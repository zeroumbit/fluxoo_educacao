# 🔒 Security Playbook — Fluxoo Educação

> Documento completo de todas as medidas, boas práticas e ajustes de segurança
> implementados no Fluxoo Educação, organizado para replicação em outros projetos.

---

## Índice

1. [Stack & Arquitetura](#1-stack--arquitetura)
2. [Autenticação](#2-autenticação)
3. [Autorização & RBAC](#3-autorização--rbac)
4. [Banco de Dados — Row Level Security](#4-banco-de-dados--row-level-security)
5. [Banco de Dados — Funções Seguras](#5-banco-de-dados--funções-seguras)
6. [Auditoria & Logging](#6-auditoria--logging)
7. [Rate Limiting](#7-rate-limiting)
8. [Proteção XSS & Sanitização](#8-proteção-xss--sanitização)
9. [Criptografia](#9-criptografia)
10. [Sessão & Cleanup](#10-sessão--cleanup)
11. [Monitoramento (Sentry) LGPD-Compliant](#11-monitoramento-sentry-lgpd-compliant)
12. [Webhooks — Gateway Seguro](#12-webhooks--gateway-seguro)
13. [Deployment — Vercel Headers & CSP](#13-deployment--vercel-headers--csp)
14. [CI/CD — Pipeline de Segurança](#14-cicd--pipeline-de-segurança)
15. [Variáveis de Ambiente & Secrets](#15-variáveis-de-ambiente--secrets)
16. [Checklist de Replicação](#16-checklist-de-replicação)
17. [Referências](#17-referências)

---

## 1. Stack & Arquitetura

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19 + TypeScript 5.9 + Vite 7.3 |
| Backend | Supabase (PostgreSQL + Auth + Edge Functions) |
| Estado | Zustand + TanStack React Query |
| UI | Tailwind CSS 4, Radix UI, shadcn/ui |
| Hospedagem | Vercel (SPA com SPA rewrites) |
| Monitoramento | Sentry (LGPD-compliant) |
| Package Manager | npm (Node 24.x) |

### Arquitetura de Segurança em Camadas

```
DEPLOYMENT: Vercel (CSP, Headers, HTTPS)
    ↓
EDGE: Webhook Gateway (Rate Limit + Assinatura + CORS)
    ↓
DATABASE: RLS em todas as tabelas + Funções SECURITY DEFINER
    ↓
FRONTEND: Auth JWT + RBAC + Rate Limit + Session Timeout + Sanitização
    ↓
CI/CD: Secret Scanning + Lint + Type Check + Env Validation
```

---

## 2. Autenticação

### 2.1 Supabase Auth (JWT)

```typescript
// Login com email/senha via Supabase Auth
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
})
```

**Configurações:**
- Tokens JWT de acesso: curta duração (gerenciado pelo Supabase)
- Refresh token rotation ativado
- Session storage: `window.sessionStorage` (não `localStorage`)
- Super Admin detectado via `app_metadata.is_super_admin` ou `app_metadata.role === 'super_admin'`

### 2.2 Login via Portal (CPF)

```typescript
// RPC SECURITY DEFINER que valida CPF e retorna dados do portal
const result = await supabase.rpc('get_portal_login_info', {
  p_cpf: cpfLimpo,
})
```

### 2.3 Validação de Senha Forte

```typescript
// Schema Zod para senhas (src/lib/password-validation.ts)
export const strongPasswordSchema = z
  .string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres')
  .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'A senha deve conter pelo menos um número')
  .regex(/[^A-Za-z0-9]/, 'A senha deve conter pelo menos um símbolo')
```

**Para replicar:**
- Schema forte para CADASTRO/TROCA DE SENHA
- Schema leve para LOGIN (não bloquear senhas antigas)
- Validação com `react-hook-form` + `@hookform/resolvers/zod`

### 2.4 Session Timeout Automático

```
Config: 60 minutos de inatividade
Warning: toast aos 55 min ("Sua sessão expira em 5 minutos")
Eventos monitorados: mousemove, mousedown, keydown, scroll, touchstart, click, focus
```

**Arquivo:** `src/hooks/useSessionTimeout.ts`

---

## 3. Autorização & RBAC

### 3.1 Hierarquia de Papéis

```
Super Admin → Acesso total à plataforma (NUNCA ações operacionais em escolas)
  └── Gestor/Diretor → Acesso total na própria escola (ações excepcionais com justificativa)
       └── Funcionários → Permissões granulares via matriz RBAC
            └── Professor → Escopo restrito às suas turmas/disciplinas
                 └── Responsável → Acesso limitado ao portal do aluno
```

### 3.2 Guards de Frontend

| Guard | Arquivo | Função |
|-------|---------|--------|
| `ProtectedRoute` | `src/modules/auth/ProtectedRoute.tsx` | Bloqueia rotas por `allowedRoles` |
| `SuperAdminGuard` | `src/lib/super-admin-guard.ts` | Bloqueia 20+ ações operacionais para Super Admin |
| `GestorGuard` | `src/lib/gestor-guard.ts` | Exige justificativa para ações excepcionais do Gestor |
| `ProfessorScope` | `src/lib/professor-scope.ts` | Restringe acesso a turmas/disciplinas do professor |

### 3.3 Super Admin Guard

```typescript
// 20 ações bloqueadas (src/lib/super-admin-guard.ts)
const SA_BLOCKED_ACTIONS = [
  'insert:alunos', 'update:alunos', 'delete:alunos',
  'insert:matriculas', 'update:matriculas', 'delete:matriculas',
  'insert:cobrancas', 'update:cobrancas',
  'insert:notas', 'update:notas',
  'insert:frequencias', 'update:frequencias',
  'insert:turmas', 'update:turmas', 'delete:turmas',
  'insert:funcionarios', 'update:funcionarios', 'delete:funcionarios',
  'insert:mural_avisos', 'update:mural_avisos',
]
```

### 3.4 Gestor Guard — Ação Excepcional

```typescript
// Ações que exigem justificativa (mínimo 10 caracteres)
const GESTOR_EXCEPTIONAL_ACTIONS = {
  LANCAR_NOTA: 'lancamento_gestor_nota',
  LANCAR_FALTA: 'lancamento_gestor_falta',
  ALTERAR_NOTA: 'alteracao_nota',
  CANCELAR_MATRICULA: 'cancelamento_matricula',
  TRANSFERIR_ALUNO: 'transferencia_aluno',
  CONCEDER_DESCONTO: 'concessao_desconto',
}
```

**Fluxo:** Justificativa → `set_config('app.audit_justificativa')` → Executa ação → Trigger `trg_audit_notas_gestor()` captura → Solicita aprovação via workflow

### 3.5 RBAC Validation (Service Layer)

```typescript
// src/lib/rbac-validation.ts
await validarPermissao(userId, tenantId, 'financeiro.cobrancas.create')
await validarPermissaoComEscopo(userId, tenantId, 'alunos.update', 'minhas_turmas')
```

### 3.6 Permission Hooks

```typescript
const hasPermission = useHasPermission('financeiro.cobrancas.create')
const hasScope = useHasScope('alunos.update', 'minhas_turmas')
const canAccess = useCanAccessModule('financeiro')
```

### 3.7 RBAC Store (Zustand)

- Cache de permissões com TTL de 30 minutos
- Invalidação via Realtime (canal Supabase)
- Limpeza automática no logout via `clearSensitiveClientState()`

---

## 4. Banco de Dados — Row Level Security

### 4.1 RLS Ativado em Todas as Tabelas

Migration 080/185: Script automatizado que ativa RLS em TODAS as tabelas do schema `public`.

```sql
-- Exemplo de política RLS por tenant
CREATE POLICY "Usuários veem apenas alunos do seu tenant"
ON alunos FOR SELECT
USING (escola_id = get_jwt_tenant_id());
```

### 4.2 Anti-Tenant-Spoofing (WITH CHECK)

Migration 185: Todas as políticas INSERT/UPDATE usam `validate_tenant_context()` para impedir que um usuário insira/altere dados de outro tenant.

```sql
CREATE POLICY "alunos_insert_policy" ON alunos
FOR INSERT WITH CHECK (
  escola_id = get_jwt_tenant_id()
  AND validate_tenant_context(escola_id)
);
```

### 4.3 Funções-chave de RLS

| Função | Propósito |
|--------|-----------|
| `get_jwt_tenant_id()` | Extrai tenant_id do JWT (app_metadata → user_metadata → fallback) |
| `validate_tenant_context(escola_id)` | Valida que tenant_id do JWT corresponde ao registro |
| `has_permission(permission_key)` | Central de autorização (guarda toda política RLS) |
| `is_my_child_v2()` | Verifica relação pai-filho (Portal) |
| `check_professor_turma()` | Escopo granular do professor |
| `check_is_super_admin_strict()` | Super Admin via `app_metadata` APENAS |
| `require_aal2()` | Helper para futura exigência de MFA |

### 4.4 Imutabilidade do Audit Log

```sql
-- Políticas que impedem UPDATE/DELETE no audit_log
CREATE POLICY "audit_log_immutable" ON audit_log
FOR UPDATE USING (false);

CREATE POLICY "audit_log_no_delete" ON audit_log
FOR DELETE USING (false);
```

---

## 5. Banco de Dados — Funções Seguras

### 5.1 SECURITY DEFINER com search_path Fixo

Migration 209: Todas as ~200+ funções `SECURITY DEFINER` tiveram `search_path` explicitamente fixado para prevenir **search_path hijacking attacks** (padrão CVE).

```sql
CREATE OR REPLACE FUNCTION has_permission(p_permission_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
  -- ...
$$;
```

### 5.2 RPCs como SECURITY INVOKER

Migration 112: Todas as funções `rpc_%` convertidas para `SECURITY INVOKER` com `search_path` explícito.

### 5.3 Funções Críticas

| Função | search_path | Propósito |
|--------|-------------|-----------|
| `has_permission()` | ✅ public, auth, extensions | Autorização central |
| `check_is_super_admin_strict()` | ✅ public, auth, extensions | Verificação Super Admin |
| `get_jwt_tenant_id()` | ✅ public, auth, extensions | Extrai tenant do JWT |
| `validate_tenant_context()` | ✅ public, auth, extensions | Anti-spoofing |
| `fn_login_precheck()` | ✅ public, auth, extensions | Rate limit login |
| `fn_login_record_attempt()` | ✅ public, auth, extensions | Registra tentativa de login |
| `fn_registrar_audit()` | ✅ public, auth, extensions | Auditoria LGPD |
| `fn_registrar_security_log()` | ✅ public, auth, extensions | Eventos de segurança |
| `get_portal_login_info()` | ✅ public, auth, extensions | Login via portal CPF |
| `check_webhook_rate_limit()` | ✅ public, auth, extensions | Rate limit webhook |

---

## 6. Auditoria & Logging

### 6.1 Tabelas de Auditoria

| Tabela | Propósito | Imutável |
|--------|-----------|----------|
| `audit_log` | Central de auditoria (LGPD) | ✅ |
| `audit_logs_v2` | Auditoria secundária com metadata de sessão | ✅ |
| `security_logs` | Eventos técnicos de segurança (rate limits, ameaças) | ✅ Append-only |
| `login_attempts` | Tentativas de login | ✅ Append-only |
| `webhook_events_log` | Histórico de webhooks | ✅ |
| `portal_audit_log` | Log de acesso ao portal | ✅ Append-only |

### 6.2 Triggers de Auditoria

| Trigger | Tabela | Ação |
|---------|--------|------|
| `trg_audit_notas_gestor()` | `notas` | Loga quando Gestor insere/atualiza notas (severity: warning) |
| `trg_audit_acoes_criticas()` | `matriculas` | Loga INSERT/UPDATE/DELETE (DELETE → critical) |
| `trg_alunos_audit()` | `alunos` | Loga INSERT/UPDATE com before/after |
| `trg_alunos_soft_delete()` | `alunos` | Previne DELETE físico; faz soft delete + audit |
| `trg_alertas_saude_audit()` | `alertas_saude_nee` | Loga alterações em alertas de saúde |

### 6.3 LGPD Scrub no Logger

```typescript
// Campos sensíveis automaticamente redactados (src/lib/logger.ts)
const sensitiveFields = [
  'password', 'senha', 'token', 'accessToken', 'refreshToken',
  'api_key', 'apiKey', 'secret', 'cpf', 'cnpj',
  'cartao', 'cartão', 'cvv', 'codigo_seguranca',
  'email', 'nome', 'name', 'telefone', 'celular', 'phone',
  'rg', 'pis', 'endereco', 'address', 'data_nascimento',
]
```

**Comportamento por ambiente:**
- **DEV:** Todos os logs no console com dados sanitizados
- **PROD:** Apenas erros enviados ao Sentry (sem PII)

### 6.4 Unhandled Error Handlers

```typescript
// Registrados globalmente em src/lib/logger.ts
window.addEventListener('error', handler)       // Erros globais
window.addEventListener('unhandledrejection', handler)  // Promises rejeitadas
```

---

## 7. Rate Limiting

### 7.1 Client-Side (Login)

```typescript
// src/hooks/useLoginRateLimit.ts
// 30 tentativas por janela de 15 minutos → bloqueio de 15 minutos
// Armazenamento: sessionStorage
```

### 7.2 Server-Side (Login)

```sql
-- RPC fn_login_precheck() + fn_login_record_attempt()
-- Tabela login_attempts
-- 30 falhas / 15 min → delay progressivo (20+ = 3s delay, 30+ = bloqueado)
```

### 7.3 Client-Side (Operações)

```typescript
// src/lib/security.ts
// Cooldown de 2 segundos entre operações
checkRateLimit('operacao_x', 2000) // retorna false se dentro do cooldown
```

### 7.4 Webhook Gateway

```
30 req/min por IP (in-memory Map + persistente check_webhook_rate_limit RPC)
```

---

## 8. Proteção XSS & Sanitização

### 8.1 DOMPurify

```typescript
// src/lib/sanitize-html.ts — Whitelist rigorosa
const ALLOWED_TAGS = [
  'a', 'b', 'blockquote', 'br', 'div', 'em',
  'h1', 'h2', 'h3', 'h4', 'hr', 'i', 'li', 'ol', 'p',
  'span', 'strong', 'table', 'tbody', 'td', 'th', 'thead', 'tr', 'u', 'ul',
]

const ALLOWED_ATTR = [
  'align', 'class', 'colspan', 'href', 'rel', 'rowspan', 'style', 'target',
]
// ALLOW_DATA_ATTR: false
```

### 8.2 Validação de Upload

```typescript
// src/lib/validate-file.ts
// Extensões permitidas + verificação de MIME type
const ALLOWED = { image: ['.jpg', '.png', '.webp', '.svg'], document: ['.pdf', ...], csv: ['.csv'] }
// Se MIME não corresponde à extensão → rejeita (arquivo corrompido ou extensão incorreta)
```

### 8.3 Validação com Zod

- Todas as telas que usam formulários implementam `react-hook-form` + `@hookform/resolvers/zod`
- Schemas de validação específicos por contexto
- CPF/CNPJ validados por algoritmo de dígitos verificadores

---

## 9. Criptografia

### 9.1 Client-Side (Rascunhos Locais)

```typescript
// src/lib/security.ts — AES-GCM via Web Crypto API
// Chave derivada de: SHA-256(origin + supabase URL)
// IV aleatório de 12 bytes
// Formato: "v2:{iv_base64}:{encrypted_base64}"
// Leitura retroativa do formato legado (XOR com salt)
```

**Para que serve:** Rascunhos de cadastro de alunos, matrículas, etc. armazenados no `localStorage` são criptografados.

### 9.2 Server-Side

- Senhas: hasheadas via Supabase Auth (bcrypt)
- Tokens: gerenciados pelo Supabase (JWT com rotação)
- HTTPS: forçado via Vercel + CSP

### 9.3 Constant-Time Comparison (Webhooks)

```typescript
// Previne timing attacks na validação de assinatura de webhook
function constantTimeCompare(a: string, b: string): boolean
```

### 9.4 HMAC-SHA256 (Webhooks)

- Assinatura HMAC-SHA256 via Web Crypto API
- Validação para Mercado Pago e Abacate Pay
- Whiltelist de algoritmos: apenas HS256 (rejeita `alg: none`)

---

## 10. Sessão & Cleanup

### 10.1 Cleanup no Logout

```typescript
// src/lib/session-cleanup.ts
// Remove 16 chaves do localStorage + 2 chaves do sessionStorage
const LOCAL_STORAGE_KEYS = [
  'fluxoo_rbac_cache', 'fluxoo-portal-storage',
  'aluno_cadastro_draft', 'matricula_draft',
  'fluxoo_funcionario_cadastro_data', 'fluxoo_escola_cadastro_data',
  'fluxoo_marketplace_cadastro_data', ...
]
const SESSION_STORAGE_KEYS = ['fluxoo_login_attempts', 'fluxoo-rbac-store']
```

### 10.2 Health Check no Startup

```typescript
// src/lib/health-check.ts
// Valida VITE_SUPABASE_URL (deve começar com https:// e conter .supabase.co)
// Valida VITE_SUPABASE_ANON_KEY (deve ter > 100 caracteres)
// Em PROD: erro fatal se variáveis críticas ausentes
// Em DEV: warn apenas
```

---

## 11. Monitoramento (Sentry) LGPD-Compliant

### 11.1 Configuração

```typescript
// src/lib/sentry.ts
Sentry.init({
  dsn: VITE_SENTRY_DSN,
  environment: MODE,
  tracesSampleRate: PROD ? 0.1 : 1.0,  // 10% em produção
  enabled: PROD,
  sendDefaultPii: false,       // LGPD: não enviar PII automaticamente
  autoSessionTracking: false,   // LGPD: não rastrear sessões
})
```

### 11.2 PII Scrubbing

```typescript
// Campos redactados antes do envio
const PII_FIELDS = [
  'cpf', 'cnpj', 'rg', 'email', 'nome', 'name',
  'phone', 'telefone', 'celular', 'address', 'endereco',
  'password', 'senha', 'token', 'secret', 'api_key',
]
// beforeSend: scruva user, breadcrumbs, extras, contexts
// beforeSendTransaction: bloqueia transações de super_admin
```

### 11.3 Sentry SetUser (LGPD-safe)

```typescript
// Apenas ID anônimo — sem email, nome, CPF
Sentry.setUser({ id: userId })
```

### 11.4 Erros Ignorados

```typescript
ignoreErrors: [
  'ResizeObserver loop limit exceeded',
  'Network request failed',
  'Load failed',
  'AbortError',
  'ChunkLoadError',
]
```

---

## 12. Webhooks — Gateway Seguro

### 12.1 Arquitetura

```
Provedor (Mercado Pago, Abacate Pay)
  → POST /api/webhooks/:provider
      → Webhook Gateway (Edge Function, SECURITY DEFINER)
          → Valida assinatura (HMAC-SHA256)
          → Rate limit check (30 req/min)
          → Log em webhook_events_log
          → Processa
          → Responde 200/400/429
```

### 12.2 Medidas de Segurança

| Medida | Detalhes |
|--------|----------|
| Validação de assinatura | HMAC-SHA256 com constant-time comparison |
| Rate limiting | 30 req/min por IP |
| CORS | Origins restritas |
| Logging | Todos os eventos em `webhook_events_log` |
| Replay protection | Timestamp + nonce |
| JWT validation | Algoritmo HS256 — rejeita `alg: none` |

---

## 13. Deployment — Vercel Headers & CSP

### 13.1 Security Headers

```json
{
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin"
}
```

### 13.2 Content Security Policy

```
default-src 'self';
script-src 'self' https://pagead2.googlesyndication.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com
         https://use.typekit.net data:;
img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com;
connect-src 'self' https://*.supabase.co wss://*.supabase.co
             https://viacep.com.br https://servicodados.ibge.gov.br
             https://*.ingest.sentry.io;
```

**⚠️ Nota:** `unsafe-inline` é necessário para Tailwind CSS e Radix UI. Considere migrar para nonces em produção hardening.

### 13.3 Cache-Control para Assets

```json
{
  "source": "/assets/(.*)",
  "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
}
```

### 13.4 SPA Rewrites

```json
{
  "source": "/((?!assets/|favicon.ico|pwa-|vite.svg).*)",
  "destination": "/index.html"
}
```

---

## 14. CI/CD — Pipeline de Segurança

### 14.1 Scripts de Segurança

| Script | Comando | O que verifica |
|--------|---------|---------------|
| `check-secrets.mjs` | `npm run security:secrets` | Escaneia arquivos por SERVICE_ROLE_KEY, DATABASE_URL, JWT patterns, .env versionados |
| `check-env.js` | `npm run check-env` | Valida Node 18+, .env.local existe, VITE_SUPABASE_URL/ANON_KEY configuradas, service-role sem VITE_ |
| `check-production.js` | `npm run check-production` | Valida Node 24.x, envs obrigatórias, service-role sem VITE_, warn se Sentry ausente |
| `check-any-budget.mjs` | `npm run lint:any-budget` | Conta usos de `no-explicit-any`, falha se acima do orçamento (1250 dev) |

### 14.2 Pre-commit Hook (Husky)

```bash
#!/usr/bin/env sh
npm run security:secrets -- --staged
npx lint-staged
```

**lint-staged:** Executa `eslint --fix` em arquivos `*.{ts,tsx}`.

### 14.3 Quality Gate

```bash
npm run quality   # check-env → security:secrets → typecheck → lint
npm run predeploy # quality → check-production → build
```

### 14.4 Padrões de Secret Scanning

```javascript
// check-secrets.mjs patterns
const secretPatterns = [
  { name: 'SUPABASE_SERVICE_ROLE_KEY', pattern: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*['"]?eyJ.../ },
  { name: 'DATABASE_URL with password', pattern: /postgres(?:ql)?:\/\/[^:]+:[^@]+@.../ },
  { name: 'JWT-like secret', pattern: /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/ },
  { name: 'Service role mention', pattern: /\b(service_role|service-role)\b.{0,40}\beyJ/ },
]
```

### 14.5 Overrides de Segurança (package.json)

```json
{
  "overrides": {
    "sourcemap-codec": "npm:@jridgewell/sourcemap-codec@^1.4.15",
    "source-map": "npm:source-map@^0.7.4",
    "glob": "npm:glob@^11.0.0",
    "serialize-javascript": "npm:serialize-javascript@^7.0.4"
  }
}
```

---

## 15. Variáveis de Ambiente & Secrets

### 15.1 Por Tipo de Exposição

| Variável | Pública? | Onde usar |
|----------|----------|-----------|
| `VITE_SUPABASE_URL` | ✅ Sim (prefixo VITE_ → browser) | `src/lib/supabase.ts` |
| `VITE_SUPABASE_ANON_KEY` | ✅ Sim (chave anon é pública por design) | `src/lib/supabase.ts` |
| `VITE_SENTRY_DSN` | ✅ Sim (DSN público) | `src/lib/sentry.ts` |
| `VITE_APP_VERSION` | ✅ Sim | Build |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ NUNCA com VITE_ | Apenas Edge Functions / scripts admin |
| `DATABASE_URL` | ❌ NUNCA | Apenas migrações locais |

### 15.2 Regras

1. **NUNCA** usar prefixo `VITE_` em secrets (service role, database urls, API keys)
2. `.env` e `.env.local` estão no `.gitignore`
3. Script `check-env.js` e `check-production.js` validam que service-role NUNCA tem `VITE_`
4. Script `check-secrets.mjs` impede commit de secrets acidentalmente

### 15.3 Gerenciamento de Tokens de Gateway

Tokens de provedores (Asaas, Mercado Pago) armazenados por tenant na tabela `gateway_tenant_config`:
- Acessados apenas por Edge Functions via service role
- Nunca expostos ao cliente

---

## 16. Checklist de Replicação

### 16.1 Autenticação & Autorização

- [ ] Configurar Supabase Auth (JWT, refresh rotation)
- [ ] Implementar `ProtectedRoute` com `allowedRoles`
- [ ] Implementar Super Admin Guard (bloqueio de ações operacionais)
- [ ] Implementar Gestor Guard (justificativa obrigatória)
- [ ] Implementar validação RBAC via service layer
- [ ] Configurar session timeout (60 min inatividade)
- [ ] Implementar login rate limit (client + server)
- [ ] Schema Zod de senha forte (8+ chars, upper, lower, number, symbol)

### 16.2 Banco de Dados

- [ ] Ativar RLS em TODAS as tabelas
- [ ] Implementar `get_jwt_tenant_id()` para multi-tenancy
- [ ] Implementar `validate_tenant_context()` anti-spoofing
- [ ] Implementar `has_permission()` como guarda central
- [ ] Todas funções SECURITY DEFINER com `SET search_path` explícito
- [ ] RPCs como SECURITY INVOKER
- [ ] Funções de auditoria (audit_log, security_logs)
- [ ] Triggers de auditoria para tabelas críticas
- [ ] Tabelas de audit imutáveis (sem UPDATE/DELETE)
- [ ] Soft delete para dados críticos

### 16.3 Frontend

- [ ] DOMPurify para sanitização HTML (whitelist de tags/atributos)
- [ ] Validação de upload (extensão + MIME type)
- [ ] Zod validation em todos os formulários
- [ ] AES-GCM para dados sensíveis em localStorage
- [ ] Rate limit client-side (cooldown entre operações)
- [ ] Cleanup de estado no logout (localStorage + sessionStorage)
- [ ] Health check no startup (valida envs)

### 16.4 Monitoramento

- [ ] Sentry configurado com LGPD scrubbing
- [ ] `sendDefaultPii: false`
- [ ] `beforeSend` com remoção de PII
- [ ] `setSentryUser()` com apenas ID anônimo
- [ ] Logger centralizado com sanitização
- [ ] Error boundaries no React

### 16.5 CI/CD

- [ ] Secrets scanning (pre-commit)
- [ ] Env validation script
- [ ] Production readiness check
- [ ] TypeScript strict mode
- [ ] ESLint + lint-staged
- [ ] Quality gate (env → secrets → typecheck → lint)
- [ ] Predeploy gate

### 16.6 Deployment

- [ ] Vercel headers: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy
- [ ] CSP configurada (atores, estilos, fontes, imagens, conexões)
- [ ] Cache-Control para assets estáticos
- [ ] `.gitignore` com .env, dist, node_modules
- [ ] `SUPABASE_SERVICE_ROLE_KEY` nunca com prefixo VITE_

---

## 17. Referências

### Arquivos de Segurança no Projeto

| Arquivo | Propósito |
|---------|-----------|
| `src/lib/security.ts` | Crypto client-side + rate limit |
| `src/lib/sentry.ts` | Sentry LGPD-compliant |
| `src/lib/logger.ts` | Logger centralizado com sanitização |
| `src/lib/sanitize-html.ts` | DOMPurify config |
| `src/lib/password-validation.ts` | Zod schemas + validação |
| `src/lib/auth-rate-limit.ts` | Server-side rate limit |
| `src/lib/super-admin-guard.ts` | Super Admin action blocker |
| `src/lib/gestor-guard.ts` | Gestor exceptional action guard |
| `src/lib/rbac-validation.ts` | RBAC service validation |
| `src/lib/professor-scope.ts` | Professor scope utilities |
| `src/lib/session-cleanup.ts` | Logout cleanup |
| `src/lib/validate-file.ts` | File upload validation |
| `src/lib/health-check.ts` | Startup env validation |
| `src/hooks/useSessionTimeout.ts` | Auto-logout |
| `src/hooks/useLoginRateLimit.ts` | Client login rate limit |
| `scripts/check-secrets.mjs` | Secret scanning |
| `scripts/check-env.js` | Env validation |
| `scripts/check-production.js` | Production readiness |
| `.husky/pre-commit` | Pre-commit hook |
| `vercel.json` | CSP + headers |

### Migrações de Segurança

| Migration | O que fez |
|-----------|-----------|
| `067` | Rate limiting + auditoria |
| `079` | Removeu Super Admin hardcoded do SQL |
| `080` | RLS em todas as tabelas |
| `082` | Gestor bypass via `escolas.gestor_user_id` |
| `091` | Reativou RLS com políticas cuidadosas |
| `112` | RPCs como SECURITY INVOKER |
| `142` | Anti-tenant-spoofing |
| `185` | WITH CHECK policies + validate_tenant_context |
| `186` | Imutabilidade do audit_log |
| `207` | Soft delete + triggers de auditoria |
| `208` | Super Admin strict (app_metadata apenas) |
| `209` | search_path fixo em 200+ funções |
| `210` | Professor scope RLS |

### Cobertura OWASP Top 10

| # | Categoria | Cobertura |
|---|-----------|-----------|
| A01 | Broken Access Control | ✅ RLS, RBAC V2, Guards |
| A02 | Cryptographic Failures | ✅ AES-GCM, HTTPS, JWT managed |
| A03 | Injection | ✅ Zod, DOMPurify, queries parametrizadas |
| A04 | Insecure Design | ⚠️ Parcial (professor route bypass) |
| A05 | Security Misconfiguration | ✅ CSP, security headers |
| A06 | Vulnerable Components | ⚠️ npm audit não no CI |
| A07 | Authentication Failures | ✅ Rate limit, session timeout |
| A08 | Data Integrity Failures | ✅ Audit imutável, webhook signature |
| A09 | Logging Failures | ✅ Audit logs, Sentry LGPD |
| A10 | SSRF | ⚠️ Parcial (webhook valida URLs) |

### Pendências de Melhoria

- [ ] CSP hardening (remover `unsafe-inline` via nonces)
- [ ] 2FA/MFA para Super Admin e Gestor
- [ ] `npm audit` integrado ao CI
- [ ] Professor route bypass fix (nível de página)
- [ ] Rate limiting server-side do Supabase configurado

---

> **Documento gerado em:** 29/05/2026
> **Projeto:** Fluxoo Educação — `fluxoo-educacao`
> **Stack:** React 19 + TypeScript 5.9 + Supabase + Vercel
