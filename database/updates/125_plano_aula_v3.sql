-- =============================================================================
-- PLANO DE AULA V3.0 - MIGRAÇÃO DE UPGRADE
-- Epic Full-Stack: Módulo Plano de Aula (Consolidado V3.0)
-- Versão: 3.0 | Data: 2026-03-25
-- Estratégia: ALTER TABLE para preservar dados existentes
-- =============================================================================

-- 1. ENUM DE STATUS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plano_aula_status') THEN
    CREATE TYPE plano_aula_status AS ENUM ('rascunho', 'publicado', 'arquivado');
  END IF;
END$$;

-- 2. ADICIONAR NOVOS CAMPOS À TABELA planos_aula
-- (preserva dados existentes via ADD COLUMN IF NOT EXISTS)

-- Campos de conteúdo estruturado (JSONB)
ALTER TABLE public.planos_aula
  ADD COLUMN IF NOT EXISTS objetivos    JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS materiais    JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS atividades   JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS avaliacoes   JSONB DEFAULT '[]'::jsonb;

-- Controle de fluxo e auditoria
ALTER TABLE public.planos_aula
  ADD COLUMN IF NOT EXISTS status            plano_aula_status DEFAULT 'rascunho',
  ADD COLUMN IF NOT EXISTS observacoes_internas TEXT,
  ADD COLUMN IF NOT EXISTS publicado_em      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by        UUID REFERENCES auth.users(id);

-- Referências opcionais (nullable para compatibilidade retroativa)
ALTER TABLE public.planos_aula
  ADD COLUMN IF NOT EXISTS disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS professor_id  UUID REFERENCES public.funcionarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS horario_inicio TIME,
  ADD COLUMN IF NOT EXISTS horario_fim   TIME;

-- Coluna de integração com Diário de Classe (V2)
ALTER TABLE public.planos_aula
  ADD COLUMN IF NOT EXISTS diario_classe_id UUID;

-- 3. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_planos_aula_tenant_data   ON public.planos_aula(tenant_id, data_aula DESC);
CREATE INDEX IF NOT EXISTS idx_planos_aula_status        ON public.planos_aula(tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_planos_aula_disciplina_id ON public.planos_aula(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_planos_aula_professor_id  ON public.planos_aula(professor_id);
CREATE INDEX IF NOT EXISTS idx_planos_aula_deleted       ON public.planos_aula(deleted_at) WHERE deleted_at IS NOT NULL;

-- 4. TRIGGER: atualiza updated_at automaticamente
-- (função update_updated_at_column já existe no schema)
DROP TRIGGER IF EXISTS trg_planos_aula_updated_at ON public.planos_aula;
CREATE TRIGGER trg_planos_aula_updated_at
  BEFORE UPDATE ON public.planos_aula
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. TRIGGER: log de auditoria para publicação
CREATE OR REPLACE FUNCTION public.log_publicacao_plano()
RETURNS TRIGGER AS $$
BEGIN
  -- Só loga quando sai de rascunho para publicado
  IF NEW.status = 'publicado' AND (OLD.status IS NULL OR OLD.status != 'publicado') THEN
    -- Define publicado_em se ainda não estiver preenchido
    IF NEW.publicado_em IS NULL THEN
      NEW.publicado_em := NOW();
    END IF;

    -- Insere no audit_log se a tabela existir
    BEGIN
      INSERT INTO public.audit_logs (
        tenant_id, user_id, acao, recurso_id, dados_novos, motivo_declarado
      ) VALUES (
        NEW.tenant_id,
        auth.uid(),
        'publicar_plano_aula',
        NEW.id,
        jsonb_build_object('publicado_em', NEW.publicado_em, 'disciplina', NEW.disciplina),
        'Plano de Aula publicado para a Família'
      );
    EXCEPTION WHEN OTHERS THEN
      -- Silencia erro caso audit_logs não exista ou tenha schema diferente
      NULL;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_planos_aula_publicacao ON public.planos_aula;
CREATE TRIGGER trg_planos_aula_publicacao
  BEFORE UPDATE ON public.planos_aula
  FOR EACH ROW EXECUTE FUNCTION public.log_publicacao_plano();

-- 6. FUNÇÃO + TRIGGER: Integração com Diário de Classe V2
-- Preenche o conteudo_realizado no plano quando o diário é lançado
CREATE OR REPLACE FUNCTION public.fn_sincronizar_diario_plano()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.planos_aula
  SET
    conteudo_realizado = COALESCE(NEW.conteudo_lecionado, conteudo_realizado),
    diario_classe_id   = NEW.id,
    updated_at         = NOW()
  WHERE
    turma_id          = NEW.turma_id
    AND disciplina_id = NEW.disciplina_id
    AND data_aula     = NEW.data_aula::date
    AND status        != 'arquivado'
    AND deleted_at    IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- O trigger só é criado se a tabela diario_classe existir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'diario_classe'
  ) THEN
    DROP TRIGGER IF EXISTS trg_sync_diario_plano ON public.diario_classe;
    CREATE TRIGGER trg_sync_diario_plano
      AFTER INSERT OR UPDATE OF conteudo_lecionado ON public.diario_classe
      FOR EACH ROW EXECUTE FUNCTION public.fn_sincronizar_diario_plano();
  END IF;
END$$;

-- 7. ROW LEVEL SECURITY
ALTER TABLE public.planos_aula ENABLE ROW LEVEL SECURITY;

-- Limpa políticas antigas para recriar de forma consistente
DROP POLICY IF EXISTS "plano_aula_superadmin"  ON public.planos_aula;
DROP POLICY IF EXISTS "plano_aula_staff"        ON public.planos_aula;
DROP POLICY IF EXISTS "plano_aula_professor"    ON public.planos_aula;
DROP POLICY IF EXISTS "plano_aula_familia"      ON public.planos_aula;
DROP POLICY IF EXISTS "planos_aula_all"         ON public.planos_aula;
DROP POLICY IF EXISTS "planos_aula_select"      ON public.planos_aula;
DROP POLICY IF EXISTS "planos_aula_insert"      ON public.planos_aula;
DROP POLICY IF EXISTS "planos_aula_update"      ON public.planos_aula;
DROP POLICY IF EXISTS "planos_aula_delete"      ON public.planos_aula;

-- Super Admin: leitura global (sem filtro de tenant)
CREATE POLICY "plano_aula_superadmin" ON public.planos_aula
  FOR SELECT
  USING ((auth.jwt() ->> 'is_super_admin')::boolean IS TRUE);

-- Staff / Coordenação: acesso total dentro do tenant
CREATE POLICY "plano_aula_staff" ON public.planos_aula
  FOR ALL
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (
      (auth.jwt() -> 'user_metadata' ->> 'role') IN ('gestor', 'admin', 'coordenador', 'secretaria')
      OR (auth.jwt() ->> 'role') IN ('gestor', 'admin', 'coordenador', 'secretaria')
    )
  );

-- Professor: apenas planos criados por ele no seu tenant
CREATE POLICY "plano_aula_professor" ON public.planos_aula
  FOR ALL
  USING (
    tenant_id    = (auth.jwt() ->> 'tenant_id')::uuid
    AND professor_id = auth.uid()
  );

-- Família (Responsável/Aluno): apenas planos PUBLICADOS e não deletados das turmas dos filhos
CREATE POLICY "plano_aula_familia" ON public.planos_aula
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND status = 'publicado'
    AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND EXISTS (
      SELECT 1 FROM public.planos_aula_turmas pat
      JOIN public.matriculas m ON m.turma_id = pat.turma_id
      JOIN public.alunos a ON a.id = m.aluno_id
      JOIN public.responsaveis r ON r.id = (auth.jwt() ->> 'responsavel_id')::uuid
      WHERE pat.plano_aula_id = planos_aula.id
        AND a.id = auth.uid()
    )
  );

-- 8. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON COLUMN public.planos_aula.status               IS 'rascunho = só professor/staff vê | publicado = família pode ver | arquivado = oculto';
COMMENT ON COLUMN public.planos_aula.objetivos            IS 'Array de strings: objetivos de aprendizagem da aula';
COMMENT ON COLUMN public.planos_aula.materiais            IS 'Array de objetos: {id, tipo, titulo, url, descricao}';
COMMENT ON COLUMN public.planos_aula.atividades           IS 'Array de objetos: {id, data, tipo, descricao, prazo}';
COMMENT ON COLUMN public.planos_aula.avaliacoes           IS 'Array de objetos: referências a avaliações do Diário V2';
COMMENT ON COLUMN public.planos_aula.observacoes_internas IS 'Visível apenas para professores e coordenação, nunca para família';
COMMENT ON COLUMN public.planos_aula.diario_classe_id     IS 'Referência ao registro no Diário de Classe V2 quando a aula é realizada';
COMMENT ON COLUMN public.planos_aula.publicado_em         IS 'Timestamp de quando o status foi alterado para publicado';
