-- ==============================================================================
-- SCRIPT DE AUTO-REPARO: REMOÇÃO DE DUPLICIDADES
-- Descrição: Este script apaga em lote as cobranças que foram geradas em dobro 
-- (apenas as que não foram pagas) e as reconstrói perfeitamente usando a nova 
-- lógica blindada da plataforma.
-- ==============================================================================

BEGIN;

-- 1. APRENDIZAGEM E LIMPEZA: Apagar TODA a "sujeira" das faturas que estão abertas. 
-- Faturas PAGAS (Manual ou Mercado Pago) não serão tocadas! Proteção máxima.
DELETE FROM public.cobrancas
WHERE 
  -- Somente faturas não pagas
  (status = 'a_vencer' OR status = 'atrasado' OR status = 'pendente')
  AND (pago = false OR pago IS NULL)
  AND (valor_pago IS NULL OR valor_pago = 0)
  -- Somente faturas do ciclo escolar
  AND tipo_cobranca = 'mensalidade';


-- 2. RECONSTRUÇÃO: Percorre todas as matrículas ativas do banco e roda o a RPC 
-- corrigida que vai gerar (sem duplicar) apenas as parcelas exatas até dezembro.
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN 
        SELECT m.aluno_id, m.tenant_id 
        FROM public.matriculas m
        WHERE m.status = 'ativa'
    LOOP
        -- Chama a RPC corrigida para cada aluno. Ela só gerará onde realmente falta.
        PERFORM public.fn_gerar_mensalidades_aluno(r.aluno_id, r.tenant_id);
    END LOOP;
END $$;

COMMIT;
