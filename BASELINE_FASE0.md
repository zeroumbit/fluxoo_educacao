# BASELINE TÉCNICA — Fase 0

> Gerado em: 28/05/2026
> Projeto: Fluxoo Educação
> Branch atual: (a definir)

---

## 1. Estado Inicial do Projeto

### 1.1 TypeScript (`npm run typecheck`)
- **Resultado:** ✅ 0 erros
- **Config:** `tsconfig.json` com strict mode, `verbatimModuleSyntax`, ES2022 target

### 1.2 Lint (`npm run lint`)
- **Resultado:** ✅ 0 erros, **355 warnings**
- **Distribuição dos warnings:**
  - `@typescript-eslint/no-explicit-any`: ~310 ocorrências — uso generalizado de `any` em todo o codebase
  - `react-hooks/exhaustive-deps`: ~40 ocorrências — dependências faltando em useEffect/useMemo
  - Outros: `@typescript-eslint/ban-ts-comment` (1), diretiva não usada (1)
- **Orçamento `any` atual:** Limite de 99999 (`lint:count-any`), orçamento real de 1250 (`lint:any-budget`)

### 1.3 Build (`npm run build`)
- **Resultado:** ✅ Sucesso (57s, 4220 módulos transformados)
- **Chunks gerados:**
  - `vendor`: **3,014 kB** (970 kB gzip) — ⚠️ acima de 500 kB
  - `index`: 245 kB (66 kB gzip)
  - Demais chunks: 0.4–130 kB via lazy loading + manualChunks
- **Aviso:** Chunk vendor ultrapassa 500 kB — sugere code-splitting adicional
- **PWA:** 148 entries precached (6,579 KiB), service worker gerado

### 1.4 Testes
- **Resultado:** ❌ Nenhum teste encontrado (0 arquivos `.test.*`, `.spec.*`, `__tests__/`)
- **Test runner:** Não configurado em `package.json`

---

## 2. Roteiro Completo de Rotas

### 2.1 Rotas Públicas (sem autenticação)
| Path | Componente | Layout |
|------|-----------|--------|
| `/` | `RootRedirect` | — |
| `/login` | `LoginPage` | — |
| `/portal/login` | `PortalLoginPage` | — |
| `/cadastro` | `EscolaCadastroPage` | — |
| `/marketplace/cadastro` | `MarketplaceCadastroPage` | — |
| `/termos-de-uso` | `TermosUsoPage` | — |
| `/politica-privacidade` | `PrivacidadePage` | — |
| `/politica-cookies` | `CookiesPage` | — |

### 2.2 Super Admin (role: `super_admin`)
| Path | Componente | Layout |
|------|-----------|--------|
| `/admin/dashboard` | `SuperAdminDashboardPage` | `SuperAdminLayout` |
| `/admin/escolas` | `EscolasPage` | `SuperAdminLayout` |
| `/admin/marketplace` | `MarketplaceConfigPage` | `SuperAdminLayout` |
| `/admin/planos` | `PlanosPage` | `SuperAdminLayout` |
| `/admin/faturas` | `FaturasPage` | `SuperAdminLayout` |
| `/admin/upgrades` | `UpgradesPage` | `SuperAdminLayout` |
| `/admin/precos` | `PrecosPage` | `SuperAdminLayout` |
| `/admin/gateways` | `GatewayConfigPage` | `SuperAdminLayout` |
| `/admin/config-recebimento` | `ConfigRecebimentoPage` | `SuperAdminLayout` |
| `/admin/logs` | Placeholder inline | `SuperAdminLayout` |

### 2.3 Professor (roles: `professor`, `funcionario`)
| Path | Componente | Layout |
|------|-----------|--------|
| `/professores/dashboard` | `ProfessorDashboardPage` | `ProfessorLayout` |
| `/professores/alunos` | `ProfessorAlunosPage` | `ProfessorLayout` |
| `/professores/alunos/:id` | `ProfessorAlunoDetalhePage` | `ProfessorLayout` |
| `/professores/turmas` | `ProfessorTurmasPage` | `ProfessorLayout` |
| `/professores/turmas/:id` | `ProfessorTurmaDetalhePage` | `ProfessorLayout` |
| `/professores/frequencia` | `ProfessorFrequenciaPage` | `ProfessorLayout` |
| `/professores/planos-aula` | `ProfessorPlanosAulaPage` | `ProfessorLayout` |
| `/professores/atividades` | `ProfessorAtividadesPage` | `ProfessorLayout` |
| `/professores/notas` | `ProfessorNotasPage` | `ProfessorLayout` |
| `/professores/agenda` | `ProfessorAgendaPage` | `ProfessorLayout` |
| `/professores/alertas` | `ProfessorAlertasPage` | `ProfessorLayout` |
| `/professores/perfil` | `MeuPerfilPage` | `ProfessorLayout` |

### 2.4 Gestor/Admin (roles: `gestor`, `funcionario`, `lojista`, `profissional`)
| Path | Componente | Notas |
|------|-----------|-------|
| `/dashboard` | `DashboardRouter` | Redireciona por role |
| `/alunos` | `AlunosListPage` | |
| `/alunos/novo` | `AlunoCadastroPage` | |
| `/alunos/importar` | `AlunosImportarPage` | |
| `/alunos/:id` | `AlunoDetalhePage` | |
| `/turmas` | `TurmasPage` | |
| `/frequencia` | `FrequenciaPage` | |
| `/frequencia/relatorio` | `RelatorioMensalFrequenciaPage` | |
| `/mural` | `MuralPage` | |
| `/financeiro` | `FinanceiroPage` | |
| `/filiais` | `FiliaisPage` | |
| `/livros` | `LivrosPage` | |
| `/funcionarios` | `FuncionariosPage` | |
| `/matriculas` | `MatriculaPage` | |
| `/matriculas/nova` | `MatriculaFormPage` | |
| `/planos-aula` | `PlanoAulaPage` | |
| `/atividades` | `AtividadesPage` | |
| `/notas` | `NotasPage` | |
| `/transferencias` | `TransferenciasPage` | |
| `/disciplinas` | `DisciplinasPage` | |
| `/agenda` | `EventosPage` | |
| `/configuracoes` | `ConfiguracoesPage` | |
| `/contas-pagar` | `ContasPagarPage` | |
| `/gateway` | `GatewayTenantConfigPage` | |
| `/financeiro-relatorios` | `FinanceiroRelatoriosPage` | **Export CSV** |
| `/documentos` | `DocumentosPage` | **Export PDF** |
| `/almoxarifado` | `AlmoxarifadoPage` | |
| `/portaria-expresso` | `FilaVirtualAdminPage` | |
| `/perfil-escola` | `PerfilEscolaPage` | |
| `/meu-perfil` | `MeuPerfilPage` | |
| `/plano` | `PlanoPage` | |
| `/curriculos` | Placeholder inline | |
| `/curriculos/:id` | Placeholder inline | |
| `/configuracoes/perfis` | `PerfisPage` | |
| `/configuracoes/auditoria` | `AuditoriaPage` | **Audit log** |
| `/aprovacoes` | `AprovacaoPage` | |
| `/loja/dashboard` | `LojistaDashboardPage` | |
| `/profissional/dashboard` | `ProfissionalDashboardPage` | |

### 2.5 Portal Responsável (role: `responsavel`)
| Path | Componente | Layout |
|------|-----------|--------|
| `/portal` | `PortalHomeV2` | `PortalLayoutV2` |
| `/portal/alunos` | `PortalAlunosListV2` | `PortalLayoutV2` |
| `/portal/alunos/:id` | `PortalAlunoPerfilV2` | `PortalLayoutV2` |
| `/portal/financeiro` | `PortalFinanceiroV2` | `PortalLayoutV2` |
| `/portal/avisos` | `PortalAvisosV2` | `PortalLayoutV2` |
| `/portal/loja` | `PortalLojaPage` | `PortalLayoutV2` |
| `/portal/perfil` | `PortalPerfilPage` | `PortalLayoutV2` |
| `/portal/fila` | `PortalFilaVirtualV2` | `PortalLayoutV2` |
| `/portal/livros` | `PortalLivrosV2` | `PortalLayoutV2` |
| `/portal/documentos` | `PortalDocumentosV2` | `PortalLayoutV2` |
| `/portal/transferencias` | `PortalTransferenciasV2` | `PortalLayoutV2` |
| `/portal/autorizacoes` | `PortalAutorizacoesV2` | `PortalLayoutV2` |

---

## 3. Matriz: Feature → Permissão → Fonte de Dados → RLS/RPC → Exportável

### 3.1 Dashboard Gestor
| Feature | Permissão | Fonte de Dados | RLS/RPC | Exportável? |
|---------|-----------|---------------|---------|-------------|
| Total de Alunos | `dashboard.view` | `alunos` + `matriculas` | `check_is_tenant_staff` | ❌ |
| Mensalidades | `dashboard.view` | `cobrancas` | `check_is_tenant_staff` | ❌ |
| Alertas Ativos | `dashboard.view` | `alertas_tratamento` + `AlertasContext` | `check_is_tenant_staff` | ❌ |
| Contas a Pagar | `financeiro.contas_pagar.view` | `contas_pagar` | `check_is_tenant_staff` | ❌ |
| A Receber 12 Meses | `dashboard.view` | `cobrancas` | `check_is_tenant_staff` | ❌ |
| Radar de Evasão | `dashboard.view` | `dashboard.service.ts` (alunos + frequencias + cobrancas) | `check_is_tenant_staff` | ❌ |
| Mural | `comunicacao.mural.view` | `mural_avisos` | `check_is_tenant_staff` | ❌ |
| Onboarding | `dashboard.view` | `OnboardingGuide.tsx` (local state) | — | ❌ |

**Gap:** Nenhuma métrica da dashboard é exportável. Não há gráficos de tendência. Dados vêm de queries diretas ao banco via React Query.

### 3.2 Dashboard Professor
| Feature | Permissão | Fonte de Dados | RLS/RPC | Exportável? |
|---------|-----------|---------------|---------|-------------|
| Agenda do Dia | — (professor) | `vw_professor_agenda_hoje` | View c/ escopo professor | ❌ |
| Pendências | — (professor) | `vw_professor_pendencias` | View c/ escopo professor | ❌ |
| Alertas | — (professor) | `vw_alertas_professor` | View c/ escopo professor | ❌ |
| Saúde das Turmas | — (professor) | `vw_professor_saude_turmas` | View c/ escopo professor | ❌ |

**Gap:** Dashboard professor não tem permissões RBAC explícitas. Views do PostgreSQL garantem escopo.

### 3.3 Financeiro
| Feature | Permissão | Fonte de Dados | RLS/RPC | Exportável? |
|---------|-----------|---------------|---------|-------------|
| Listar Cobranças | `financeiro.cobrancas.view` | `cobrancas` | `check_is_tenant_staff` | ❌ |
| Relatório Fechamento Mensal | `financeiro.relatorios.view` | `mv_fechamento_mensal` (MV) | `check_is_tenant_staff` | ✅ CSV |
| Exportar Relatório | `financeiro.relatorios.export` | `mv_fechamento_mensal` | `check_is_tenant_staff` | ✅ CSV |
| Contas a Pagar | `financeiro.contas_pagar.view` | `contas_pagar` | `check_is_tenant_staff` | ❌ |

**Nota:** A exportação CSV atual é 100% client-side. A permissão `financeiro.relatorios.export` é verificada apenas no frontend. O RLS do banco filtra os dados, mas não há validação RBAC no backend para a operação de export.

### 3.4 Frequência
| Feature | Permissão | Fonte de Dados | RLS/RPC | Exportável? |
|---------|-----------|---------------|---------|-------------|
| Listar por Turma/Data | `academico.frequencia.view` | `frequencias` | Staff_CRUD_Frequencias | ❌ |
| Relatório Mensal | `academico.frequencia.view` | `frequencias` | Staff_CRUD_Frequencias | ❌ (página existe, sem export) |
| Salvar Frequências | `academico.frequencia.register` | RPC `salvar_frequencias_turma_data` | RPC c/ RLS | ❌ |

### 3.5 Notas / Acadêmico
| Feature | Permissão | Fonte de Dados | RLS/RPC | Exportável? |
|---------|-----------|---------------|---------|-------------|
| Listar Avaliações | `academico.notas.view` | `avaliacoes_config` | `check_is_tenant_staff` | ❌ |
| Notas por Avaliação | `academico.notas.view` | `avaliacoes_notas` | Academic_Staff_Access | ❌ |
| Boletim Consolidado | `academico.notas.view` | `vw_boletim_completo` | View | ❌ |
| Histórico Escolar | `academico.documentos.manage` | RPC `fn_get_historico_consolidado_aluno` | RPC | ✅ PDF (impressão) |

### 3.6 Documentos
| Feature | Permissão | Fonte de Dados | RLS/RPC | Exportável? |
|---------|-----------|---------------|---------|-------------|
| Templates | `academico.documentos.view` | `documento_templates` | `check_is_tenant_staff` | ❌ |
| Emitir Documento | `academico.documentos.create` | `documentos_emitidos` | `check_is_tenant_staff` | ✅ PDF (FichaMatricula) |
| Solicitações | `academico.documentos.manage` | `document_solicitations` | `check_is_tenant_staff` | ❌ |

### 3.7 Auditoria
| Feature | Permissão | Fonte de Dados | RLS/RPC | Exportável? |
|---------|-----------|---------------|---------|-------------|
| Visualizar Logs | `configuracoes.auditoria.view` | `audit_logs_v2` | `check_is_tenant_staff` | ❌ |
| Exportar Logs | ❌ (não existe) | — | — | ❌ |

### 3.8 Alunos / Turmas
| Feature | Permissão | Fonte de Dados | RLS/RPC | Exportável? |
|---------|-----------|---------------|---------|-------------|
| Listar Alunos | `academico.alunos.view` | `alunos` + `matriculas` | Staff_CRUD_Alunos | ❌ |
| Listar Turmas | `academico.turmas.view` | `turmas` | `check_is_tenant_staff` | ❌ |
| Matrículas | `academico.matriculas.view` | `matriculas` | `check_is_tenant_staff` | ❌ |

---

## 4. Topologia de Segurança

### 4.1 Proteção por Camadas
```
[Browser] → [React Query] → [Service Layer] → [Supabase REST] → [RLS] → [Postgres]
    ↑              ↑               ↑                   ↑
  PermissionGate  staleTime    validarPermissao()   JWT + tenant_id
  (UI)            (5min avg)   (rbac-validation)    no header
```

### 4.2 Funções Helper RLS (Postgres)
| Função | Proposito |
|--------|-----------|
| `check_is_super_admin()` | Verifica JWT `app_metadata.is_super_admin` |
| `check_is_tenant_staff(tenant_id)` | Staff do tenant (funcionário ou gestor) |
| `is_my_child_v2(aluno_id)` | Responsável tem vínculo com aluno |
| `validate_tenant_context(tenant_id)` | Anti-spoofing: tenant_id bate com JWT |
| `check_professor_turma(turma_id)` | Professor vinculado à turma |

### 4.3 Edge Functions
- **Apenas 1:** `webhook-gateway` (Asaas, Mercado Pago, Abacate Pay)
  - Rate limiting, HMAC validation, idempotência, sanitização de logs
  - Usa `SUPABASE_SERVICE_ROLE_KEY`

### 4.4 Rate Limiting
- **Client-side:** `useLoginRateLimit.ts` (sessionStorage, 30 tentativas / 15min)
- **Server-side:** `auth-rate-limit.ts` → RPC `fn_login_precheck` + `fn_login_record_attempt`
- **PortalLogin:** ❌ **SEM rate limiting**

### 4.5 CSRF
- **Status:** ❌ Sem proteção CSRF explícita. Depende do Supabase Auth (gotrue).

---

## 5. Riscos Identificados (Pré-Implementação)

### 🔴 Críticos

| # | Risco | Impacto | Localização |
|---|-------|---------|-------------|
| R1 | **Zero testes automatizados** | Qualquer refatoração ou feature nova pode quebrar fluxos críticos sem detecção | Todo o projeto |
| R2 | **Exportação sem validação backend** | Permissão `financeiro.relatorios.export` verificada só no frontend. RLS protege os dados na query, mas a operação de export em si não tem auditoria obrigatória | `FinanceiroRelatoriosPage.web.tsx` |
| R3 | **PortalLogin sem rate limiting** | Ataque de força bruta via CPF no portal de responsáveis | `PortalLoginPage.tsx` |

### 🟡 Altos

| # | Risco | Impacto | Localização |
|---|-------|---------|-------------|
| R4 | **Chunk vendor de 3MB** | Primeiro carregamento lento em conexões móveis | `vite.config.ts` (vendor chunk) |
| R5 | **~310 usos de `any`** | Facilita bugs de tipo em runtime, dificulta manutenção | Espalhado por todo o src/ |
| R6 | **Serviço de export inexistente** | Cada export é implementado ad-hoc (CSV manual, PDF via lib, HTML print), sem padrão reutilizável | `relatorios`, `pdf.tsx`, `historicoPdfService.ts` |
| R7 | **Dois sistemas RBAC coexistem** | Controlado por `VITE_USE_LEGACY_RBAC`. Pode causar inconsistência se ambas as fontes divergirem | `RBACProvider` + `rbac.store.ts` |

### 🟢 Médios

| # | Risco | Impacto | Localização |
|---|-------|---------|-------------|
| R8 | **40+ warnings de hooks com deps faltando** | Comportamento inesperado em useEffect/useMemo | 40+ arquivos |
| R9 | **Sem prefetch nas rotas lazy** | Transições de tela lentas ao navegar | `App.tsx` (React.lazy sem prefetch) |
| R10 | **Permission keys service-layer vs DB seed divergentes** | `financeiro.cobrancas.pay`, `financeiro.cobrancas.delete` etc. existem no código mas não no seed SQL | `financeiro/service.ts` |
| R11 | **Sem gráficos de tendência** | Dashboard mostra apenas números atuais, sem visualização temporal | Dashboard inteiro |
| R12 | **Imagens sem otimização** | Fotos de alunos em listas grandes sem srcset/webp | `avatar.tsx`, páginas de alunos |

---

## 6. Anomalias e Descobertas

### 6.1 Duas formas de verificar permissão
- **Nova (Zustand):** `useHasPermission(key)` → `rbac.store.ts` (cache 30min, Realtime invalidation)
- **Legacy (Context):** `usePermissions().hasPermission(key)` → `RBACProvider` (React Query, staleTime 10min)
- Ambas chamam `rbacService.resolverPermissoes()` → RPC `fn_resolve_user_permissions`

### 6.2 Permission keys usadas em service.ts sem seed correspondente
| Chave | Onde | Seed DB |
|-------|------|---------|
| `financeiro.cobrancas.pay` | `financeiro/service.ts` | ❌ (seed tem `baixa_manual`) |
| `financeiro.cobrancas.delete` | `financeiro/service.ts` | ❌ |
| `financeiro.cobrancas.update` | `financeiro/service.ts` | ❌ |
| `funcionarios.manage_users` | `funcionarios/service.ts` | ❌ |
| `funcionarios.funcoes.create` | `funcionarios/service.ts` | ❌ |
| `funcionarios.folha.generate` | `funcionarios/service.ts` | ❌ |
| `alunos.manage_responsaveis` | `alunos/service.ts` | ❌ |
| `almoxarifado.*` (4 chaves) | `almoxarifado/service.ts` | ❌ |

### 6.3 Views do PostgreSQL usadas
| View | Módulo | 
|------|--------|
| `vw_boletim_completo` | Academico |
| `vw_professor_agenda_hoje` | Professor |
| `vw_professor_pendencias` | Professor |
| `vw_professor_saude_turmas` | Professor |
| `vw_alertas_professor` | Professor |
| `vw_gateways_disponiveis` | Financeiro |

### 6.4 Materialized Views
| MV | Módulo | Atualização |
|----|--------|-------------|
| `mv_fechamento_mensal` | Financeiro | Não verificada (pode estar stale) |

### 6.5 Total de RPCs: 32

---

## 7. Recomendações Imediatas (Pré-Fase 1)

1. **Adicionar rate limiting ao PortalLogin** antes de qualquer outra mudança de segurança (R3)
2. **Documentar divergência de permission keys** entre service.ts e seed DB (R10) — pode causar falso negativo em validarPermissao()
3. **Verificar atualização da MV `mv_fechamento_mensal`** — se estiver stale, o relatório financeiro mostra dados incorretos
4. **Definir qual RBAC system será o oficial** (Zustand vs Context) antes de adicionar novas permissões de relatórios/integrações
