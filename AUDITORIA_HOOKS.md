# 🔍 Auditoria de Hooks - Super Admin, Escolas e Portal

**Data:** 29 de março de 2026  
**Objetivo:** Identificar hooks faltantes ou duplicados entre módulos

---

## 📊 Visão Geral dos Hooks Existentes

### Super Admin (`src/modules/super-admin/hooks.ts`)

| Hook | Tipo | Descrição |
|------|------|-----------|
| `useSuperAdminDashboard` | Query | Stats do dashboard |
| `usePlanos` | Query | Lista planos |
| `useUpsertPlano` | Mutation | Criar/editar plano |
| `useDeletePlano` | Mutation | Excluir plano |
| `useModulos` | Query | Lista módulos |
| `useUpsertModulo` | Mutation | Criar/editar módulo |
| `useDeleteModulo` | Mutation | Excluir módulo |
| `usePlanoModulos` | Query | Módulos de um plano |
| `useSetPlanoModulos` | Mutation | Definir módulos do plano |
| `useEscolas` | Query | Lista escolas |
| `useUpdateEscolaStatus` | Mutation | Atualizar status |
| `useSuspenderEscola` | Mutation | Suspender escola |
| `useEscolaDetalhes` | Query | Detalhes da escola |
| `useAssinaturas` | Query | Lista assinaturas |
| `useCreateAssinatura` | Mutation | Criar assinatura |
| `useFaturas` | Query | Lista faturas |
| `useConfirmarFatura` | Mutation | Confirmar fatura |
| `useSolicitacoesUpgrade` | Query | Solicitações de upgrade |
| `useAprovarUpgrade` | Mutation | Aprovar upgrade |
| `useRecusarUpgrade` | Mutation | Recusar upgrade |
| `useConfiguracaoRecebimento` | Query | Config de recebimento |
| `useUpdateConfiguracaoRecebimento` | Mutation | Atualizar config |
| `useTenantHealthScores` | Query | Health scores |
| `useRadarEvasaoGeral` | Query | Radar de evasão |

**Total:** 24 hooks ✅ **Completo**

---

### Escolas (`src/modules/escolas/hooks.ts`)

| Hook | Tipo | Descrição |
|------|------|-----------|
| `useEscolas` | Query | Lista escolas |
| `useEscola` | Query | Buscar escola por ID |
| `usePlanos` | Query | Lista planos |
| `useConfigRecebimento` | Query | Config de recebimento |
| `useCriarEscola` | Mutation | Criar escola |
| `useCriarAssinatura` | Mutation | Criar assinatura |
| `useCriarFaturaInicial` | Mutation | Criar fatura inicial |
| `useAtualizarEscola` | Mutation | Atualizar escola |

**Total:** 8 hooks ⚠️ **Faltam alguns**

---

### Portal (`src/modules/portal/hooks.ts`)

| Hook | Tipo | Descrição |
|------|------|-----------|
| `useResponsavel` | Query | Dados do responsável |
| `useVinculosAtivos` | Query | Vínculos de alunos |
| `useDashboardAluno` | Query | Dashboard de um aluno |
| `useDashboardFamilia` | Query | Dashboard consolidado |
| `useAvisosPortal` | Query | Avisos/mural |
| `useCobrancasAluno` | Query | Cobranças de um aluno |
| `useConfigPix` | Query | Config PIX da escola |
| `useConfigRecados` | Query | Config de recados |
| `useSolicitacoesDocumento` | Query | Solicitações de documentos |
| `useTransferenciasPortal` | Query | Transferências de aluno |
| `useResponderTransferencia` | Mutation | Responder transferência |
| `useNotificacaoSonoraAvisos` | Efeito | Som de notificação |

**Total:** 12 hooks ✅ **Completo**

---

### Hooks Globais (`src/hooks/`)

| Hook | Descrição |
|------|-----------|
| `use-online-status.ts` | Status de conexão |
| `use-mobile.ts` | Detecção de mobile |
| `use-viacep.ts` | Busca CEP |
| `useLoginRateLimit.ts` | Rate limit de login |
| `useNotifications.ts` | Notificações (3 tipos) |
| `usePdf.ts` | Geração de PDF |
| `usePermissions.ts` | Permissões RBAC |

**Total:** 7 hooks ✅ **Completo**

---

## 🔍 Hooks Faltantes ou Duplicados

### 1. ⚠️ DUPLICAÇÃO: `useEscolas`

**Onde:**
- `src/modules/super-admin/hooks.ts` (linha 82)
- `src/modules/escolas/hooks.ts` (linha 5)

**Problema:**
```typescript
// Super Admin
export function useEscolas() {
  return useQuery({
    queryKey: ['admin', 'escolas'],
    queryFn: () => superAdminService.getEscolas(),
  })
}

// Escolas
export function useEscolas() {
  return useQuery({
    queryKey: ['escolas'],
    queryFn: () => escolaService.listar(),
  })
}
```

**Impacto:**
- Confusão na importação
- Dados podem ser diferentes
- Cache do React Query não é compartilhado

**Solução:**
```typescript
// Manter apenas no módulo de escolas
// Super Admin importa de lá ou usa hook específico

// No Super Admin:
export function useTodasEscolas() {
  return useQuery({
    queryKey: ['admin', 'todas-escolas'],
    queryFn: () => superAdminService.getTodasEscolas(),
  })
}
```

**Prioridade:** MÉDIA

---

### 2. ⚠️ DUPLICAÇÃO: `usePlanos`

**Onde:**
- `src/modules/super-admin/hooks.ts` (linha 14)
- `src/modules/escolas/hooks.ts` (linha 19)

**Problema:**
```typescript
// Super Admin - Retorna TODOS os planos
export function usePlanos() {
  return useQuery({
    queryKey: ['admin', 'planos'],
    queryFn: () => superAdminService.getPlanos(),
  })
}

// Escolas - Retorna planos disponíveis
export function usePlanos() {
  return useQuery({
    queryKey: ['planos'],
    queryFn: () => escolaService.listarPlanos(),
  })
}
```

**Solução:**
Renomear para evitar conflito:
```typescript
// Super Admin
export function useAdminPlanos()

// Escolas
export function usePlanosDisponiveis()
```

**Prioridade:** MÉDIA

---

### 3. ⚠️ DUPLICAÇÃO: `useConfigRecebimento` / `useConfiguracaoRecebimento`

**Onde:**
- `src/modules/super-admin/hooks.ts` (linha 186) - `useConfiguracaoRecebimento`
- `src/modules/escolas/hooks.ts` (linha 27) - `useConfigRecebimento`
- `src/modules/portal/hooks.ts` (linha 153) - `useConfigPix`

**Problema:**
- 3 nomes diferentes para mesma funcionalidade
- Confusão na importação

**Solução:**
Padronizar nomes:
```typescript
// Super Admin (visão global)
export function useConfiguracaoRecebimentoGlobal()

// Escolas (visão da escola)
export function useConfiguracaoRecebimento()

// Portal (apenas PIX)
export function useConfigPix() // Manter
```

**Prioridade:** BAIXA

---

### 4. ❌ FALTANTE: Hook para Buscar Escola Atual (Escolas)

**Onde Faltando:** `src/modules/escolas/hooks.ts`

**Necessidade:**
```typescript
// Gestor precisa buscar dados da própria escola
export function useMinhaEscola() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['escolas', 'minha', authUser?.tenantId],
    queryFn: () => escolaService.buscarPorId(authUser!.tenantId),
    enabled: !!authUser?.tenantId,
  })
}
```

**Uso:**
- `AdminLayout.tsx` (atualmente usa `useEscola(id)`)
- `DashboardPage` (atualmente usa `useEscola(id)`)

**Benefício:**
- Mais semântico
- Auto-contido (não precisa passar ID)

**Prioridade:** BAIXA

---

### 5. ❌ FALTANTE: Hook para Atualizar Config da Escola (Escolas)

**Onde Faltando:** `src/modules/escolas/hooks.ts`

**Necessidade:**
```typescript
export function useAtualizarConfigEscola() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, config }: { id: string; config: any }) =>
      escolaService.atualizarConfig(id, config),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['escolas'] })
      qc.invalidateQueries({ queryKey: ['config-recebimento'] })
    },
  })
}
```

**Uso:**
- `ConfiguracoesPage` (atualmente usa `useTenantSettings`)
- `PerfilEscolaPage`

**Prioridade:** MÉDIA

---

### 6. ❌ FALTANTE: Hook para Estatísticas da Escola (Super Admin)

**Onde Faltando:** `src/modules/super-admin/hooks.ts`

**Necessidade:**
```typescript
export function useEstatisticasEscola(escolaId: string) {
  return useQuery({
    queryKey: ['admin', 'escola-stats', escolaId],
    queryFn: () => superAdminService.getEstatisticasEscola(escolaId),
    enabled: !!escolaId,
  })
}
```

**Dados:**
- Total de alunos
- Faturamento mensal
- Inadimplência
- Frequência média

**Uso:**
- `EscolasPage` (detalhes da escola)
- `SuperAdminDashboardPage`

**Prioridade:** ALTA

---

### 7. ❌ FALTANTE: Hook para Histórico de Status da Escola (Super Admin)

**Onde Faltando:** `src/modules/super-admin/hooks.ts`

**Necessidade:**
```typescript
export function useHistoricoStatusEscola(escolaId: string) {
  return useQuery({
    queryKey: ['admin', 'escola-historico', escolaId],
    queryFn: () => superAdminService.getHistoricoStatus(escolaId),
    enabled: !!escolaId,
  })
}
```

**Dados:**
- Quando foi ativa
- Quando foi suspensa
- Motivos de suspensão

**Uso:**
- `EscolasPage` (auditoria)
- `SuperAdminDashboardPage`

**Prioridade:** MÉDIA

---

### 8. ❌ FALTANTE: Hook para Dados do Responsável + Vínculos (Portal)

**Onde:** `src/modules/portal/hooks.ts`

**Problema:**
```typescript
// Atualmente precisa usar 2 hooks
const { data: responsavel } = useResponsavel()
const { data: vinculos } = useVinculosAtivos()

// Deveria ter um hook consolidado
const { data: responsavel, vinculos } = useResponsavelCompleto()
```

**Solução:**
```typescript
export function useResponsavelCompleto() {
  const { data: responsavel } = useResponsavel()
  const { data: vinculos } = useVinculosAtivos()
  
  return {
    responsavel,
    vinculos,
    isLoading: !responsavel || !vinculos,
  }
}
```

**Prioridade:** BAIXA

---

### 9. ❌ FALTANTE: Hook para Configurações da Escola (Portal)

**Onde Faltando:** `src/modules/portal/hooks.ts`

**Necessidade:**
```typescript
export function useConfiguracoesEscola(tenantId: string) {
  return useQuery({
    queryKey: ['portal', 'configs', tenantId],
    queryFn: () => portalService.buscarConfiguracoes(tenantId),
    enabled: !!tenantId,
  })
}
```

**Dados:**
- Config PIX
- Config Recados
- Config Financeira
- Logo da escola

**Uso:**
- `PortalCobrancasPageV2`
- `PortalHomeV2`

**Prioridade:** MÉDIA

---

### 10. ⚠️ MELHORIA: Hook `useTenantSettings` Muito Complexo

**Onde:** `src/modules/escolas/hooks/useTenantSettings.ts`

**Problema:**
```typescript
// Hook com MUITAS responsabilidades
export function useTenantSettings() {
  // 200+ linhas de código
  // Busca config, cria config, atualiza, valida, histórico, etc.
}
```

**Solução:**
Dividir em hooks menores:
```typescript
export function useConfigEscola() // Busca config
export function useAtualizarConfigEscola() // Atualiza
export function useHistoricoConfigEscola() // Histórico
```

**Prioridade:** MÉDIA

---

## 📋 Resumo das Ações

### Hooks Duplicados (Renomear)

| Hook Atual | Novo Nome Sugerido | Módulo |
|------------|-------------------|--------|
| `useEscolas` (Super Admin) | `useAdminEscolas` | super-admin |
| `usePlanos` (Super Admin) | `useAdminPlanos` | super-admin |
| `usePlanos` (Escolas) | `usePlanosDisponiveis` | escolas |
| `useConfiguracaoRecebimento` (Super Admin) | `useConfiguracaoRecebimentoGlobal` | super-admin |

---

### Hooks Faltantes (Criar)

| Hook | Módulo | Prioridade |
|------|--------|------------|
| `useMinhaEscola` | escolas | 🟢 Baixa |
| `useAtualizarConfigEscola` | escolas | 🟡 Média |
| `useEstatisticasEscola` | super-admin | 🔴 Alta |
| `useHistoricoStatusEscola` | super-admin | 🟡 Média |
| `useResponsavelCompleto` | portal | 🟢 Baixa |
| `useConfiguracoesEscola` | portal | 🟡 Média |

---

### Hooks para Refatorar

| Hook | Ação | Prioridade |
|------|------|------------|
| `useTenantSettings` | Dividir em hooks menores | 🟡 Média |

---

## 🎯 Prioridades

### Alta (Esta Sprint)
1. ✅ Criar `useEstatisticasEscola` (Super Admin)
2. ✅ Renomear `useEscolas` duplicado

### Média (Próxima Sprint)
3. ✅ Criar `useAtualizarConfigEscola` (Escolas)
4. ✅ Criar `useHistoricoStatusEscola` (Super Admin)
5. ✅ Criar `useConfiguracoesEscola` (Portal)
6. ✅ Renomear `usePlanos` duplicado

### Baixa (Futuro)
7. ✅ Criar `useMinhaEscola` (Escolas)
8. ✅ Criar `useResponsavelCompleto` (Portal)
9. ✅ Refatorar `useTenantSettings`

---

## 📊 Score de Cobertura de Hooks

| Módulo | Hooks Atuais | Hooks Faltantes | Score |
|--------|--------------|-----------------|-------|
| **Super Admin** | 24 | 2 | 92% ✅ |
| **Escolas** | 8 | 3 | 73% ⚠️ |
| **Portal** | 12 | 2 | 86% ✅ |
| **Global** | 7 | 0 | 100% ✅ |
| **Média Geral** | **51** | **7** | **88%** ⚠️ |

---

## ✅ Conclusão

**Situação Atual:** 88% de cobertura ✅

**Principais Problemas:**
1. 4 hooks duplicados (nomes conflitantes)
2. 6 hooks faltantes
3. 1 hook muito complexo (`useTenantSettings`)

**Ações Imediatas:**
1. Renomear hooks duplicados
2. Criar `useEstatisticasEscola` (Super Admin)
3. Criar `useAtualizarConfigEscola` (Escolas)

**Impacto das Correções:**
- Melhor organização de código
- Menos confusão na importação
- Melhor cache do React Query
- Mais reutilização

---

**Auditor realizado por:** Fluxoo Development Team  
**Data:** 29 de março de 2026
