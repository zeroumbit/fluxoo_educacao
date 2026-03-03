-- Adiciona campos de endereço nas tabelas de alunos e responsaveis
-- Isso permite a implementação completa da API ViaCEP

-- Alunos
ALTER TABLE public.alunos
ADD COLUMN IF NOT EXISTS cep VARCHAR(9) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS logradouro VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS numero VARCHAR(20) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS complemento VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS bairro VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cidade VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS estado VARCHAR(2) DEFAULT NULL;

-- Responsaveis
ALTER TABLE public.responsaveis
ADD COLUMN IF NOT EXISTS cep VARCHAR(9) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS logradouro VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS numero VARCHAR(20) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS complemento VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS bairro VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cidade VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS estado VARCHAR(2) DEFAULT NULL;

-- Comentários
COMMENT ON COLUMN public.alunos.cep IS 'CEP do endereço do aluno';
COMMENT ON COLUMN public.alunos.logradouro IS 'Rua/Avenida do aluno';
COMMENT ON COLUMN public.alunos.numero IS 'Número do endereço do aluno';
COMMENT ON COLUMN public.alunos.complemento IS 'Complemento do endereço do aluno';
COMMENT ON COLUMN public.alunos.bairro IS 'Bairro do aluno';
COMMENT ON COLUMN public.alunos.cidade IS 'Cidade do aluno';
COMMENT ON COLUMN public.alunos.estado IS 'UF do estado do aluno';

COMMENT ON COLUMN public.responsaveis.cep IS 'CEP do endereço do responsável';
COMMENT ON COLUMN public.responsaveis.logradouro IS 'Rua/Avenida do responsável';
COMMENT ON COLUMN public.responsaveis.numero IS 'Número do endereço do responsável';
COMMENT ON COLUMN public.responsaveis.complemento IS 'Complemento do endereço do responsável';
COMMENT ON COLUMN public.responsaveis.bairro IS 'Bairro do responsável';
COMMENT ON COLUMN public.responsaveis.cidade IS 'Cidade do responsável';
COMMENT ON COLUMN public.responsaveis.estado IS 'UF do estado do responsável';
