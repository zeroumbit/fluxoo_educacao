# Plano de Remoção de `any` — Fluxoo Edu

## Sumário Executivo

**~700-850 ocorrências de `any`** em **~110 arquivos**.
Distribuídas em **12 categorias** com 3 níveis de risco.

A abordagem é **fundação → serviços → páginas**: corrigir a base de tipos primeiro, depois propagar as correções para cima.

---

## Fase 0: Fundação — Adicionar Tabelas Faltantes ao Schema de Tipos

**Risco: BAIXO** · Arquivo: `src/lib/database.types.ts`

### O Problema
6 tabelas/views usadas no código NÃO estão registradas em `Database['public']['Tables']`, forçando `('tabela' as any)` em **~60 lugares**. Outras 15 tabelas têm `Update: any`.

### O que fazer

#### 0.1 Adicionar definições ausentes (antes do `export type Database`)

```typescript
// ========== TURMA_PROFESSORES ==========
export type TurmaProfessor = {
  id: string
  tenant_id: string
  turma_id: string
  professor_id: string
  disciplina_id: string | null
  carga_horaria_semanal: number | null
  data_inicio: string | null
  data_fim: string | null
  status: string | null
  created_at: string
}
export type TurmaProfessorInsert = Omit<TurmaProfessor, 'id' | 'created_at'> & {
  id?: string; created_at?: string
}
export type TurmaProfessorUpdate = Partial<TurmaProfessorInsert>

// ========== TURMA_GRADE_HORARIA ==========
export type TurmaGradeHoraria = {
  id: string
  tenant_id: string
  turma_id: string
  disciplina_id: string | null
  professor_id: string | null
  dia_semana: number
  hora_inicio: string
  hora_fim: string
  sala: string | null
  status: string | null
  created_at: string
}
export type TurmaGradeHorariaInsert = Omit<TurmaGradeHoraria, 'id' | 'created_at'> & {
  id?: string; created_at?: string
}
export type TurmaGradeHorariaUpdate = Partial<TurmaGradeHorariaInsert>

// ========== CONFIGURACOES_ESCOLA_HISTORICO ==========
export type ConfiguracaoEscolaHistorico = {
  id: string
  tenant_id: string
  config_financeira: Record<string, unknown> | null
  config_academica: Record<string, unknown> | null
  alterado_por: string
  created_at: string
}
export type ConfiguracaoEscolaHistoricoInsert = Omit<ConfiguracaoEscolaHistorico, 'id' | 'created_at'> & {
  id?: string; created_at?: string
}
```

#### 0.2 Trocar `Update: any` por tipos concretos nas tabelas que já têm definição

| Tabela | Tem Row/Insert? | Trocar `Update: any` por |
|--------|-----------------|--------------------------|
| `autorizacoes_auditoria` | Sim (`AutorizacaoAuditoria`, `AutorizacaoAuditoriaInsert`) | `Update: Partial<AutorizacaoAuditoriaInsert>` |
| `selos` | Sim (`Selo`, `SeloInsert`) | `Update: Partial<SeloInsert>` |
| `almoxarifado_movimentacoes` | Sim (`AlmoxarifadoMovimentacao`, `AlmoxarifadoMovimentacaoInsert`) | `Update: Partial<AlmoxarifadoMovimentacaoInsert>` |
| `alertas_financeiros_ignorados` | Sim (`AlertaFinanceiroIgnorado`, `AlertaFinanceiroIgnoradoInsert`) | `Update: Partial<AlertaFinanceiroIgnoradoInsert>` |
| `tenant_disciplinas_ocultas` | Sim (`TenantDisciplinaOculta`, `TenantDisciplinaOcultaInsert`) | `Update: Partial<TenantDisciplinaOcultaInsert>` |
| `system_modules` | Sim (`SystemModule`, `SystemModuleInsert`) | `Update: Partial<SystemModuleInsert>` |
| `permissions` | Sim (`Permission`, `PermissionInsert`) | `Update: Partial<PermissionInsert>` |
| `perfil_permissions` | Sim (`PerfilPermission`, `PerfilPermissionInsert`) | `Update: Partial<PerfilPermissionInsert>` |
| `cargos_v2` | Sim (`CargoV2`, `CargoV2Insert`) | `Update: Partial<CargoV2Insert>` |
| `user_permission_overrides` | Sim (`UserPermissionOverride`, `UserPermissionOverrideInsert`) | `Update: Partial<UserPermissionOverrideInsert>` |
| `approval_workflows` | Sim (`ApprovalWorkflow`, `ApprovalWorkflowInsert`) | `Update: Partial<ApprovalWorkflowInsert>` |
| `funcao_escola` | Sim (`FuncaoEscola`, `FuncaoEscolaInsert`) | **Adicionar ao `Database['public']['Tables']`** |

#### 0.3 Adicionar tabelas/views faltantes ao `Database['public']`

```typescript
// Dentro de Database['public']['Tables'], adicionar:
turma_professores: { Row: TurmaProfessor; Insert: TurmaProfessorInsert; Update: TurmaProfessorUpdate; Relationships: any[] }
turma_grade_horaria: { Row: TurmaGradeHoraria; Insert: TurmaGradeHorariaInsert; Update: TurmaGradeHorariaUpdate; Relationships: any[] }
configuracoes_escola_historico: { Row: ConfiguracaoEscolaHistorico; Insert: ConfiguracaoEscolaHistoricoInsert; Update: Partial<ConfiguracaoEscolaHistoricoInsert>; Relationships: any[] }
funcoes_escola: { Row: FuncaoEscola; Insert: FuncaoEscolaInsert; Update: FuncaoEscolaUpdate; Relationships: any[] }
avaliacoes_config: { Row: ...; Insert: ...; Update: ...; Relationships: any[] }
avaliacoes_notas: { Row: ...; Insert: ...; Update: ...; Relationships: any[] }
fechamento_bimestre: { Row: ...; Insert: ...; Update: ...; Relationships: any[] }
recuperacoes: { Row: ...; Insert: ...; Update: ...; Relationships: any[] }
calendario_letivo: { Row: ...; Insert: ...; Update: ...; Relationships: any[] }
observacoes_pedagogicas: { Row: ...; Insert: ...; Update: ...; Relationships: any[] }
marketplace_categorias: { Row: ...; Insert: ...; Update: ...; Relationships: any[] }
```

**Todas essas tabelas precisam ter definições Row/Insert/Update espelhando as colunas do banco.**

#### 0.4 Views faltantes em `Database['public']['Views']`

```typescript
vw_radar_evasao: { Row: { ... }; Relationships: any[] }
vw_professor_escopo: { Row: { ... }; Relationships: any[] }
vw_aprovacoes_pendentes: { Row: { ... }; Relationships: any[] }
```

### Verificação
Após Fase 0, o Supabase client `createClient<Database>()` reconhecerá todas as tabelas. Nenhum `as any` será necessário em `.from('turma_professores')` — o tipo será inferido automaticamente.

---

## Fase 1: Service Layer — Remover `as any` de Consultas Supabase

**Risco: MÉDIO** · ~20 arquivos · ~60-80 ocorrências

### 1.1 Remover table name casts (`'tabela' as any`)

**Padrão ANTES:**
```typescript
const { data } = await (supabase.from('turma_professores' as any) as any)
  .select('turma_id')
  .eq('professor_id', professorId)
```

**Padrão DEPOIS:**
```typescript
const { data } = await supabase
  .from('turma_professores')
  .select('turma_id')
  .eq('professor_id', professorId)
```

### 1.2 Remover client casts (`(supabase as any)`, `(supabase.from('x') as any)`)

**Padrão ANTES:**
```typescript
const { data } = await (supabase.from('funcionarios') as any)
  .select('id, nome_completo, tenant_id')
  .eq('user_id', user.id)
  .maybeSingle()
```

**Padrão DEPOIS:**
```typescript
const { data } = await supabase
  .from('funcionarios')
  .select('id, nome_completo, tenant_id')
  .eq('user_id', user.id)
  .maybeSingle()
```

### 1.3 Remover object/return casts (`} as any`, `return data as any`)

**Padrão ANTES:**
```typescript
return data as any
```

**Padrão DEPOIS:** Tipar o retorno da função explicitamente ou usar `satisfies`. O Supabase client tipado já retorna o tipo correto.

### 1.4 Substituir `(supabase as unknown as LegacyClient)` por client tipado

Os arquivos que usam `supabase as unknown as ...` (academico.service.v1, dashboard.service, professor.service) devem ser atualizados para usar o client tipado diretamente.

### Arquivos alvo (por ordem de impacto)

| Prioridade | Arquivo | Casts | Depende de Fase 0? |
|------------|---------|-------|--------------------|
| P0 | `src/modules/turmas/service.ts` | 12 | Sim (turma_professores, turma_grade_horaria) |
| P0 | `src/modules/academico/service.v2.ts` | 15 | Sim (avaliacoes_config, etc.) |
| P1 | `src/modules/escolas/service.ts` | 10 | Não |
| P1 | `src/modules/funcionarios/service.ts` | 8 | Sim (funcoes_escola) |
| P1 | `src/modules/assinatura/service.ts` | 5 | Não |
| P1 | `src/modules/super-admin/marketplace.service.ts` | 6 | Sim (marketplace_categorias) |
| P2 | `src/modules/notificacoes/notificacoes.service.ts` | 4 | Não |
| P2 | `src/modules/comunicacao/service.ts` | 10 | Não |
| P2 | `src/modules/comunicacao/welcome.service.ts` | 3 | Não |
| P2 | `src/modules/frequencia/service.ts` | 4 | Não |
| P2 | `src/modules/portal/financeiro.service.ts` | 4 | Não |
| P2 | `src/lib/gestor-guard.ts` | 6 | Não |
| P2 | `src/lib/auth-rate-limit.ts` | 4 | Não |
| P2 | `src/lib/professor-scope.ts` | 2 | Sim (vw_professor_escopo) |
| P2 | `src/lib/rbac-validation.ts` | 2 | Não |
| P3 | `src/modules/configuracoes/service.ts` | 2 | Não |
| P3 | `src/modules/escolas/hooks/useTenantSettings.ts` | 5 | Sim (configuracoes_escola_historico) |
| P3 | `src/modules/academico/services/historicoDigitalService.ts` | 6 | Não |
| P3 | `src/modules/alunos/alertas.service.ts` | 4 | Não |
| P3 | `src/modules/almoxarifado/service.ts` | 2 | Não |

### Risco e Mitigação
- **Risco**: Query pode quebrar se o tipo genérico do Supabase não corresponder à estrutura real da tabela.
- **Mitigação**: Cada tabela deve ser verificada no schema real do banco antes de tipar. Definir os tipos exatos com `select('col1, col2, ...')` explícito para garantir compatibilidade.
- **Rollback**: Reverter o `as any` é trivial.

---

## Fase 2: Service Layer — Tipar Parâmetros e Retornos de Funções

**Risco: MÉDIO** · ~15 arquivos · ~30-40 ocorrências

### 2.1 Parâmetros de mutation (React Query hooks)

**Padrão ANTES:**
```typescript
mutationFn: (atribuicao: any) => turmaService.atribuirProfessor(atribuicao)
```

**Padrão DEPOIS:**
```typescript
mutationFn: (atribuicao: TurmaProfessorInsert) => turmaService.atribuirProfessor(atribuicao)
```

### Arquivos alvo

| Arquivo | Parâmetros | Tipo correto |
|---------|-----------|-------------|
| `src/modules/turmas/hooks.ts` | `atribuicao: any`, `item: any` | `TurmaProfessorInsert`, `TurmaGradeHorariaInsert` |
| `src/modules/funcionarios/hooks.ts` | `data: any` | `FuncionarioInsert` |
| `src/modules/almoxarifado/hooks.ts` | `data: any` | `AlmoxarifadoItemInsert` |
| `src/modules/agenda/hooks.ts` | `d: any` | `EventoInsert` |
| `src/modules/autorizacoes/hooks.ts` | `updates: any` | `AutorizacaoRespostaUpdate` |
| `src/modules/financeiro/hooks.ts` | vários params `any` | Tipos específicos |
| `src/modules/financeiro/hooks-avancado.ts` | `updates: any`, `pagamento: any` | `CobrancaUpdate`, `PagamentoManualResponse` |

### 2.2 Parâmetros de funções de serviço

| Arquivo | Parâmetro | Tipo correto |
|---------|-----------|-------------|
| `src/modules/turmas/service.ts` | `atribuicao: any` | `TurmaProfessorInsert` |
| `src/modules/turmas/service.ts` | `item: any` | `TurmaGradeHorariaInsert` |
| `src/modules/almoxarifado/service.ts` | `item: any`, `updates: any` | `AlmoxarifadoItemInsert`, `AlmoxarifadoItemUpdate` |
| `src/modules/funcionarios/service.ts` | `funcionario: any`, `updates: any` | `FuncionarioInsert`, `FuncionarioUpdate` |

### Risco e Mitigação
- **Risco**: Tipo Insert pode faltar campos opcionais que a função preenche dinamicamente.
- **Mitigação**: Usar `Partial<T>`, `Omit<T, 'id' | 'created_at'>` ou `satisfies T` em vez de `as T`.
- **Regra**: Sempre preferir `Omit` ou `Partial` a `as` para não mentir para o compilador.

---

## Fase 3: Páginas — Tipar `useState<any>` e `zodResolver as any`

**Risco: BAIXO-MÉDIO** · ~30 arquivos · ~45-55 ocorrências (useState) + ~20-25 (zod)

### 3.1 useState<any> → useState<tipo específico | null>

**Padrão ANTES:**
```typescript
const [formData, setFormData] = useState<any>(null)
```

**Padrão DEPOIS:**
```typescript
const [formData, setFormData] = useState<Aluno | null>(null)
```

### 3.2 useState<any[]> → useState<tipo específico[]>

**Padrão ANTES:**
```typescript
const [filiais, setFiliais] = useState<any[]>([])
```

**Padrão DEPOIS:**
```typescript
const [filiais, setFiliais] = useState<Filial[]>([])
```

### 3.3 zodResolver as any

**Padrão ANTES:**
```typescript
zodResolver(meuSchema) as any
```

**Padrão DEPOIS:**
```typescript
zodResolver(meuSchema) // O tipo é inferido do schema Zod
```

Se houver incompatibilidade real entre o schema Zod e o tipo do formulário, corrigir o schema ou o tipo — não usar `as any`.

### Arquivos de maior impacto (mais ocorrências)

| Arquivo | useStates | zod/form casts |
|---------|-----------|----------------|
| `src/modules/alunos/pages/AlunoCadastroPage.web.tsx` | 3 | 3 |
| `src/modules/academico/pages/MatriculaListPage.web.tsx` | 1 | 6 |
| `src/modules/academico/pages/MatriculaFormPage.web.tsx` | 0 | 4 |
| `src/modules/academico/pages/MatriculaFormPage.mobile.tsx` | 0 | 5 |
| `src/modules/alunos/pages/AlunoDetalhePage.web.tsx` | 2 | 0 |
| `src/modules/funcionarios/pages/FuncionariosPage.web.tsx` | 2 | 2 |
| `src/modules/livros/pages/LivrosPage.web.tsx` | 0 | 2 |
| `src/modules/almoxarifado/pages/AlmoxarifadoPage.web.tsx` | 0 | 2 |
| `src/modules/financeiro/pages/FinanceiroPage.web.tsx` | 2 | 0 |
| `src/modules/documentos/pages/DocumentosPage.web.tsx` | 1 | 0 |

---

## Fase 4: Páginas — Tipar Property Access (`obj as any`).prop

**Risco: MÉDIO** · ~25 arquivos · ~80-100 ocorrências

### O Problema
Objetos com joins (ex: `aluno.turma.nome`) são acessados via `(obj as any).prop` porque o tipo Supabase não inclui relações aninhadas.

### Estratégia

**Opção A (recomendada para joins simples):** Tipar explicitamente o `.select()` com TypeScript usando `SupabaseClient['from']` generic.

**Opção B (recomendada para a maioria dos casos):** Criar interfaces locais nos hooks/páginas para o resultado da query com join.

**Padrão ANTES:**
```typescript
const genero = (aluno as any).genero
const turmaNome = (aluno as any).turma?.nome
```

**Padrão DEPOIS:**
```typescript
// Opção B: Interface local que descreve o resultado real
interface AlunoComTurma extends Aluno {
  turma: { nome: string } | null
}

// Usar no hook/service que retorna os dados
// O type assertion `as AlunoComTurma` é feito uma vez no service/hook,
// não em cada propriedade
const aluno = data as AlunoComTurma
const genero = aluno.genero
const turmaNome = aluno.turma?.nome
```

### Priorização

| Prioridade | Arquivo | Casts | Notas |
|------------|---------|-------|-------|
| P0 | `src/modules/alunos/pages/AlunoDetalhePage.web.tsx` | ~10 | `(aluno as any).genero`, `.foto_url`, `.valor_mensalidade_atual`, `.data_ingresso` — Mas `aluno` já é `Aluno`! Campo existe no tipo. |
| P0 | `src/modules/auth/AuthContext.tsx` | ~4 | `escolaData as any` — `escolaData` já tem tipo `Escola \| null`. Cast desnecessário. |
| P1 | `src/modules/assinatura/pages/PlanoPage.web.tsx` | ~4 | `(assinatura as any)?.plano` — precisa de interface Plano na assinatura |
| P1 | `src/modules/portal/pages/PortalPerfilPage.web.tsx` | 4 | `(dados as any).logradouro` — dados já é `Escola \| null` |
| P1 | `src/modules/meu-perfil/pages/MeuPerfilPage.web.tsx` | 3 | `(data as any).logradouro` — mesmo caso |
| P2 | `src/modules/alunos/pages/AlunoDetalhePage.mobile.tsx` | 4 | Mesmo padrão da web |
| P2 | `src/modules/academico/pages/NotasPage.web.tsx` | 3 | `(location.state as any)?.turmaId` |
| P2 | `src/modules/portal/v2/pages/PortalAlunoPerfilV2.web.tsx` | 4 | `(student as any)?.turma?.nome` |
| P3 | Demais casos dispersos | ~50 | Distribuídos em ~15 arquivos |

### Observação Importante
Muitos `(obj as any).prop` são em objetos que JÁ têm o tipo correto, mas o TypeScript não reconhece porque a query select tem joins. A correção deve ser feita **no retorno da query** (no service/hook), não em cada ponto de uso.

---

## Fase 5: Páginas — Tipar Callback Parameters em `.map()`, `.filter()`, `.forEach()`

**Risco: BAIXO** · ~50 arquivos · ~200-250 ocorrências

### Estratégia

**Padrão ANTES:**
```typescript
data?.forEach((matricula: any) => { ... })
turmas.filter((t: any) => t.status === 'ativa')
```

**Padrão DEPOIS:**
```typescript
data?.forEach((matricula: Matricula) => { ... })
turmas.filter((t: Turma) => t.status === 'ativa')
```

### Abordagem
- 80% dos casos: o tipo correto já existe em `database.types.ts` e pode ser importado.
- 15% dos casos: o tipo correto é o Row da tabela, que o Supabase infere automaticamente se a query for tipada. Ao remover `as any` da query (Fase 1), estes callbacks serão automaticamente tipados.
- 5% dos casos: o dado é resultado de join e precisa de interface local.

### Execução
- **Não fazer manualmente** — este padrão é tão repetitivo que vale um codemod (jscodeshift ou script ts-morph).
- Fazer por arquivo, do mais simples (query sem joins) para o mais complexo.

---

## Fase 6: Páginas — Tipar Catch Clauses (`error: any`)

**Risco: BAIXO** · ~25 arquivos · ~55-65 ocorrências

### Estratégia

**Padrão ANTES:**
```typescript
} catch (error: any) {
  console.error(error.message)
}
```

**Padrão DEPOIS:**
```typescript
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Erro desconhecido'
  console.error(message)
}
```

### Arquivos alvo

| Arquivo | Ocorrências |
|---------|-------------|
| `src/modules/alunos/pages/AlunoDetalhePage.web.tsx` | 7 |
| `src/modules/academico/pages/TransferenciasPage.web.tsx` | 3 |
| `src/modules/portal/v2/components/PortalAlunoCadastroV2.tsx` | 3 |
| `src/modules/alunos/pages/AlunoDetalhePage.mobile.tsx` | 3 |
| Demais | ~40 |

### Nota
- `catch (error: any)` é permitido pelo TypeScript mesmo com `strict: true`. É uma escolha de estilo.
- A correção para `unknown` é segura e alinha com boas práticas.
- Recomendo criar um helper `function getErrorMessage(error: unknown): string` para evitar repetição do `instanceof Error`.

---

## Fase 7: Componentes — Tipar Props

**Risco: BAIXO** · ~10 arquivos · ~15-20 ocorrências

### Estratégia

**Padrão ANTES:**
```typescript
interface Props {
  icon: any
  notifications?: any[]
}
```

**Padrão DEPOIS:**
```typescript
interface Props {
  icon: React.ReactNode
  notifications?: Notificacao[]
}
```

### Arquivos

| Arquivo | Prop | Tipo correto |
|---------|------|-------------|
| `src/layout/PortalLayout.tsx` | `icon: any` | `React.ReactNode` |
| `src/components/ui/NotificationBell.tsx` | `notifications?: any[]` | `Notificacao[]` |
| `src/modules/rbac/components/PermissionMatrix.tsx` | `groupedPermissions: Record<string, any[]>` | `Record<string, PerfilPermission[]>` |
| `src/modules/portal/v2/components/BottomNavV2.tsx` | `item: any` | Tipo do item de navegação |
| `src/modules/marketplace/pages/LojistaDashboardPage.tsx` | `icon: any` | `React.ReactNode` |
| `src/modules/alunos/components/ModalDescontoAluno.tsx` | `aluno: any` | `Aluno` |
| `src/modules/financeiro/components/PixManualBannerNotification.tsx` | `rawNotifications: any[]` | `Notificacao[]` |

---

## Fase 8: database.types.ts — Auto-generated Types (Baixa Prioridade)

**Risco: MÍNIMO** · 1 arquivo · ~70-80 ocorrências

### O que são
- `Relationships: any[]` — ~70 ocorrências, gerado pelo Supabase CLI `supabase gen types`
- `Record<string, any>` — ~5 ocorrências (campos JSONB: `metadata`, `config_financeira`, `config_academica`)
- `dados_agrupados: any` — para `importacoes_staging` (JSONB dinâmico)

### Estratégia
- **`Relationships: any[]`**: Deixar como está. É auto-gerado pelo `supabase gen types` e não afeta a segurança de tipo do código de aplicação. Se quiser remover, configure `supabase gen types --linked` para gerar com relacionamentos tipados.
- **`Record<string, any>` em campos JSONB**: Trocar por `Record<string, unknown>` onde possível. Mas campos como `config_financeira` em `ConfiguracaoEscola` são genuinamente dinâmicos — `unknown` é mais seguro que `any`.
- **`dados_agrupados: any`**: Trocar por `Record<string, unknown>` já que é um JSONB livre.
- **`divergencias: any`** (linha 1856): Verificar qual tipo real e substituir.

---

## Cronograma e Dependências

```
Fase 0 (Fundação: database.types.ts)
  ├── Dependency for: Fase 1 (service layer casts)
  │     ├── Dependency for: Fase 3 (useState em páginas)
  │     └── Dependency for: Fase 5 (callback params)
  ├── Independent: Fase 6 (catch clauses)
  ├── Independent: Fase 7 (prop types)
  └── Independent: Fase 8 (auto-generated types)

Fase 1 (Service layer casts removal)
  └── Dependency for: Fase 2 (function parameter types)

Fase 4 (Property access) — partially independent
```

### Ordem recomendada de execução

| Passo | Fase | Estimativa | Paralelizável? |
|-------|------|------------|----------------|
| 1 | Fase 6: catch clauses | 30 min | Sim (25 arquivos em paralelo) |
| 2 | Fase 7: prop types | 15 min | Sim |
| 3 | Fase 0: database.types.ts | 1-2h | Não (1 arquivo, precisa de cuidado) |
| 4 | Fase 1: service layer casts | 2-3h | Parcial (por módulo) |
| 5 | Fase 2: function parameter types | 1h | Sim (por hook/service) |
| 6 | Fase 3: useState + zodResolver | 2-3h | Sim (por página) |
| 7 | Fase 4: property access | 2-3h | Sim (por página) |
| 8 | Fase 5: callback params | 3-4h | Sim (por arquivo/codemod) |
| 9 | Fase 8: auto-generated types | 30 min | Não |

**Total estimado: ~12-17 horas de trabalho efetivo**

---

## Verificação e Validação

Após cada fase:

```bash
# 1. Verificar se o TypeScript compila sem erros
npx tsc --noEmit --project tsconfig.app.json

# 2. Rodar linter
npx eslint src/ --ext .ts,.tsx

# 3. Build da aplicação
npm run build
```

### Critérios de Aceite
- [ ] `npx tsc --noEmit` passa sem erros
- [ ] Nenhum comportamento runtime alterado (testes E2E passam)
- [ ] `any` removido de todas as categorias exceto `Relationships: any[]` (auto-gerado)
- [ ] Código resultante é semanticamente idêntico ao original

---

## Riscos e Bloqueios

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Tabela `turma_professores` tem colunas diferentes do esperado | Média | Alto | Verificar schema real antes de tipar |
| Join queries retornam shape diferente do tipo Row | Alta | Médio | Usar `select()` explícito + interface local |
| Zod schemas têm `transform()` que muda o tipo de saída | Média | Baixo | Usar `z.input<>` e `z.output<>` separadamente |
| `strict: false` no tsconfig.app.json mascara erros | Alta | Médio | Ativar `strict: true` gradualmente por arquivo |
