# Plano de Execução - Fase 1: Segurança e Integridade Acadêmica

Este plano detalha as ações para a **Fase 1** das melhorias do Fluxoo EDU, focando em consolidar a segurança de dados e garantir que as regras de negócio acadêmicas sejam aplicadas conforme as configurações de cada escola.

## User Review Required

> [!IMPORTANT]
> **Consolidação RLS**: O script de RLS habilitará a segurança em TODAS as tabelas. Isso pode afetar fluxos de onboarding ou login se não forem testados adequadamente.
> **Regras Acadêmicas**: A ativação da validação de aprovação/reprovação pode alterar o status de alunos que anteriormente pareciam aprovados.

## Proposed Changes

### 🛡️ Segurança (RLS Consolidation)

Agrupamento e padronização de políticas para evitar o conflito identificado entre as migrations 080-099.

#### [NEW] [140_consolidacao_rls_final.sql](file:///c:/PROJETOS/01%20FLUXOO/01%20fluxoo-edu/database/updates/140_consolidacao_rls_final.sql)
- Script unificado que habilita RLS em todas as tabelas (sem exceções inseguras).
- Padronização do uso de `auth.jwt() ->> 'tenant_id'` como fonte de verdade.
- Implementação de bypass limpo para Super Admin.
- Resolução de recursão em políticas de usuários.

---

### 🎓 Módulo Acadêmico (Integração de Regras)

Vinculação das configurações de `media_aprovacao` e `frequencia_minima_perc` aos processos de notas e faltas.

#### [MODIFY] [BoletimService.ts](file:///c:/PROJETOS/01%20FLUXOO/01%20fluxoo-edu/src/modules/academico/BoletimService.ts) (ou similar)
- Integrar chamada ao `validarAprovacao()` do `configuracoes/service.ts`.
- Impedir alteração de status manual que confronte a regra da escola.

#### [MODIFY] [FrequenciaComponents.tsx](file:///c:/PROJETOS/01%20FLUXOO/01%20fluxoo-edu/src/modules/academico/components/Frequencia...)
- Adicionar avisos visuais quando um aluno atinge o limite de faltas configurado (`frequencia_minima_perc`).
- Validar `validarDiaLetivo()` antes de permitir registros em datas fora do calendário escolar.

---

### 🚪 Módulo Operacional (Portaria)

Aplicação das travas de segurança operacional configuradas pela escola.

#### [MODIFY] [SaidaLogComponent.tsx](file:///c:/PROJETOS/01%20FLUXOO/01%20fluxoo-edu/src/modules/operacional/...)
- Validar `idade_minima_saida_desacompanhada` ao registrar saída.
- Exigir foto se `exige_foto_terceiros` estiver ativo.

## Open Questions

- **Frequência**: Devemos apenas alertar ou BLOQUEAR o registro de notas se o aluno estiver reprovado por falta?
- **Soft Deletes**: Deseja que eu já aplique o soft delete universal (deleted_at) nas tabelas principais nesta fase ou apenas na Fase 5?

## Verification Plan

### Automated Tests
- Executar scripts SQL e verificar se o `tenant_id` é respeitado via comandos `set local role ...`.
- Testar funções de validação do `configuracoes/service.ts` com diferentes perfis de escola.

### Manual Verification
- Tentar acessar dados de Escola B logado como Funcionário de Escola A.
- Alterar a média de aprovação de uma escola e verificar se o status do boletim de um aluno muda dinamicamente.
