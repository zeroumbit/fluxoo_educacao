-- =====================================================
-- MIGRAÇÃO: Correção de status de cobranças em atraso
-- Arquivo: 137_correcao_status_cobrancas.sql
-- Problema 1: cobranças com status desatualizado no banco
-- Problema 2: diagnóstico para verificar se cobranças estão
--             sendo geradas corretamente (bug de "só 1 mês")
-- IDEMPOTENTE: Seguro para rodar múltiplas vezes.
-- =====================================================

-- =====================================================
-- 0. DIAGNÓSTICO: quantas cobranças por aluno?
-- (Execute isso primeiro para entender o estado atual)
-- =====================================================

-- Ver cobranças por aluno (buscar alunos com poucas cobranças)
SELECT 
    a.nome_completo,
    COUNT(c.id) as total_cobrancas,
    COUNT(CASE WHEN c.status = 'a_vencer' THEN 1 END) as a_vencer,
    COUNT(CASE WHEN c.status = 'atrasado' THEN 1 END) as atrasadas,
    COUNT(CASE WHEN c.status = 'pago' THEN 1 END) as pagas,
    COUNT(CASE WHEN c.status = 'cancelado' THEN 1 END) as canceladas,
    COUNT(CASE WHEN c.deleted_at IS NOT NULL THEN 1 END) as deletadas_soft
FROM public.alunos a
LEFT JOIN public.cobrancas c ON c.aluno_id = a.id
GROUP BY a.id, a.nome_completo
ORDER BY total_cobrancas ASC
LIMIT 20;

-- Verificar se há cobranças com soft-delete (deleted_at preenchido)
-- que estão ocultando os dados no portal
SELECT 
    a.nome_completo,
    c.descricao,
    c.data_vencimento,
    c.status,
    c.valor,
    c.deleted_at,
    c.deleted_by
FROM public.cobrancas c
JOIN public.alunos a ON a.id = c.aluno_id
WHERE c.deleted_at IS NOT NULL
ORDER BY c.created_at DESC
LIMIT 50;


-- 1. Mostrar quantas cobranças estão com status incorreto
SELECT 
    COUNT(*) as total_com_status_errado,
    'a_vencer no banco, mas data já passou' as situacao
FROM public.cobrancas c
LEFT JOIN public.configuracoes_escola ce 
    ON c.tenant_id = ce.tenant_id 
    AND ce.vigencia_fim IS NULL
WHERE c.pago = FALSE
  AND c.deleted_at IS NULL
  AND c.status = 'a_vencer'
  AND c.data_vencimento + COALESCE((ce.config_financeira->>'dias_carencia')::INTEGER, 0) < CURRENT_DATE;

-- 2. Disparar o trigger em massa: UPDATE força o trigger a recalcular o status.
--    Atualiza TODAS as cobranças não pagas para que o trigger corrija o status.
--    O trigger fn_atualizar_status_cobranca já tem toda a lógica de carência.
UPDATE public.cobrancas
SET updated_at = NOW()
WHERE pago = FALSE
  AND deleted_at IS NULL
  AND status != 'cancelado'
  AND data_vencimento < CURRENT_DATE;

-- 3. Verificar resultado
SELECT 
    status,
    COUNT(*) as quantidade,
    SUM(valor) as valor_total
FROM public.cobrancas
WHERE pago = FALSE
  AND deleted_at IS NULL
  AND status != 'cancelado'
GROUP BY status
ORDER BY status;

-- 4. Agendar o job para rodar diariamente (via pg_cron se disponível no Supabase)
-- NOTA: No Supabase, usar "Database > Extensions > pg_cron" e cadastrar o job:
--
-- SELECT cron.schedule(
--   'atualizar-status-cobrancas-diario',
--   '0 6 * * *',  -- Roda às 06:00 todos os dias (horário UTC)
--   $$ SELECT public.atualizar_status_cobrancas_em_massa(); $$
-- );
--
-- Para verificar jobs agendados:
-- SELECT * FROM cron.job;

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================
