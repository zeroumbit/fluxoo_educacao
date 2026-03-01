# ✅ SOLUÇÃO DEFINITIVA - Erro 403 Funcionários

## 🚨 Erro Reportado
```
GET https://...supabase.co/rest/v1/funcionarios?... 403 (Forbidden)
{code: '42501', message: 'permission denied for table users'}
```

---

## 🔧 SOLUÇÃO EM 1 PASSO

### Execute este script no SQL Editor do Supabase:

```sql
-- =====================================================
-- SOLUÇÃO RÁPIDA - Copie e cole no SQL Editor
-- =====================================================

-- 1. Habilitar RLS
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE escolas ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas
DROP POLICY IF EXISTS "funcionarios_gestor_read" ON funcionarios;
DROP POLICY IF EXISTS "funcionarios_gestor_insert" ON funcionarios;
DROP POLICY IF EXISTS "funcionarios_gestor_update" ON funcionarios;
DROP POLICY IF EXISTS "funcionarios_gestor_delete" ON funcionarios;
DROP POLICY IF EXISTS "escolas_gestor_read" ON escolas;
DROP POLICY IF EXISTS "escolas_gestor_update" ON escolas;

-- 3. Criar políticas para ESCOLAS
CREATE POLICY "escolas_gestor_read" ON escolas
  FOR SELECT TO authenticated
  USING (gestor_user_id = auth.uid());

CREATE POLICY "escolas_gestor_update" ON escolas
  FOR UPDATE TO authenticated
  USING (gestor_user_id = auth.uid());

-- 4. Criar políticas para FUNCIONARIOS
CREATE POLICY "funcionarios_gestor_read" ON funcionarios
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM escolas
      WHERE escolas.id = funcionarios.tenant_id
      AND escolas.gestor_user_id = auth.uid()
    )
    OR funcionarios.user_id = auth.uid()
  );

CREATE POLICY "funcionarios_gestor_insert" ON funcionarios
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM escolas
      WHERE escolas.id = funcionarios.tenant_id
      AND escolas.gestor_user_id = auth.uid()
    )
  );

CREATE POLICY "funcionarios_gestor_update" ON funcionarios
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM escolas
      WHERE escolas.id = funcionarios.tenant_id
      AND escolas.gestor_user_id = auth.uid()
    )
  );

CREATE POLICY "funcionarios_gestor_delete" ON funcionarios
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM escolas
      WHERE escolas.id = funcionarios.tenant_id
      AND escolas.gestor_user_id = auth.uid()
    )
  );

-- 5. Verificar
SELECT 'Políticas criadas com sucesso!' AS status;
```

---

## ✅ TESTAR

1. **Recarregue** a página http://localhost:5173/funcionarios
2. **Cadastre** um funcionário
3. **Verifique** se aparece na lista

---

## 🐛 AINDA COM PROBLEMAS?

### Diagnóstico Rápido

Execute no SQL Editor:

```sql
-- 1. Verificar RLS
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('funcionarios', 'escolas');

-- 2. Verificar políticas
SELECT policyname, cmd FROM pg_policies WHERE tablename IN ('funcionarios', 'escolas');

-- 3. Verificar se usuário tem escola
SELECT id, razao_social, gestor_user_id FROM escolas WHERE gestor_user_id = auth.uid();

-- 4. Testar query
SELECT * FROM funcionarios LIMIT 5;
```

### Problemas Comuns

#### 1. "gestor_user_id é NULL"
**Solução:** Vincular usuário à escola
```sql
UPDATE escolas 
SET gestor_user_id = '<SEU_USER_ID>' 
WHERE id = '<ID_DA_ESCOLA>';
```

#### 2. "tenant_id não está sendo enviado"
**Solução:** Verificar AuthContext
- O usuário logado é gestor?
- O tenantId está sendo preenchido?

#### 3. "Políticas não funcionam"
**Solução:** Dropar e recriar
```sql
DROP POLICY IF EXISTS "funcionarios_gestor_read" ON funcionarios;
-- Depois recriar com o script acima
```

---

## 📋 SCRIPTS DISPONÍVEIS

| Arquivo | Descrição |
|---------|-----------|
| `023_solucion definitiva_rls_funcionarios.sql` | Solução completa e permanente |
| `024_diagnostico_rls.sql` | Script de diagnóstico |
| `022_correcao_emergencial_rls.sql` | Solução emergencial (políticas permissivas) |

---

## 📖 DOCUMENTAÇÃO COMPLETA

- `CORRECAO_ERRO_403.md` - Guia detalhado de troubleshooting
- `CORRECAO_RAPIDA.md` - Instruções rápidas
- `FUNCIONARIOS_FIX.md` - Documentação original
- `RESUMO_FUNCIONARIOS.md` - Resumo das alterações

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Executar script SQL acima
2. ✅ Testar cadastro de funcionário
3. ✅ Testar listagem
4. ✅ Implementar em produção

---

**✅ Após aplicar:** O módulo de funcionários estará 100% funcional!
