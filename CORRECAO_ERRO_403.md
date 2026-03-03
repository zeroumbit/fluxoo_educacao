# 🔧 Correção do Erro 403 - Funcionários

## Erro Reportado
```
GET https://phuyqtdpedfigbfsevte.supabase.co/rest/v1/funcionarios?... 403 (Forbidden)
{code: '42501', details: null, hint: null, message: 'permission denied for table users'}
```

## Causa do Erro

O erro `permission denied for table users` ocorre porque as políticas RLS estão tentando fazer join com tabelas do sistema (`auth.users`) ou com a tabela `escolas`, e o usuário não tem permissão para acessar essas tabelas no contexto da policy.

## ✅ Solução Rápida (2 Passos)

### Passo 1: Executar Script Emergencial

No **SQL Editor** do Supabase, execute:

```sql
-- ============================================
-- SCRIPT EMERGENCIAL - 022_correcao_emergencial_rls.sql
-- ============================================

-- Habilitar RLS
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'funcionarios'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON funcionarios', pol.policyname);
    END LOOP;
END $$;

-- Política PERMISSIVA para teste (funciona imediatamente)
CREATE POLICY "Funcionarios - Authenticated read" ON funcionarios
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Funcionarios - Authenticated insert" ON funcionarios
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Funcionarios - Authenticated update" ON funcionarios
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Funcionarios - Authenticated delete" ON funcionarios
  FOR DELETE
  TO authenticated
  USING (true);
```

### Passo 2: Testar

1. Recarregue a página http://localhost:5173/funcionarios
2. Tente cadastrar um funcionário
3. Verifique se aparece na lista

✅ **Se funcionar:** O erro 403 foi corrigido!

---

## 🔒 Solução Para Produção (Mais Segura)

Após testar com as políticas permissivas, use políticas restritivas:

```sql
-- Remover políticas permissivas
DROP POLICY IF EXISTS "Funcionarios - Authenticated read" ON funcionarios;
DROP POLICY IF EXISTS "Funcionarios - Authenticated insert" ON funcionarios;
DROP POLICY IF EXISTS "Funcionarios - Authenticated update" ON funcionarios;
DROP POLICY IF EXISTS "Funcionarios - Authenticated delete" ON funcionarios;

-- Criar políticas RESTRITIVAS (somente gestor do tenant)
CREATE POLICY "Funcionarios - Gestor read" ON funcionarios
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM escolas
      WHERE id = funcionarios.tenant_id
      AND gestor_user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Funcionarios - Gestor insert" ON funcionarios
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM escolas
      WHERE id = tenant_id
      AND gestor_user_id = auth.uid()
    )
  );

CREATE POLICY "Funcionarios - Gestor update" ON funcionarios
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM escolas
      WHERE id = funcionarios.tenant_id
      AND gestor_user_id = auth.uid()
    )
  );

CREATE POLICY "Funcionarios - Gestor delete" ON funcionarios
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM escolas
      WHERE id = funcionarios.tenant_id
      AND gestor_user_id = auth.uid()
    )
  );
```

---

## 🐛 Debug Passo a Passo

### 1. Verificar se RLS está habilitado

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'funcionarios';
```

Deve retornar `rowsecurity = true`

### 2. Verificar políticas existentes

```sql
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'funcionarios'
ORDER BY cmd;
```

### 3. Verificar se usuário está autenticado

No console do navegador:

```javascript
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
console.log('User ID:', session?.user?.id)
```

### 4. Verificar se escola existe para o usuário

```sql
-- Substitua <USER_ID> pelo ID do usuário logado
SELECT id, razao_social, gestor_user_id 
FROM escolas 
WHERE gestor_user_id = '<USER_ID>';
```

### 5. Testar query direta

No SQL Editor (como usuário autenticado):

```sql
SELECT * FROM funcionarios LIMIT 10;
```

Se funcionar no SQL Editor mas não no app, o problema é a autenticação.

---

## 📋 Checklist de Verificação

- [ ] RLS habilitado na tabela `funcionarios`
- [ ] RLS habilitado na tabela `escolas`
- [ ] Políticas RLS criadas para `funcionarios`
- [ ] Políticas RLS criadas para `escolas`
- [ ] Usuário está autenticado no Supabase Auth
- [ ] Usuário tem `gestor_user_id` vinculado na tabela `escolas`
- [ ] `tenant_id` está sendo enviado corretamente no INSERT

---

## ⚠️ Problemas Comuns

### 1. "permission denied for table escolas"

**Solução:** Criar políticas para a tabela `escolas` também:

```sql
ALTER TABLE escolas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Escolas - Authenticated read" ON escolas
  FOR SELECT
  TO authenticated
  USING (gestor_user_id = auth.uid());
```

### 2. "policy has no effect"

**Causa:** A condição da policy nunca é verdadeira.

**Solução:** Verificar se `gestor_user_id` está preenchido na tabela `escolas`:

```sql
SELECT id, gestor_user_id FROM escolas;
```

### 3. "no policies found"

**Causa:** Políticas foram removidas ou não foram criadas.

**Solução:** Executar o script emergencial acima.

---

## 🔍 Logs Úteis

### No Console do Navegador

Adicione este log temporário no service.ts:

```typescript
async listar(tenantId: string) {
  console.log('📋 Listando funcionários para tenant:', tenantId)
  console.log('🔑 Auth user:', (await supabase.auth.getUser()).data.user?.id)
  
  const { data, error } = await supabase
    .from('funcionarios')
    .select('*')
    .eq('tenant_id', tenantId)
  
  if (error) {
    console.error('❌ Erro:', error)
  } else {
    console.log('✅ Sucesso:', data?.length, 'funcionários')
  }
  
  return data || []
}
```

### No Supabase Dashboard

1. Vá para **Database** > **Logs**
2. Filtre por erro 403
3. Veja a query exata que falhou

---

## 📞 Precisa de Mais Ajuda?

Se nada funcionar:

1. **Verifique o tenant_id:**
   ```sql
   SELECT id FROM escolas WHERE gestor_user_id = auth.uid();
   ```

2. **Teste insert manual:**
   ```sql
   INSERT INTO funcionarios (tenant_id, nome_completo, funcao, status)
   VALUES ('<TENANT_ID>', 'Teste', 'Professor', 'ativo');
   ```

3. **Verifique se é super admin:**
   ```sql
   SELECT email, role FROM auth.users WHERE id = auth.uid();
   ```

---

## ✅ Verificação Final

Após aplicar a correção, execute:

```sql
-- Deve listar funcionários sem erro
SELECT * FROM funcionarios ORDER BY created_at DESC LIMIT 5;

-- Deve mostrar todas as políticas
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'funcionarios';
```

Se funcionar, o módulo de funcionários estará operacional!
