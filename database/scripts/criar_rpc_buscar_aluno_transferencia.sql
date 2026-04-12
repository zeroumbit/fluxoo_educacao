-- =====================================================
-- MIGRATION: Criar função RPC buscar_aluno_transferencia
-- DATA: 2026-04-12
-- DESCRIÇÃO: Função RPC para buscar aluno por código de
--            transferência e retornar dados completos com
--            responsáveis vinculados.
-- =====================================================

-- Drop de TODAS as variantes da função (sem especificar parâmetros)
DROP FUNCTION IF EXISTS public.buscar_aluno_transferencia CASCADE;

-- Criação da função RPC
CREATE OR REPLACE FUNCTION public.buscar_aluno_transferencia(p_codigo TEXT)
RETURNS SETOF JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Busca o aluno pelo código de transferência
    -- Retorna JSONB com dados do aluno + responsáveis + filial
    SELECT jsonb_build_object(
        'id', a.id,
        'tenant_id', a.tenant_id,
        'filial_id', a.filial_id,
        'nome_completo', a.nome_completo,
        'data_nascimento', a.data_nascimento,
        'cpf', a.cpf,
        'status', a.status,
        'codigo_transferencia', a.codigo_transferencia,
        'created_at', a.created_at,
        'responsaveis', COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', r.id,
                        'nome', r.nome,
                        'cpf', r.cpf,
                        'email', r.email,
                        'telefone', r.telefone,
                        'parentesco', ar.grau_parentesco,
                        'is_financeiro', ar.is_financeiro
                    )
                )
                FROM public.aluno_responsavel ar
                INNER JOIN public.responsaveis r ON r.id = ar.responsavel_id
                WHERE ar.aluno_id = a.id
                  AND ar.status = 'ativo'
            ),
            '[]'::jsonb
        ),
        'filial', (
            SELECT jsonb_build_object(
                'id', f.id,
                'nome_unidade', f.nome_unidade,
                'cidade', f.cidade,
                'estado', f.estado
            )
            FROM public.filiais f
            WHERE f.id = a.filial_id
        )
    ) INTO v_result
    FROM public.alunos a
    WHERE a.codigo_transferencia = UPPER(p_codigo)
      AND a.deleted_at IS NULL;

    -- Se não encontrou, retorna NULL
    IF v_result IS NULL THEN
        RETURN;
    END IF;

    RETURN NEXT v_result;
END;
$$;

-- Revogar acesso público e conceder apenas a roles autenticados
REVOKE ALL ON FUNCTION public.buscar_aluno_transferencia(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.buscar_aluno_transferencia(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.buscar_aluno_transferencia(TEXT) TO anon;

-- Comentário para documentação
COMMENT ON FUNCTION public.buscar_aluno_transferencia IS 'Busca aluno por código de transferência e retorna dados completos com responsáveis. Usado no fluxo de solicitação de transferência.';

-- Verificação
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.routines
        WHERE routine_name = 'buscar_aluno_transferencia'
        AND routine_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ Função RPC buscar_aluno_transferencia criada com sucesso';
    ELSE
        RAISE WARNING '⚠️ Falha ao criar função RPC buscar_aluno_transferencia';
    END IF;
END $$;
