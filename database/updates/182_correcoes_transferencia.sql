-- ============================================================
-- 182_correcoes_transferencia.sql
-- Adiciona colunas faltantes na tabela escolas e correções
-- ============================================================

-- 1. Adicionar colunas de reputação e permissão na tabela escolas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'escolas' AND column_name = 'permissao_solicitacao_ativa') THEN
        ALTER TABLE public.escolas ADD COLUMN permissao_solicitacao_ativa BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'escolas' AND column_name = 'reputacao_rede') THEN
        ALTER TABLE public.escolas ADD COLUMN reputacao_rede INTEGER DEFAULT 100;
    END IF;
END $$;

-- 2. Garantir que a RPC de integração use o nome de coluna correto 'necessita_enturmacao'
-- (Já atualizado na migration 181, mas vamos garantir aqui também)
CREATE OR REPLACE FUNCTION public.concluir_transferencia_integrar(p_transferencia_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
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

    SELECT * INTO v_transf
    FROM public.transferencias_escolares
    WHERE id = p_transferencia_id;

    IF NOT FOUND THEN RAISE EXCEPTION 'Transferência não encontrada.'; END IF;

    IF v_transf.escola_origem_id <> v_tenant_id THEN
        RAISE EXCEPTION 'Permissão negada: apenas a escola de origem pode concluir.';
    END IF;

    IF v_transf.status <> 'aguardando_liberacao_origem' THEN
        RAISE EXCEPTION 'Operação inválida. Status: %', v_transf.status;
    END IF;

    SELECT * INTO v_aluno_origem FROM public.alunos WHERE id = v_transf.aluno_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Aluno não encontrado.'; END IF;

    IF v_transf.escola_destino_id IS NOT NULL THEN
        INSERT INTO public.alunos (
            tenant_id, nome_completo, data_nascimento, cpf, rg, genero, 
            naturalidade, nacionalidade, endereco, numero, complemento, 
            bairro, cidade, estado, cep, telefone, email, foto_url, 
            necessidades_especiais, observacoes, status, necessita_enturmacao
        )
        VALUES (
            v_transf.escola_destino_id, v_aluno_origem.nome_completo, 
            v_aluno_origem.data_nascimento, v_aluno_origem.cpf, v_aluno_origem.rg, 
            v_aluno_origem.genero, v_aluno_origem.naturalidade, v_aluno_origem.nacionalidade, 
            v_aluno_origem.endereco, v_aluno_origem.numero, v_aluno_origem.complemento, 
            v_aluno_origem.bairro, v_aluno_origem.cidade, v_aluno_origem.estado, 
            v_aluno_origem.cep, v_aluno_origem.telefone, v_aluno_origem.email, 
            v_aluno_origem.foto_url, v_aluno_origem.necessidades_especiais,
            'Transferido de: ' || (SELECT razao_social FROM public.escolas WHERE id = v_transf.escola_origem_id),
            'ativo', true
        )
        RETURNING id INTO v_novo_aluno_id;

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

    UPDATE public.matriculas SET status = 'transferido' WHERE aluno_id = v_transf.aluno_id AND tenant_id = v_transf.escola_origem_id AND status = 'ativa';
    UPDATE public.alunos SET status = 'transferido' WHERE id = v_transf.aluno_id;
    UPDATE public.transferencias_escolares SET status = 'concluido', concluido_em = now() WHERE id = p_transferencia_id;

    RETURN 'concluido';
END;
$$;
