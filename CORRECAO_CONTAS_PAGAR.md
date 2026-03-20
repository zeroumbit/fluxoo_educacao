# 🔧 Correção Urgente: Contas a Pagar Sumiram

## 🚨 Problema Identificado

Suas contas a pagar **NÃO foram deletadas**! Elas estão seguras no banco de dados.

O que aconteceu foi um **bloqueio de permissão** no banco de dados.

### Causa Raiz

A migration `067_rbac_blindagem_rls.sql` criou uma regra de segurança (RLS) muito restritiva:

```sql
-- Política criada na migration 067
CREATE POLICY "rbac_contas_pagar_select" ON public.contas_pagar FOR SELECT
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('financeiro.contas_pagar.view')  -- ❌ PERMISSÃO NÃO EXISTIA!
);
```

**Problema:** A permissão `financeiro.contas_pagar.view` **não foi cadastrada** no sistema RBAC, então **NENHUM usuário** conseguia visualizar as contas a pagar!

---

## ✅ Solução

### Opção 1: Executar Script de Correção (Recomendado)

1. **Acesse o Dashboard do Supabase**
   - Vá até: https://app.supabase.com
   - Selecione seu projeto
   - Clique em **SQL Editor**

2. **Execute o Script de Correção**
   
   Copie e cole o conteúdo do arquivo:
   ```
   database/updates/078_fix_contas_pagar_permissions.sql
   ```

3. **Aguarde a Confirmação**
   - O script deve retornar "Success. No rows returned"
   - Isso significa que as permissões foram criadas

4. **Teste o Acesso**
   - Acesse: `http://localhost:5173/contas-pagar`
   - Suas contas devem aparecer normalmente

---

### Opção 2: Script Manual (Alternativo)

Se preferir, execute manualmente este comando no SQL Editor do Supabase:

```sql
-- 1. Cadastrar permissões
INSERT INTO public.permissions (key, modulo_key, recurso, acao, descricao)
VALUES 
    ('financeiro.contas_pagar.view', 'financeiro', 'contas_pagar', 'view', 'Visualizar contas a pagar'),
    ('financeiro.contas_pagar.create', 'financeiro', 'contas_pagar', 'create', 'Criar novas contas a pagar'),
    ('financeiro.contas_pagar.edit', 'financeiro', 'contas_pagar', 'edit', 'Editar contas a pagar'),
    ('financeiro.contas_pagar.pay', 'financeiro', 'contas_pagar', 'pay', 'Registrar pagamento'),
    ('financeiro.contas_pagar.delete', 'financeiro', 'contas_pagar', 'delete', 'Excluir contas')
ON CONFLICT (key) DO NOTHING;

-- 2. Atualizar política RLS
DROP POLICY IF EXISTS "rbac_contas_pagar_select" ON public.contas_pagar;
CREATE POLICY "rbac_contas_pagar_select" ON public.contas_pagar FOR SELECT
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (
        public.has_permission('financeiro.contas_pagar.view')
        OR public.has_permission('financeiro.contas_pagar.create')
        OR public.has_permission('financeiro.contas_pagar.edit')
        OR public.has_permission('financeiro.contas_pagar.pay')
        OR public.has_permission('financeiro.contas_pagar.delete')
    )
);
```

---

## 🔍 Verificação

Após aplicar a correção, execute este comando para verificar se as permissões foram criadas:

```sql
SELECT * FROM public.permissions 
WHERE key LIKE 'financeiro.contas_pagar%';
```

**Resultado esperado:** 5 linhas (view, create, edit, pay, delete)

---

## 📊 Status

| Item | Status |
|------|--------|
| Dados no banco | ✅ Seguros (não deletados) |
| Tabela contas_pagar | ✅ Intacta |
| Políticas RLS | ⚠️ Bloqueando acesso |
| Permissões RBAC | ❌ Não cadastradas |
| Correção disponível | ✅ Script pronto |

---

## 🎯 Após a Correção

1. **Recarregue a página** `http://localhost:5173/contas-pagar`
2. **Suas 2 contas devem aparecer** normalmente
3. **Teste criar uma nova conta** para garantir que está funcionando

---

## 📝 Nota Importante

Este problema foi causado por uma **migration incompleta** (067). O script de correção (`078_fix_contas_pagar_permissions.sql`) foi criado para resolver definitivamente o problema.

**Arquivos relacionados:**
- `database/updates/067_rbac_blindagem_rls.sql` (causa do problema)
- `database/updates/078_fix_contas_pagar_permissions.sql` (correção)

---

**Dúvidas?** Execute o script e me avise se suas contas aparecerem! 🎉
