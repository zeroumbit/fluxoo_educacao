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
| **Gaps de Sincronização** | 14 | 🔴 Crítico |
| **Hooks sem Invalidação Cruzada** | 8 | 🔴 Crítico |
| **Funcionalidades sem Contraparte no Portal** | 5 | 🟡 Alto |
| **Inconsistências de Invalidação** | 3 | 🟡 Médio |

### ✅ O Que Já Funciona

- ✅ **Avisos/Mural:** Invalidação cruzada implementada corretamente
- ✅ **Boletim/Notas:** Invalidação cruzada implementada corretamente
- ✅ **Transferências:** Invalidação bidirecional implementada
- ✅ **Cobranças:** Reparo automático via `repararStatusAtrasados()`
- ✅ **Autenticação:** Separação correta entre Admin e Portal

---

## 🔴 Problemas Críticos (Prioridade 1)

### 1. Eventos/Agenda - Sem Invalidação para Portal

**Arquivo:** `src/modules/agenda/hooks.ts`  
**Linhas:** 11, 15  
**Impacto:** Responsáveis não veem eventos novos ou atualizados até refresh manual

**Código Atual:**
```typescript
export function useCriarEvento() {
  const qc = useQueryClient()
  return useMutation({ 
    mutationFn: (d: any) => agendaService.criarEvento(d), 
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eventos'] }) 
  })
}
```

**Correção:**
```typescript
export function useCriarEvento() {
  const qc = useQueryClient()
  return useMutation({ 
    mutationFn: (d: any) => agendaService.criarEvento(d), 
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eventos'] })
      qc.invalidateQueries({ queryKey: ['portal', 'eventos'] }) // ✅ Adicionar
    }
  })
}
```

**Ações Necessárias:**
- [ ] `useCriarEvento()` - Adicionar invalidação do portal
- [ ] `useExcluirEvento()` - Adicionar invalidação do portal
- [ ] `useEditarEvento()` (se existir) - Adicionar invalidação do portal

---

### 2. Frequência - Sem Invalidação para Portal

**Arquivo:** `src/modules/frequencia/hooks.ts`  
**Linha:** 40  
**Impacto:** Responsáveis não veem faltas/presenças lançadas em tempo real

**Código Atual:**
```typescript
export function useSalvarFrequencias() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (frequencias: FrequenciaInsert[]) =>
      frequenciaService.salvarFrequencias(frequencias),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frequencias'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
```

**Correção:**
```typescript
export function useSalvarFrequencias() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (frequencias: FrequenciaInsert[]) =>
      frequenciaService.salvarFrequencias(frequencias),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frequencias'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'frequencia'] }) // ✅ Adicionar
    },
  })
}
```

**Ações Necessárias:**
- [ ] `useSalvarFrequencias()` - Adicionar invalidação do portal

---

### 3. Livros/Materiais - Sem Invalidação para Portal

**Arquivo:** `src/modules/livros/hooks.ts`  
**Linhas:** 30, 46, 75, 91  
**Impacto:** Lista de livros/materiais não atualiza no Portal após cadastro no Admin

**Código Atual:**
```typescript
export function useCriarLivro() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ livro, turmasIds }) => livrosService.criarLivro(livro, turmasIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['livros'] })
    },
  })
}
```

**Correção:**
```typescript
export function useCriarLivro() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ livro, turmasIds }) => livrosService.criarLivro(livro, turmasIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['livros'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'itens-escolares'] }) // ✅ Adicionar
    },
  })
}
```

**Ações Necessárias:**
- [ ] `useCriarLivro()` - Adicionar invalidação do portal
- [ ] `useEditarLivro()` - Adicionar invalidação do portal
- [ ] `useExcluirLivro()` - Adicionar invalidação do portal
- [ ] `useCriarMaterial()` - Adicionar invalidação do portal
- [ ] `useEditarMaterial()` - Adicionar invalidação do portal
- [ ] `useExcluirMaterial()` - Adicionar invalidação do portal

---

### 4. Configuração de Recados - Sem Invalidação para Portal

**Arquivo:** `src/modules/agenda/hooks.ts`  
**Linha:** 23  
**Impacto:** Responsáveis veem configurações desatualizadas

**Código Atual:**
```typescript
export function useUpsertConfigRecados() {
  const qc = useQueryClient()
  return useMutation({ 
    mutationFn: (d: any) => agendaService.upsertConfigRecados(d), 
    onSuccess: () => qc.invalidateQueries({ queryKey: ['config_recados'] }) 
  })
}
```

**Correção:**
```typescript
export function useUpsertConfigRecados() {
  const qc = useQueryClient()
  return useMutation({ 
    mutationFn: (d: any) => agendaService.upsertConfigRecados(d), 
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['config_recados'] })
      qc.invalidateQueries({ queryKey: ['portal', 'config-recados'] }) // ✅ Adicionar
    }
  })
}
```

**Ações Necessárias:**
- [ ] `useUpsertConfigRecados()` - Adicionar invalidação do portal

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
| 1 | agenda | useCriarEvento | 🔴 Pendente | Crítica |
| 2 | agenda | useExcluirEvento | 🔴 Pendente | Crítica |
| 3 | frequencia | useSalvarFrequencias | 🔴 Pendente | Crítica |
| 4 | livros | useCriarLivro | 🔴 Pendente | Crítica |
| 5 | livros | useEditarLivro | 🔴 Pendente | Crítica |
| 6 | livros | useExcluirLivro | 🔴 Pendente | Crítica |
| 7 | livros | useCriarMaterial | 🔴 Pendente | Crítica |
| 8 | livros | useEditarMaterial | 🔴 Pendente | Crítica |
| 9 | livros | useExcluirMaterial | 🔴 Pendente | Crítica |
| 10 | agenda | useUpsertConfigRecados | 🔴 Pendente | Crítica |
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

**Última Atualização:** 2026-03-20
