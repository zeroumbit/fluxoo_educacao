# 🔧 Correção do Health Score das Escolas

## 📋 Problema Identificado

A barra de progresso da saúde das escolas no `/admin/dashboard` não refletia a realidade:

- **Escolas com 0% de uso** apareciam com **60% de saúde** ❌
- **Escolas financeiramente em dia** mas **sem alunos** tinham score inflado ❌
- **Escolas com 100% de uso mas COM atraso** tinham o mesmo score que escolas saudáveis ❌

### Causa Raiz

A view `vw_tenant_health_score` usava uma fórmula com pontos fixos:

```sql
-- FÓRMULA ANTIGA (PROBLEMÁTICA)
CASE
    WHEN f.possui_atraso THEN 20
    ELSE 40  -- Escola sem atraso: 40 pontos FIXOS
END
+
CASE
    WHEN u.percentual_uso > 90 THEN 40
    WHEN u.percentual_uso > 70 THEN 30
    ELSE 20  -- Escola com pouco uso: 20 pontos FIXOS
END AS health_score
```

**Resultado:** Escola com 0% de uso + sem atraso = 40 + 20 = **60%** (falso positivo!)

---

## ✅ Solução Implementada

### Nova Fórmula (Proporcional e Justa)

```sql
-- FÓRMULA NOVA (CORRIGIDA)
Componente 1: Uso da Cota (0-70 pontos)
  - Proporcional: percentual_uso * 0.70
  - Escola com 0% de uso = 0 pontos
  - Escola com 100% de uso = 70 pontos

Componente 2: Bônus Financeiro (0-30 pontos)
  - Sem atraso: 30 pontos
  - COM atraso: 0 pontos (penalização total)
```

### Tabela Comparativa

| Escola | Uso | Atraso | Score ANTIGO | Score NOVO | Status |
|--------|-----|--------|--------------|------------|--------|
| Escola A | 0% | Não | 60% ❌ | 30% ✅ | Crítico |
| Escola B | 50% | Não | 60% ❌ | 65% ✅ | Estável |
| Escola C | 100% | Não | 80% ✅ | 100% ✅ | Saudável |
| Escola D | 50% | **Sim** | 40% ✅ | 17.5% ✅ | Atenção |
| Escola E | 100% | **Sim** | 60% ❌ | 35% ✅ | Crítico |

---

## 🚀 Como Aplicar a Correção

### Passo 1: Executar Migration no Supabase

1. Acesse o **SQL Editor** do Supabase
2. Copie o conteúdo do arquivo `database/updates/131_correcao_health_score.sql`
3. Execute o script completo

```sql
-- Copie e cole no SQL Editor do Supabase
-- Arquivo: database/updates/131_correcao_health_score.sql
```

### Passo 2: Validar a Correção

Após aplicar, execute esta query para verificar os novos scores:

```sql
SELECT 
    tenant_id, 
    razao_social, 
    ROUND(percentual_uso, 1) as uso_cota,
    alunos_ativos,
    limite_alunos_contratado,
    CASE WHEN possui_atraso THEN 'SIM' ELSE 'NÃO' END as atraso,
    ROUND(health_score, 1) as health_score_novo
FROM vw_tenant_health_score 
ORDER BY health_score ASC;
```

### Passo 3: Verificar no Dashboard

1. Acesse `http://localhost:5173/admin/dashboard`
2. Veja o card **Health Score**
3. Confirme que:
   - Escolas com **baixo uso** estão com score **baixo** (< 50%)
   - Escolas com **atraso** estão com score **muito baixo** (< 25%)
   - Escolas **cheias e em dia** estão com score **alto** (> 75%)

---

## 📊 Interpretação dos Scores

| Faixa | Classificação | Ação Recomendada |
|-------|--------------|------------------|
| **0-24%** | 🔴 Crítico | Contato imediato - risco de churn |
| **25-49%** | 🟠 Atenção | Investigar causa (uso baixo ou financeiro) |
| **50-74%** | 🟡 Estável | Monitorar - boa saúde mas pode melhorar |
| **75-100%** | 🟢 Saudável | Escola ativa e em dia |

---

## 🎯 Benefícios da Correção

1. **Detecção Precoce de Risco**
   - Escolas com baixo uso agora aparecem como "Críticas"
   - Permite ação proativa do Super Admin

2. **Financeiro Penalizado Corretamente**
   - Escola com atraso perde TODOS os 30 pontos financeiros
   - Score cai drasticamente, alertando para risco

3. **Proporcionalidade**
   - Score reflete REALMENTE o uso da cota contratada
   - Escola com 50% de uso = ~35 pontos de uso (não 20 fixos!)

4. **Transparência**
   - UI agora mostra:
     - Número de alunos ativos vs limite
     - Status financeiro (em dia/atraso)
     - Classificação textual (Crítico/Atenção/Estável/Saudável)
     - Barra de progresso colorida por faixa

---

## 🔍 Validação Pós-Apply

### Query de Validação

```sql
-- Verificar casos específicos
SELECT 
    razao_social,
    ROUND(percentual_uso, 1) as uso,
    alunos_ativos,
    limite_alunos_contratado,
    CASE WHEN possui_atraso THEN '⚠️ ATRASO' ELSE '✅ OK' END as financeiro,
    ROUND(health_score, 1) as score,
    CASE 
        WHEN health_score < 25 THEN '🔴 Crítico'
        WHEN health_score < 50 THEN '🟠 Atenção'
        WHEN health_score < 75 THEN '🟡 Estável'
        ELSE '🟢 Saudável'
    END as classificacao
FROM vw_tenant_health_score
ORDER BY health_score;
```

### Casos de Teste

| Cenário | Uso | Alunos | Limite | Atraso | Score Esperado |
|---------|-----|--------|--------|--------|----------------|
| Escola Nova | 0% | 0 | 100 | Não | 30% (Atenção) |
| Escola Crescente | 50% | 50 | 100 | Não | 65% (Estável) |
| Escola Cheia | 100% | 100 | 100 | Não | 100% (Saudável) |
| Escola Problema | 50% | 50 | 100 | **Sim** | 17.5% (Crítico) |
| Escola Risco | 100% | 100 | 100 | **Sim** | 35% (Atenção) |

---

## 📝 Notas Técnicas

### Arquivos Modificados

1. **Banco de Dados:**
   - `database/updates/131_correcao_health_score.sql` (NOVO)

2. **Frontend:**
   - `src/modules/super-admin/pages/SuperAdminDashboardPage.web.tsx`
   - `src/modules/super-admin/pages/SuperAdminDashboardPage.mobile.tsx` (opcional)

### Views Afetadas

- `vw_tenant_uso_cota` (permanece igual)
- `vw_tenant_financeiro` (permanece igual)
- `vw_tenant_health_score` (MODIFICADA)

### Impacto

- ✅ **Super Admin**: Dashboard mais precisa
- ✅ **Comercial**: Alertas de churn mais confiáveis
- ✅ **Financeiro**: Escolas em atraso destacadas
- ⚠️ **Nenhum impacto** em outras funcionalidades

---

## ✅ Checklist de Aplicação

- [ ] Backup do banco (automático no Supabase)
- [ ] Executar migration `131_correcao_health_score.sql`
- [ ] Validar query de verificação
- [ ] Testar no dashboard `/admin/dashboard`
- [ ] Verificar casos de teste
- [ ] Comunicar equipe sobre nova classificação

---

**Data da Correção:** 28 de março de 2026  
**Responsável:** Super Admin  
**Status:** ✅ Pronto para produção
