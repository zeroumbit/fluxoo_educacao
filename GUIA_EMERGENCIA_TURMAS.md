# 🚨 GUIA DE EMERGÊNCIA - TURMAS NÃO APARECEM

**Data:** 21 de março de 2026  
**Prioridade:** MÁXIMA  
**Status:** EM ANDAMENTO

---

## 📋 PROBLEMA

**Turmas cadastradas (9) não aparecem após correções de segurança.**

**Erros:**
```
403 Forbidden - new row violates row-level security policy
auth.uid() = null
tenant_id = null
```

---

## 🔍 CAUSA

O `tenant_id` não está no JWT do usuário porque o metadata do Supabase Auth não foi configurado corretamente.

---

## ✅ SOLUÇÃO PASSO A PASSO

### **PASSO 1: Executar Migration 087**

No **Supabase SQL Editor**, execute:

```sql
-- Copie e cole o conteúdo de:
database/updates/087_fix_jwt_tenant_claims.sql
```

**O que isso faz:**
- Adiciona `tenant_id` no metadata de TODOS os gestores
- Cria trigger para atualizar automaticamente no futuro

---

### **PASSO 2: Fazer Logout e Login**

**Importante:** O JWT só é gerado no login.

1. **Faça logout** da aplicação
2. **Feche o navegador** completamente
3. **Abra o navegador** novamente
4. **Faça login** com o email do gestor

---

### **PASSO 3: Validar JWT**

No **Supabase SQL Editor**, execute:

```sql
SELECT 
    auth.uid() as usuario_id,
    auth.jwt() ->> 'email' as email,
    auth.jwt() ->> 'tenant_id' as tenant_id,
    auth.jwt() -> 'user_metadata' ->> 'tenant_id' as metadata_tenant_id,
    auth.jwt() -> 'user_metadata' ->> 'role' as metadata_role;
```

**Resultado esperado:**
```
usuario_id: abc123... (NÃO null)
email: gestor@escola.com
tenant_id: def456... (NÃO null)
metadata_tenant_id: def456... (NÃO null)
metadata_role: 'gestor'
```

**Se ainda estiver null:**
- O logout/login não foi feito corretamente
- Execute novamente o PASSO 1

---

### **PASSO 4: Executar Migration 090**

No **Supabase SQL Editor**, execute:

```sql
-- Copie e cole o conteúdo de:
database/updates/090_correcao_definitiva_gestor.sql
```

**O que isso faz:**
- Remove TODAS as políticas antigas conflitantes
- Cria política única `gestor_acesso_total`
- Garante acesso total do gestor à escola

---

### **PASSO 5: Recarregar Página**

1. **Recarregue a página** (F5)
2. **Vá em Turmas** no menu
3. **Verifique se as 9 turmas apareceram**

---

## 🧪 VALIDAÇÃO

### Checklist

- [ ] Migration 087 executada com sucesso
- [ ] Logout e login realizados
- [ ] JWT validado (tenant_id NÃO é null)
- [ ] Migration 090 executada com sucesso
- [ ] Página recarregada (F5)
- [ ] 9 turmas apareceram na listagem
- [ ] Matrículas apareceram
- [ ] Contas a pagar apareceram
- [ ] Erro 403 ao criar turma foi resolvido
- [ ] Erro 403 ao criar conta a pagar foi resolvido

---

## 🚨 SE AINDA NÃO FUNCIONAR

### Diagnóstico Avançado

Execute no **Supabase SQL Editor**:

```sql
-- 1. Verificar se gestor_user_id está configurado
SELECT 
    e.id as escola_id,
    e.razao_social,
    e.gestor_user_id,
    u.email as gestor_email
FROM escolas e
LEFT JOIN auth.users u ON u.id = e.gestor_user_id
ORDER BY e.created_at DESC
LIMIT 10;
```

**Se `gestor_user_id` for NULL:**
```sql
-- Corrigir: substitua SEU_EMAIL pelo email do gestor
UPDATE escolas 
SET gestor_user_id = (SELECT id FROM auth.users WHERE email = 'SEU_EMAIL')
WHERE gestor_user_id IS NULL;
```

### Verificar Políticas

```sql
-- Verificar políticas existentes
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'turmas'
ORDER BY policyname;
```

**Deve aparecer:** `gestor_acesso_total`

---

## 📞 SUPORTE

Se após todos os passos as turmas ainda não aparecerem:

1. **Tire prints** dos erros no console do navegador (F12)
2. **Execute o diagnóstico** do PASSO 6
3. **Envie os resultados** para análise

---

**Última atualização:** 21 de março de 2026  
**Próxima ação:** Executar PASSO 1 (Migration 087)
