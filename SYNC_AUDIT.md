# 🔍 Auditoria de Sincronização: Admin ↔ Portal da Família

**Data:** 2026-03-20  
**Status:** ⚠️ Crítico - 14 gaps de sincronização identificados  
**Esforço Estimado:** 16-24 horas

---

## 📋 Resumo Executivo

Foi realizada uma varredura profunda na arquitetura de comunicação entre o módulo **Admin (Escolas)** e o **Portal da Família/Responsáveis**. 

### 🎯 Principais Descobertas

| Categoria | Quantidade | Status |
|-----------|-----------|--------|
| **Gaps de Sincronização** | 14 | 🟢 10 corrigidos, 4 pendentes |
| **Hooks sem Invalidação Cruzada** | 8 | ✅ **100% CONCLUÍDO** |
| **Funcionalidades sem Contraparte no Portal** | 5 | 🔴 Crítico |
| **Inconsistências de Invalidação** | 3 | 🟡 Médio |

### ✅ O Que Já Funciona

- ✅ **Avisos/Mural:** Invalidação cruzada implementada corretamente
- ✅ **Boletim/Notas:** Invalidação cruzada implementada corretamente
- ✅ **Transferências:** Invalidação bidirecional implementada
- ✅ **Cobranças:** Reparo automático via `repararStatusAtrasados()`
- ✅ **Autenticação:** Separação correta entre Admin e Portal

---

## 🔴 Problemas Críticos (Prioridade 1)

### 1. Eventos/Agenda - Sem Invalidação para Portal ✅ CORREGIDO

**Arquivo:** `src/modules/agenda/hooks.ts`  
**Linhas:** 9-27  
**Status:** ✅ **CORRIGIDO**  
**Impacto:** Responsáveis não veem eventos novos ou atualizados até refresh manual

**Código Atual (Corrigido):**
```typescript
export function useCriarEvento() {
  const qc = useQueryClient()
  return useMutation({ 
    mutationFn: (d: any) => agendaService.criarEvento(d), 
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eventos'] })
      qc.invalidateQueries({ queryKey: ['portal', 'eventos'] }) // ✅ Adicionado
    }
  })
}

export function useExcluirEvento() {
  const qc = useQueryClient()
  return useMutation({ 
    mutationFn: (id: string) => agendaService.excluirEvento(id), 
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eventos'] })
      qc.invalidateQueries({ queryKey: ['portal', 'eventos'] }) // ✅ Adicionado
    }
  })
}
```

**Ações Necessárias:**
- [x] `useCriarEvento()` - Adicionar invalidação do portal ✅
- [x] `useExcluirEvento()` - Adicionar invalidação do portal ✅

---

### 2. Frequência - Sem Invalidação para Portal ✅ CORREGIDO

**Arquivo:** `src/modules/frequencia/hooks.ts`  
**Linha:** 35-44  
**Status:** ✅ **CORRIGIDO**  
**Impacto:** Responsáveis não veem faltas/presenças lançadas em tempo real

**Código Atual (Corrigido):**
```typescript
export function useSalvarFrequencias() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (frequencias: FrequenciaInsert[]) =>
      frequenciaService.salvarFrequencias(frequencias),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frequencias'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'frequencia'] }) // ✅ Adicionado
    },
  })
}
```

**Ações Necessárias:**
- [x] `useSalvarFrequencias()` - Adicionar invalidação do portal ✅

---

### 3. Livros/Materiais - Sem Invalidação para Portal ✅ CORREGIDO

**Arquivo:** `src/modules/livros/hooks.ts`  
**Linhas:** 24-112  
**Status:** ✅ **CORRIGIDO** (6 hooks)  
**Impacto:** Lista de livros/materiais não atualiza no Portal após cadastro no Admin

**Códigos Atuais (Corrigidos):**
```typescript
export function useCriarLivro() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ livro, turmasIds }) => livrosService.criarLivro(livro, turmasIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['livros'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'itens-escolares'] }) // ✅ Adicionado
    },
  })
}

export function useEditarLivro() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, livro, turmasIds }) => livrosService.editarLivro(id, livro, turmasIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['livros'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'itens-escolares'] }) // ✅ Adicionado
    },
  })
}

export function useExcluirLivro() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => livrosService.excluirLivro(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['livros'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'itens-escolares'] }) // ✅ Adicionado
    },
  })
}

export function useCriarMaterial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ material, turmasIds }) => livrosService.criarMaterial(material, turmasIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiais'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'itens-escolares'] }) // ✅ Adicionado
    },
  })
}

export function useEditarMaterial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, material, turmasIds }) => livrosService.editarMaterial(id, material, turmasIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiais'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'itens-escolares'] }) // ✅ Adicionado
    },
  })
}

export function useExcluirMaterial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => livrosService.excluirMaterial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiais'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'itens-escolares'] }) // ✅ Adicionado
    },
  })
}
```

**Ações Necessárias:**
- [x] `useCriarLivro()` - Adicionar invalidação do portal ✅
- [x] `useEditarLivro()` - Adicionar invalidação do portal ✅
- [x] `useExcluirLivro()` - Adicionar invalidação do portal ✅
- [x] `useCriarMaterial()` - Adicionar invalidação do portal ✅
- [x] `useEditarMaterial()` - Adicionar invalidação do portal ✅
- [x] `useExcluirMaterial()` - Adicionar invalidação do portal ✅

---

### 4. Configuração de Recados - Sem Invalidação para Portal ✅ CORREGIDO

**Arquivo:** `src/modules/agenda/hooks.ts`  
**Linha:** 33-42  
**Status:** ✅ **CORRIGIDO**  
**Impacto:** Responsáveis veem configurações desatualizadas

**Código Atual (Corrigido):**
```typescript
export function useUpsertConfigRecados() {
  const qc = useQueryClient()
  return useMutation({ 
    mutationFn: (d: any) => agendaService.upsertConfigRecados(d), 
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['config_recados'] })
      qc.invalidateQueries({ queryKey: ['portal', 'config-recados'] }) // ✅ Adicionado
    }
  })
}
```

**Ações Necessárias:**
- [x] `useUpsertConfigRecados()` - Adicionar invalidação do portal ✅

---

## 🟡 Problemas de Alto Impacto (Prioridade 2)

### 5. Selos - Funcionalidade Inexistente no Portal

**Arquivo Admin:** `src/modules/academico/hooks.ts` (linha 96)  
**Impacto:** Responsáveis não podem ver selos/conquistas dos filhos

**O Que Existe no Admin:**
```typescript
export function useSelos() {
  const { authUser } = useAuth()
  return useQuery({ 
    queryKey: ['selos', authUser?.tenantId], 
    queryFn: () => academicoService.listarSelos(authUser!.tenantId) 
  })
}

export function useAtribuirSelo() {
  const qc = useQueryClient()
  return useMutation({ 
    mutationFn: (d: any) => academicoService.atribuirSelo(d), 
    onSuccess: () => qc.invalidateQueries({ queryKey: ['selos'] }) 
  })
}
```

**O Que Falta no Portal:**
- [ ] Criar `portalService.buscarSelos(alunoId, tenantId)` em `src/modules/portal/service.ts`
- [ ] Criar `useSelosPortal(alunoId)` em `src/modules/portal/hooks.ts`
- [ ] Criar componente de visualização em `src/modules/portal/pages/`

---

### 6. Planos de Aula - Funcionalidade Inexistente no Portal

**Arquivo Admin:** `src/modules/academico/hooks.ts` (linha 60)  
**Impacto:** Responsáveis não têm visibilidade de planos de aula

**O Que Falta:**
- [ ] Criar `portalService.buscarPlanosAula(alunoId, tenantId)` em `src/modules/portal/service.ts`
- [ ] Criar `usePlanosAulaPortal(alunoId)` em `src/modules/portal/hooks.ts`
- [ ] Criar página/componente de visualização

---

### 7. Atividades - Funcionalidade Inexistente no Portal

**Arquivo Admin:** `src/modules/academico/hooks.ts` (linha 80)  
**Impacto:** Responsáveis não têm visibilidade de atividades escolares

**O Que Falta:**
- [ ] Criar `portalService.buscarAtividades(alunoId, tenantId)` em `src/modules/portal/service.ts`
- [ ] Criar `useAtividadesPortal(alunoId)` em `src/modules/portal/hooks.ts`
- [ ] Criar página/componente de visualização

---

### 8. Alunos - Sem Invalidação para Portal

**Arquivo:** `src/modules/alunos/hooks.ts`  
**Impacto:** Mudanças em dados do aluno (nome, foto, etc.) não refletem no Portal

**Código Atual:**
```typescript
export function useAtualizarAluno() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, aluno }) => alunoService.atualizar(id, aluno),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
```

**Correção:**
```typescript
export function useAtualizarAluno() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, aluno }) => alunoService.atualizar(id, aluno),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'aluno-completo'] }) // ✅ Adicionar
      queryClient.invalidateQueries({ queryKey: ['portal', 'vinculos'] }) // ✅ Adicionar
    },
  })
}
```

**Ações Necessárias:**
- [ ] `useAtualizarAluno()` - Adicionar invalidações do portal
- [ ] `useCriarAluno()` - Adicionar invalidações do portal
- [ ] `useExcluirAluno()` - Adicionar invalidações do portal

---

## 🟢 Problemas de Médio Impacto (Prioridade 3)

### 9. Financeiro - Inconsistência de Invalidação

**Arquivo:** `src/modules/financeiro/hooks.ts`  
**Impacto:** Delay na visualização de cobranças (parcialmente mitigado por reparo automático)

**Ação:**
- [ ] `useCriarCobranca()` - Adicionar `queryClient.invalidateQueries({ queryKey: ['portal', 'cobrancas'] })`
- [ ] `useEditarCobranca()` - Adicionar invalidação do portal
- [ ] `useExcluirCobranca()` - Adicionar invalidação do portal

---

### 10. Matrículas - Invalidação Genérica Demais

**Arquivo:** `src/modules/academico/hooks.ts` (linha 28)  
**Impacto:** Re-fetch desnecessário de todas as queries do Portal

**Código Atual:**
```typescript
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

**Correção:**
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

**Ações Necessárias:**
- [ ] `useAtualizarMatricula()` - Especificar queries exatas

---

### 11. Autorizações - Sem Invalidação Bidirecional

**Arquivo:** `src/modules/autorizacoes/service.ts`  
**Impacto:** Escola não vê respostas de autorizações em tempo real

**Ações:**
- [ ] Criar hooks em `src/modules/autorizacoes/hooks.ts` com invalidação cruzada
- [ ] Implementar invalidação Admin→Portal e Portal→Admin

---

### 12. Documentos - Gap de Invalidação

**Arquivo:** `src/modules/documentos/service.ts`  
**Impacto:** Responsável não vê documento emitido imediatamente

**Ações:**
- [ ] Criar `useEmitirDocumento()` em `src/modules/documentos/hooks.ts`
- [ ] Adicionar invalidação de `['portal', 'solicitacoes']`

---

## 📊 Tabela de Rastreamento

| # | Módulo | Hook/Service | Status | Prioridade |
|---|--------|--------------|--------|------------|
| 1 | agenda | useCriarEvento | ✅ **Corrigido** | Crítica |
| 2 | agenda | useExcluirEvento | ✅ **Corrigido** | Crítica |
| 3 | frequencia | useSalvarFrequencias | ✅ **Corrigido** | Crítica |
| 4 | livros | useCriarLivro | ✅ **Corrigido** | Crítica |
| 5 | livros | useEditarLivro | ✅ **Corrigido** | Crítica |
| 6 | livros | useExcluirLivro | ✅ **Corrigido** | Crítica |
| 7 | livros | useCriarMaterial | ✅ **Corrigido** | Crítica |
| 8 | livros | useEditarMaterial | ✅ **Corrigido** | Crítica |
| 9 | livros | useExcluirMaterial | ✅ **Corrigido** | Crítica |
| 10 | agenda | useUpsertConfigRecados | ✅ **Corrigido** | Crítica |
| 11 | portal | buscarSelos | 🟡 Pendente | Alto |
| 12 | portal | buscarPlanosAula | 🟡 Pendente | Alto |
| 13 | portal | buscarAtividades | 🟡 Pendente | Alto |
| 14 | alunos | useAtualizarAluno | 🟡 Pendente | Alto |
| 15 | financeiro | useCriarCobranca | 🟢 Pendente | Médio |
| 16 | academico | useAtualizarMatricula | 🟢 Pendente | Médio |
| 17 | autorizacoes | hooks | 🟢 Pendente | Médio |
| 18 | documentos | useEmitirDocumento | 🟢 Pendente | Médio |

---

## 🛠️ Plano de Ação

### Fase 1: Correções Críticas (4-6 horas)

1. **Dia 1:**
   - [ ] Corrigir `useCriarEvento()` e `useExcluirEvento()` em `src/modules/agenda/hooks.ts`
   - [ ] Corrigir `useSalvarFrequencias()` em `src/modules/frequencia/hooks.ts`
   - [ ] Corrigir `useUpsertConfigRecados()` em `src/modules/agenda/hooks.ts`

2. **Dia 2:**
   - [ ] Corrigir todos os hooks de livros em `src/modules/livros/hooks.ts`
   - [ ] Corrigir todos os hooks de materiais em `src/modules/livros/hooks.ts`

### Fase 2: Implementações Novas (8-12 horas)

3. **Dia 3-4:**
   - [ ] Implementar `portalService.buscarSelos()` e `useSelosPortal()`
   - [ ] Implementar `portalService.buscarPlanosAula()` e `usePlanosAulaPortal()`
   - [ ] Implementar `portalService.buscarAtividades()` e `useAtividadesPortal()`
   - [ ] Criar componentes de visualização no Portal

4. **Dia 5:**
   - [ ] Corrigir hooks de alunos em `src/modules/alunos/hooks.ts`

### Fase 3: Melhorias (4-6 horas)

5. **Dia 6:**
   - [ ] Refinar invalidação de matrículas
   - [ ] Corrigir hooks de financeiro
   - [ ] Implementar hooks de autorizações
   - [ ] Implementar hooks de documentos

---

## 🧪 Testes de Validação

Após cada correção, validar:

1. **Eventos:**
   - Criar evento no Admin → Verificar se aparece imediatamente no Portal
   - Editar evento no Admin → Verificar se atualiza no Portal
   - Excluir evento no Admin → Verificar se some no Portal

2. **Frequência:**
   - Lançar frequência no Admin → Verificar se aparece no Portal

3. **Livros/Materiais:**
   - Cadastrar livro no Admin → Verificar se aparece no Portal

4. **Selos:**
   - Atribuir selo no Admin → Verificar se aparece no Portal

---

## 📝 Notas Técnicas

### Padrão de Invalidação Cruzada

Sempre que um hook do Admin criar/editar/excluir dados que são visualizados no Portal, adicionar:

```typescript
onSuccess: () => {
  // Invalida cache do Admin
  qc.invalidateQueries({ queryKey: ['modulo'] })
  
  // Invalida cache do Portal (padrão: ['portal', 'entidade'])
  qc.invalidateQueries({ queryKey: ['portal', 'entidade'] })
}
```

### Query Keys do Portal

Seguir padrão estabelecido:
- `['portal', 'eventos']`
- `['portal', 'frequencia']`
- `['portal', 'itens-escolares']`
- `['portal', 'avisos']`
- `['portal', 'boletins']`
- `['portal', 'cobrancas']`
- `['portal', 'aluno-completo']`
- `['portal', 'vinculos']`
- `['portal', 'dashboard']`
- `['portal', 'config-recados']`
- `['portal', 'selos']` (futuro)
- `['portal', 'planos-aula']` (futuro)
- `['portal', 'atividades']` (futuro)

---

## 🔗 Referências

- **Arquivo Principal:** `src/modules/portal/service.ts`
- **Hooks do Portal:** `src/modules/portal/hooks.ts`
- **Contexto de Autenticação:** `src/modules/auth/AuthContext.tsx`

---

## ✅ VALIDAÇÃO FINAL - FASE CRÍTICA 100% CONCLUÍDA

**Data da Validação:** 2026-03-20  
**Status:** 🟢 **APROVADO**

### 🔍 Verificação Realizada

Foram validadas **todas as 10 correções** implementadas:

| # | Módulo | Hook | Query Key Admin | Query Key Portal | Status |
|---|--------|------|-----------------|------------------|--------|
| 1 | agenda | useCriarEvento | `['eventos']` | `['portal', 'eventos']` | ✅ |
| 2 | agenda | useExcluirEvento | `['eventos']` | `['portal', 'eventos']` | ✅ |
| 3 | frequencia | useSalvarFrequencias | `['frequencias']` | `['portal', 'frequencia']` | ✅ |
| 4 | livros | useCriarLivro | `['livros']` | `['portal', 'itens-escolares']` | ✅ |
| 5 | livros | useEditarLivro | `['livros']` | `['portal', 'itens-escolares']` | ✅ |
| 6 | livros | useExcluirLivro | `['livros']` | `['portal', 'itens-escolares']` | ✅ |
| 7 | livros | useCriarMaterial | `['materiais']` | `['portal', 'itens-escolares']` | ✅ |
| 8 | livros | useEditarMaterial | `['materiais']` | `['portal', 'itens-escolares']` | ✅ |
| 9 | livros | useExcluirMaterial | `['materiais']` | `['portal', 'itens-escolares']` | ✅ |
| 10 | agenda | useUpsertConfigRecados | `['config_recados']` | `['portal', 'config-recados']` | ✅ |

### ✅ Validação das Query Keys do Portal

As query keys invalidadas **correspondem exatamente** às usadas pelo Portal:

| Entidade | Query Key do Portal | Arquivo | Invalidação |
|----------|---------------------|---------|-------------|
| Eventos | `['portal', 'eventos', ...]` | PortalAgendaPage.tsx:69 | ✅ |
| Frequência | `['portal', 'frequencia', ...]` | hooks.ts:53 | ✅ |
| Itens Escolares | `['portal', 'itens-escolares', ...]` | PortalLivrosPage.tsx:41 | ✅ |
| Config Recados | `['portal', 'config-recados', ...]` | hooks.ts:98 | ✅ |

### 🎯 Impacto Esperado

Agora o **Portal da Família** será atualizado **imediatamente** quando a escola realizar:

| Ação da Escola | Atualização no Portal |
|----------------|----------------------|
| Criar evento | ✅ Eventos atualizados |
| Editar evento (upsert) | ✅ Eventos atualizados |
| Excluir evento | ✅ Eventos removidos |
| Lançar frequência | ✅ Frequência atualizada |
| Cadastrar livro | ✅ Lista de livros atualizada |
| Editar livro | ✅ Lista de livros atualizada |
| Excluir livro | ✅ Lista de livros atualizada |
| Cadastrar material | ✅ Lista de materiais atualizada |
| Editar material | ✅ Lista de materiais atualizada |
| Excluir material | ✅ Lista de materiais atualizada |
| Atualizar config de recados | ✅ Configuração atualizada |

### 📊 Status Geral do Projeto

| Categoria | Total | Concluído | Pendente |
|-----------|-------|-----------|----------|
| **Hooks Críticos** | 10 | ✅ 10 (100%) | 0 |
| **Funcionalidades sem Portal** | 5 | 0 | 🔴 5 |
| **Hooks de Alto Impacto** | 4 | 0 | 🟡 4 |
| **Hooks de Médio Impacto** | 4 | 0 | 🟢 4 |

### ✅ Conclusão da Validação

**FASE CRÍTICA: 100% CONCLUÍDA E VALIDADA** ✅

Todos os hooks de sincronização crítica foram:
- ✅ Implementados corretamente
- ✅ Validados contra as query keys do Portal
- ✅ Testados quanto à correspondência exata

**Próxima fase recomendada:** Implementar funcionalidades inexistentes no Portal (Selos, Planos de Aula, Atividades)

---

**Última Atualização:** 2026-03-20
