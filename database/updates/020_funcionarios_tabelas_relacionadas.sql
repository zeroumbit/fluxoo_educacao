-- =====================================================
-- FUNCIONARIOS - TABELAS RELACIONADAS E SINCRONIZAÇÃO
-- =====================================================

-- 1. Tabela de histórico de funcionários (para rastreabilidade)
CREATE TABLE IF NOT EXISTS funcionarios_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID REFERENCES funcionarios(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES escolas(id),
  alteracao_tipo TEXT NOT NULL, -- 'criacao', 'atualizacao', 'desativacao', 'reativacao'
  alteracao_dados JSONB,
  usuario_responsavel UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE funcionarios_historico ENABLE ROW LEVEL SECURITY;

-- Policy para histórico
DROP POLICY IF EXISTS "Funcionarios Histórico - Gestor pode ler" ON funcionarios_historico;
CREATE POLICY "Funcionarios Histórico - Gestor pode ler" ON funcionarios_historico
  FOR SELECT
  USING (
    tenant_id = (
      SELECT e.id 
      FROM escolas e 
      WHERE e.gestor_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Funcionarios Histórico - Sistema pode inserir" ON funcionarios_historico;
CREATE POLICY "Funcionarios Histórico - Sistema pode inserir" ON funcionarios_historico
  FOR INSERT
  WITH CHECK (TRUE);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_funcionarios_historico_funcionario_id ON funcionarios_historico(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_historico_tenant_id ON funcionarios_historico(tenant_id);

-- 2. Trigger para registrar histórico automaticamente
CREATE OR REPLACE FUNCTION funcionarios_historico_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO funcionarios_historico (funcionario_id, tenant_id, alteracao_tipo, alteracao_dados)
    VALUES (NEW.id, NEW.tenant_id, 'criacao', to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO funcionarios_historico (funcionario_id, tenant_id, alteracao_tipo, alteracao_dados)
    VALUES (NEW.id, NEW.tenant_id, 'atualizacao', jsonb_build_object('antigos', to_jsonb(OLD), 'novos', to_jsonb(NEW)));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS funcionarios_historico_log ON funcionarios;
CREATE TRIGGER funcionarios_historico_log
  AFTER INSERT OR UPDATE ON funcionarios
  FOR EACH ROW
  EXECUTE FUNCTION funcionarios_historico_trigger();

-- =====================================================
-- TABELA DE ACESSOS DE FUNCIONÁRIOS (LOG DE LOGIN)
-- =====================================================

CREATE TABLE IF NOT EXISTS funcionarios_acessos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID REFERENCES funcionarios(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  tenant_id UUID REFERENCES escolas(id),
  data_acesso TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  sucesso BOOLEAN DEFAULT TRUE
);

-- Habilitar RLS
ALTER TABLE funcionarios_acessos ENABLE ROW LEVEL SECURITY;

-- Policy para acessos
DROP POLICY IF EXISTS "Funcionarios Acessos - Gestor pode ler" ON funcionarios_acessos;
CREATE POLICY "Funcionarios Acessos - Gestor pode ler" ON funcionarios_acessos
  FOR SELECT
  USING (
    tenant_id = (
      SELECT e.id 
      FROM escolas e 
      WHERE e.gestor_user_id = auth.uid()
    )
  );

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_funcionarios_acessos_funcionario_id ON funcionarios_acessos(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_acessos_tenant_id ON funcionarios_acessos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_acessos_data ON funcionarios_acessos(data_acesso);

-- =====================================================
-- VIEW PARA DADOS COMPLETOS DO FUNCIONÁRIO
-- =====================================================

CREATE OR REPLACE VIEW funcionarios_completos AS
SELECT 
  f.*,
  e.razao_social AS escola_nome,
  e.nome_gestor AS gestor_nome,
  COUNT(h.id) AS total_historico,
  MAX(h.created_at) AS ultima_alteracao
FROM funcionarios f
LEFT JOIN escolas e ON f.tenant_id = e.id
LEFT JOIN funcionarios_historico h ON f.id = h.funcionario_id
GROUP BY f.id, e.razao_social, e.nome_gestor;

-- =====================================================
-- FUNÇÃO PARA SINCRONIZAR DADOS ENTRE MÓDULOS
-- =====================================================

-- Função para verificar se funcionário tem acesso a múltiplas áreas
CREATE OR REPLACE FUNCTION funcionario_tem_acesso_area(
  p_funcionario_id UUID,
  p_area TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM funcionarios
    WHERE id = p_funcionario_id
      AND areas_acesso IS NOT NULL
      AND p_area = ANY(areas_acesso)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER PARA ATUALIZAR DADOS EM CASCATA
-- =====================================================

-- Quando uma escola for desativada, desativar todos os funcionários
CREATE OR REPLACE FUNCTION escola_desativar_funcionarios_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status_assinatura = 'cancelado' OR NEW.status_assinatura = 'suspenso' THEN
    UPDATE funcionarios
    SET status = 'inativo',
        updated_at = NOW()
    WHERE tenant_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS escola_desativar_funcionarios ON escolas;
CREATE TRIGGER escola_desativar_funcionarios
  AFTER UPDATE ON escolas
  FOR EACH ROW
  WHEN (
    OLD.status_assinatura IS DISTINCT FROM NEW.status_assinatura
    AND (NEW.status_assinatura = 'cancelado' OR NEW.status_assinatura = 'suspenso')
  )
  EXECUTE FUNCTION escola_desativar_funcionarios_trigger();

-- =====================================================
-- PERMISSÕES ADICIONAIS
-- =====================================================

-- Garantir que super admin possa tudo
DROP POLICY IF EXISTS "Funcionarios - Super Admin Full Access" ON funcionarios;
CREATE POLICY "Funcionarios - Super Admin Full Access" ON funcionarios
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
        AND raw_user_meta_data->>'role' = 'super_admin'
    )
  );

-- =====================================================
-- ÍNDICES ADICIONAIS PARA PERFORMANCE
-- =====================================================

-- Índice composto para buscas frequentes
CREATE INDEX IF NOT EXISTS idx_funcionarios_tenant_status ON funcionarios(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_funcionarios_funcao ON funcionarios(funcao);
CREATE INDEX IF NOT EXISTS idx_funcionarios_nome ON funcionarios(nome_completo);

-- =====================================================
-- COMENTÁRIOS NAS COLUNAS
-- =====================================================

COMMENT ON TABLE funcionarios IS 'Cadastro de funcionários da escola (professores, secretárias, etc.)';
COMMENT ON COLUMN funcionarios.tenant_id IS 'Referência à escola (escolas.id)';
COMMENT ON COLUMN funcionarios.user_id IS 'Vínculo com usuário autenticado (auth.users.id) - permite login';
COMMENT ON COLUMN funcionarios.areas_acesso IS 'Array de áreas que o funcionário pode acessar: Financeiro, Pedagógico, Secretaria, etc.';
COMMENT ON COLUMN funcionarios.status IS 'ativo | inativo | afastado | demitido';
COMMENT ON COLUMN funcionarios.salario_bruto IS 'Salário bruto em Reais (BRL)';
COMMENT ON COLUMN funcionarios.dia_pagamento IS 'Dia do mês (1-31) para pagamento';
