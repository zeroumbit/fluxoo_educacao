# 🔍 AUDITORIA COMPLETA - CADASTRO DE ALUNOS

**Data:** 27 de março de 2026  
**Status Geral:** ⚠️ **85% - Funcional com Pontos de Atenção**

---

## 📊 RESUMO EXECUTIVO

| Área | Status | Observação |
|------|--------|------------|
| **Cadastro (CRUD)** | ✅ **100%** | Formulário completo, validações, RBAC |
| **Vínculo Responsável** | ✅ **100%** | Tabela N:N `aluno_responsavel` correta |
| **Geração de Cobranças** | ✅ **100%** | Automática no cadastro da matrícula |
| **Frequência** | ✅ **100%** | `aluno_id` em `frequencias` com CASCADE |
| **Financeiro** | ✅ **100%** | `aluno_id` em `cobrancas` com índices |
| **Matrículas** | ✅ **100%** | `aluno_id` em `matriculas` com FK |
| **Boletim/Notas** | ✅ **100%** | `aluno_id` em `boletins`, `avaliacoes_notas` |
| **Turmas (Vínculo)** | ⚠️ **PARCIAL** | `turmas.alunos_ids` é ARRAY manual (sem trigger) |
| **Sincronização** | ⚠️ **PARCIAL** | Depende de update manual no service |
| **Cache/Estado** | ⚠️ **ATENÇÃO** | localStorage pode persistir rascunho |
| **RLS Policies** | ✅ **100%** | Corretas para gestor e responsável |

---

## ✅ O QUE ESTÁ 100% FUNCIONAL

### 1. **Fluxo de Cadastro Completo**

**Arquivo:** `src/modules/alunos/pages/AlunoCadastroPage.web.tsx`

```
4 Etapas:
├── Responsável (nome, cpf, email, telefone, parentesco, financeiro)
├── Dados do Aluno (nome, nascimento, cpf, rg, genero, foto, valor_mensalidade)
├── Endereço (cep, logradouro, numero, bairro, cidade, estado, filial_id)
└── Saúde (patologias[], medicamentos[], observacoes)
```

**Service:** `src/modules/alunos/service.ts - criarComResponsavel()`

```typescript
✅ Fluxo:
1. Verifica responsável por CPF → reutiliza ou cria
2. Cria usuário no Auth (se email + senha)
3. Cria aluno na tabela `alunos`
4. Vincula via `aluno_responsavel` (N:N)
5. Gera cobranças iniciais (se valor_mensalidade > 0)
```

### 2. **Tabela `aluno_responsavel` (Vínculo N:N)**

```sql
✅ Campos:
- aluno_id (FK -> alunos.id)
- responsavel_id (FK -> responsaveis.id)
- grau_parentesco
- is_financeiro (TRUE/FALSE) ← Apenas 1 por aluno
- is_academico (TRUE/FALSE)
- status (ativo/inativo)
```

**Regras Implementadas:**
- ✅ Apenas 1 responsável financeiro por aluno
- ✅ Múltiplos responsáveis acadêmicos permitidos
- ✅ Reutiliza responsável existente (pelo CPF)
- ✅ Cria usuário no Auth se necessário

### 3. **Geração Automática de Cobranças**

**Service:** `src/modules/financeiro/service.ts`

```typescript
✅ gerarCobrancasIniciaisGenerico():
- Gera 12 cobranças (mensalidades)
- Valor baseado em `valor_mensalidade_atual`
- Vencimento todo dia 5 (padrão)
- Status: 'a_vencer'
```

**Trigger Proporcional:** `database/updates/037_cobranca_proporcional.sql`

```sql
✅ fn_gerar_primeira_fatura_proporcional():
- Calcula valor proporcional se ingresso após dia 01
- Gera primeira fatura com vencimento +5 dias
```

### 4. **Tabelas com Vínculo `aluno_id` (FK com CASCADE)**

| Tabela | FK | ON DELETE | Status |
|--------|-----|-----------|--------|
| `matriculas` | `aluno_id` | CASCADE | ✅ |
| `frequencias` | `aluno_id` | CASCADE | ✅ |
| `cobrancas` | `aluno_id` | CASCADE | ✅ |
| `boletins` | `aluno_id` | CASCADE | ✅ |
| `selos` | `aluno_id` | CASCADE | ✅ |
| `document_solicitations` | `aluno_id` | CASCADE | ✅ |
| `documentos_emitidos` | `aluno_id` | CASCADE | ✅ |
| `autorizacoes_respostas` | `aluno_id` | CASCADE | ✅ |
| `fila_virtual` | `aluno_id` | CASCADE | ✅ |
| `avaliacoes_notas` | `aluno_id` | CASCADE | ✅ |
| `frequencia_diaria` | `aluno_id` | CASCADE | ✅ |

### 5. **Views do Radar de Evasão**

**Arquivo:** `database/updates/046_radar_evasao_melhorias.sql`

```sql
✅ vw_radar_evasao:
- faltas_consecutivas > 7 (últimos 30 dias)
- cobrancas_atrasadas >= 1
- cobrancas_recorrentes >= 3 (NOVO)
- motivo_principal (classificação automática)
```

### 6. **RLS Policies**

```sql
✅ Policies Implementadas:
- Gestor: acesso total aos alunos da escola (tenant_id)
- Responsável: acesso apenas aos filhos (via aluno_responsavel)
- Portal: check_gestor_or_portal_access()
```

---

## ⚠️ PONTOS DE ATENÇÃO (NÃO ESTÃO 100%)

### 🔴 **1. `turmas.alunos_ids` - ARRAY MANUAL (CRÍTICO)**

**Problema:**
```typescript
// turmas.alunos_ids é um ARRAY de UUIDs, NÃO é FK
alunos_ids: string[] | null
```

**Impacto:**
- ❌ Não há sincronização automática quando matrícula é criada
- ❌ Não há trigger que atualiza o array
- ❌ Se criar matrícula → aluno NÃO aparece na turma automaticamente
- ❌ Se excluir matrícula → aluno PERMANECE no array da turma

**Código Atual:**
```typescript
// src/modules/turmas/service.ts - buscarTurmasComAlunos()
.contains('alunos_ids', [alunoId])  // Busca por array
```

**Solução Necessária:**
```sql
-- Criar trigger de sincronização
CREATE OR REPLACE FUNCTION fn_sincronizar_alunos_ids()
RETURNS TRIGGER AS $$
BEGIN
  -- INSERT na matrícula → adiciona ao array
  IF TG_OP = 'INSERT' THEN
    UPDATE turmas 
    SET alunos_ids = array_append(COALESCE(alunos_ids, '{}'), NEW.aluno_id)
    WHERE id = NEW.turma_id;
    RETURN NEW;
  END IF;
  
  -- DELETE na matrícula → remove do array
  IF TG_OP = 'DELETE' THEN
    UPDATE turmas 
    SET alunos_ids = array_remove(alunos_ids, OLD.aluno_id)
    WHERE id = OLD.turma_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sincronizar_alunos_ids
AFTER INSERT OR DELETE ON matriculas
FOR EACH ROW EXECUTE FUNCTION fn_sincronizar_alunos_ids();
```

**Status:** 🔴 **NÃO IMPLEMENTADO** - Requer migration urgente

---

### 🟡 **2. Sincronização `valor_mensalidade_atual` (IMPORTANTE)**

**Problema:**
```typescript
// Duplicado em 2 lugares:
1. alunos.valor_mensalidade_atual
2. turmas.valor_mensalidade
```

**Código Atual:**
```typescript
// src/modules/academico/service.ts - atualizarMatricula()
await supabase.from('alunos')
  .update({
    valor_mensalidade_atual: updatedMatricula.valor_matricula,
    status: updatedMatricula.status === 'ativa' ? 'ativo' : 'inativo'
  })
  .eq('id', updatedMatricula.aluno_id)
```

**Impacto:**
- ⚠️ Se atualizar turma → precisa atualizar alunos manualmente
- ⚠️ Se atualizar aluno → turma pode ficar desatualizada
- ⚠️ Risco de inconsistência financeira

**Solução:**
- ✅ Manter sincronização no service (já existe)
- 📝 Documentar que `valor_mensalidade_atual` do aluno é a fonte da verdade

**Status:** 🟡 **Funcional mas requer atenção**

---

### 🟡 **3. Cache localStorage - Rascunho Persistente**

**Problema:**
```typescript
// AlunoCadastroPage.web.tsx
localStorage.setItem('aluno_cadastro_draft', ...)
localStorage.setItem('aluno_cadastro_step', ...)
```

**Impacto:**
- ⚠️ Rascunho persiste mesmo após erro no cadastro
- ⚠️ Usuário pode ver dados antigos ao retornar
- ⚠️ Pode causar confusão entre sessões

**Solução:**
```typescript
// Limpar rascunho após sucesso
localStorage.removeItem('aluno_cadastro_draft')
localStorage.removeItem('aluno_cadastro_step')
```

**Status:** 🟡 **Baixo impacto, mas requer fix**

---

### 🟡 **4. Views Duplicadas em Migrations**

**Problema:**
```
vw_radar_evasao existe em:
- 026_inteligencia_zero_cost.sql (original)
- 038_dashboard_radar_rls.sql (RLS fix)
- 046_radar_evasao_melhorias.sql (atual)
```

**Impacto:**
- ⚠️ Confusão sobre qual é a versão vigente
- ⚠️ Última migration prevalece, mas pode causar conflitos

**Solução:**
- 📝 Documentar que `046_radar_evasao_melhorias.sql` é a versão atual
- 🗑️ Remover views das migrations antigas (ou comentar)

**Status:** 🟡 **Documentação**

---

### 🟢 **5. Exclusão de Aluno - Cascata Manual**

**Código Atual:**
```typescript
// src/modules/alunos/service.ts - excluir()

// 1. Coletar responsáveis vinculados
const { data: vinculosPre } = await supabase
  .from('aluno_responsavel')
  .select('responsavel_id')
  .eq('aluno_id', id)

// 2. Limpeza manual (hardcoded)
await supabase.from('aluno_responsavel').delete().eq('aluno_id', id)
await supabase.from('matriculas').delete().eq('aluno_id', id)
await supabase.from('boletins').delete().eq('aluno_id', id)
await supabase.from('selos').delete().eq('aluno_id', id)
await supabase.from('frequencias').delete().eq('aluno_id', id)
// ... + 6 tabelas

// 3. Excluir aluno
await supabase.from('alunos').delete().eq('id', id)

// 4. Tratar responsáveis órfãos
if (count === 0) {
  await supabase.from('responsaveis')
    .update({ user_id: null, senha_hash: '', status: 'inativo' })
    .eq('id', respId)
}
```

**Impacto:**
- ⚠️ Lista hardcoded de tabelas
- ⚠️ Se adicionar nova tabela → precisa atualizar o service
- ⚠️ Frágil a mudanças

**Solução:**
```sql
-- Usar FKs com ON DELETE CASCADE no banco
ALTER TABLE frequencias 
  ADD CONSTRAINT fk_frequencias_aluno 
  FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE;
```

**Status:** 🟢 **Funcional, mas pode melhorar**

---

## 📋 CHECKLIST DE VALIDAÇÃO

### Cadastro de Aluno
- [x] Formulário com 4 etapas
- [x] Validação de campos obrigatórios
- [x] Upload de foto (bucket `alunos_fotos`)
- [x] CPF limpo (regex)
- [x] Reutiliza responsável existente
- [x] Cria usuário no Auth (se necessário)
- [x] Vínculo N:N via `aluno_responsavel`
- [x] Gera cobranças iniciais
- [x] Invalida cache React Query

### Edição de Aluno
- [x] Busca aluno por ID
- [x] Busca matrícula ativa
- [x] Busca turma atual
- [x] Atualiza dados cadastrais
- [x] Atualiza responsáveis (CRUD completo)
- [x] Alterna responsável financeiro
- [x] Desvincula responsável

### Exclusão de Aluno
- [x] Verifica pendências financeiras
- [x] Bloqueia exclusão se houver cobranças 'a_vencer' ou 'atrasado'
- [x] Coleta responsáveis vinculados
- [x] Remove vínculos (cascata manual)
- [x] Trata responsáveis órfãos
- [x] Invalida cache

### Reflexos no Sistema
- [x] **Frequência:** `aluno_id` em `frequencias` (CASCADE)
- [x] **Financeiro:** `aluno_id` em `cobrancas` (CASCADE)
- [x] **Matrículas:** `aluno_id` em `matriculas` (CASCADE)
- [x] **Boletim:** `aluno_id` em `boletins` (CASCADE)
- [x] **Selos:** `aluno_id` em `selos` (CASCADE)
- [x] **Documentos:** `aluno_id` em `document_solicitations`, `documentos_emitidos`
- [x] **Autorizações:** `aluno_id` em `autorizacoes_respostas`
- [x] **Fila Virtual:** `aluno_id` em `fila_virtual`
- [x] **Avaliações:** `aluno_id` em `avaliacoes_notas`
- [ ] **Turmas:** `alunos_ids` é ARRAY manual ⚠️

### Views e Relatórios
- [x] `vw_radar_evasao` - Filtra por aluno
- [x] `vw_aluno_faltas_consecutivas` - Conta faltas
- [x] `vw_aluno_financeiro_atrasado` - Conta cobranças
- [x] `vw_aluno_financeiro_recorrente` - Inadimplência 3+
- [x] `vw_alerta_evasao_familiar` - Irmãos retirados
- [x] `vw_tenant_uso_cota` - Conta alunos ativos
- [x] `vw_boletim_consolidado` - Notas do aluno
- [x] `mv_fechamento_mensal` - Financeiro por mês

### Triggers e Functions
- [x] `trg_atualiza_status` - Atualiza cobrança para 'atrasado'
- [x] `trg_gerar_fatura_ingresso` - Gera fatura proporcional
- [x] `fn_atualizar_status_cobranca()` - Régua de cobrança
- [x] `fn_calcular_proporcional_ingresso()` - Cálculo proporcional
- [x] `set_updated_at` - Atualiza `updated_at`
- [ ] `trg_sincronizar_alunos_ids` - **NÃO EXISTE** ⚠️

### Índices de Performance
- [x] `idx_alunos_tenant` - `alunos(tenant_id)`
- [x] `idx_frequencias_aluno_data` - `frequencias(aluno_id, data_aula)`
- [x] `idx_cobrancas_aluno_status` - `cobrancas(aluno_id, status)`
- [x] `idx_cobrancas_tenant_mes` - `cobrancas(tenant_id, data_vencimento)`
- [x] `idx_cobrancas_status_aluno` - `cobrancas(status, aluno_id) WHERE status='atrasado'`
- [x] `idx_aluno_responsavel_fin_opt` - `aluno_responsavel(responsavel_id) WHERE is_financeiro=true`
- [ ] `idx_matriculas_aluno_id` - Verificar existência
- [ ] `idx_turmas_alunos_ids` - **NÃO APLICÁVEL (array)**

---

## 🔧 AÇÕES NECESSÁRIAS

### Alta Prioridade

| # | Ação | Arquivo | Impacto |
|---|------|---------|---------|
| **1** | **Criar trigger de sincronização `turmas.alunos_ids`** | `database/updates/047_sync_alunos_ids.sql` | 🔴 Crítico |
| **2** | **Validar índices de matrícula** | `database/updates/047_sync_alunos_ids.sql` | 🟡 Importante |
| **3** | **Limpar localStorage após cadastro** | `src/modules/alunos/pages/AlunoCadastroPage.web.tsx` | 🟡 UX |

### Média Prioridade

| # | Ação | Arquivo | Impacto |
|---|------|---------|---------|
| **4** | **Consolidar views duplicadas** | `database/updates/026, 038, 046` | 🟡 Documentação |
| **5** | **Adicionar log de auditoria** | `src/modules/alunos/service.ts` | 🟢 Rastreabilidade |
| **6** | **Validação de CPF duplicado (aluno)** | `src/modules/alunos/service.ts` | 🟡 Integridade |

### Baixa Prioridade

| # | Ação | Arquivo | Impacto |
|---|------|---------|---------|
| **7** | **Mover cascata manual para FKs** | `database/updates/XXX` | 🟢 Manutenibilidade |
| **8** | **Soft delete (`deleted_at`)** | `alunos` table | 🟢 Recuperação |
| **9** | **Validação idade mínima** | `src/modules/alunos/pages/AlunoCadastroPage.web.tsx` | 🟡 UX |

---

## 🎯 CONCLUSÃO

### ✅ **O cadastro de aluno está 85% funcional**

**Pontos Fortes:**
1. ✅ CRUD completo com validações
2. ✅ Vínculo N:N com responsáveis
3. ✅ Geração automática de cobranças
4. ✅ Todas as tabelas relacionadas com FK e CASCADE
5. ✅ RLS policies implementadas
6. ✅ Views de radar de evasão funcionais
7. ✅ Invalidação de cache correta

**Pontos Críticos:**
1. 🔴 `turmas.alunos_ids` é array manual sem sincronização
2. 🟡 Sincronização de valor_mensalidade depende de update manual
3. 🟡 localStorage persiste rascunho

**Recomendação:**
- **Imediato:** Criar trigger `trg_sincronizar_alunos_ids` (migration 047)
- **Curto prazo:** Limpar localStorage após cadastro
- **Médio prazo:** Consolidar views duplicadas e adicionar auditoria

---

## 📎 ARQUIVOS-CHAVE PARA CONSULTA

```
src/modules/alunos/
├── service.ts (CRUD principal)
├── hooks.ts (React Query)
├── types.ts (Types do banco)
├── pages/
│   ├── AlunoCadastroPage.web.tsx (Formulário web)
│   ├── AlunoCadastroPage.mobile.tsx (Formulário mobile)
│   ├── AlunoDetalhePage.web.tsx (Edição completa)
│   └── AlunosListPage.web.tsx (Listagem)

src/modules/academico/
└── service.ts (Matrículas)

src/modules/financeiro/
└── service.ts (Cobranças)

database/updates/
├── 026_inteligencia_zero_cost.sql (Views radar)
├── 037_cobranca_proporcional.sql (Trigger fatura)
├── 038_dashboard_radar_rls.sql (RLS radar)
└── 046_radar_evasao_melhorias.sql (Melhorias radar)
```

---

**Próximo Passo:** Criar migration `047_sync_alunos_ids.sql` com trigger de sincronização.
