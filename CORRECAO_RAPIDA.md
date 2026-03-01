# 🚀 Correção Rápida - Erro 403 em Funcionários

## ⚡ Solução em 3 Passos

### Passo 1: Copiar e Executar SQL

Abra o **SQL Editor** do Supabase e execute:

```sql
-- ============================================
-- SCRIPT 1: 019_fix_funcionarios_rls.sql
-- ============================================

-- Habilitar RLS
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;

-- Política SELECT
DROP POLICY IF EXISTS "Funcionarios - Gestor pode ler" ON funcionarios;
CREATE POLICY "Funcionarios - Gestor pode ler" ON funcionarios
  FOR SELECT
  USING (
    tenant_id = (
      SELECT e.id 
      FROM escolas e 
      WHERE e.gestor_user_id = auth.uid()
    )
  );

-- Política INSERT
DROP POLICY IF EXISTS "Funcionarios - Gestor pode inserir" ON funcionarios;
CREATE POLICY "Funcionarios - Gestor pode inserir" ON funcionarios
  FOR INSERT
  WITH CHECK (
    tenant_id = (
      SELECT e.id 
      FROM escolas e 
      WHERE e.gestor_user_id = auth.uid()
    )
  );

-- Política UPDATE
DROP POLICY IF EXISTS "Funcionarios - Gestor pode atualizar" ON funcionarios;
CREATE POLICY "Funcionarios - Gestor pode atualizar" ON funcionarios
  FOR UPDATE
  USING (
    tenant_id = (
      SELECT e.id 
      FROM escolas e 
      WHERE e.gestor_user_id = auth.uid()
    )
  );

-- Política DELETE
DROP POLICY IF EXISTS "Funcionarios - Gestor pode deletar" ON funcionarios;
CREATE POLICY "Funcionarios - Gestor pode deletar" ON funcionarios
  FOR DELETE
  USING (
    tenant_id = (
      SELECT e.id 
      FROM escolas e 
      WHERE e.gestor_user_id = auth.uid()
    )
  );

-- Policy para funcionário ler próprio registro
DROP POLICY IF EXISTS "Funcionarios - Usuário pode ler próprio registro" ON funcionarios;
CREATE POLICY "Funcionarios - Usuário pode ler próprio registro" ON funcionarios
  FOR SELECT
  USING (
    user_id = auth.uid()
  );
```

### Passo 2: Testar Cadastro

1. Acesse http://localhost:5173/funcionarios
2. Clique em **"Novo Funcionário"**
3. Preencha:
   - Nome Completo
   - Função (ex: Professor)
4. Clique em **"Cadastrar"**

✅ Se funcionar: Você verá "Funcionário cadastrado!"

❌ Se der erro: Abra o console (F12) e veja a mensagem

### Passo 3: Verificar (Opcional)

No SQL Editor do Supabase:

```sql
-- Verificar se tem funcionários
SELECT * FROM funcionarios ORDER BY created_at DESC LIMIT 10;

-- Verificar políticas
SELECT policyname FROM pg_policies WHERE tablename = 'funcionarios';
```

## 📋 Scripts Completos

Para a solução completa com todas as features (histórico, logs, etc.), execute os arquivos:

1. `database/updates/019_fix_funcionarios_rls.sql`
2. `database/updates/020_funcionarios_tabelas_relacionadas.sql`

## ❓ Ainda com Problemas?

### Erro: "tenant_id é obrigatório"
✅ Isso é esperado! O código foi atualizado para validar isso.

### Erro: "policy not found"
✅ Execute os scripts na ordem correta.

### Erro: "relation does not exist"
✅ A tabela `funcionarios` não existe. Crie primeiro.

### Funcionário não aparece após cadastro
✅ Verifique se o `tenant_id` está correto (deve ser o ID da escola)

## 🔧 Debug

No console do navegador, após o erro:

```javascript
// Verificar usuário logado
console.log('AuthUser:', window.authUser)

// Verificar tenant
console.log('Tenant ID:', window.authUser?.tenantId)
```

## 📚 Documentação Completa

- `FUNCIONARIOS_FIX.md` - Guia detalhado
- `RESUMO_FUNCIONARIOS.md` - Resumo das alterações
- `src/modules/funcionarios/README.md` - Documentação do módulo

---

**✅ Após corrigir:** O cadastro de funcionários funcionará normalmente e os dados estarão sincronizados com todos os módulos da plataforma!
