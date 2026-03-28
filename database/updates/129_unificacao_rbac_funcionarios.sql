-- ==============================================================================
-- 🛡️ MIGRATION 129: UNIFICAÇÃO DE ACESSO (PERFIS RBAC)
-- Descrição: Migra o sistema de "Áreas de Acesso" legado para o sistema de 
--            "Perfis de Acesso" (RBAC Enterprise). 
--            Garante que o RPC de permissões funcione para todos.
-- ==============================================================================

-- 1. ATUALIZAÇÃO DA RPC DE PERMISSÕES (FALLBACK PARA ÁREAS LEGADAS)
-- Isso garante que quem ainda tem "areas_acesso" continue funcionando 
-- enquanto a migração completa acontece.
CREATE OR REPLACE FUNCTION public.fn_resolve_user_permissions(p_user_id UUID)
RETURNS TABLE(
    permission_key TEXT,
    scope scope_type,
    source TEXT
) AS $$
DECLARE
    v_perfil_id UUID;
    v_current_perfil UUID;
    v_depth INTEGER := 0;
    v_funcionario_id UUID;
    v_areas TEXT[];
BEGIN
    -- 1. TENTAR VIA USUARIOS_SISTEMA (RBAC OFICIAL)
    SELECT us.perfil_id INTO v_perfil_id
    FROM public.usuarios_sistema us
    WHERE us.id = p_user_id AND us.status = 'ativo';
    
    -- Se encontrou perfil, resolve via herança
    IF v_perfil_id IS NOT NULL THEN
        v_current_perfil := v_perfil_id;
        WHILE v_current_perfil IS NOT NULL AND v_depth < 3 LOOP
            RETURN QUERY
            SELECT p.key, pp.scope_type, 'perfil'::TEXT
            FROM public.perfil_permissions pp
            JOIN public.permissions p ON p.id = pp.permission_id
            WHERE pp.perfil_id = v_current_perfil;
            
            SELECT pa.parent_perfil_id INTO v_current_perfil
            FROM public.perfis_acesso pa
            WHERE pa.id = v_current_perfil;
            
            v_depth := v_depth + 1;
        END LOOP;
        
        -- Overrides (allow)
        RETURN QUERY
        SELECT p.key, 'toda_escola'::scope_type, 'override_allow'::TEXT
        FROM public.user_permission_overrides upo
        JOIN public.permissions p ON p.id = upo.permission_id
        WHERE upo.user_id = p_user_id AND upo.status = 'allow';
        
        RETURN;
    END IF;

    -- 2. FALLBACK: VIA FUNCIONARIOS.AREAS_ACESSO (LEGADO)
    -- Se não tem perfil no usuarios_sistema, mapeia as áreas para permissões
    SELECT areas_acesso INTO v_areas
    FROM public.funcionarios
    WHERE user_id = p_user_id;

    IF v_areas IS NOT NULL AND array_length(v_areas, 1) > 0 THEN
        RETURN QUERY
        SELECT 
            CASE 
                WHEN a = 'dashboard' THEN 'dashboard.view'
                WHEN a = 'alunos' THEN 'academico.alunos.view'
                WHEN a = 'turmas' THEN 'academico.turmas.view'
                WHEN a = 'frequencia' THEN 'academico.frequencia.register'
                WHEN a = 'mural' THEN 'comunicacao.mural.view'
                WHEN a = 'financeiro' THEN 'financeiro.cobrancas.view'
                WHEN a = 'financeiro_view' THEN 'financeiro.cobrancas.view'
                WHEN a = 'contas_pagar' THEN 'financeiro.contas_pagar.view'
                WHEN a = 'config_financeira' THEN 'financeiro.config.view'
                WHEN a = 'funcionarios' THEN 'gestao.funcionarios.view'
                WHEN a = 'matriculas' THEN 'academico.matriculas.view'
                WHEN a = 'planos_aula' THEN 'academico.planos_aula.view'
                WHEN a = 'atividades' THEN 'academico.atividades.view'
                WHEN a = 'agenda' THEN 'comunicacao.agenda.view'
                WHEN a = 'documentos' THEN 'academico.documentos.view'
                WHEN a = 'almoxarifado' THEN 'gestao.almoxarifado.view'
                WHEN a = 'perfil_escola' THEN 'gestao.perfil_escola.view'
                ELSE 'dashboard.view' -- Fallback mínimo
            END as p_key,
            'toda_escola'::scope_type,
            'legacy_area'::TEXT
        FROM unnest(v_areas) as a;
        
        -- Adiciona permissão de dashboard por padrão se tiver qualquer acesso
        RETURN QUERY SELECT 'dashboard.view'::TEXT, 'toda_escola'::scope_type, 'legacy_area'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. BACKFILL: CRIAR REGISTROS EM USUARIOS_SISTEMA PARA QUEM JÁ TEM ACESSO
-- Isso move os usuários do sistema legado para o novo RBAC automaticamente.
DO $$
DECLARE
    rec RECORD;
    v_perfil_default UUID := 'a0000001-0000-0000-0000-000000000001'; -- Perfil Professor (Base)
    v_perfil_adm UUID := 'a0000001-0000-0000-0000-000000000005'; -- Perfil Administrador
    v_perfil_final UUID;
BEGIN
    FOR rec IN 
        SELECT id, user_id, tenant_id, email, funcoes, areas_acesso
        FROM public.funcionarios 
        WHERE user_id IS NOT NULL
    LOOP
        -- Se já existe no usuarios_sistema, pula
        IF EXISTS (SELECT 1 FROM public.usuarios_sistema WHERE id = rec.user_id) THEN
            CONTINUE;
        END IF;

        -- Determinar melhor perfil inicial
        IF 'Professor' = ANY(rec.funcoes) OR 'Corpo Docente' = ANY(rec.funcoes) THEN
            v_perfil_final := v_perfil_default;
        ELSIF array_length(rec.areas_acesso, 1) > 10 THEN
            v_perfil_final := v_perfil_adm;
        ELSE
            v_perfil_final := v_perfil_default;
        END IF;

        -- Inserir no usuarios_sistema
        INSERT INTO public.usuarios_sistema (id, tenant_id, funcionario_id, email_login, perfil_id, status)
        VALUES (rec.user_id, rec.tenant_id, rec.id, COALESCE(rec.email, 'migrado_' || rec.user_id || '@fluxoo.edu'), v_perfil_final, 'ativo')
        ON CONFLICT (id) DO NOTHING;
    END LOOP;
END $$;
