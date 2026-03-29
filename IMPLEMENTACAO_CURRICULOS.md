# Implementação do Módulo de Currículos - Resumo

## O que foi implementado

### 1. Banco de Dados

#### Migration 130: Tabela de Currículos
**Arquivo**: `database/updates/130_curriculos_profissionais.sql`

Cria a tabela `curriculos` com:
- Campos para dados profissionais (disponibilidade, áreas de interesse, pretensão salarial)
- Campos para formação acadêmica (JSONB)
- Campos para experiência profissional (JSONB)
- Habilidades e certificações
- Controle de visibilidade (is_publico, is_ativo)
- Políticas RLS para segurança

#### Migration 131: Permissões RBAC
**Arquivo**: `database/updates/131_curriculos_permissions.sql`

Adiciona as permissões:
- `gestao.curriculos.view`
- `gestao.curriculos.detalhes`
- `gestao.curriculos.contatar`

### 2. Tipos TypeScript

**Arquivo**: `src/lib/database.types.ts`

Adicionado:
- `Curriculo`: Tipo principal
- `CurriculoInsert`: Para inserção
- `CurriculoUpdate`: Para atualização
- `FormacaoAcademica`: Estrutura de formação
- `ExperienciaProfissional`: Estrutura de experiência
- `Certificacao`: Estrutura de certificação

### 3. Menu de Navegação

**Arquivo**: `src/layout/AdminLayout.tsx`

Adicionado item de menu "Currículos" na seção **Gestão**:
- Ícone: `FileUser`
- Rota: `/curriculos`
- Permissão: `gestao.curriculos.view`
- Posição: Primeiro item da seção Gestão (acima de "Plano")

### 4. Módulo de Currículos

**Pasta**: `src/modules/curriculos/`

#### Service (`service.ts`)
- `listarPublicos()`: Lista currículos disponíveis
- `buscarPorId()`: Busca currículo detalhado
- `buscarPorUserId()`: Busca currículo do usuário
- `salvar()`: Cria ou atualiza currículo
- `atualizar()`: Atualiza campos específicos
- `atualizarVisibilidade()`: Alterna entre público/privado
- `atualizarStatus()`: Ativa/desativa currículo

#### Hooks (`hooks.ts`)
- `useCurriculosPublicos()`: Lista com filtros
- `useCurriculo()`: Detalhes por ID
- `useMeuCurriculo()`: Currículo do usuário logado
- `useSalvarCurriculo()`: Mutation para salvar
- `useAtualizarCurriculo()`: Mutation para atualizar
- `useAtualizarVisibilidade()`: Toggle visibilidade
- `useAtualizarStatus()`: Toggle status

#### Tipos (`types.ts`)
- `CurriculoLista`: Interface estendida com dados relacionados
- `FiltrosCurriculo`: Filtros de busca
- `AREAS_INTERESSE`: Lista de áreas disponíveis
- `DISPONIBILIDADE_TIPOS`: Tipos de disponibilidade

#### Páginas

**CurriculosListPage.web.tsx**
- Lista em grid com cards
- Filtros por área de interesse
- Busca textual
- Cards com:
  - Nome e função
  - Resumo profissional
  - Áreas de interesse (badges)
  - Disponibilidade
  - Pretensão salarial
- Loading states e empty states

**CurriculoDetalhePage.tsx**
- Visualização completa do currículo
- Seções:
  - Cabeçalho com avatar e status
  - Áreas de interesse
  - Disponibilidade
  - Pretensão salarial
  - Resumo profissional
  - Formação acadêmica
  - Experiência profissional
  - Habilidades
  - Certificações
  - Observações
  - Data de cadastro/atualização
- Botão "Entrar em Contato" (e-mail)

### 5. Rotas

**Arquivo**: `src/App.tsx`

Adicionado:
```typescript
const CurriculosListPage = lazy(() => import('@/modules/curriculos/pages/CurriculosListPage'))
const CurriculoDetalhePage = lazy(() => import('@/modules/curriculos/pages/CurriculoDetalhePage'))

// Rotas
<Route path="/curriculos" element={<CurriculosListPage />} />
<Route path="/curriculos/:id" element={<CurriculoDetalhePage />} />
```

## Como Ativar

### 1. Executar Migrations no Banco

```bash
# Acessar Supabase SQL Editor e executar:
database/updates/130_curriculos_profissionais.sql
database/updates/131_curriculos_permissions.sql
```

### 2. Build e Deploy

```bash
npm run build
# Verificar se não há erros
npm preview
```

## Fluxo de Uso

### Para o Gestor da Escola

1. **Acessar menu**: Gestão → Currículos
2. **Visualizar lista**: Cards com resumo dos profissionais
3. **Filtrar**: Por área de interesse ou busca textual
4. **Ver detalhes**: Clicar no card para ver currículo completo
5. **Entrar em contato**: Clicar em "Entrar em Contato" (abre e-mail)

### Para o Profissional (futuro)

1. **Acessar cadastro**: Perfil → Meu Currículo
2. **Preencher dados**:
   - Disponibilidade para emprego formal
   - Áreas de interesse
   - Formação acadêmica
   - Experiência profissional
   - Habilidades e certificações
   - Pretensão salarial
3. **Publicar**: Tornar currículo visível para escolas

## Regras de Negócio

### Visibilidade

- Apenas profissionais com `disponibilidade_emprego = true` aparecem na lista
- Apenas currículos com `is_publico = true` e `is_ativo = true` são listados
- Gestores veem apenas currículos públicos
- Super Admin vê todos os currículos

### Permissões

- **Gestor/Admin**: Pode visualizar e contatar
- **Professor**: Não tem acesso ao módulo
- **Super Admin**: Acesso completo (leitura)

### Dados do Profissional

Os dados exibidos são:
- Nome completo (da tabela funcionarios)
- E-mail de contato (da tabela usuarios_sistema)
- Função/cargo atual
- Todas as informações preenchidas no currículo

## Estrutura de Dados

### JSONB - Formação Acadêmica
```json
[
  {
    "nivel": "superior",
    "instituicao": "Universidade X",
    "ano_conclusao": 2020,
    "area": "Pedagogia"
  }
]
```

### JSONB - Experiência Profissional
```json
[
  {
    "empresa": "Escola Y",
    "cargo": "Professor",
    "periodo": "2020-2023",
    "atividades": "Aulas de matemática"
  }
]
```

### JSONB - Certificações
```json
[
  {
    "nome": "Curso de Libras",
    "instituicao": "Instituto Z",
    "ano": 2021,
    "carga_horaria": 40
  }
]
```

## Melhorias Futuras

### Fase 2
- [ ] Cadastro de currículo pelo profissional
- [ ] Upload de foto e documentos
- [ ] Preview do currículo antes de publicar
- [ ] Sistema de vagas disponíveis

### Fase 3
- [ ] Matching automático (vaga × currículo)
- [ ] Sistema de candidatura
- [ ] Chat escola-profissional
- [ ] Agendamento de entrevistas

### Técnicas
- [ ] Cache otimizado
- [ ] Paginação server-side
- [ ] Export PDF
- [ ] Analytics de visualizações

## Status

✅ Banco de dados criado  
✅ Tipos TypeScript adicionados  
✅ Permissões RBAC configuradas  
✅ Menu implementado  
✅ Rotas criadas  
✅ Páginas de listagem e detalhe  
✅ Build passando sem erros  
⏳ Aguardando execução das migrations  
⏳ Cadastro de currículo (futuro)  

---

**Implementação concluída em**: 29 de março de 2025  
**Autor**: Fluxoo Educacional
