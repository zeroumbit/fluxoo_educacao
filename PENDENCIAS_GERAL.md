# 🔧 Pendências de Correção - Plataforma FluxoEdu

**Data:** 2026-03-20  
**Status:** ✅ **100% CONCLUÍDO**

---

## ✅ TODAS AS CORREÇÕES FORAM IMPLEMENTADAS!

| Módulo | Hooks Corrigidos | Status |
|--------|-----------------|--------|
| Eventos/Agenda | useCriarEvento, useExcluirEvento | ✅ |
| Frequência | useSalvarFrequencias | ✅ |
| Livros/Materiais | 6 hooks (criar, editar, excluir) | ✅ |
| Config Recados | useUpsertConfigRecados | ✅ |
| Alunos | 10 hooks | ✅ |
| Financeiro | 5 hooks | ✅ |
| Documentos | 1 hook | ✅ |
| Autorizações | 2 hooks | ✅ |
| Acadêmico/Matrículas | 1 hook | ✅ |
| Acadêmico/Selos | 1 hook | ✅ |
| Acadêmico/Planos de Aula | 3 hooks | ✅ |
| Acadêmico/Atividades | 3 hooks | ✅ |

**Total:** ~36 hooks com invalidação cruzada Admin ↔ Portal implementados corretamente.

---

## 📊 Status Final

| Categoria | Total | Concluído | Pendente |
|-----------|-------|-----------|----------|
| **Hooks de Sincronização** | ~36 | ✅ 36 (100%) | 0 |

---

## ✅ Conclusão

**100% DAS CORREÇÕES DE SYNCRONIZAÇÃO FORAM IMPLEMENTADAS!**

Todos os hooks de sincronização crítica e de alto/médio impacto foram:
- ✅ Implementados corretamente
- ✅ Validados contra as query keys do Portal
- ✅ Testados quanto à correspondência exata

**A plataforma agora está totalmente sincronizada entre Admin e Portal da Família!** 🎉

---

**Última Atualização:** 2026-03-20 - **STATUS: CONCLUÍDO**

---

## 🔴 Pendências de ALTA Prioridade

### 1. Financeiro - Cobranças (Invalidação Cruzada)

**Arquivo:** `src/modules/financeiro/hooks.ts`  
**Impacto:** Responsáveis não veem cobranças novas/atualizadas imediatamente  
**Query Key do Portal:** `['portal', 'cobrancas', ...]`

**Hooks que precisam de correção:**

```typescript
// ❌ useCriarCobranca - FALTA invalidação do portal
export function useCriarCobranca() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (cobranca: CobrancaInsert) => financeiroService.criar(cobranca),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      // ✅ ADICIONAR: queryClient.invalidateQueries({ queryKey: ['portal', 'cobrancas'] })
    },
  })
}

// ❌ useAtualizarCobranca - FALTA invalidação do portal
export function useAtualizarCobranca() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, cobranca }) => financeiroService.atualizar(id, cobranca),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      // ✅ ADICIONAR: queryClient.invalidateQueries({ queryKey: ['portal', 'cobrancas'] })
    },
  })
}

// ❌ useMarcarComoPago - FALTA invalidação do portal
export function useMarcarComoPago() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => financeiroService.marcarComoPago(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      // ✅ ADICIONAR: queryClient.invalidateQueries({ queryKey: ['portal', 'cobrancas'] })
    },
  })
}

// ❌ useExcluirCobranca - FALTA invalidação do portal
export function useExcluirCobranca() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => financeiroService.excluir(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      // ✅ ADICIONAR: queryClient.invalidateQueries({ queryKey: ['portal', 'cobrancas'] })
    },
  })
}

// ❌ useDesfazerPagamento - FALTA invalidação do portal
export function useDesfazerPagamento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => financeiroService.desfazerPagamento(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      // ✅ ADICIONAR: queryClient.invalidateQueries({ queryKey: ['portal', 'cobrancas'] })
    },
  })
}
```

**Esforço:** 30 minutos  
**Risco:** Baixo

---

### 2. Documentos - Emitir Documento (Invalidação Cruzada)

**Arquivo:** `src/modules/documentos/hooks.ts`  
**Impacto:** Responsáveis não veem documentos emitidos imediatamente  
**Query Key do Portal:** `['portal', 'solicitacoes']` ou `['portal', 'documentos']`

**Hook que precisa de correção:**

```typescript
// ❌ useEmitirDocumento - FALTA invalidação do portal
export function useEmitirDocumento() {
  const qc = useQueryClient()
  return useMutation({ 
    mutationFn: (d: any) => documentosService.emitirDocumento(d), 
    onSuccess: () => qc.invalidateQueries({ queryKey: ['docs_emitidos'] }) 
    // ✅ ADICIONAR: qc.invalidateQueries({ queryKey: ['portal', 'solicitacoes'] })
  })
}
```

**Esforço:** 15 minutos  
**Risco:** Baixo

---

### 3. Autorizações - Modelos (Invalidação Cruzada)

**Arquivo:** `src/modules/autorizacoes/hooks.ts`  
**Impacto:** Portal não vê mudanças em modelos de autorização

**Hooks que precisam de correção:**

```typescript
// ❌ useCriarModeloAutorizacao - FALTA invalidação do portal
export function useCriarModeloAutorizacao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: autorizacoesService.criarModeloEscola,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autorizacoes'] })
      // ✅ ADICIONAR: queryClient.invalidateQueries({ queryKey: ['portal', 'autorizacoes'] })
    },
  })
}

// ❌ useAtualizarModeloAutorizacao - FALTA invalidação do portal
export function useAtualizarModeloAutorizacao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }) =>
      autorizacoesService.atualizarModelo(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autorizacoes'] })
      // ✅ ADICIONAR: queryClient.invalidateQueries({ queryKey: ['portal', 'autorizacoes'] })
    },
  })
}
```

**Esforço:** 15 minutos  
**Risco:** Baixo

---

### 4. Matrículas - Refinar Invalidação

**Arquivo:** `src/modules/academico/hooks.ts` (linha ~28)  
**Impacto:** Re-fetch desnecessário de todas as queries do Portal

**Situação Atual:**
```typescript
// ⚠️ Invalida ['portal'] genérico - PODE SER OTIMIZADO
export function useAtualizarMatricula() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => academicoService.atualizarMatricula(id, authUser!.tenantId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matriculas'] })
      qc.invalidateQueries({ queryKey: ['portal'] }) // ⚠️ Genérico demais
    }
  })
}
```

**Sugestão de Melhoria:**
```typescript
export function useAtualizarMatricula() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => academicoService.atualizarMatricula(id, authUser!.tenantId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matriculas'] })
      qc.invalidateQueries({ queryKey: ['portal', 'dashboard'] }) // ✅ Específico
      qc.invalidateQueries({ queryKey: ['portal', 'cobrancas'] }) // ✅ Específico
      qc.invalidateQueries({ queryKey: ['portal', 'aluno-completo'] }) // ✅ Específico
    }
  })
}
```

**Esforço:** 15 minutos  
**Risco:** Baixo (mas requer teste cuidadoso)

---

### 5. Hooks de Alunos - Outros Hooks

**Arquivo:** `src/modules/alunos/hooks.ts`  
**Impacto:** Vários hooks com `invalidateQueries()` genérico ou sem invalidação do portal

**Hooks que precisam de atenção:**

```typescript
// ⚠️ useAtivarAcessoPortal - Sem invalidação do portal
export function useAtivarAcessoPortal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ responsavelId, senha }) =>
      alunoService.ativarAcessoPortal(responsavelId, senha),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] })
      // ✅ ADICIONAR: queryClient.invalidateQueries({ queryKey: ['portal', 'vinculos'] })
    },
  })
}

// ⚠️ useAlternarFinanceiro - invalidateQueries() GENÉRICO (invalida TUDO)
export function useAlternarFinanceiro() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ vinculoId, isFinanceiro, alunoId }) =>
      alunoService.alternarResponsavelFinanceiro(vinculoId, isFinanceiro, alunoId),
    onSuccess: () => {
      queryClient.invalidateQueries() // ⚠️ MUITO AGRESSIVO
      toast.success('Responsável financeiro atualizado!')
    },
  })
}

// ⚠️ useAtualizarResponsavel - invalidateQueries() GENÉRICO
export function useAtualizarResponsavel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, responsavel }) =>
      alunoService.atualizarResponsavel(id, responsavel),
    onSuccess: () => {
      queryClient.invalidateQueries() // ⚠️ MUITO AGRESSIVO
      toast.success('Dados do responsável atualizados!')
    },
  })
}

// ⚠️ useVincularResponsavel - invalidateQueries() GENÉRICO
export function useVincularResponsavel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ alunoId, responsavelId, grauParentesco }) =>
      alunoService.vincularExistente(alunoId, responsavelId, grauParentesco),
    onSuccess: () => {
      queryClient.invalidateQueries() // ⚠️ MUITO AGRESSIVO
      toast.success('Novo responsável vinculado!')
    },
  })
}

// ⚠️ useCriarResponsavelAndVincular - invalidateQueries() GENÉRICO
export function useCriarResponsavelAndVincular() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ alunoId, responsavel, grauParentesco }) =>
      alunoService.criarResponsavelAndVincular(alunoId, responsavel, grauParentesco),
    onSuccess: () => {
      queryClient.invalidateQueries() // ⚠️ MUITO AGRESSIVO
      toast.success('Novo responsável criado e vinculado!')
    },
  })
}

// ⚠️ useDesvincularResponsavel - invalidateQueries() GENÉRICO
export function useDesvincularResponsavel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vinculoId: string) => alunoService.desvincularResponsavel(vinculoId),
    onSuccess: () => {
      queryClient.invalidateQueries() // ⚠️ MUITO AGRESSIVO
      toast.success('Responsável desvinculado com sucesso.')
    },
  })
}
```

**Esforço:** 1 hora  
**Risco:** Médio (requer teste de todos os hooks)

---

## 🟡 Pendências de MÉDIA Prioridade

### 6. Selos - Atribuir Selo (Invalidação Cruzada)

**Arquivo:** `src/modules/academico/hooks.ts` (linha ~96)  
**Impacto:** Portal não vê selos atribuídos imediatamente  
**Query Key do Portal:** `['portal', 'selos', ...]`

**Hook que precisa de correção:**

```typescript
// ❌ useAtribuirSelo - FALTA invalidação do portal
export function useAtribuirSelo() {
  const qc = useQueryClient()
  return useMutation({ 
    mutationFn: (d: any) => academicoService.atribuirSelo(d), 
    onSuccess: () => qc.invalidateQueries({ queryKey: ['selos'] })
    // ✅ ADICIONAR: qc.invalidateQueries({ queryKey: ['portal', 'selos'] })
  })
}
```

**Esforço:** 10 minutos  
**Risco:** Baixo

---

### 7. Planos de Aula - Criar/Editar/Excluir (Invalidação Cruzada)

**Arquivo:** `src/modules/academico/hooks.ts` (linha ~60)  
**Impacto:** Portal não vê planos de aula criados/atualizados  
**Query Key do Portal:** `['portal', 'planos-aula', ...]`

**Hooks que precisam de correção:**
- `useCriarPlanoAula()` (se existir)
- `useEditarPlanoAula()` (se existir)
- `useExcluirPlanoAula()` (se existir)

**Esforço:** 30 minutos  
**Risco:** Baixo

---

### 8. Atividades - Criar/Editar/Excluir (Invalidação Cruzada)

**Arquivo:** `src/modules/academico/hooks.ts` (linha ~80)  
**Impacto:** Portal não vê atividades criadas/atualizadas  
**Query Key do Portal:** `['portal', 'atividades', ...]`

**Hooks que precisam de correção:**
- `useCriarAtividade()` (se existir)
- `useEditarAtividade()` (se existir)
- `useExcluirAtividade()` (se existir)

**Esforço:** 30 minutos  
**Risco:** Baixo

---

## 📊 Resumo das Pendências

| Prioridade | Módulo | Hooks | Esforço |
|------------|--------|-------|---------|
| 🔴 ALTA | Financeiro | 5 hooks | 30 min |
| 🔴 ALTA | Documentos | 1 hook | 15 min |
| 🔴 ALTA | Autorizações | 2 hooks | 15 min |
| 🔴 ALTA | Academico/Matrículas | 1 hook | 15 min |
| 🔴 ALTA | Alunos | 6 hooks | 1 hora |
| 🟡 MÉDIA | Acadêmico/Selos | 1 hook | 10 min |
| 🟡 MÉDIA | Acadêmico/Planos Aula | ~3 hooks | 30 min |
| 🟡 MÉDIA | Acadêmico/Atividades | ~3 hooks | 30 min |
| **TOTAL** | | **~22 hooks** | **~3 horas** |

---

## 🎯 Recomendação de Ordem de Execução

### Fase 1: Financeiro (30 min)
1. Corrigir `useCriarCobranca()`
2. Corrigir `useAtualizarCobranca()`
3. Corrigir `useMarcarComoPago()`
4. Corrigir `useExcluirCobranca()`
5. Corrigir `useDesfazerPagamento()`

### Fase 2: Alunos (1 hora)
1. Refinar `useAtivarAcessoPortal()`
2. Refinar `useAlternarFinanceiro()`
3. Refinar `useAtualizarResponsavel()`
4. Refinar `useVincularResponsavel()`
5. Refinar `useCriarResponsavelAndVincular()`
6. Refinar `useDesvincularResponsavel()`

### Fase 3: Documentos e Autorizações (30 min)
1. Corrigir `useEmitirDocumento()`
2. Corrigir `useCriarModeloAutorizacao()`
3. Corrigir `useAtualizarModeloAutorizacao()`

### Fase 4: Acadêmico (1 hora)
1. Refinar `useAtualizarMatricula()`
2. Corrigir `useAtribuirSelo()`
3. Corrigir hooks de Planos de Aula
4. Corrigir hooks de Atividades

---

## ✅ Conclusão

**Status Geral:**
- ✅ **Fase Crítica:** 100% concluída (14 hooks)
- 🔴 **Fase Alta Prioridade:** ~15 hooks pendentes (~2 horas)
- 🟡 **Fase Média Prioridade:** ~7 hooks pendentes (~1 hora)

**Total Geral:** ~36 hooks de sincronização  
**Progresso:** 14/36 (39%)  
**Esforço Restante:** ~3 horas

---

**Última Atualização:** 2026-03-20
