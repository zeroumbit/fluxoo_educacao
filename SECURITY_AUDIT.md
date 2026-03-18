# 🔒 Relatório de Auditoria de Segurança - Fluxoo Edu

**Data da Auditoria:** 18 de março de 2026  
**Status:** ⚠️ **ALTO RISCO** - Não recomendado para produção  
**Total de Vulnerabilidades:** 14

---

## 📊 Sumário Executivo

| Severidade | Quantidade | Status |
|------------|------------|--------|
| 🔴 Crítica | 3 | Requer ação imediata |
| 🟠 Alta | 4 | Requer correção em 1 semana |
| 🟡 Média | 5 | Corrigir em 2-4 semanas |
| 🟢 Baixa | 2 | Melhorias recomendadas |

---

## 1. Vulnerabilidades Críticas (Ação Imediata - 24-48h)

### 1.1 Email do Super Admin Hardcoded

**Localização:** `src/lib/config.ts:5` e `database/updates/067_rbac_blindagem_rls.sql:13`

```typescript
// ❌ PROBLEMÁTICO
export const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL || 'zeroumbit@gmail.com'
```

**Problema:** Email sensível exposto no código-fonte e em migrations SQL.

**Impacto:** 
- Facilita ataques de força bruta direcionados
- Engenharia social facilitada
- Exposição de informações da equipe

**Solução:**

```typescript
// ✅ CORRETO
export const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL

// Validar no build
if (!import.meta.env.VITE_SUPER_ADMIN_EMAIL) {
  throw new Error('VITE_SUPER_ADMIN_EMAIL é obrigatória')
}
```

**Checklist:**
- [ ] Remover fallback de email em `src/lib/config.ts`
- [ ] Remover email hardcoded em `database/updates/067_rbac_blindagem_rls.sql:13`
- [ ] Adicionar validação de variável de ambiente obrigatória
- [ ] Documentar no README a necessidade da variável

---

### 1.2 RLS Desabilitado em Múltiplas Tabelas

**Localização:** Múltiplos arquivos SQL em `database/updates/`

**Arquivos Afetados:**
- `007_fix_rls_urgente.sql:15` - tabela `escolas`
- `013_fix_rls_turmas.sql:7` - tabela `turmas`
- `014_disable_rls_escolas.sql:7,10` - tabelas `escolas, filiais`
- `008_modulos_avancados.sql:260-271` - 10 tabelas
- `011_fix_rls_filiais_e_onboarding.sql:7-16` - 5 tabelas
- `017_multiple_turmas_atividades.sql:29` - `atividades_turmas`
- `016_multiple_turmas_planos_aula.sql:28` - `planos_aula_turmas`
- `041_autorizacoes_responsaveis.sql:86-88` - 3 tabelas de autorizações

**Problema:** Row Level Security desabilitado permite que qualquer usuário autenticado acesse dados de TODAS as escolas.

**Impacto:** 
- Violação completa do isolamento multi-tenant
- Vazamento de dados entre escolas
- Acesso não autorizado a informações sensíveis

**Solução:**

```sql
-- 1. Habilitar RLS em todas as tabelas
ALTER TABLE escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE turmas ENABLE ROW LEVEL SECURITY;
-- ... repetir para todas as tabelas

-- 2. Criar políticas baseadas em tenant_id
CREATE POLICY tenant_isolation ON escolas
  FOR ALL
  USING (tenant_id = auth.jwt() ->> 'tenant_id');

-- 3. Usar função has_permission() do migration 067
CREATE POLICY rbac_access ON escolas
  FOR ALL
  USING (has_permission('escolas', 'read'));
```

**Checklist:**
- [ ] Criar migration de emergência reabilitando RLS
- [ ] Testar em ambiente de staging
- [ ] Validar isolamento de tenants com testes automatizados
- [ ] Monitorar logs de erro pós-deploy

---

### 1.3 Bypass de Permissão no Banco de Dados

**Localização:** `database/updates/067_rbac_blindagem_rls.sql:13-18`

```sql
-- ❌ PROBLEMÁTICO
IF (v_user_metadata ->> 'email') = 'jossemar.dev@gmail.com' OR 
   (v_user_metadata ->> 'is_super_admin')::boolean = true THEN
    RETURN TRUE;
END IF;

IF (v_user_metadata ->> 'role') = 'gestor' THEN
    RETURN TRUE;
END IF;
```

**Problema:** Bypass baseado em email hardcoded e role de gestor concede acesso total sem validação de permissões específicas.

**Impacto:** 
- Qualquer usuário com role 'gestor' ignora todo o sistema RBAC
- Acesso total a todos os recursos sem auditoria

**Solução:**

```sql
-- ✅ CORRETO
CREATE OR REPLACE FUNCTION has_permission(
  p_resource text,
  p_action text
) RETURNS boolean AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_user_metadata jsonb;
  v_role text;
  v_tenant_id text;
  v_permission_record permissions;
BEGIN
  -- 1. Validar usuário autenticado
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 2. Obter metadata do usuário
  SELECT raw_user_meta_data INTO v_user_metadata
  FROM auth.users WHERE id = v_user_id;

  -- 3. Super Admin - apenas via claim, sem email hardcoded
  IF (v_user_metadata ->> 'is_super_admin')::boolean = true THEN
    RETURN TRUE;
  END IF;

  -- 4. Obter tenant_id do usuário
  v_tenant_id := v_user_metadata ->> 'tenant_id';
  v_role := v_user_metadata ->> 'role';

  -- 5. Validar permissão específica no sistema RBAC
  SELECT * INTO v_permission_record
  FROM permissions
  WHERE role = v_role
    AND resource = p_resource
    AND action = p_action
    AND tenant_id = v_tenant_id;

  -- 6. Retornar baseado na permissão encontrada
  RETURN v_permission_record.id IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Checklist:**
- [ ] Remover bypass por email hardcoded
- [ ] Implementar validação granular para gestores
- [ ] Adicionar testes de permissão para cada role
- [ ] Documentar matriz de permissões

---

## 2. Vulnerabilidades Altas (Corrigir em 1 semana)

### 2.1 Validação de Role no Frontend

**Localização:** `src/modules/auth/AuthContext.tsx:70-75`

**Problema:** Validação de super admin feita apenas no frontend baseado em email.

**Solução:**
- Mover validação para claims JWT no backend
- Validar permissões em todas as requisições via RLS

**Checklist:**
- [ ] Implementar claims JWT no Supabase
- [ ] Validar claims no banco via RLS
- [ ] Remover lógica de validação do frontend

---

### 2.2 Exposição de Dados no AuthContext

**Localização:** `src/modules/auth/AuthContext.tsx:80-117`

**Problema:** Dados sensíveis armazenados em estado global sem criptografia.

**Solução:**
- Minimizar dados sensíveis no frontend
- Usar sessionStorage em vez de localStorage
- Implementar timeout de sessão

**Checklist:**
- [ ] Remover dados não essenciais do contexto
- [ ] Criptografar dados sensíveis no storage
- [ ] Configurar session timeout de 30 minutos

---

### 2.3 Falta de Validação de Sessão no Backend

**Localização:** `src/modules/alunos/service.ts:149-150`

**Problema:** Cliente Supabase com chave ANON para operações sensíveis.

**Solução:**
- Usar Edge Functions para signup
- Implementar rate limiting
- Requerer confirmação de email

**Checklist:**
- [ ] Migrar signup para Edge Function
- [ ] Configurar rate limiting no Supabase
- [ ] Habilitar email confirmation obrigatório

---

### 2.4 Chaves do Supabase Expostas

**Localização:** `src/lib/supabase.ts:4-5`

**Problema:** URL e chave anon expostas no frontend (mitigado pelo modelo do Supabase).

**Solução:**
- Garantir RLS bem configurado em todas as tabelas
- Implementar rate limiting no Supabase

**Checklist:**
- [ ] Auditar todas as políticas RLS
- [ ] Configurar rate limiting no Supabase
- [ ] Monitorar requisições suspeitas

---

## 3. Vulnerabilidades Médias (Corrigir em 2-4 semanas)

### 3.1 Console Logs Expondo Dados Sensíveis

**Localização:** Múltiplos arquivos

**Solução:**
```typescript
// ✅ Criar logger ambiente-aware
const logger = {
  log: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log(...args)
    }
  },
  error: (error: Error) => {
    // Em produção, enviar para serviço de logging
    if (import.meta.env.PROD) {
      // Sentry.captureException(error)
    } else {
      console.error(error)
    }
  }
}
```

**Checklist:**
- [ ] Criar módulo de logger centralizado
- [ ] Substituir todos os console.log
- [ ] Integrar com Sentry em produção

---

### 3.2 Armazenamento no localStorage

**Localização:** `src/stores/rbac.store.ts:148-157`

**Solução:**
- Usar sessionStorage
- Criptografar dados sensíveis

**Checklist:**
- [ ] Migrar para sessionStorage
- [ ] Implementar criptografia simples
- [ ] Adicionar verificação de integridade

---

### 3.3 Fetch de APIs Externas sem Validação

**Localização:** `src/hooks/use-viacep.ts:45-52`

**Solução:**
```typescript
// ✅ Validar resposta com Zod
const cepSchema = z.object({
  cep: z.string(),
  logradouro: z.string(),
  bairro: z.string(),
  localidade: z.string(),
  uf: z.string().length(2),
})

const data = await response.json()
const validatedData = cepSchema.parse(data)
```

**Checklist:**
- [ ] Adicionar validação Zod em APIs externas
- [ ] Implementar timeout nas requisições
- [ ] Adicionar tratamento de erro robusto

---

### 3.4 Falta de Rate Limiting

**Solução:** Implementar no frontend e backend.

**Checklist:**
- [ ] Rate limiting para tentativas de login (5 tentativas/hora)
- [ ] Rate limiting para signup
- [ ] Configurar Cloudflare rate limiting

---

### 3.5 Validação de Senha Fraca

**Localização:** `src/modules/auth/LoginPage.tsx:14-17`

**Solução:**
```typescript
const loginSchema = z.object({
  email: z.string().refine((val) => validarEmail(val), 'E-mail inválido'),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter letra maiúscula')
    .regex(/[a-z]/, 'Deve conter letra minúscula')
    .regex(/[0-9]/, 'Deve conter número')
    .regex(/[^A-Za-z0-9]/, 'Deve conter símbolo'),
})
```

**Checklist:**
- [ ] Aumentar mínimo para 8 caracteres
- [ ] Requerer complexidade
- [ ] Implementar verificação de senhas comuns

---

## 4. Vulnerabilidades Baixas (Melhorias Recomendadas)

### 4.1 Validação de Inputs com Zod

**Status:** ✅ Implementado (ponto positivo)

**Melhoria:** Aumentar requisitos de senha.

---

### 4.2 Headers de Segurança

**Localização:** `vercel.json`

**Status:** ✅ Configurado (ponto positivo)

**Melhoria:** Remover `unsafe-inline` e `unsafe-eval` em produção.

---

## 5. Vulnerabilidade Crítica Adicional - XSS

### 5.1 Uso de dangerouslySetInnerHTML sem Sanitização

**Localização:**
- `src/modules/portal/components/ModalContratoEscola.tsx:180`
- `src/modules/documentos/components/ContratoTab.tsx:246`
- `src/components/ui/RichTextEditor.tsx:104`

**Problema:** HTML renderizado sem sanitização permite XSS.

**Solução:**

```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

```typescript
// ✅ CORRETO
import DOMPurify from 'dompurify'

<div 
  dangerouslySetInnerHTML={{ 
    __html: DOMPurify.sanitize(contratoHtml, {
      USE_PROFILES: { html: true }
    }) 
  }} 
/>
```

**Checklist:**
- [ ] Instalar DOMPurify
- [ ] Sanitizar TODO dangerouslySetInnerHTML
- [ ] Testar com payloads XSS conhecidos
- [ ] Atualizar CSP para remover unsafe-inline

---

## 6. Pontos Positivos

✅ Uso correto de variáveis de ambiente VITE_  
✅ Headers de segurança no Vercel  
✅ Validação com Zod em formulários  
✅ TypeScript para type safety  
✅ Supabase Auth (sistema maduro)  
✅ Sistema RBAC bem estruturado (no papel)  

---

## 7. Plano de Ação Prioritário

### Fase 1 - Emergência (24-48h)
- [ ] Habilitar RLS em todas as tabelas
- [ ] Instalar e configurar DOMPurify
- [ ] Remover emails hardcoded
- [ ] Revisar bypass de gestor no has_permission()

### Fase 2 - Curto Prazo (1 semana)
- [ ] Implementar validação de permissões no backend
- [ ] Adicionar rate limiting no frontend
- [ ] Remover console.logs de produção
- [ ] Aumentar requisitos de senha

### Fase 3 - Médio Prazo (2-4 semanas)
- [ ] Implementar 2FA para admins
- [ ] Migrar operações sensíveis para Edge Functions
- [ ] Integrar com Sentry para logging
- [ ] Implementar auditoria automatizada no CI/CD

### Fase 4 - Pré-Produção (1 mês)
- [ ] Contratar pentest profissional
- [ ] Implementar monitoramento de segurança
- [ ] Criar plano de resposta a incidentes
- [ ] Documentar políticas de segurança

---

## 8. Conclusão

**Status Atual:** ⚠️ **ALTO RISCO**

A plataforma **NÃO está pronta para produção** com dados reais de alunos e escolas. As vulnerabilidades críticas de isolamento multi-tenant e XSS representam risco significativo de vazamento de dados.

**Pré-requisitos para Produção:**
1. ✅ Resolver TODAS as vulnerabilidades críticas
2. ✅ Resolver TODAS as vulnerabilidades altas
3. ✅ Realizar pentest externo
4. ✅ Implementar monitoramento contínuo
5. ✅ Criar processos de resposta a incidentes

---

**Próxima Revisão:** Após implementação da Fase 1  
**Responsável:** Equipe de Desenvolvimento + Security Team  
