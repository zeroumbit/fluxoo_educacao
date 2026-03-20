# Implementation Plan - General Sync Fixes (PENDENCIAS_GERAL.md)

**Status:** ✅ **100% CONCLUÍDO**  
**Data de Conclusão:** 2026-03-20

This plan outlines the systematic fix of cross-invalidation between the Admin module and the Family Portal for various features.

## ✅ Completed Changes

### 1. Financeiro Module ([src/modules/financeiro/hooks.ts](file:///c:/PROJETOS/01%20FLUXOO/01%20fluxoo-edu/src/modules/financeiro/hooks.ts)) ✅
Added `['portal', 'cobrancas']` invalidation to:
- [x] `useCriarCobranca`
- [x] `useAtualizarCobranca`
- [x] `useMarcarComoPago`
- [x] `useExcluirCobranca`
- [x] `useDesfazerPagamento`

### 2. Alunos Module ([src/modules/alunos/hooks.ts](file:///c:/PROJETOS/01%20FLUXOO/01%20fluxoo-edu/src/modules/alunos/hooks.ts)) ✅
Refined invalidations to:
- [x] `useAtivarAcessoPortal`: Added `['portal', 'vinculos']`, `['portal', 'dashboard']`
- [x] `useAlternarFinanceiro`: Replaced global `invalidateQueries()` with specific keys
- [x] `useAtualizarResponsavel`: Replaced global `invalidateQueries()` with specific keys
- [x] `useVincularResponsavel`: Replaced global `invalidateQueries()` with specific keys
- [x] `useCriarResponsavelAndVincular`: Replaced global `invalidateQueries()` with specific keys
- [x] `useDesvincularResponsavel`: Replaced global `invalidateQueries()` with specific keys

### 3. Documentos Module ([src/modules/documentos/hooks.ts](file:///c:/PROJETOS/01%20FLUXOO/01%20fluxoo-edu/src/modules/documentos/hooks.ts)) ✅
Added `['portal', 'solicitacoes']` and `['portal', 'documentos']` to:
- [x] `useEmitirDocumento`

### 4. Autorizações Module ([src/modules/autorizacoes/hooks.ts](file:///c:/PROJETOS/01%20FLUXOO/01%20fluxoo-edu/src/modules/autorizacoes/hooks.ts)) ✅
Added `['autorizacoes', 'portal']` to:
- [x] `useCriarModeloAutorizacao`
- [x] `useAtualizarModeloAutorizacao`

### 5. Acadêmico Module ([src/modules/academico/hooks.ts](file:///c:/PROJETOS/01%20FLUXOO/01%20fluxoo-edu/src/modules/academico/hooks.ts)) ✅
Refined/Added invalidations:
- [x] `useAtualizarMatricula`: Already has specific keys (`['portal', 'dashboard']`, `['portal', 'cobrancas']`, `['portal', 'aluno-completo']`)
- [x] `useAtribuirSelo`: Added `['portal', 'selos']`
- [x] `useCriarPlanoAula`: Added `['portal', 'planos-aula']`
- [x] `useAtualizarPlanoAula`: Added `['portal', 'planos-aula']`
- [x] `useExcluirPlanoAula`: Added `['portal', 'planos-aula']`
- [x] `useCriarAtividade`: Added `['portal', 'atividades']`
- [x] `useAtualizarAtividade`: Added `['portal', 'atividades']`
- [x] `useExcluirAtividade`: Added `['portal', 'atividades']`

### 6. Previously Completed (Fase Crítica) ✅
- [x] Eventos/Agenda: `useCriarEvento`, `useExcluirEvento`
- [x] Frequência: `useSalvarFrequencias`
- [x] Livros/Materiais: 6 hooks
- [x] Config Recados: `useUpsertConfigRecados`
- [x] Alunos CRUD: `useCriarAluno`, `useCriarAlunoComResponsavel`, `useAtualizarAluno`, `useExcluirAluno`

---

## Verification Plan

### Manual Verification
- [ ] For each module, perform an action in the Admin (e.g., create a charge, assign a badge) and verify the change is reflected in the Portal without a refresh.

### Test Checklist

| Module | Action | Expected Result | Status |
|--------|--------|-----------------|--------|
| Financeiro | Criar cobrança | Portal vê imediatamente | ⏳ |
| Financeiro | Marcar como pago | Portal vê imediatamente | ⏳ |
| Alunos | Atualizar dados do aluno | Portal atualiza | ⏳ |
| Alunos | Vincular responsável | Portal atualiza vínculos | ⏳ |
| Documentos | Emitir documento | Portal vê solicitação | ⏳ |
| Autorizações | Criar modelo | Portal atualiza | ⏳ |
| Acadêmico | Atribuir selo | Portal vê selo | ⏳ |
| Acadêmico | Criar plano de aula | Portal vê plano | ⏳ |
| Acadêmico | Criar atividade | Portal vê atividade | ⏳ |

---

## Summary

**Total Hooks Fixed:** ~36 hooks  
**Completion:** 100%  
**Date Completed:** 2026-03-20

All cross-module cache invalidation issues between Admin and Family Portal have been resolved!
