-- ============================================================
-- 181_aluno_pendente_enturmacao.sql
-- Sinalização de alunos transferidos que precisam de turma
-- ============================================================

-- 1. Adicionar coluna na tabela alunos
ALTER TABLE public.alunos 
ADD COLUMN IF NOT EXISTS necessita_enturmacao BOOLEAN DEFAULT false;

-- 2. Atualizar a RPC concluir_transferencia_integrar para marcar o aluno
CREATE OR REPLACE FUNCTION public.concluir_transferencia_integrar(p_transferencia_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER  -- Precisa de permissão elevada para inserir em outro tenant
SET search_path = public
AS $$
DECLARE
    v_transf              RECORD;
    v_aluno_origem        RECORD;
    v_tenant_id           UUID;
    v_novo_aluno_id       UUID;
    v_responsavel_record  RECORD;
BEGIN
    v_tenant_id := (current_setting('request.jwt.claims', true)::json ->> 'tenant_id')::uuid;

    -- Buscar transferência
    SELECT * INTO v_transf
    FROM public.transferencias_escolares
    WHERE id = p_transferencia_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transferência não encontrada.';
    END IF;

    -- Validação: apenas a escola de origem pode concluir
    IF v_transf.escola_origem_id <> v_tenant_id THEN
        RAISE EXCEPTION 'Permissão negada: apenas a escola de origem pode concluir a transferência.';
    END IF;

    -- Validação: deve estar aguardando liberação
    IF v_transf.status <> 'aguardando_liberacao_origem' THEN
        RAISE EXCEPTION 'Operação inválida: transferência não está aguardando liberação. Status: %', v_transf.status;
    END IF;

    -- Buscar dados do aluno na escola de origem
    SELECT * INTO v_aluno_origem
    FROM public.alunos
    WHERE id = v_transf.aluno_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Aluno não encontrado.';
    END IF;

    -- Se a escola destino está no sistema, copiar dados do aluno
    IF v_transf.escola_destino_id IS NOT NULL THEN
        -- Criar CÓPIA do aluno na escola destino (novo UUID, novo tenant)
        INSERT INTO public.alunos (
            tenant_id,
            nome_completo,
            data_nascimento,
            cpf,
            rg,
            genero,
            naturalidade,
            nacionalidade,
            endereco,
            numero,
            complemento,
            bairro,
            cidade,
            estado,
            cep,
            telefone,
            email,
            foto_url,
            necessidades_especiais,
            observacoes,
            status,
            necessita_enturmacao -- NOVA COLUNA
        )
        VALUES (
            v_transf.escola_destino_id,
            v_aluno_origem.nome_completo,
            v_aluno_origem.data_nascimento,
            v_aluno_origem.cpf,
            v_aluno_origem.rg,
            v_aluno_origem.genero,
            v_aluno_origem.naturalidade,
            v_aluno_origem.nacionalidade,
            v_aluno_origem.endereco,
            v_aluno_origem.numero,
            v_aluno_origem.complemento,
            v_aluno_origem.bairro,
            v_aluno_origem.cidade,
            v_aluno_origem.estado,
            v_aluno_origem.cep,
            v_aluno_origem.telefone,
            v_aluno_origem.email,
            v_aluno_origem.foto_url,
            v_aluno_origem.necessidades_especiais,
            'Transferido de: ' || (SELECT razao_social FROM public.escolas WHERE id = v_transf.escola_origem_id),
            'ativo',
            true -- MARCAR COMO PENDENTE DE ENTURMAÇÃO
        )
        RETURNING id INTO v_novo_aluno_id;

        -- Copiar vínculos com responsáveis
        FOR v_responsavel_record IN
            SELECT responsavel_id, grau_parentesco, is_principal
            FROM public.aluno_responsavel
            WHERE aluno_id = v_transf.aluno_id
        LOOP
            INSERT INTO public.aluno_responsavel (aluno_id, responsavel_id, grau_parentesco, is_principal)
            VALUES (v_novo_aluno_id, v_responsavel_record.responsavel_id, v_responsavel_record.grau_parentesco, v_responsavel_record.is_principal)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Inativar matrícula na escola de origem
    UPDATE public.matriculas
    SET status = 'transferido'
    WHERE aluno_id = v_transf.aluno_id
      AND tenant_id = v_transf.escola_origem_id
      AND status = 'ativa';

    -- Inativar aluno na escola de origem (mantém dados históricos)
    UPDATE public.alunos
    SET status = 'transferido'
    WHERE id = v_transf.aluno_id;

    -- Marcar transferência como concluída
    UPDATE public.transferencias_escolares
    SET
        status       = 'concluido',
        concluido_em = now()
    WHERE id = p_transferencia_id;

    RETURN 'concluido';
END;
$$;

-- 3. Trigger para limpar o sinalizador quando o aluno for enturmado (inserido na tabela matriculas)
CREATE OR REPLACE FUNCTION public.fn_limpar_pendencia_enturmacao()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.alunos
    SET necessita_enturmacao = false
    WHERE id = NEW.aluno_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_limpar_pendencia_enturmacao ON public.matriculas;
CREATE TRIGGER trg_limpar_pendencia_enturmacao
AFTER INSERT ON public.matriculas
FOR EACH ROW
EXECUTE FUNCTION public.fn_limpar_pendencia_enturmacao();
