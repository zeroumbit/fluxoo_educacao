# Sincronização de Hooks: Escolas x Portal

- [x] Análise de hooks e service do módulo `escolas`
- [x] Criação do plano de implementação para invalidação cruzada
- [x] Implementação das mutations no módulo `escolas` (Super Admin) para invalidar queries do `portal`
- [x] Verificação de outros módulos (Planos, Frequência) para garantir sincronia total
- [x] Testes de fluxo (Admin -> Portal)

---

# Reestruturação Universal RLS e Governança Enterprise (V3.1)

- [x] Atualizar o [implementation_plan.md](file:///C:/Users/josse/.gemini/antigravity/brain/6de963d1-a375-40af-9841-a5d518390ba2/implementation_plan.md) com as diretrizes do Padrão Universal RLS V3.1.
- [x] Criar a Migration ([111_universal_rls_governance_v3_1.sql](file:///c:/PROJETOS/01%20FLUXOO/01%20fluxoo-edu/database/updates/111_universal_rls_governance_v3_1.sql)).
  - [x] Garantir o DROP de políticas antigas listadas (`Gestor_*`, `Portal_*`, etc).
  - [x] Adicionar Índice Opt-In para a tabela `consent_logs`.
  - [x] Implementar as políticas de `SELECT` utilizando os metadata requests do JWT via JSONB.
  - [x] Implementar as políticas de `UPDATE/INSERT` exclusivas para staff (Bloqueio do Super Admin nas transacionais e do Responsável no back-end).
  - [x] Checar campos transacionais ausentes (alunos, turmas, faturas).
- [ ] Verificar funções RPC (Remote Procedure Calls) no banco atual e assegurar que estão sob `SECURITY INVOKER` com `SET search_path = public`.
- [ ] Rodar no ambiente de deves o arquivo consolidado de soft-deletes.
