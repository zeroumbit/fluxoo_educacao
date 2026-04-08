# 🔍 AUDITORIA COMPLETA - CONEXÕES E SEGURANÇA FLUXOO EDU

**Data:** 08 de abril de 2026  
**Escopo:** Super Admin ↔ Escolas ↔ Portal ↔ Funcionários, Hooks, Segurança

---

## 📊 RESUMO EXECUTIVO

| Categoria | Status | Crítico | Alto | Médio | Baixo |
|---|---|---|---|---|---|
| **Conexões entre módulos** | ⚠️ Atenção | 1 | 2 | 1 | - |
| **Hooks desconectados** | ✅ OK | 0 | 0 | 1 | 2 |
| **Segurança/Super Admin** | ⚠️ Atenção | 0 | 2 | 2 | 1 |
| **Rotas/Proteção** | ⚠️ Atenção | 0 | 1 | 3 | 2 |

---

## 🔴 PROBLEMAS CRÍTICOS E ALTOS

### 1. 🚨 SUPER ADMIN ACESSA DADOS ADMINISTRATIVOS DAS ESCOLAS?

**Status:** ❌ **SIM - Violação de regra de negócio**

**Problema:**
- O Super Admin tem acesso via `SuperAdminLayout` a `/admin/escolas`, onde pode ver dados detalhados das escolas
- Não há separação clara entre "dados de assinatura/plano" (que o Super Admin pode ver) e "dados administrativos da escola" (que NÃO deve acessar)
- O Super Admin usa o mesmo `AuthContext` que funcionários, mas com bypass total no RBAC

**Evidência:**
```typescript
// AuthContext.tsx - linha 62-71
if (isSuperAdminEmail(user.email || '')) {
  setAuthUser({
    role: 'super_admin',
    tenantId: 'super_admin',  // ❌ Não há tenant real
    isGestor: true,           // ❌ Recee bypass de gestor
    isSuperAdmin: true
  })
}
```

**Impacto:**
- Se o Super Admin acessar `/financeiro`, `/funcionarios`, `/alunos` de uma escola, **não há proteção de rota ou de tenant que o impeça**
- O sistema depende de UI (menus ocultos) para restringir, não de backend/RLS

**Recomendação:**
1. **Implementar RLS (Row Level Security)** no Supabase para bloquear Super Admin em tabelas de tenant específico
2. **Criar policies separadas** para super_admin vs gestor/funcionario
3. **Adicionar middleware de tenant** nos serviços para validar se o usuário pode acessar dados daquele tenant
4. **Separar contexto do Super Admin** do contexto de escolas

---

### 2. 🚨 PROFESSOR PODE ACESSAR ROTAS DO ADMIN VIA URL DIRETA

**Status:** ❌ **VULNERABILIDADE DE ACESSO**

**Problema:**
```typescript
// App.tsx - linha ~252
<ProtectedRoute allowedRoles={['gestor', 'admin', 'funcionario', 'lojista', 'profissional']}>
  <AdminLayout />
</ProtectedRoute>
```

- Professores recebem `role: 'funcionario'` + `isProfessor: true`
- Como `'funcionario'` está nos `allowedRoles`, **professores passam pela proteção de rota**
- O `AdminLayout` apenas **oculta itens do menu** para professores, mas **não bloqueia acesso direto via URL**

**Evidência no AdminLayout.tsx:**
```typescript
// Linha ~170: Professores NUNCA veem Financeiro, Capital Humano ou Configuracoes
if (isProfessor && (group.label === 'Financeiro' || group.label === 'Capital Humano' || group.label === 'Configurações')) {
  return { ...group, items: [] } // ❌ Apenas esconde visualmente
}
```

**Teste de vulnerabilidade:**
- Um professor logado pode digitar `http://app.com/financeiro` na URL e **terá acesso completo**
- Pode digitar `http://app.com/funcionarios` e ver dados de todos funcionários
- Pode digitar `http://app.com/contas-pagar` e ver todas contas

**Recomendação:**
1. **Remover `'funcionario'` dos allowedRoles do AdminLayout**
2. **Criar ProtectedRoute separado para professores** dentro do AdminLayout
3. **Adicionar verificação de isProfessor nas rotas sensíveis** dentro do AdminLayout:
   ```typescript
   if (authUser?.isProfessor) return <Navigate to="/professores/dashboard" replace />
   ```
4. **Idealmente:** Criar layouts separados com rotas dedicadas (já existe `/professores/*`, usar apenas isso)

---

### 3. 🚨 FALTA PROTEÇÃO DE TENANT EM MÚLTIPLAS QUERIES

**Status:** ⚠️ **VAZAMENTO POTENCIAL DE DADOS ENTRE ESCOLAS**

**Problema:**
Vários serviços fazem queries **sem filtrar por tenant_id**:

```typescript
// service.ts:367 - deletar aluno (sem validar tenant)
await supabase.from('aluno_responsavel').delete().eq('aluno_id', id)
await supabase.from('matriculas').delete().eq('aluno_id', id)
await supabase.from('boletins').delete().eq('aluno_id', id)
```

**Arquivos afetados:**
- `src/modules/alunos/service.ts` - operações CRUD sem validação de tenant
- `src/modules/financeiro/service-avancado.ts` - contas a pagar sem tenant filter
- `src/modules/academico/service.ts` - operações acadêmicas sem tenant
- `src/modules/documentos/service.ts` - templates de documentos sem tenant
- `src/modules/agenda/service.ts` - eventos sem tenant

**Cenário de risco:**
- Funcionário da Escola A pode manipular ID de aluno da Escola B e **alterar/deletar dados**
- Não há verificação se o `aluno_id`, `cobranca_id`, etc. pertence ao tenant do usuário logado

**Recomendação:**
1. **Criar wrapper de serviço com tenant scope:**
   ```typescript
   function tenantQuery(tableName: string) {
     return {
       select: (columns: string) => supabase.from(tableName).select(columns).eq('tenant_id', authUser.tenantId),
       insert: (data: any) => supabase.from(tableName).insert({ ...data, tenant_id: authUser.tenantId }),
       update: (data: any) => supabase.from(tableName).update(data).eq('tenant_id', authUser.tenantId),
       delete: () => supabase.from(tableName).delete().eq('tenant_id', authUser.tenantId),
     }
   }
   ```
2. **Habilitar RLS (Row Level Security)** no Supabase para todas as tabelas com tenant_id
3. **Adicionar validação de ownership** antes de operações DELETE/UPDATE

---

### 4. 🚨 ROLE 'ADMIN' É VALOR MORTO NO SISTEMA

**Status:** ⚠️ **CÓDIGO MORTO + CONFUSÃO DE PERMISSÕES**

**Problema:**
```typescript
// database.types.ts
export type UserRole = 'super_admin' | 'admin' | 'gestor' | 'professor' | 'funcionario' | 'responsavel' | 'lojista' | 'profissional'

// App.tsx - allowedRoles inclui 'admin'
allowedRoles={['gestor', 'admin', 'funcionario', 'lojista', 'profissional']}
```

- O tipo `UserRole` inclui `'admin'`, mas **AuthContext nunca atribui este role**
- `'admin'` está nos `allowedRoles` das rotas do Admin, mas **nunca é usado na prática**
- Pode causar confusão e dar falsa sensação de permissão

**Recomendação:**
- Remover `'admin'` do tipo `UserRole` OU implementá-lo de fato
- Se for legado, marcar como deprecated e remover gradualmente

---

### 5. 🚨 DUPLICAÇÃO DE ROTA `/curriculos/:id`

**Status:** ⚠️ **ROTA DUPLICADA**

**Problema:**
```typescript
// App.tsx - linhas ~282-283 (DUAS VEZES!)
<Route path="/curriculos/:id" element={<CurriculoDetalhePage />} />
<Route path="/curriculos/:id" element={<CurriculoDetalhePage />} />
```

**Impacto:**
- Rota redundante (sem quebra de segurança, mas código morto)
- Pode causar confusão em manutenção futura

**Recomendação:** Remover uma das duplicatas

---

## 🟡 PROBLEMAS MÉDIOS

### 6. ⚠️ HOOK `usePermissao` USA CAMPO `areasAcesso` QUE NÃO EXISTE NO BANCO

**Status:** ⚠️ **FUNCIONALIDADE INOPERANTE**

**Problema:**
```typescript
// AuthContext.tsx - linha 139
// Áreas de acesso removidas (tabela não existe no banco)
areasAcesso = []
```

- O hook `usePermissao.tsx` verifica acesso por áreas (`'Financeiro'`, `'Pedagógico'`, `'Secretaria'`)
- Mas o `AuthContext` **sempre retorna array vazio** porque a tabela não existe
- **Todo sistema de permissão por área funcional está quebrado**

**Impacto:**
- `usePermissao('Financeiro')` sempre retorna `false` para funcionários
- HOC `withPermissao('Financeiro')` **bloqueia todos os funcionários** indevidamente

**Recomendação:**
1. **Recriar tabela `areas_acesso`** no banco OU
2. **Remover completamente o hook `usePermissao`** e migrar tudo para `usePermissions` (baseado em permissões granulares)

---

### 7. ⚠️ CRIAÇÃO DE USUÁRIO NO AUTH VIA FRONTEND É INSEGURO

**Status:** ⚠️ **VULNERABILIDADE DE SEGURANÇA**

**Problema:**
```typescript
// alunos/service.ts - linha 224-240
const authClient = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
)

const { data: authData } = await authClient.auth.signUp({
  email: responsavel.email,
  password: (responsavel as any).senha_hash,  // ❌ Senha exposta no frontend
  options: { data: { role: 'responsavel', nome: responsavel.nome } }
})
```

**Riscos:**
- Senha do responsável é manipulada no frontend (pode ser interceptada)
- `role: 'responsavel'` é definido no frontend via `user_metadata` (pode ser manipulado)
- Any user with browser dev tools could change `role` to `gestor` or `super_admin`

**Recommendation:**
1. **Move user creation to Edge Function** (backend)
2. **Never set roles from frontend** - use database triggers or backend service
3. **Add database trigger** to validate/override role on user insert

---

### 8. ⚠️ SUPER ADMIN IDENTIFICADO APENAS POR EMAIL

**Status:** ⚠️ **POSSÍVEL BYPASS**

**Problem:**
```typescript
// config.ts
export const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL

// AuthContext.tsx
if (isSuperAdminEmail(user.email || '')) {
  // grant all access
}
```

- Super Admin é identified **only by email** from environment variable
- If email is compromised or user changes email, they lose/gain super admin access
- Não há verificação no JWT claim ou database role

**Recommendation:**
1. **Store super_admin role in database** (user_metadata ou separate table)
2. **Use JWT claims** from Supabase for role verification
3. **Add multi-email support** for multiple super admins

---

### 9. ⚠️ LOGGER VASA INFORMAÇÕES EM DESENVOLVIMENTO

**Status:** ⚠️ **POTENTIAL DATA LEAK**

**Problem:**
```typescript
// logger.ts - line 46
const sensitiveFields = [
  'password', 'senha', 'token', 'accessToken', 'refreshToken',
  'api_key', 'apiKey', 'secret', 'cpf', 'cnpj', 'cartao', 'cvv'
]

// However, sanitization only applies to object properties
// If logged as string, data is NOT sanitized
logger.error('User login failed', { userData: JSON.stringify({ cpf: '123...', password: 'abc' }) })
```

**Risk:**
- If sensitive data is nested or stringified, it bypasses sanitization
- Logs in development may expose real CPFs, passwords, tokens

**Recommendation:**
1. **Implement recursive sanitization** for nested objects
2. **Add regex-based sanitization** for stringified JSON
3. **Never log full user objects** - only IDs and non-sensitive fields

---

### 10. ⚠️ ROTAS SEM RATE LIMITING

**Status:** ⚠️ **NO BRUTE FORCE PROTECTION**

**Problem:**
- Existe `useLoginRateLimit.ts` para login, mas **não há rate limiting** para:
  - Cadastro de alunos
  - Alteração de dados financeiros
  - Deleção de registros
  - Export de dados

**Recommendation:**
1. **Implement API-level rate limiting** in Supabase Edge Functions
2. **Add frontend rate limiting** for sensitive operations
3. **Log all mutation operations** for audit trail

---

## ✅ HOOKS CONECTADOS - STATUS

### Hooks Funcionais (9 total)

| Hook | Conexão | Status | Observação |
|---|---|---|---|
| `usePermissions` | AuthContext ✅ | ✅ OK | Hook central de autorização |
| `usePermissao` | AuthContext ✅ | ⚠️ Quebrado | `areasAcesso` sempre vazio |
| `useTenantSettings` | API backend ✅ | ✅ OK | Depende de validação backend |
| `useLoginRateLimit` | localStorage ✅ | ✅ OK | Proteção local apenas |
| `useNotifications` | Push API ✅ | ✅ OK | Funcional |
| `use-mobile` | Browser API | ✅ OK | Utilitário puro |
| `use-online-status` | Browser API | ✅ OK | Utilitário puro |
| `use-viacep` | ViaCEP API | ✅ OK | Serviço público |
| `usePdf` | jsPDF local | ✅ OK | Utilitário puro |

### Hooks **SEM** conexão com API/Backend

- **Nenhum hook de domínio encontrado** (useAlunos, useFinanceiro, useTurmas, etc.)
- Serviços estão em arquivos `service.ts` separados (não padronizados como hooks)

**Recomendação:**
- Padronizar serviços como hooks para melhor DX e reuso de cache
- Exemplo: `useAlunos()` ao invés de `alunoService.getAll()` + `useQuery` manual

---

## 🔐 MATRIZ DE PERMISSÕES ATUAL

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPER ADMIN                               │
│  - Acesso: GLOBAL (bypass total no RBAC)                     │
│  - Identificação: Email (VITE_SUPER_ADMIN_EMAIL)             │
│  - ❌ FALTA: Proteção de tenant via RLS                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      GESTOR                                  │
│  - Acesso: TOTAL na sua escola (tenant)                      │
│  - Identificação: user_metadata.role === 'gestor'            │
│  - ✅ Protegido por tenant_id nas queries                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   FUNCIONÁRIO                                │
│  - Acesso: Granular via RBAC (perfis_acesso)                 │
│  - ✅ Permissões resolvidas pelo RBACProvider                │
│  - ❌ FALTA: Proteção de tenant em operações DELETE/UPDATE   │
│                                                                │
│  ├── Professor (perfil 'professor/professora')               │
│  │   - isProfessor: true                                      │
│  │   - ❌ PODE acessar rotas admin via URL direta            │
│  │   - ✅ Tem /professores/* dedicado                         │
│  │                                                            │
│  └── Funcionário padrão                                       │
│      - Acesso conforme permissões do perfil                   │
│      - ✅ Protegido por RBAC                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  RESPONSÁVEL (Portal)                        │
│  - Acesso: APENAS dados dos seus filhos                      │
│  - Login: CPF (signInPortal)                                 │
│  - ✅ Isolado em /portal/* com allowedRoles=['responsavel']  │
│  - ⚠️ Depende de RLS do Supabase para filtrar por aluno      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 AÇÕES PRIORITÁRIAS

### 🔴 URGENTE (Sprint 1)

1. **[CRÍTICO] Proteger rotas admin contra professores**
   - Adicionar verificação `if (authUser?.isProfessor)` no ProtectedRoute do Admin
   - Ou remover `'funcionario'` dos allowedRoles e criar rota separada

2. **[CRÍTICO] Implementar RLS no Supabase**
   - Criar policies para todas tabelas com tenant_id
   - Garantir que Super Admin não pode consultar dados administrativos

3. **[ALTO] Mover criação de usuários para backend**
   - Criar Edge Function para signup de responsáveis
   - Nunca definir roles do frontend

### 🟡 IMPORTANTE (Sprint 2)

4. **[MÉDIO] Resolver hook usePermissao**
   - Recriar tabela areas_acesso OU remover hook

5. **[MÉDIO] Adicionar validação de tenant em serviços**
   - Criar wrapper tenantQuery()
   - Validar ownership antes de DELETE/UPDATE

6. **[MÉDIO] Implementar auditoria de operações**
   - Logar todas mutations (quem, quando, o que)
   - Já existe `autorizacoes_auditoria`, expandir para outros módulos

### 🟢 MELHORIAS (Sprint 3+)

7. **[BAIXO] Remover role 'admin' morto**
8. **[BAIXO] Remover rota duplicada /curriculos/:id**
9. **[BAIXO] Melhorar sanitização do logger**
10. **[BAIXO] Adicionar rate limiting para operações sensíveis**

---

## 📋 CHECKLIST DE SEGURANÇA

- [ ] RLS habilitado em todas tabelas com tenant_id
- [ ] Super Admin bloqueado de acessar dados administrativos via RLS
- [ ] Professores não conseguem acessar rotas admin via URL
- [ ] Criação de usuários feita apenas no backend
- [ ] Validação de tenant em todas operações CRUD
- [ ] Hook usePermissao resolvido (recriado ou removido)
- [ ] Role 'admin' removido ou implementado
- [ ] Auditoria de operações sensível implementada
- [ ] Rate limiting em endpoints críticos
- [ ] Logger com sanitização recursiva

---

## 📌 CONCLUSÃO

**Principais problemas encontrados:**

1. ✅ **Hooks estão bem conectados** ao AuthContext e AuthProvider
2. ❌ **Super Admin não tem separação clara** entre dados de assinatura vs dados administrativos das escolas
3. ❌ **Professores podem acessar rotas admin** via URL direta (financeiro, funcionários, configurações)
4. ❌ **Falta proteção de tenant** em várias queries de serviços
5. ⚠️ **Hook usePermissao está quebrado** (áreas de acesso não existem no banco)
6. ⚠️ **Criação de usuários no frontend** é insegura
7. ⚠️ **Role 'admin' é código morto**
8. ⚠️ **Rota duplicada** `/curriculos/:id`

**Prioridade:** Resolver itens 1-4 **imediatamente** antes de colocar em produção com múltiplas escolas.

---

*Auditoria realizada em 08/04/2026 - fluxoo-edu*
