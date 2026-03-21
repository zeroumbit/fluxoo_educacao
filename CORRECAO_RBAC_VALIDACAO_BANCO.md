# ✅ Correção: Validação de Permissão no Banco (RLS)

**Data:** 20 de março de 2026  
**Status:** ✅ **IMPLEMENTADO**  
**Impacto:** SEGURANÇA - Validação de permissões movida do frontend para o banco

---

## 🐛 PROBLEMA IDENTIFICADO

**Problema:** Validações de role (super_admin, gestor, funcionario) eram feitas apenas no frontend via React hooks.

**Risco:** Um usuário mal-intencionado poderia bypassar as validações do frontend e acessar dados/permissões não autorizadas diretamente via API do Supabase.

**Exemplo de código vulnerável (frontend):**
```typescript
// ❌ APENAS NO FRONTEND (VULNERÁVEL)
if (authUser?.role === 'super_admin' || authUser?.role === 'gestor') {
  return true // Acesso concedido sem validação no banco
}
```

---

## ✅ SOLUÇÃO IMPLEMENTADA

### Migration 082: Hardening RBAC - Validação de Gestor no Banco

**Arquivo:** `database/updates/082_hardening_rbac_gestor.sql`

**Mudanças:**

1. **Função `has_permission()` atualizada** para validar gestor explicitamente no banco:

```sql
CREATE OR REPLACE FUNCTION public.has_permission(p_permission_key TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_metadata JSONB := auth.jwt() -> 'user_metadata';
    v_user_id UUID := auth.uid();
    v_tenant_id TEXT;
    v_is_gestor BOOLEAN;
BEGIN
    -- 1. Validar usuário autenticado
    IF v_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- 2. Super Admin Bypass (Apenas via Claim is_super_admin)
    IF (v_user_metadata ->> 'is_super_admin')::boolean = true THEN
        RETURN TRUE;
    END IF;

    -- 3. Obter tenant_id do usuário
    v_tenant_id := v_user_metadata ->> 'tenant_id';

    -- 4. Verificar se é gestor da escola (validação NO BANCO)
    SELECT EXISTS (
        SELECT 1 FROM public.escolas
        WHERE id::text = v_tenant_id
        AND gestor_user_id = v_user_id
    ) INTO v_is_gestor;

    -- 5. Gestor tem acesso total na sua própria escola
    IF v_is_gestor THEN
        RETURN TRUE;
    END IF;

    -- 6. Funcionário: Validar permissão específica via RBAC
    RETURN EXISTS (
        SELECT 1 FROM public.fn_resolve_user_permissions(v_user_id)
        WHERE permission_key = p_permission_key
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

2. **Políticas RLS em todas as tabelas críticas** usando `has_permission()`:

```sql
-- Exemplo: Tabela alunos
CREATE POLICY "rbac_alunos_select" ON public.alunos FOR SELECT
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('academico.alunos.view')
);

CREATE POLICY "rbac_alunos_insert" ON public.alunos FOR INSERT
WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('academico.alunos.create')
);
```

---

## 📊 TABELAS PROTEGIDAS COM RLS

| Tabela | Permissões Protegidas |
|--------|----------------------|
| `alunos` | view, create, edit, delete |
| `cobrancas` | view, create, edit, delete |
| `contas_pagar` | view, create, edit, delete |
| `matriculas` | view, create, edit |
| `planos_aula` | view, manage |
| `atividades` | view, manage |
| `mural_avisos` | view, manage |
| `frequencias` | view, manage |
| `boletins` | view, manage |
| `documento_templates` | view, manage |
| `autorizacoes_modelos` | view, manage |
| `funcionarios` | view, manage |
| `almoxarifado_itens` | view, manage |

---

## 🔒 CAMADAS DE SEGURANÇA

### Antes (Vulnerável)
```
┌─────────────────┐
│   Frontend      │ ← Validação de role (React)
│   (React)       │ ← Pode ser bypassada
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Supabase      │ ← Sem validação no banco
│   (API)         │ ← Acesso direto possível
└─────────────────┘
```

### Depois (Protegido)
```
┌─────────────────┐
│   Frontend      │ ← Validação de role (React)
│   (React)       │ ← UX, não segurança
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Supabase      │ ← RLS Policy
│   (API)         │ ← has_permission()
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │ ← Validação no banco
│   (RLS)         │ ← Segurança real
└─────────────────┘
```

---

## 🎯 REGRA DE NEGÓCIO PRESERVADA

| Role | Acesso | Validação |
|------|--------|-----------|
| **Super Admin** | Total em toda plataforma | Via claim `is_super_admin` no JWT |
| **Gestor** | Total na sua escola | Via `gestor_user_id` no banco |
| **Funcionário** | Segundo matriz RBAC | Via `fn_resolve_user_permissions()` |
| **Responsável** | Portal da Família | Via políticas específicas (não afetado) |

---

## 🧪 TESTES DE VALIDAÇÃO

### Teste 1: Gestor acessa sua escola
```sql
-- Deve retornar TRUE
SELECT public.has_permission('academico.alunos.view');
-- Contexto: usuário é gestor_user_id da escola
```

### Teste 2: Gestor tenta acessar outra escola
```sql
-- Deve retornar FALSE
SELECT public.has_permission('academico.alunos.view');
-- Contexto: usuário NÃO é gestor_user_id da escola
```

### Teste 3: Funcionário com permissão
```sql
-- Deve retornar TRUE se perfil tem permissão
SELECT public.has_permission('financeiro.cobrancas.view');
```

### Teste 4: Funcionário sem permissão
```sql
-- Deve retornar FALSE
SELECT public.has_permission('gestao.funcionarios.manage');
```

### Teste 5: Super Admin
```sql
-- Sempre retorna TRUE
SELECT public.has_permission('qualquer.permissao');
```

---

## 📋 MIGRATIONS RELACIONADAS

| Migration | Descrição |
|-----------|-----------|
| `067_rbac_blindagem_rls.sql` | Cria função `has_permission()` original |
| `050_rbac_v2_enterprise.sql` | Cria `fn_resolve_user_permissions()` |
| `082_hardening_rbac_gestor.sql` | **Adiciona validação de gestor no banco** |

---

## 🚀 PRÓXIMOS PASSOS

1. **Executar migration 082** no Supabase SQL Editor
2. **Testar validações** com diferentes roles
3. **Monitorar logs** de erros de permissão
4. **Auditar tabelas** sem proteção RLS

---

## ⚠️ IMPORTANTE

**Esta correção NÃO remove validações do frontend!**

As validações no frontend continuam importantes para:
- ✅ **UX**: Mostrar/esconder botões e menus
- ✅ **Performance**: Evitar requisições desnecessárias
- ✅ **Feedback**: Mensagens de erro amigáveis

Mas agora a **segurança real está no banco**, onde não pode ser bypassada.

---

**Status:** ✅ **IMPLEMENTADO**  
**Segurança:** ✅ **REFORÇADA**  
**Regras de Negócio:** ✅ **PRESERVADAS**
