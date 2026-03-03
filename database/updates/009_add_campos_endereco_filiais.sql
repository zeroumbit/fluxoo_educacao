ALTER TABLE public.filiais
ADD COLUMN IF NOT EXISTS cep VARCHAR(9) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS logradouro VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS numero VARCHAR(20) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS bairro VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cidade VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS estado VARCHAR(2) DEFAULT NULL;

COMMENT ON COLUMN public.filiais.cep IS 'CEP da unidade';
COMMENT ON COLUMN public.filiais.logradouro IS 'Rua/Logradouro da unidade';
COMMENT ON COLUMN public.filiais.numero IS 'Número do endereço da unidade';
COMMENT ON COLUMN public.filiais.bairro IS 'Bairro da unidade';
COMMENT ON COLUMN public.filiais.cidade IS 'Cidade onde fica a unidade';
COMMENT ON COLUMN public.filiais.estado IS 'UF do estado onde fica a unidade';
