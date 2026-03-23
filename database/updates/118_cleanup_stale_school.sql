-- ==============================================================================
-- 🛡️ MIGRATION 118: CLEANUP STALE SCHOOL DATA
-- Descrição: Remove qualquer resquício da escola "Universidade Fluxoo"
-- que possa ter sobrado após deleções manuais incompletas.
-- CNPJ: 36.991.323/0001-31 | Email: fluxoosoftware@gmail.com
-- ==============================================================================

DO $$ 
DECLARE 
    v_tenant_id UUID;
BEGIN
    -- 1. Tenta encontrar o ID da escola pelo CNPJ ou Email
    SELECT id INTO v_tenant_id FROM public.escolas 
    WHERE cnpj = '36.991.323/0001-31' OR email_gestor = 'fluxoosoftware@gmail.com'
    LIMIT 1;

    IF v_tenant_id IS NOT NULL THEN
        RAISE NOTICE '🧹 Iniciando limpeza profunda para o tenant_id: %', v_tenant_id;

        -- 2. Limpeza de tabelas transacionais e filiais (Ordem inversa para evitar erros de FK)
        DELETE FROM public.cobrancas WHERE tenant_id = v_tenant_id;
        DELETE FROM public.matriculas WHERE tenant_id = v_tenant_id;
        DELETE FROM public.turmas WHERE tenant_id = v_tenant_id;
        DELETE FROM public.alunos WHERE tenant_id = v_tenant_id;
        DELETE FROM public.funcionarios WHERE tenant_id = v_tenant_id;
        DELETE FROM public.filiais WHERE tenant_id = v_tenant_id;
        DELETE FROM public.faturas WHERE tenant_id = v_tenant_id;
        DELETE FROM public.assinaturas WHERE tenant_id = v_tenant_id;
        DELETE FROM public.solicitacoes_upgrade WHERE tenant_id = v_tenant_id;
        DELETE FROM public.config_financeira WHERE tenant_id = v_tenant_id;
        DELETE FROM public.mural_avisos WHERE tenant_id = v_tenant_id;
        DELETE FROM public.eventos WHERE tenant_id = v_tenant_id;

        -- 3. Finalmente deleta a escola
        DELETE FROM public.escolas WHERE id = v_tenant_id;

        RAISE NOTICE '✅ Limpeza de tabelas públicas concluída.';
    ELSE
        RAISE NOTICE '⚠️ Nenhuma escola encontrada na tabela public.escolas com este CNPJ/Email.';
    END IF;

    -- 4. Limpeza de Segurança (Auth Users relacionados)
    -- Atenção: Isso remove usuários que tenham o tenant_id nos metadados
    -- (Opcional se o usuário já limpou o auth.users, mas garante integridade)
    RAISE NOTICE '⏳ Verifique se há usuários orfãos em auth.users com metadados deste CNPJ/Email.';

END $$;
