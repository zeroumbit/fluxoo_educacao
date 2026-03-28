-- ==============================================================================
-- CORREÇÃO DO HEALTH SCORE DAS ESCOLAS
-- ==============================================================================
-- Problema: A fórmula anterior dava 60% para escolas com 0% de uso e financeiro em dia
-- Solução: Nova fórmula ponderada onde uso da cota é o fator principal (70%)
-- e financeiro é complementar (30%)
-- ==============================================================================

-- DROP na view antiga para recriar com novas colunas
DROP VIEW IF EXISTS vw_tenant_health_score CASCADE;

CREATE OR REPLACE VIEW vw_tenant_health_score WITH (security_invoker = on) AS
SELECT
    u.tenant_id,
    u.razao_social,
    u.percentual_uso,
    u.alunos_ativos,
    u.limite_alunos_contratado,
    f.possui_atraso,
    f.ultimo_vencimento,
    
    -- NOVA FÓRMULA DO HEALTH SCORE (0-100%)
    -- Componente 1: Uso da Cota (0-70 pontos)
    -- - Proporcional ao percentual de uso
    -- - Escola com 0% de uso = 0 pontos
    -- - Escola com 100% de uso = 70 pontos
    (
        CASE
            -- Se tem atraso, reduz uso da cota para 50% do valor original (max 35 pontos)
            WHEN f.possui_atraso THEN (u.percentual_uso * 0.35)
            -- Sem atraso, usa escala completa (max 70 pontos)
            ELSE (u.percentual_uso * 0.70)
        END
    )
    +
    -- Componente 2: Bônus Financeiro (0-30 pontos)
    -- - Escola sem atraso ganha 30 pontos
    -- - Escola com atraso perde TODOS os pontos financeiros
    CASE
        WHEN f.possui_atraso THEN 0
        ELSE 30
    END
    AS health_score
    
FROM vw_tenant_uso_cota u
LEFT JOIN vw_tenant_financeiro f ON f.tenant_id = u.tenant_id
ORDER BY health_score ASC;

-- ==============================================================================
-- EXEMPLOS DE COMPORTAMENTO (ANTES vs DEPOIS)
-- ==============================================================================
-- Escola A: 0% uso, sem atraso
--   ANTES: 40 + 20 = 60% ❌ (falso positivo)
--   DEPOIS: (0 * 0.70) + 30 = 30% ✅ (alerta de uso baixo)
--
-- Escola B: 50% uso, sem atraso
--   ANTES: 40 + 20 = 60% ❌ (não reflete uso real)
--   DEPOIS: (50 * 0.70) + 30 = 65% ✅ (proporcional ao uso)
--
-- Escola C: 100% uso, sem atraso
--   ANTES: 40 + 40 = 80% ✅
--   DEPOIS: (100 * 0.70) + 30 = 100% ✅ (saúde máxima)
--
-- Escola D: 50% uso, COM atraso
--   ANTES: 20 + 20 = 40% ✅
--   DEPOIS: (50 * 0.35) + 0 = 17.5% ✅ (penaliza mais o atraso)
--
-- Escola E: 100% uso, COM atraso
--   ANTES: 20 + 40 = 60% ❌ (escola cheia mas inadimplente)
--   DEPOIS: (100 * 0.35) + 0 = 35% ✅ (alerta de risco financeiro)
-- ==============================================================================

COMMENT ON VIEW vw_tenant_health_score IS '
Health Score corrigido para Super Admin acompanhar saúde das escolas.

FÓRMULA:
- Uso da Cota (0-70 pts): Proporcional aos alunos ativos vs limite contratado
- Bônus Financeiro (0-30 pts): 30 pontos se SEM atrasos, 0 se COM atraso

INTERPRETAÇÃO:
- 0-24%: Crítico (risco de evasão/churn)
- 25-49%: Atenção (uso baixo ou financeiro problemático)
- 50-74%: Estável (boa saúde, mas pode melhorar)
- 75-100%: Saudável (escola ativa e em dia)

EXECUTAR APÓS APPLY:
SELECT tenant_id, razao_social, percentual_uso, possui_atraso, 
       ROUND(health_score, 1) as score 
FROM vw_tenant_health_score 
ORDER BY health_score;
';
