# 🗑️ Guia de Limpeza de Migrations

## 📊 Resumo da Análise

**Total de arquivos SQL:** 139 migrations

---

## ✅ Candidatos Seguros para Deletar

Estas migrations provavelmente **não são mais necessárias**:

### 1. Diagnóstico (1 arquivo)
- `024_diagnostico_rls.sql` - Script de diagnóstico temporário

### 2. Rollback (1 arquivo)
- `073_rollback_security.sql` - Rollback de segurança (se as mudanças foram consolidadas)

### 3. Hotfix (1 arquivo)
- `097_hotfix_login_profile.sql` - Hotfix que pode ter sido incorporado

---

## ⚠️ Migrations para Verificar com Cuidado

### Correções Emergenciais (3 arquivos)
Estas podem ter sido consolidadas em migrations posteriores:
- `007_fix_rls_urgente.sql`
- `022_correcao_emergencial_rls.sql`
- `086_fix_emergencial_simples.sql`

**Verificar:** Se há uma versão posterior que consolidou estas correções (ex: `080_enable_rls_all_tables.sql` ou `111_universal_rls_governance_v3_1.sql`)

### Cleanup (3 arquivos)
- `048_turmas_integridade_e_limpeza.sql` - Limpeza de turmas
- `089_gestor_acesso_total_limpeza.sql` - Limpeza de acesso gestor
- `118_cleanup_stale_school.sql` - Limpeza de escola obsoleta

**Verificar:** Se os dados/limpeza foram aplicados permanentemente

---

## 🔢 Migrations com Mesmo Número (Potencial Redundância)

### Grupo 013
- `013_fix_rls_turmas.sql`
- `013_vincular_gestor_escola.sql`
- **Recomendação:** Manter ambas se fizerem coisas diferentes, ou consolidar

### Grupo 032
- `032_backfill_financeiro.sql`
- `032_document_solicitations.sql`
- **Recomendação:** Provavelmente são complementares (nomes diferentes)

### Grupo 035
- `035_fix_boletim_rls.sql`
- `035_fix_rls_frequencias.sql`
- **Recomendação:** Verificar se foram consolidadas em `096_comprehensive_portal_rls.sql`

### Grupo 041
- `041_autorizacoes_responsaveis.sql`
- `041_funcionarios_full_access_rls.sql`
- **Recomendação:** Provavelmente complementares

### Grupo 046
- `046_fix_matriculas_turmas.sql`
- `046_radar_evasao_melhorias.sql`
- **Recomendação:** Verificar redundância

### Grupo 048
- `048_notificacoes_sincronizadas.sql`
- `048_turmas_integridade_e_limpeza.sql`
- **Recomendação:** Provavelmente complementares

### Grupo 114-118 (Múltiplas correções)
- `114_add_tipo_empresa_planos.sql` + `114_universal_rls_fix.sql`
- `115_add_validade_planos.sql` + `115_fix_cadastro_escola.sql`
- `116_add_tipo_pagamento_planos.sql` + `116_fix_cadastro_escola_selects.sql`
- `117_fix_rls_responsaveis.sql` + `117_fix_super_admin_escolas_access.sql`
- `118_add_genero_alunos.sql` + `118_cleanup_stale_school.sql`
- **Recomendação:** Unificar em arquivos únicos com nomes mais descritivos

### Grupo 130-131
- `130_configuracoes_historico_campo.sql` + `130_curriculos_profissionais.sql` + `130_fix_rbac_initial_access.sql`
- `131_correcao_health_score.sql` + `131_curriculos_permissions.sql`
- **Recomendação:** Consolidar em um único arquivo por versão

### Grupo 20260320 (Migrations recentes)
- `20260320_075_materiais_rls_fix.sql`
- `20260320_076_portal_itens_sync.sql`
- `20260320_077_fix_rls_update_alunos.sql`
- `20260320_080_sync_portal_final.sql`
- `20260320_materiais_escolares.sql`
- **Recomendação:** Estas parecem ser iterações rápidas - consolidar em uma única migration

---

## 🔄 Migrations Possivelmente Substituídas

### Correções RLS (7 arquivos)
Estas podem ter sido consolidadas na `111_universal_rls_governance_v3_1.sql`:
- `007_fix_rls_urgente.sql`
- `011_fix_rls_filiais_e_onboarding.sql`
- `013_fix_rls_turmas.sql`
- `035_fix_rls_frequencias.sql`
- `059_fix_rls_financeiro_relatorios.sql`
- `117_fix_rls_responsaveis.sql`
- `20260320_077_fix_rls_update_alunos.sql`

### RLS do Portal (4 arquivos)
Podem ter sido consolidadas em `096_comprehensive_portal_rls.sql`:
- `030_portal_rls_policies.sql`
- `092_fix_portal_rls_recursion.sql`
- `096_comprehensive_portal_rls.sql` (manter esta)
- `marketplace_portal_rls.sql`

### Acesso Gestor (3 arquivos)
Podem ter sido consolidadas na última versão:
- `085_fix_gestor_acesso_completo.sql`
- `088_gestor_acesso_total_irrestrito.sql`
- `089_gestor_acesso_total_limpeza.sql`
- **Recomendação:** Manter apenas `090_correcao_definitiva_gestor.sql` ou `107_restaurar_gestor_sem_afetar_portal.sql`

---

## 📋 Checklist de Verificação Antes de Deletar

### Passo 1: Criar tabela de controle de migrations
```sql
CREATE TABLE IF NOT EXISTS migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  applied_at TIMESTAMP DEFAULT NOW(),
  description TEXT
);
```

### Passo 2: Verificar no banco de dados
Para cada migration candidata:
1. Abra o arquivo SQL
2. Identifique as tabelas/colunas/políticas criadas
3. Verifique no Supabase se existem:
   ```sql
   -- Verificar tabela
   SELECT EXISTS (
     SELECT FROM information_schema.tables 
     WHERE table_name = 'nome_tabela'
   );
   
   -- Verificar coluna
   SELECT EXISTS (
     SELECT FROM information_schema.columns 
     WHERE table_name = 'nome_tabela' AND column_name = 'nome_coluna'
   );
   
   -- Verificar política RLS
   SELECT EXISTS (
     SELECT FROM pg_policies 
     WHERE tablename = 'nome_tabela'
   );
   ```

### Passo 3: Registrar migrations aplicadas
```sql
-- Para cada migration que você confirmar que foi aplicada
INSERT INTO migrations (name, description) VALUES 
  ('111_universal_rls_governance_v3_1.sql', 'Governança RLS universal v3.1'),
  ('096_comprehensive_portal_rls.sql', 'RLS completo do portal'),
  ('090_correcao_definitiva_gestor.sql', 'Correção definitiva acesso gestor');
```

### Passo 4: Deletar arquivos redundantes
Após confirmar que as mudanças estão no banco:
- Delete os arquivos de diagnóstico
- Delete os arquivos de rollback
- Delete hotfixes incorporados
- Delete correções emergenciais consolidadas

---

## 🎯 Plano de Ação Recomendado

### Fase 1: Seguro (pode deletar agora)
1. `024_diagnostico_rls.sql`
2. `073_rollback_security.sql`

### Fase 2: Verificar e consolidar
1. Agrupar migrations por número duplicado
2. Ler cada arquivo e identificar sobreposições
3. Manter apenas o último de cada série (se aplicável)

### Fase 3: Limpeza de correções
1. Identificar a "versão definitiva" de cada correção
2. Manter: `111_universal_rls_governance_v3_1.sql`, `096_comprehensive_portal_rls.sql`, `090_correcao_definitiva_gestor.sql`
3. Deletar correções anteriores se consolidadas

### Fase 4: Organização futura
1. Padronizar numeração (evitar números duplicados)
2. Usar nomes descritivos
3. Criar migration de consolidação quando houver múltiplas correções

---

## 📝 Scripts Úteis

### Listar todas as tabelas do banco
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

### Listar todas as políticas RLS
```sql
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Verificar colunas de uma tabela
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'nome_tabela'
ORDER BY ordinal_position;
```

---

## ⚠️ Avisos Importantes

1. **NUNCA delete migrations sem verificar o banco de dados**
2. **Sempre faça backup antes de deletar arquivos**
3. **Documente quais migrations foram consolidadas**
4. **Mantenha um changelog das mudanças**

---

## 📞 Dúvidas?

Consulte a documentação do Supabase ou o histórico de commits do projeto para entender o contexto de cada migration.
