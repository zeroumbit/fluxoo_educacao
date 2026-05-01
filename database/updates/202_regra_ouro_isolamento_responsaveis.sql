-- ==============================================================================
-- 🚀 REPARAÇÃO PROFUNDA E REGRA DE OURO: ISOLAMENTO DE RESPONSÁVEIS POR TENANT
-- ==============================================================================

-- 1. Adicionar tenant_id às tabelas de responsabilidade
ALTER TABLE public.responsaveis ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.escolas(id);
ALTER TABLE public.aluno_responsavel ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.escolas(id);

-- 2. Popular tenant_id com base nos alunos existentes
-- (Como validamos que não há compartilhamento entre escolas hoje, a migração é segura)
UPDATE public.aluno_responsavel ar
SET tenant_id = a.tenant_id
FROM public.alunos a
WHERE ar.aluno_id = a.id AND ar.tenant_id IS NULL;

UPDATE public.responsaveis r
SET tenant_id = ar.tenant_id
FROM public.aluno_responsavel ar
WHERE r.id = ar.responsavel_id AND r.tenant_id IS NULL;

-- 2.1 Limpar responsáveis órfãos (sem nenhum aluno vinculado) que ficaram sem tenant_id
-- Responsáveis sem alunos não podem ser isolados corretamente e devem ser removidos.
DELETE FROM public.responsaveis WHERE tenant_id IS NULL;

-- 3. Tornar o tenant_id obrigatório para novos registros
ALTER TABLE public.responsaveis ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.aluno_responsavel ALTER COLUMN tenant_id SET NOT NULL;

-- 4. Criar índices para performance de filtragem por tenant
CREATE INDEX IF NOT EXISTS idx_responsaveis_tenant ON public.responsaveis(tenant_id);
CREATE INDEX IF NOT EXISTS idx_aluno_responsavel_tenant ON public.aluno_responsavel(tenant_id);

-- 5. REFINAR A REGRA DE UNICIDADE (A REGRA DE OURO)
-- O CPF agora é único APENAS dentro da mesma escola.
-- Isso permite que se uma escola usar um CPF errado/temporário, ela não "sequestre" dados de outra escola.
ALTER TABLE public.responsaveis DROP CONSTRAINT IF EXISTS responsaveis_cpf_key;
ALTER TABLE public.responsaveis ADD CONSTRAINT responsaveis_cpf_tenant_key UNIQUE (cpf, tenant_id);

-- 6. ATUALIZAR POLÍTICAS RLS (Segurança Multi-tenant)
ALTER TABLE public.responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aluno_responsavel ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gestores_Manage_Responsaveis" ON public.responsaveis;
CREATE POLICY "Gestores_Manage_Responsaveis" ON public.responsaveis
    FOR ALL TO authenticated
    USING (tenant_id = (SELECT tenant_id FROM public.funcionarios WHERE user_id = auth.uid() LIMIT 1));

DROP POLICY IF EXISTS "Gestores_Manage_Aluno_Responsavel" ON public.aluno_responsavel;
CREATE POLICY "Gestores_Manage_Aluno_Responsavel" ON public.aluno_responsavel
    FOR ALL TO authenticated
    USING (tenant_id = (SELECT tenant_id FROM public.funcionarios WHERE user_id = auth.uid() LIMIT 1));

-- 7. Comentário de Auditoria
COMMENT ON TABLE public.responsaveis IS 'Tabela de responsáveis isolada por tenant (Regra de Ouro implementada em 30/04/2026)';
