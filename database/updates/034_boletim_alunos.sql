-- Tabela de boletins/avaliações dos alunos
CREATE TABLE IF NOT EXISTS boletins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  filial_id UUID REFERENCES filiais(id) ON DELETE SET NULL,
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  
  -- Período letivo
  ano_letivo INTEGER NOT NULL DEFAULT 2024,
  bimestre INTEGER NOT NULL CHECK (bimestre BETWEEN 1 AND 4),
  
  -- Disciplinas e notas (armazenado como JSONB para flexibilidade)
  disciplinas JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Exemplo: [{"disciplina": "Matemática", "nota": 8.5, "faltas": 2, "observacoes": "Bom desempenho"}]
  
  -- Status e observações gerais
  status VARCHAR(50) DEFAULT 'ativo',
  observacoes_gerais TEXT,
  data_emissao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para buscas
CREATE INDEX IF NOT EXISTS boletins_aluno_idx ON boletins(aluno_id);
CREATE INDEX IF NOT EXISTS boletins_turma_idx ON boletins(turma_id);
CREATE INDEX IF NOT EXISTS boletins_tenant_idx ON boletins(tenant_id);
CREATE INDEX IF NOT EXISTS boletins_bimestre_idx ON boletins(ano_letivo, bimestre);

-- RLS Policies
ALTER TABLE boletins ENABLE ROW LEVEL SECURITY;

-- Policy: Escola (tenant) vê apenas seus boletins
CREATE POLICY "Escolas veem apenas seus boletins" ON boletins
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Policy: Responsável pode ver boletins dos seus alunos
CREATE POLICY "Responsaveis veem boletins dos seus alunos" ON boletins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM aluno_responsavel ar
      WHERE ar.aluno_id = boletins.aluno_id
      AND ar.responsavel_id = current_setting('app.current_responsavel')::uuid
      AND ar.status = 'ativo'
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_boletins_updated_at ON boletins;
CREATE TRIGGER update_boletins_updated_at
  BEFORE UPDATE ON boletins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE boletins IS 'Boletins escolares com notas e faltas por bimestre';
COMMENT ON COLUMN boletins.disciplinas IS 'Array JSONB com disciplinas, notas, faltas e observações';
