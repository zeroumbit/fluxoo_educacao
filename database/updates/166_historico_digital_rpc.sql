-- ==============================================================================
-- RPC Functions para Histórico Digital de Transferências
-- Autor: Fluxoo Edu
-- Data: 2026-04-20
-- Descrição: Funções para buscar dados acadêmicos consolidados para emissão de
--            histórico escolar oficial
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Função para buscar médias consolidadas por aluno
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_get_historico_medias_aluno(p_aluno_id UUID, p_tenant_id UUID)
RETURNS TABLE (
    disciplina_id UUID,
    disciplina_nome TEXT,
    bimestre INTEGER,
    media_final NUMERIC,
    resultado TEXT
) LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bc.disciplina_id,
        d.nome AS disciplina_nome,
        bc.bimestre,
        bc.media_final,
        bc.resultado
    FROM public.vw_boletim_completo bc
    LEFT JOIN public.disciplinas d ON d.id = bc.disciplina_id
    WHERE bc.aluno_id = p_aluno_id 
      AND bc.tenant_id = p_tenant_id
    ORDER BY bc.bimestre, d.nome;
END;
$$;

-- ------------------------------------------------------------------------------
-- 2. Função para buscar frequência consolidada por aluno
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_get_historico_frequencia_aluno(p_aluno_id UUID, p_tenant_id UUID)
RETURNS TABLE (
    total_presencas INTEGER,
    total_faltas INTEGER,
    total_justificadas INTEGER,
    total_aulas INTEGER,
    percentual_frequencia NUMERIC
) LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN f.status = 'presente' THEN 1 ELSE 0 END), 0)::INTEGER AS total_presencas,
        COALESCE(SUM(CASE WHEN f.status = 'falta' THEN 1 ELSE 0 END), 0)::INTEGER AS total_faltas,
        COALESCE(SUM(CASE WHEN f.status = 'justificada' THEN 1 ELSE 0 END), 0)::INTEGER AS total_justificadas,
        COUNT(f.id)::INTEGER AS total_aulas,
        CASE 
            WHEN COUNT(f.id) > 0 THEN 
                ROUND(
                    (COUNT(f.id) - SUM(CASE WHEN f.status IN ('falta', 'justificada') THEN 1 ELSE 0 END))::NUMERIC / 
                    COUNT(f.id) * 100
                , 2)
            ELSE 100
        END AS percentual_frequencia
    FROM public.frequencias f
    WHERE f.aluno_id = p_aluno_id 
      AND f.tenant_id = p_tenant_id
      AND f.deleted_at IS NULL;
END;
$$;

-- ------------------------------------------------------------------------------
-- 3. Função para buscar dados consolidados do histórico (médias + frequência)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_get_historico_consolidado_aluno(p_aluno_id UUID, p_tenant_id UUID)
RETURNS TABLE (
    disciplinas JSONB,
    frequencia JSONB,
    media_geral NUMERIC
) LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_disciplinas JSONB;
    v_frequencia JSONB;
    v_media_geral NUMERIC;
BEGIN
    -- Buscar médias por disciplina
    SELECT jsonb_agg(
        jsonb_build_object(
            'disciplina', disciplina_nome,
            'media_final', media_final,
            'resultado', resultado
        )
    )
    INTO v_disciplinas
    FROM public.fn_get_historico_medias_aluno(p_aluno_id, p_tenant_id);

    -- Buscar frequência
    SELECT jsonb_build_object(
        'presencas', total_presencas,
        'faltas', total_faltas,
        'justificadas', total_justificadas,
        'total_aulas', total_aulas,
        'percentual', percentual_frequencia
    )
    INTO v_frequencia
    FROM public.fn_get_historico_frequencia_aluno(p_aluno_id, p_tenant_id)
    LIMIT 1;

    -- Calcular média geral
    SELECT AVG(media_final)
    INTO v_media_geral
    FROM public.fn_get_historico_medias_aluno(p_aluno_id, p_tenant_id);

    RETURN QUERY SELECT v_disciplinas, v_frequencia, COALESCE(v_media_geral, 0);
END;
$$;

-- ------------------------------------------------------------------------------
-- 4. Função para emitir histórico oficial (salva na tabela de auditoria)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_emitir_historico_oficial(
    p_aluno_id UUID,
    p_tenant_id UUID,
    p_transferencia_id UUID DEFAULT NULL,
    p_incluir_dados_saude BOOLEAN DEFAULT FALSE,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    historico_id UUID,
    validation_hash TEXT,
    pdf_url TEXT,
    sucesso BOOLEAN
) LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_aluno RECORD;
    v_escola RECORD;
    v_historico RECORD;
    v_payload JSONB;
    v_validation_hash TEXT;
    v_historico_id UUID;
    v_pdf_url TEXT;
BEGIN
    -- Validar aluno existe
    SELECT id, nome_completo, codigo_transferencia, data_nascimento
    INTO v_aluno
    FROM public.alunos
    WHERE id = p_aluno_id AND tenant_id = p_tenant_id;

    IF v_aluno IS NULL THEN
        RAISE EXCEPTION 'Aluno não encontrado';
    END IF;

    -- Validar escola existe
    SELECT id, nome, cnpj
    INTO v_escola
    FROM public.escolas
    WHERE id = p_tenant_id;

    IF v_escola IS NULL THEN
        RAISE EXCEPTION 'Escola não encontrada';
    END IF;

    -- Gerar hash de validação
    v_validation_hash := encode(gen_random_bytes(32), 'hex');

    -- Buscar dados acadêmicos consolidados
    SELECT disciplinas, frequencia, media_geral
    INTO v_payload
    FROM public.fn_get_historico_consolidado_aluno(p_aluno_id, p_tenant_id);

    -- Adicionar dados de saúde se solicitado
    IF p_incluir_dados_saude THEN
        v_payload := v_payload || jsonb_build_object(
            'dados_saude', (
                SELECT jsonb_agg(jsonb_build_object(
                    'tipo', tipo_alerta,
                    'descricao', descricao,
                    'cuidados', cuidados_especificos
                ))
                FROM public.alertas_saude_nee
                WHERE aluno_id = p_aluno_id AND tenant_id = p_tenant_id
            )
        );
    END IF;

    -- Criar payload completo
    v_payload := jsonb_build_object(
        'aluno', jsonb_build_object(
            'id', v_aluno.id,
            'nome_completo', v_aluno.nome_completo,
            'codigo_transferencia', v_aluno.codigo_transferencia,
            'data_nascimento', v_aluno.data_nascimento
        ),
        'escola_origem', jsonb_build_object(
            'tenant_id', v_escola.id,
            'nome_escola', v_escola.nome,
            'cnpj', v_escola.cnpj
        ),
        'academico', v_payload,
        'emissao', jsonb_build_object(
            'validation_hash', v_validation_hash,
            'emitido_em', NOW()::TEXT,
            'por', p_user_id
        )
    );

    -- Inserir na tabela de auditoria
    INSERT INTO public.historicos_digitais_emitidos (
        tenant_id,
        aluno_id,
        transferencia_id,
        validation_hash,
        payload_snapshot,
        status,
        criado_por
    ) VALUES (
        p_tenant_id,
        p_aluno_id,
        p_transferencia_id,
        v_validation_hash,
        v_payload,
        'pendente_geracao',
        p_user_id
    )
    RETURNING id INTO v_historico_id;

    -- Atualizar status para emitido
    UPDATE public.historicos_digitais_emitidos
    SET status = 'final_emitido'
    WHERE id = v_historico_id;

    -- Retornar dados (PDF URL será gerado depois via Edge Function se necessário)
    v_pdf_url := '/historicos/' || v_validation_hash || '.pdf';

    RETURN QUERY SELECT v_historico_id, v_validation_hash, v_pdf_url, TRUE;
END;
$$;

-- ------------------------------------------------------------------------------
-- 5. Função para listar históricos emitidos por aluno
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_listar_historicos_aluno(p_aluno_id UUID, p_tenant_id UUID)
RETURNS TABLE (
    id UUID,
    validation_hash TEXT,
    status TEXT,
    criado_em TIMESTAMPTZ,
    pdf_url TEXT
) LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id,
        h.validation_hash,
        h.status,
        h.created_at AS criado_em,
        h.storage_path AS pdf_url
    FROM public.historicos_digitais_emitidos h
    WHERE h.aluno_id = p_aluno_id AND h.tenant_id = p_tenant_id
    ORDER BY h.created_at DESC;
END;
$$;

-- ------------------------------------------------------------------------------
-- 6. Grant de permissões
-- ------------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.fn_get_historico_medias_aluno TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_get_historico_frequencia_aluno TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_get_historico_consolidado_aluno TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_emitir_historico_oficial TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_listar_historicos_aluno TO authenticated;

-- Comentários para documentação
COMMENT ON FUNCTION public.fn_get_historico_medias_aluno IS 'Retorna médias consolidadas por disciplina e bimestre para um aluno';
COMMENT ON FUNCTION public.fn_get_historico_frequencia_aluno IS 'Retorna estatísticas de frequência consolidadas para um aluno';
COMMENT ON FUNCTION public.fn_get_historico_consolidado_aluno IS 'Retorna dados acadêmicos consolidados (médias + frequência) em formato JSON';
COMMENT ON FUNCTION public.fn_emitir_historico_oficial IS 'Emite um histórico escolar oficial, salvando na tabela de auditoria';
COMMENT ON FUNCTION public.fn_listar_historicos_aluno IS 'Lista todos os históricos digitais emitidos para um aluno';