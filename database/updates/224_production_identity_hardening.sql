-- ============================================================================
-- Production identity hardening
--
-- Vincula cadastros legados por uma correspondencia unica de e-mail antes de
-- desabilitar fallbacks de autorizacao no cliente. Nenhuma associacao ambigua
-- e feita automaticamente.
-- ============================================================================

BEGIN;

UPDATE public.escolas AS escola
SET gestor_user_id = usuario.id
FROM auth.users AS usuario
WHERE escola.gestor_user_id IS NULL
  AND usuario.email IS NOT NULL
  AND lower(trim(escola.email_gestor)) = lower(trim(usuario.email))
  AND NOT EXISTS (
    SELECT 1
    FROM public.escolas AS outra_escola
    WHERE outra_escola.id <> escola.id
      AND lower(trim(outra_escola.email_gestor)) = lower(trim(escola.email_gestor))
  );

UPDATE public.funcionarios AS funcionario
SET user_id = usuario.id
FROM auth.users AS usuario
WHERE funcionario.user_id IS NULL
  AND funcionario.email IS NOT NULL
  AND usuario.email IS NOT NULL
  AND lower(trim(funcionario.email)) = lower(trim(usuario.email))
  AND NOT EXISTS (
    SELECT 1
    FROM public.funcionarios AS outro_funcionario
    WHERE outro_funcionario.id <> funcionario.id
      AND lower(trim(outro_funcionario.email)) = lower(trim(funcionario.email))
  );

CREATE UNIQUE INDEX IF NOT EXISTS escolas_gestor_user_id_unique
  ON public.escolas (gestor_user_id)
  WHERE gestor_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS funcionarios_user_id_unique
  ON public.funcionarios (user_id)
  WHERE user_id IS NOT NULL;

COMMIT;

-- Pos-aplicacao: investigar manualmente os registros ainda sem vinculo.
-- SELECT id, razao_social, email_gestor FROM public.escolas WHERE gestor_user_id IS NULL;
-- SELECT id, nome_completo, email FROM public.funcionarios WHERE user_id IS NULL;
