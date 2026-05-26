-- ==========================================
-- NOVO MODELO DE PRECIFICAÇÃO — Fluxoo Educação
-- Preço fixo por aluno: R$5,00 matriz / R$4,00 filial
-- Módulos com trial configurável
-- Fatura com itens discriminados
-- ==========================================

-- ==========================================
-- 1. PRECOS — Configuração de preços
-- ==========================================
CREATE TABLE IF NOT EXISTS public.precos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo            TEXT NOT NULL CHECK (tipo IN ('global', 'cliente')),
    tenant_id       UUID REFERENCES public.escolas(id) ON DELETE CASCADE,
    valor_matriz    DECIMAL(10,2) NOT NULL DEFAULT 5.00,
    valor_filial    DECIMAL(10,2) NOT NULL DEFAULT 4.00,
    ativo           BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_precos_updated ON public.precos;
CREATE TRIGGER trg_precos_updated
BEFORE UPDATE ON public.precos
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Apenas 1 registro global + 1 por cliente
CREATE UNIQUE INDEX IF NOT EXISTS idx_precos_global
ON public.precos((true))
WHERE tipo = 'global' AND ativo = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_precos_tenant
ON public.precos(tenant_id)
WHERE tipo = 'cliente' AND ativo = true;

-- Seed: Preço global padrão
INSERT INTO public.precos (tipo, valor_matriz, valor_filial)
VALUES ('global', 5.00, 4.00)
ON CONFLICT DO NOTHING;

-- ==========================================
-- 2. PRECOS_MODULOS — Preço dos módulos add-on
-- ==========================================
CREATE TABLE IF NOT EXISTS public.precos_modulos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo            TEXT NOT NULL CHECK (tipo IN ('global', 'cliente')),
    tenant_id       UUID REFERENCES public.escolas(id) ON DELETE CASCADE,
    modulo_id       UUID NOT NULL REFERENCES public.modulos(id),
    valor           DECIMAL(10,2) NOT NULL,
    trial_dias      INTEGER NOT NULL DEFAULT 90,
    ativo           BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_precos_modulos_updated ON public.precos_modulos;
CREATE TRIGGER trg_precos_modulos_updated
BEFORE UPDATE ON public.precos_modulos
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE UNIQUE INDEX IF NOT EXISTS idx_precos_modulos_global
ON public.precos_modulos(modulo_id)
WHERE tipo = 'global' AND ativo = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_precos_modulos_tenant
ON public.precos_modulos(tenant_id, modulo_id)
WHERE tipo = 'cliente' AND ativo = true;

-- Seed: Preços globais dos módulos add-on
-- Primeiro garante que os módulos existam
INSERT INTO public.modulos (nome, codigo, descricao) VALUES
  ('Contas a Pagar', 'contas_pagar', 'Gestão de contas a pagar e despesas da escola'),
  ('Fila Virtual', 'fila_virtual', 'Fila de atendimento virtual para responsáveis')
ON CONFLICT (codigo) DO NOTHING;

-- Preços globais dos módulos
INSERT INTO public.precos_modulos (tipo, modulo_id, valor, trial_dias)
SELECT 'global', id, 100.00, 90 FROM public.modulos WHERE codigo = 'contas_pagar'
ON CONFLICT DO NOTHING;

INSERT INTO public.precos_modulos (tipo, modulo_id, valor, trial_dias)
SELECT 'global', id, 60.00, 90 FROM public.modulos WHERE codigo = 'fila_virtual'
ON CONFLICT DO NOTHING;

-- ==========================================
-- 3. ASSINATURA_MODULOS — Controle de módulos ativos por escola
-- ==========================================
CREATE TABLE IF NOT EXISTS public.assinatura_modulos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    modulo_id       UUID NOT NULL REFERENCES public.modulos(id),
    status          TEXT NOT NULL CHECK (status IN ('trial', 'ativo', 'cancelado', 'expirado')),
    data_ativacao   DATE NOT NULL DEFAULT CURRENT_DATE,
    data_fim_trial  DATE NOT NULL,
    data_cancelamento DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_assinatura_modulos_updated ON public.assinatura_modulos;
CREATE TRIGGER trg_assinatura_modulos_updated
BEFORE UPDATE ON public.assinatura_modulos
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_assinatura_modulos_tenant
ON public.assinatura_modulos(tenant_id);

CREATE INDEX IF NOT EXISTS idx_assinatura_modulos_status
ON public.assinatura_modulos(status);

-- Impede módulo duplicado ativo por tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_assinatura_modulos_tenant_modulo
ON public.assinatura_modulos(tenant_id, modulo_id)
WHERE status IN ('trial', 'ativo');

-- ==========================================
-- 4. FATURA_ITENS — Itens discriminados da fatura
-- ==========================================
CREATE TABLE IF NOT EXISTS public.fatura_itens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fatura_id       UUID NOT NULL REFERENCES public.faturas(id) ON DELETE CASCADE,
    tipo            TEXT NOT NULL CHECK (tipo IN ('matriz', 'filial', 'modulo')),
    filial_id       UUID REFERENCES public.filiais(id),
    modulo_id       UUID REFERENCES public.modulos(id),
    quantidade      INTEGER NOT NULL,
    valor_unitario  DECIMAL(10,2) NOT NULL,
    subtotal        DECIMAL(10,2) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fatura_itens_fatura
ON public.fatura_itens(fatura_id);

-- ==========================================
-- 5. VIEW — Alunos ativos por filial
-- ==========================================
CREATE OR REPLACE VIEW public.vw_alunos_por_filial AS
SELECT
    a.tenant_id,
    COALESCE(a.filial_id::text, 'matriz') AS unidade_id,
    f.is_matriz,
    COUNT(*) FILTER (WHERE a.status = 'ativo' AND a.deleted_at IS NULL) AS alunos_ativos
FROM public.alunos a
LEFT JOIN public.filiais f ON f.id = a.filial_id AND f.tenant_id = a.tenant_id
WHERE a.deleted_at IS NULL
GROUP BY a.tenant_id, COALESCE(a.filial_id::text, 'matriz'), f.is_matriz;

-- ==========================================
-- 6. VIEW — Preço vigente por tenant (global ou customizado)
-- ==========================================
CREATE OR REPLACE VIEW public.vw_preco_vigente AS
SELECT
    e.id AS tenant_id,
    COALESCE(pc.valor_matriz, pg.valor_matriz) AS valor_matriz,
    COALESCE(pc.valor_filial, pg.valor_filial) AS valor_filial,
    CASE WHEN pc.id IS NOT NULL THEN 'cliente' ELSE 'global' END AS tipo_preco
FROM public.escolas e
CROSS JOIN LATERAL (
    SELECT valor_matriz, valor_filial
    FROM public.precos
    WHERE tipo = 'global' AND ativo = true
    LIMIT 1
) pg
LEFT JOIN LATERAL (
    SELECT valor_matriz, valor_filial, id
    FROM public.precos
    WHERE tipo = 'cliente' AND tenant_id = e.id AND ativo = true
    LIMIT 1
) pc ON true;

-- ==========================================
-- 7. VIEW — Preço dos módulos vigente por tenant
-- ==========================================
CREATE OR REPLACE VIEW public.vw_preco_modulo_vigente AS
SELECT
    e.id AS tenant_id,
    m.id AS modulo_id,
    m.nome AS modulo_nome,
    m.codigo AS modulo_codigo,
    COALESCE(pmc.valor, pmg.valor) AS valor,
    COALESCE(pmc.trial_dias, pmg.trial_dias) AS trial_dias,
    CASE WHEN pmc.id IS NOT NULL THEN 'cliente' ELSE 'global' END AS tipo_preco
FROM public.escolas e
CROSS JOIN public.modulos m
CROSS JOIN LATERAL (
    SELECT valor, trial_dias
    FROM public.precos_modulos
    WHERE tipo = 'global' AND modulo_id = m.id AND ativo = true
    LIMIT 1
) pmg
LEFT JOIN LATERAL (
    SELECT valor, trial_dias, id
    FROM public.precos_modulos
    WHERE tipo = 'cliente' AND tenant_id = e.id AND modulo_id = m.id AND ativo = true
    LIMIT 1
) pmc ON true
WHERE EXISTS (SELECT 1 FROM public.precos_modulos WHERE modulo_id = m.id AND ativo = true);

-- ==========================================
-- 8. FUNÇÃO — Calcular fatura de uma escola
-- ==========================================
CREATE OR REPLACE FUNCTION public.fn_calcular_fatura(
    p_tenant_id UUID,
    p_competencia DATE DEFAULT CURRENT_DATE,
    p_dia_vencimento INTEGER DEFAULT 5
)
RETURNS TABLE (
    tenant_id UUID,
    valor_total DECIMAL(10,2),
    itens JSONB
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_valor_matriz DECIMAL(10,2);
    v_valor_filial DECIMAL(10,2);
    v_alunos_matriz INTEGER;
    v_total_base DECIMAL(10,2) := 0;
    v_total_modulos DECIMAL(10,2) := 0;
    v_total_geral DECIMAL(10,2);
    v_itens JSONB := '[]'::JSONB;
    v_assinatura_id UUID;
    v_tem_filial BOOLEAN;
    v_data_vencimento DATE;
    v_fatura_id UUID;
    v_item JSONB;
BEGIN
    -- Buscar preços vigentes
    SELECT pv.valor_matriz, pv.valor_filial
    INTO v_valor_matriz, v_valor_filial
    FROM public.vw_preco_vigente pv
    WHERE pv.tenant_id = p_tenant_id;

    -- Verificar se existe pelo menos 1 filial não-matriz
    SELECT EXISTS (
        SELECT 1 FROM public.filiais
        WHERE tenant_id = p_tenant_id AND is_matriz = false
    ) INTO v_tem_filial;

    -- Se não tem filial, usa valor_matriz para todos
    IF NOT v_tem_filial THEN
        v_valor_filial := v_valor_matriz;
    END IF;

    -- Contar alunos ativos da matriz (sem filial ou filial is_matriz)
    SELECT COUNT(*)
    INTO v_alunos_matriz
    FROM public.alunos a
    LEFT JOIN public.filiais f ON f.id = a.filial_id
    WHERE a.tenant_id = p_tenant_id
    AND a.status = 'ativo'
    AND a.deleted_at IS NULL
    AND (a.filial_id IS NULL OR f.is_matriz = true);

    -- Adicionar item da matriz
    IF v_alunos_matriz > 0 THEN
        v_total_base := v_alunos_matriz * v_valor_matriz;
        v_itens := v_itens || jsonb_build_object(
            'tipo', 'matriz',
            'filial_id', NULL,
            'modulo_id', NULL,
            'quantidade', v_alunos_matriz,
            'valor_unitario', v_valor_matriz,
            'subtotal', v_alunos_matriz * v_valor_matriz,
            'descricao', 'Matriz — ' || v_alunos_matriz || ' alunos ativos'
        );
    END IF;

    -- Adicionar itens de cada filial não-matriz
    FOR v_item IN
        SELECT jsonb_build_object(
            'tipo', 'filial',
            'filial_id', f.id,
            'modulo_id', NULL,
            'quantidade', vap.alunos_ativos,
            'valor_unitario', v_valor_filial,
            'subtotal', vap.alunos_ativos * v_valor_filial,
            'descricao', f.nome_unidade || ' — ' || vap.alunos_ativos || ' alunos ativos'
        )
        FROM public.vw_alunos_por_filial vap
        JOIN public.filiais f ON f.id = vap.unidade_id::uuid
        WHERE vap.tenant_id = p_tenant_id
        AND f.is_matriz = false
        AND vap.alunos_ativos > 0
    LOOP
        v_total_base := v_total_base + (v_item->>'subtotal')::DECIMAL;
        v_itens := v_itens || v_item;
    END LOOP;

    -- Adicionar módulos ativos (fora do trial ou ativos)
    FOR v_item IN
        SELECT jsonb_build_object(
            'tipo', 'modulo',
            'filial_id', NULL,
            'modulo_id', sam.modulo_id,
            'quantidade', 1,
            'valor_unitario', pvpm.valor,
            'subtotal', pvpm.valor,
            'descricao', m.nome || ' (módulo)'
        )
        FROM public.assinatura_modulos sam
        JOIN public.vw_preco_modulo_vigente pvpm
            ON pvpm.tenant_id = sam.tenant_id AND pvpm.modulo_id = sam.modulo_id
        JOIN public.modulos m ON m.id = sam.modulo_id
        WHERE sam.tenant_id = p_tenant_id
        AND sam.status = 'ativo'
        AND CURRENT_DATE >= sam.data_fim_trial
    LOOP
        v_total_modulos := v_total_modulos + (v_item->>'subtotal')::DECIMAL;
        v_itens := v_itens || v_item;
    END LOOP;

    v_total_geral := v_total_base + v_total_modulos;

    -- Buscar assinatura ativa
    SELECT id INTO v_assinatura_id
    FROM public.assinaturas
    WHERE tenant_id = p_tenant_id AND status IN ('ativa', 'inadimplente')
    LIMIT 1;

    -- Calcular data de vencimento
    v_data_vencimento := make_date(
        EXTRACT(YEAR FROM p_competencia)::INT,
        EXTRACT(MONTH FROM p_competencia)::INT,
        LEAST(p_dia_vencimento, 28)
    );

    -- Criar fatura
    INSERT INTO public.faturas (
        tenant_id, assinatura_id, competencia, valor,
        data_vencimento, status
    ) VALUES (
        p_tenant_id, v_assinatura_id, date_trunc('month', p_competencia),
        v_total_geral, v_data_vencimento, 'pendente'
    )
    RETURNING id INTO v_fatura_id;

    -- Inserir itens
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_itens)
    LOOP
        INSERT INTO public.fatura_itens (
            fatura_id, tipo, filial_id, modulo_id,
            quantidade, valor_unitario, subtotal
        ) VALUES (
            v_fatura_id,
            v_item->>'tipo',
            (v_item->>'filial_id')::UUID,
            (v_item->>'modulo_id')::UUID,
            (v_item->>'quantidade')::INTEGER,
            (v_item->>'valor_unitario')::DECIMAL,
            (v_item->>'subtotal')::DECIMAL
        );
    END LOOP;

    -- Atualizar assinatura com os valores calculados
    UPDATE public.assinaturas SET
        valor_por_aluno_contratado = v_valor_matriz,
        limite_alunos_contratado = v_alunos_matriz,
        valor_total_contratado = v_total_geral,
        updated_at = NOW()
    WHERE id = v_assinatura_id;

    RETURN QUERY SELECT p_tenant_id, v_total_geral, v_itens;
END;
$$;

-- ==========================================
-- 9. FUNÇÃO — Ativar módulo com trial para uma escola
-- ==========================================
CREATE OR REPLACE FUNCTION public.fn_ativar_modulo(
    p_tenant_id UUID,
    p_modulo_codigo TEXT
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_modulo_id UUID;
    v_trial_dias INTEGER;
    v_assinatura_modulo_id UUID;
BEGIN
    SELECT id INTO v_modulo_id FROM public.modulos WHERE codigo = p_modulo_codigo;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Módulo não encontrado: %', p_modulo_codigo;
    END IF;

    -- Verificar se já está ativo
    IF EXISTS (
        SELECT 1 FROM public.assinatura_modulos
        WHERE tenant_id = p_tenant_id AND modulo_id = v_modulo_id
        AND status IN ('trial', 'ativo')
    ) THEN
        RAISE EXCEPTION 'Módulo já está ativo para esta escola';
    END IF;

    -- Buscar trial_dias do preço vigente
    SELECT COALESCE(
        (SELECT pmc.trial_dias FROM public.precos_modulos pmc
         WHERE pmc.tipo = 'cliente' AND pmc.tenant_id = p_tenant_id AND pmc.modulo_id = v_modulo_id AND pmc.ativo = true),
        (SELECT pmg.trial_dias FROM public.precos_modulos pmg
         WHERE pmg.tipo = 'global' AND pmg.modulo_id = v_modulo_id AND pmg.ativo = true),
        90
    ) INTO v_trial_dias;

    INSERT INTO public.assinatura_modulos (
        tenant_id, modulo_id, status,
        data_ativacao, data_fim_trial
    ) VALUES (
        p_tenant_id, v_modulo_id, 'trial',
        CURRENT_DATE, CURRENT_DATE + v_trial_dias
    )
    RETURNING id INTO v_assinatura_modulo_id;

    RETURN v_assinatura_modulo_id;
END;
$$;

-- ==========================================
-- 10. FUNÇÃO — Recalcular fatura existente (útil para upgrades)
-- ==========================================
CREATE OR REPLACE FUNCTION public.fn_recalcular_fatura(
    p_fatura_id UUID
)
RETURNS DECIMAL(10,2) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_tenant_id UUID;
    v_valor_matriz DECIMAL(10,2);
    v_valor_filial DECIMAL(10,2);
    v_alunos_matriz INTEGER;
    v_total DECIMAL(10,2) := 0;
    v_tem_filial BOOLEAN;
BEGIN
    SELECT tenant_id INTO v_tenant_id FROM public.faturas WHERE id = p_fatura_id;

    SELECT
        COALESCE(pc.valor_matriz, pg.valor_matriz),
        CASE WHEN EXISTS (SELECT 1 FROM public.filiais WHERE tenant_id = v_tenant_id AND is_matriz = false)
             THEN COALESCE(pc.valor_filial, pg.valor_filial)
             ELSE COALESCE(pc.valor_matriz, pg.valor_matriz)
        END
    INTO v_valor_matriz, v_valor_filial
    FROM (SELECT valor_matriz, valor_filial FROM public.precos WHERE tipo = 'global' AND ativo = true LIMIT 1) pg
    LEFT JOIN (SELECT valor_matriz, valor_filial FROM public.precos WHERE tipo = 'cliente' AND tenant_id = v_tenant_id AND ativo = true LIMIT 1) pc ON true;

    SELECT COUNT(*) INTO v_alunos_matriz
    FROM public.alunos a
    LEFT JOIN public.filiais f ON f.id = a.filial_id
    WHERE a.tenant_id = v_tenant_id AND a.status = 'ativo' AND a.deleted_at IS NULL
    AND (a.filial_id IS NULL OR f.is_matriz = true);

    -- Limpar itens antigos
    DELETE FROM public.fatura_itens WHERE fatura_id = p_fatura_id;

    -- Item matriz
    IF v_alunos_matriz > 0 THEN
        INSERT INTO public.fatura_itens (fatura_id, tipo, quantidade, valor_unitario, subtotal)
        VALUES (p_fatura_id, 'matriz', v_alunos_matriz, v_valor_matriz, v_alunos_matriz * v_valor_matriz);
        v_total := v_alunos_matriz * v_valor_matriz;
    END IF;

    -- Itens filiais
    INSERT INTO public.fatura_itens (fatura_id, tipo, filial_id, quantidade, valor_unitario, subtotal)
    SELECT p_fatura_id, 'filial', f.id, COUNT(*), v_valor_filial, COUNT(*) * v_valor_filial
    FROM public.alunos a
    JOIN public.filiais f ON f.id = a.filial_id
    WHERE a.tenant_id = v_tenant_id AND a.status = 'ativo' AND a.deleted_at IS NULL AND f.is_matriz = false
    GROUP BY f.id;

    SELECT COALESCE(SUM(subtotal), 0) INTO v_total
    FROM public.fatura_itens WHERE fatura_id = p_fatura_id;

    -- Módulos ativos
    INSERT INTO public.fatura_itens (fatura_id, tipo, modulo_id, quantidade, valor_unitario, subtotal)
    SELECT p_fatura_id, 'modulo', sam.modulo_id, 1, pvpm.valor, pvpm.valor
    FROM public.assinatura_modulos sam
    JOIN public.vw_preco_modulo_vigente pvpm ON pvpm.tenant_id = sam.tenant_id AND pvpm.modulo_id = sam.modulo_id
    WHERE sam.tenant_id = v_tenant_id AND sam.status = 'ativo' AND CURRENT_DATE >= sam.data_fim_trial;

    SELECT COALESCE(SUM(subtotal), 0) INTO v_total
    FROM public.fatura_itens WHERE fatura_id = p_fatura_id;

    UPDATE public.faturas SET valor = v_total, updated_at = NOW() WHERE id = p_fatura_id;

    RETURN v_total;
END;
$$;

-- ==========================================
-- 12. RLS POLICIES
-- ==========================================
ALTER TABLE public.precos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.precos_modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinatura_modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fatura_itens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "SA_All_Precos" ON public.precos;
DROP POLICY IF EXISTS "SA_All_PrecosModulos" ON public.precos_modulos;
DROP POLICY IF EXISTS "SA_All_AssinaturaModulos" ON public.assinatura_modulos;
DROP POLICY IF EXISTS "Tenant_Select_AssinaturaModulos" ON public.assinatura_modulos;
DROP POLICY IF EXISTS "Tenant_Select_FaturaItens" ON public.fatura_itens;
DROP POLICY IF EXISTS "SA_All_FaturaItens" ON public.fatura_itens;

-- Super Admin tem acesso total
CREATE POLICY "SA_All_Precos" ON public.precos FOR ALL TO authenticated
USING (public.check_is_super_admin())
WITH CHECK (public.check_is_super_admin());

CREATE POLICY "SA_All_PrecosModulos" ON public.precos_modulos FOR ALL TO authenticated
USING (public.check_is_super_admin())
WITH CHECK (public.check_is_super_admin());

CREATE POLICY "SA_All_AssinaturaModulos" ON public.assinatura_modulos FOR ALL TO authenticated
USING (public.check_is_super_admin())
WITH CHECK (public.check_is_super_admin());

-- Escola vê apenas seus próprios módulos
CREATE POLICY "Tenant_Select_AssinaturaModulos" ON public.assinatura_modulos FOR SELECT TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Tenant_Select_FaturaItens" ON public.fatura_itens FOR SELECT TO authenticated
USING (fatura_id IN (SELECT id FROM public.faturas WHERE tenant_id = (auth.jwt() ->> 'tenant_id')::uuid));

-- Super Admin vê todos os itens de fatura
CREATE POLICY "SA_All_FaturaItens" ON public.fatura_itens FOR ALL TO authenticated
USING (public.check_is_super_admin())
WITH CHECK (public.check_is_super_admin());
