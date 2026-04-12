-- migration: motor_transferencias_trianguladas.sql
-- 1. GERADOR DE SHORT ID (Friendly ID)

-- Adiciona a coluna na tabela alunos se não existir
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS codigo_transferencia VARCHAR(8);

-- Garante que o código seja único
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'alunos_codigo_transferencia_key') THEN
        ALTER TABLE public.alunos ADD CONSTRAINT alunos_codigo_transferencia_key UNIQUE (codigo_transferencia);
    END IF;
END $$;

-- Cria função para gerar código aleatório de 8 caracteres alfanuméricos maiúsculos
CREATE OR REPLACE FUNCTION public.gerar_codigo_transferencia()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER SET search_path = public
AS $$
DECLARE
  novo_codigo VARCHAR(8);
  codigo_existe BOOLEAN;
BEGIN
  -- Se o código já foi passado na inserção, mantém ele
  IF NEW.codigo_transferencia IS NOT NULL THEN
    RETURN NEW;
  END IF;

  LOOP
    -- Gera string aleatória de 8 caracteres (A-Z, 0-9)
    novo_codigo := array_to_string(ARRAY(
        SELECT substr('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', (random() * 35)::int + 1, 1)
        FROM generate_series(1, 8)
    ), '');

    -- Verifica por colisão
    SELECT EXISTS(SELECT 1 FROM public.alunos WHERE codigo_transferencia = novo_codigo) INTO codigo_existe;
    
    IF NOT codigo_existe THEN
      NEW.codigo_transferencia := novo_codigo;
      EXIT;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Trigger para invocar ao inserir um aluno
DROP TRIGGER IF EXISTS trg_gerar_codigo_transferencia_alunos ON public.alunos;
CREATE TRIGGER trg_gerar_codigo_transferencia_alunos
BEFORE INSERT ON public.alunos
FOR EACH ROW
EXECUTE FUNCTION public.gerar_codigo_transferencia();


-- 2. TABELA DE TRANSFERÊNCIAS (transferencias_escolares)

CREATE TABLE IF NOT EXISTS public.transferencias_escolares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    escola_origem_id UUID NOT NULL, -- Removido FK forte para tenant_id global se aplicável, mas mapeia para tenant_id.
    escola_destino_id UUID,
    responsavel_id UUID,
    iniciado_por TEXT NOT NULL CHECK (iniciado_por IN ('origem', 'destino', 'responsavel')),
    status TEXT NOT NULL CHECK (status IN ('aguardando_responsavel', 'aguardando_liberacao_origem', 'concluido', 'cancelado')),
    motivo_solicitacao TEXT,
    prazo_liberacao DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_transferencias_origem ON public.transferencias_escolares (escola_origem_id);
CREATE INDEX IF NOT EXISTS idx_transferencias_destino ON public.transferencias_escolares (escola_destino_id);
CREATE INDEX IF NOT EXISTS idx_transferencias_responsavel ON public.transferencias_escolares (responsavel_id);
CREATE INDEX IF NOT EXISTS idx_transferencias_aluno ON public.transferencias_escolares (aluno_id);

-- Trigger atualizando timestamps (updated_at)
CREATE OR REPLACE FUNCTION public.update_transferencias_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER SET search_path = public
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_transferencias_updated_at ON public.transferencias_escolares;
CREATE TRIGGER trg_transferencias_updated_at
BEFORE UPDATE ON public.transferencias_escolares
FOR EACH ROW
EXECUTE FUNCTION public.update_transferencias_updated_at();

-- Trigger calculando o prazo de liberação +30 dias automaticamente
CREATE OR REPLACE FUNCTION public.set_prazo_liberacao_transferencia()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER SET search_path = public
AS $$
BEGIN
    -- Quando o status atualiza de aguardando responsável para liberação da origem
    IF NEW.status = 'aguardando_liberacao_origem' AND OLD.status = 'aguardando_responsavel' THEN
        NEW.prazo_liberacao := CURRENT_DATE + INTERVAL '30 days';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_prazo_liberacao_transferencia ON public.transferencias_escolares;
CREATE TRIGGER trg_set_prazo_liberacao_transferencia
BEFORE UPDATE ON public.transferencias_escolares
FOR EACH ROW
EXECUTE FUNCTION public.set_prazo_liberacao_transferencia();


-- 3. REGRAS RLS (Row Level Security)

ALTER TABLE public.transferencias_escolares ENABLE ROW LEVEL SECURITY;

-- Limpeza de políticas pré-existentes se aplicável
DROP POLICY IF EXISTS "Universal_Select_Transferencias" ON public.transferencias_escolares;
DROP POLICY IF EXISTS "Universal_Insert_Transferencias" ON public.transferencias_escolares;
DROP POLICY IF EXISTS "Universal_Update_Transferencias" ON public.transferencias_escolares;
DROP POLICY IF EXISTS "Universal_Delete_Transferencias" ON public.transferencias_escolares;

-- SELECT POLICY: Empregando novo padrão (NOVO_PADRAO_UNIVERSAL_RLS_MIGRATION_111)
CREATE POLICY "Universal_Select_Transferencias" ON public.transferencias_escolares FOR SELECT TO authenticated USING (
    -- Super Admin (Bypass para Leitura)
    (auth.jwt() ->> 'is_super_admin')::boolean = TRUE
    OR
    -- Escola de Origem - pode ver baseada no tenant_id
    (escola_origem_id = (auth.jwt() ->> 'tenant_id')::uuid AND (auth.jwt() -> 'permissions')::jsonb ? 'transferencias.view')
    OR
    -- Escola de Destino - pode ver baseada no tenant_id
    (escola_destino_id = (auth.jwt() ->> 'tenant_id')::uuid AND (auth.jwt() -> 'permissions')::jsonb ? 'transferencias.view')
    OR
    -- Responsável - pode ver transfers vinculadas usando Sub/UID
    (responsavel_id = auth.uid())
);

-- INSERT POLICY
CREATE POLICY "Universal_Insert_Transferencias" ON public.transferencias_escolares FOR INSERT TO authenticated WITH CHECK (
    -- Inserção pela Origem ou Destino
    (escola_origem_id = (auth.jwt() ->> 'tenant_id')::uuid AND (auth.jwt() -> 'permissions')::jsonb ? 'transferencias.edit')
    OR
    (escola_destino_id = (auth.jwt() ->> 'tenant_id')::uuid AND (auth.jwt() -> 'permissions')::jsonb ? 'transferencias.edit')
    OR
    -- Inserção pelo Responsável
    (responsavel_id = auth.uid())
);

-- UPDATE POLICY
CREATE POLICY "Universal_Update_Transferencias" ON public.transferencias_escolares FOR UPDATE TO authenticated USING (
    -- Somente editável pela origem
    (escola_origem_id = (auth.jwt() ->> 'tenant_id')::uuid AND (auth.jwt() -> 'permissions')::jsonb ? 'transferencias.edit')
    OR
    -- Retorna também pelo destino
    (escola_destino_id = (auth.jwt() ->> 'tenant_id')::uuid AND (auth.jwt() -> 'permissions')::jsonb ? 'transferencias.edit')
    OR
    -- Responsável só interage em seus tickets (normalmente aprovação)
    (responsavel_id = auth.uid() AND status = 'aguardando_responsavel')
) WITH CHECK (
    (escola_origem_id = (auth.jwt() ->> 'tenant_id')::uuid)
    OR
    (escola_destino_id = (auth.jwt() ->> 'tenant_id')::uuid)
    OR
    (responsavel_id = auth.uid())
);
