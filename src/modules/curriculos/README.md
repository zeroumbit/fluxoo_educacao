# Módulo de Currículos - Banco de Talentos

## Visão Geral

Módulo que permite às escolas visualizar e entrar em contato com profissionais disponíveis para emprego formal na plataforma (professores, vigias, porteiros, e outros funcionários).

## Funcionalidades

### Para Escolas (Gestores)
- **Listagem de Currículos**: Visualiza todos os currículos públicos de profissionais disponíveis
- **Filtros de Busca**:
  - Busca por texto (nome, resumo, habilidades)
  - Filtro por área de interesse (Docência, Administrativo, Segurança, etc.)
- **Detalhes do Currículo**:
  - Dados profissionais completos
  - Formação acadêmica
  - Experiência profissional
  - Habilidades e certificações
  - Pretensão salarial
  - Tipo de disponibilidade
- **Contato**: Botão para entrar em contato via e-mail

### Para Profissionais (em desenvolvimento)
- Cadastro de currículo com disponibilidade para emprego formal
- Definição de áreas de interesse
- Upload de formação e experiência
- Controle de visibilidade (público/privado)
- Ativação/desativação do currículo

## Estrutura do Módulo

```
src/modules/curriculos/
├── pages/
│   ├── CurriculosListPage.tsx       # Lista de currículos
│   ├── CurriculosListPage.web.tsx   # Versão web
│   ├── CurriculosListPage.mobile.tsx # Versão mobile
│   └── CurriculoDetalhePage.tsx     # Detalhes do currículo
├── hooks.ts                          # React Query hooks
├── service.ts                        # Integração com Supabase
└── types.ts                          # Tipos TypeScript
```

## Banco de Dados

### Tabela: `curriculos`

```sql
CREATE TABLE curriculos (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    tenant_id UUID REFERENCES escolas(id),
    funcionario_id UUID REFERENCES funcionarios(id),
    
    -- Dados profissionais
    disponibilidade_emprego BOOLEAN DEFAULT FALSE,
    disponibilidade_tipo TEXT[],
    areas_interesse TEXT[],
    pretensao_salarial NUMERIC(10,2),
    
    -- Formação e experiência
    formacao JSONB,
    experiencia JSONB,
    habilidades TEXT[],
    certificacoes JSONB,
    
    -- Controle
    is_publico BOOLEAN DEFAULT FALSE,
    is_ativo BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

### Migrations
- `130_curriculos_profissionais.sql`: Cria a tabela e políticas RLS
- `131_curriculos_permissions.sql`: Adiciona permissões RBAC

### Permissões RBAC
- `gestao.curriculos.view`: Visualizar lista de currículos
- `gestao.curriculos.detalhes`: Ver detalhes completos
- `gestao.curriculos.contatar`: Entrar em contato com profissional

## Rotas

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/curriculos` | CurriculosListPage | Lista todos os currículos disponíveis |
| `/curriculos/:id` | CurriculoDetalhePage | Detalhes de um currículo específico |

## Menu

O menu "Currículos" está localizado na seção **Gestão**, logo acima do menu "Plano".

**Ícone**: `FileUser` (Lucide React)  
**Permissão**: `gestao.curriculos.view`

## Áreas de Interesse Disponíveis

- Docência
- Administrativo
- Segurança
- Limpeza
- Alimentação
- Transporte
- Manutenção
- Recepção
- Biblioteca
- Esporte
- Arte
- Tecnologia

## Tipos de Disponibilidade

- Tempo Integral
- Meio Período
- Substituições
- Eventual/Freelance

## Políticas de Segurança (RLS)

1. **Usuário**: Pode ver e editar seu próprio currículo
2. **Gestores**: Podem ver apenas currículos públicos e ativos
3. **Super Admin**: Pode ver todos os currículos

## Próximos Passos (Melhorias Futuras)

1. **Para Profissionais**:
   - [ ] Criar página de cadastro/edição de currículo
   - [ ] Upload de foto e documentos
   - [ ] Integração com LinkedIn
   - [ ] Sistema de matching com vagas

2. **Para Escolas**:
   - [ ] Criar vagas disponíveis
   - [ ] Sistema de candidatura
   - [ ] Chat com candidatos
   - [ ] Agendamento de entrevistas

3. **Técnicas**:
   - [ ] Cache de currículos
   - [ ] Paginação na listagem
   - [ ] Export de currículos em PDF
   - [ ] Analytics de visualizações

## Como Usar

### Hooks Disponíveis

```typescript
// Listar currículos públicos
const { data: curriculos } = useCurriculosPublicos({
  areas: ['docencia'],
  search: 'professor'
})

// Buscar currículo por ID
const { data: curriculo } = useCurriculo(id)

// Salvar currículo (criar/atualizar)
const salvar = useSalvarCurriculo()
salvar.mutate({ ...dados })

// Atualizar visibilidade
const atualizarVisibilidade = useAtualizarVisibilidade()
atualizarVisibilidade.mutate({ id, isPublico: true })
```

### Service

```typescript
import { curriculosService } from './service'

// Listar públicos
const curriculos = await curriculosService.listarPublicos(tenantId, filtros)

// Buscar por ID
const curriculo = await curriculosService.buscarPorId(id)

// Salvar
await curriculosService.salvar(dados)
```

## Dependências

- `@tanstack/react-query`: Cache e estado server-side
- `lucide-react`: Ícones
- `date-fns`: Formatação de datas
- Componentes UI: Button, Card, Badge, Skeleton, Input

## Autor

Fluxoo Educacional © 2025
