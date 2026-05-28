-- ==============================================================================
-- 🔧 FIX: ADICIONAR PERMISSION KEYS FALTANTES
-- Problema: ~23 permission keys usadas no código (validarPermissao) não existem
--          na tabela `public.permissions`, causando falha silenciosa no backend
--          para usuários não-gestor/não-super_admin.
-- Solução: 
--   1. Adicionar módulos faltantes ao system_modules
--   2. Inserir todas as keys faltantes, agrupadas por módulo
--   3. Vincular ao perfil Gestor
-- ==============================================================================

-- ==========================================================
-- 1. ADICIONAR MÓDULOS FALTANTES AO system_modules
-- ==========================================================
INSERT INTO public.system_modules (key, nome, icone, ordem) VALUES
    ('alunos', 'Alunos', 'Users', 7),
    ('funcionarios', 'Funcionários', 'UserCog', 35),
    ('almoxarifado', 'Almoxarifado', 'Package', 45)
ON CONFLICT (key) DO NOTHING;

-- ==========================================================
-- 2. MÓDULO ALUNOS
--    Code usa: 'alunos.{acao}'  |  Seed tem: 'academico.alunos.{acao}'
-- ==========================================================
INSERT INTO public.permissions (key, modulo_key, recurso, acao, descricao)
VALUES
    ('alunos.create', 'alunos', 'alunos', 'create', 'Cadastrar alunos'),
    ('alunos.update', 'alunos', 'alunos', 'update', 'Atualizar dados de alunos'),
    ('alunos.delete', 'alunos', 'alunos', 'delete', 'Excluir alunos'),
    ('alunos.manage_responsaveis', 'alunos', 'responsaveis', 'manage', 'Gerenciar vínculo de responsáveis')
ON CONFLICT (key) DO NOTHING;

-- ==========================================================
-- 3. MÓDULO FUNCIONÁRIOS
--    Code usa: 'funcionarios.{acao}'  |  Seed tem: 'gestao.funcionarios.{acao}'
-- ==========================================================
INSERT INTO public.permissions (key, modulo_key, recurso, acao, descricao)
VALUES
    ('funcionarios.create', 'funcionarios', 'funcionarios', 'create', 'Criar funcionários'),
    ('funcionarios.update', 'funcionarios', 'funcionarios', 'update', 'Atualizar dados de funcionários'),
    ('funcionarios.delete', 'funcionarios', 'funcionarios', 'delete', 'Excluir funcionários'),
    ('funcionarios.manage_users', 'funcionarios', 'funcionarios', 'manage_users', 'Gerenciar usuários do sistema'),
    ('funcionarios.funcoes.create', 'funcionarios', 'funcoes', 'create', 'Criar funções/cargos'),
    ('funcionarios.folha.generate', 'funcionarios', 'folha', 'generate', 'Gerar folha de pagamento')
ON CONFLICT (key) DO NOTHING;

-- ==========================================================
-- 4. MÓDULO ALMOXARIFADO
--    Code usa: 'almoxarifado.{sub}.{acao}'  |  Seed tem: 'gestao.almoxarifado.{view|manage}'
-- ==========================================================
INSERT INTO public.permissions (key, modulo_key, recurso, acao, descricao)
VALUES
    ('almoxarifado.itens.create', 'almoxarifado', 'itens', 'create', 'Adicionar itens ao almoxarifado'),
    ('almoxarifado.itens.update', 'almoxarifado', 'itens', 'update', 'Atualizar itens do almoxarifado'),
    ('almoxarifado.itens.delete', 'almoxarifado', 'itens', 'delete', 'Remover itens do almoxarifado'),
    ('almoxarifado.movimentacoes.create', 'almoxarifado', 'movimentacoes', 'create', 'Registrar movimentações de estoque'),
    ('almoxarifado.movimentacoes.delete', 'almoxarifado', 'movimentacoes', 'delete', 'Remover movimentações de estoque')
ON CONFLICT (key) DO NOTHING;

-- ==========================================================
-- 5. MÓDULO FINANCEIRO — AÇÕES ALTERNATIVAS
--    Code usa 'delete'/'update'/'pay' | Seed tem 'cancel'/'edit'/'baixa_manual'
-- ==========================================================
INSERT INTO public.permissions (key, modulo_key, recurso, acao, descricao)
VALUES
    ('financeiro.cobrancas.update', 'financeiro', 'cobrancas', 'update', 'Atualizar cobranças'),
    ('financeiro.cobrancas.delete', 'financeiro', 'cobrancas', 'delete', 'Excluir cobranças'),
    ('financeiro.cobrancas.pay', 'financeiro', 'cobrancas', 'pay', 'Registrar pagamento de cobrança'),
    ('financeiro.contas_pagar.update', 'financeiro', 'contas_pagar', 'update', 'Atualizar contas a pagar')
ON CONFLICT (key) DO NOTHING;

-- ==========================================================
-- 6. MÓDULO ACADÊMICO — AÇÕES FALTANTES
--    Code usa 'update'/'delete' | Seed tem 'edit'/'cancel' ou não tem
-- ==========================================================
INSERT INTO public.permissions (key, modulo_key, recurso, acao, descricao)
VALUES
    ('academico.matriculas.update', 'academico', 'matriculas', 'update', 'Atualizar matrículas'),
    ('academico.matriculas.delete', 'academico', 'matriculas', 'delete', 'Excluir matrículas'),
    ('academico.planos_aula.delete', 'academico', 'planos_aula', 'delete', 'Excluir planos de aula'),
    ('academico.atividades.delete', 'academico', 'atividades', 'delete', 'Excluir atividades')
ON CONFLICT (key) DO NOTHING;

-- ==========================================================
-- 7. VINCULAR AO PERFIL GESTOR (se existir)
-- ==========================================================
DO $$
DECLARE
    v_gestor_perfil_id UUID;
    v_keys TEXT[] := ARRAY[
        'alunos.create', 'alunos.update', 'alunos.delete', 'alunos.manage_responsaveis',
        'funcionarios.create', 'funcionarios.update', 'funcionarios.delete',
        'funcionarios.manage_users', 'funcionarios.funcoes.create', 'funcionarios.folha.generate',
        'almoxarifado.itens.create', 'almoxarifado.itens.update', 'almoxarifado.itens.delete',
        'almoxarifado.movimentacoes.create', 'almoxarifado.movimentacoes.delete',
        'financeiro.cobrancas.update', 'financeiro.cobrancas.delete', 'financeiro.cobrancas.pay',
        'financeiro.contas_pagar.update',
        'academico.matriculas.update', 'academico.matriculas.delete',
        'academico.planos_aula.delete', 'academico.atividades.delete'
    ];
    v_key TEXT;
BEGIN
    SELECT id INTO v_gestor_perfil_id
    FROM public.perfis_acesso
    WHERE nome ILIKE '%gestor%'
    LIMIT 1;

    IF v_gestor_perfil_id IS NOT NULL THEN
        FOREACH v_key IN ARRAY v_keys
        LOOP
            INSERT INTO public.perfil_permissions (perfil_id, permission_id, scope_type)
            SELECT
                v_gestor_perfil_id,
                p.id,
                'toda_escola'::public.scope_type
            FROM public.permissions p
            WHERE p.key = v_key
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;
END $$;

-- ==========================================================
-- 8. VERIFICAÇÃO
-- ==========================================================
-- SELECT * FROM public.permissions
-- WHERE key IN (
--     'alunos.create','alunos.update','alunos.delete','alunos.manage_responsaveis',
--     'funcionarios.create','funcionarios.update','funcionarios.delete',
--     'funcionarios.manage_users','funcionarios.funcoes.create','funcionarios.folha.generate',
--     'almoxarifado.itens.create','almoxarifado.itens.update','almoxarifado.itens.delete',
--     'almoxarifado.movimentacoes.create','almoxarifado.movimentacoes.delete',
--     'financeiro.cobrancas.update','financeiro.cobrancas.delete','financeiro.cobrancas.pay',
--     'financeiro.contas_pagar.update',
--     'academico.matriculas.update','academico.matriculas.delete',
--     'academico.planos_aula.delete','academico.atividades.delete'
-- );
