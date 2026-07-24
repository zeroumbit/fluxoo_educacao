# FLUXOO EDUCAÇÃO — Plataforma de Gestão Educacional

---

## 1. VISÃO GERAL DO PRODUTO

**Fluxoo Educação** é uma plataforma **SaaS multi-tenant** completa de gestão educacional, projetada para escolas de todos os portes. A plataforma unifica em um só ecossistema digital todas as áreas de uma instituição de ensino: **acadêmico, financeiro, comunicação, recursos humanos, almoxarifado, portaria, e relacionamento com pais/responsáveis**.

### Proposta de Valor

> "Transformar a gestão escolar em uma experiência integrada, móvel e inteligente — reduzindo custos operacionais, eliminando retrabalho e aproximando a família da escola."

### Públicos-Alvo

| Perfil | Descrição |
|--------|-----------|
| **Diretores / Mantenedores** | Visão consolidada da instituição, indicadores de desempenho, saúde financeira |
| **Gestores Escolares** | Operação do dia a dia: matrículas, turmas, notas, frequência, finanças |
| **Professores** | Lançamento de notas, chamada, planos de aula, agenda, comunicação com alunos |
| **Funcionários Administrativos** | Secretaria, financeiro, RH, portaria, almoxarifado |
| **Pais / Responsáveis** | Acompanhamento dos filhos, financeiro, documentos, comunicação |
| **Super Admin (Fluxoo)** | Administração da plataforma: escolas, planos, faturamento, gateways |

---

## 2. ARQUITETURA TÉCNICA

### Visão Geral da Arquitetura

```
┌──────────────────────────────────────────────────────────────────┐
│                    APLICAÇÃO FRONT-END (SPA)                      │
│         React 19 + TypeScript + Vite 7 + Tailwind CSS v4         │
│                                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ TanStack │ │  Zustand │ │  React   │ │  Framer Motion   │   │
│  │  Query 5 │ │   (5)    │ │ Router 7 │ │   Animações      │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              30 MÓDULOS DE NEGÓCIO                        │   │
│  │  (Domain-Driven Design por Feature)                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                    SUPABASE (Backend as a Service)                 │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  PostgreSQL   │  │     Auth     │  │      Storage         │  │
│  │  75+ tabelas  │  │  JWT + RLS   │  │  Arquivos / Fotos    │  │
│  │  15+ views    │  │  RBAC V2.2   │  │  Comprovantes        │  │
│  │  20+ RPCs     │  │  6 perfis    │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          Edge Functions (Deno)                             │   │
│  │  Webhook Gateway — Asaas / Mercado Pago / Abacate Pay     │   │
│  │  (Rate Limit + Idempotência + Multi-tenant)               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          Supabase Realtime                                 │   │
│  │  Invalidação de cache RBAC em tempo real                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Stack Tecnológico Completo

| Categoria | Tecnologia |
|-----------|-----------|
| **Linguagem** | TypeScript (strict mode) |
| **Framework Frontend** | React 19.2 |
| **Bundler** | Vite 7.3 (chunk splitting otimizado) |
| **Roteamento** | React Router DOM v7 |
| **Estilização** | Tailwind CSS v4 + shadcn/ui (New York) |
| **Estado Servidor** | TanStack React Query v5 |
| **Estado Cliente** | Zustand v5 (persistido) |
| **Formulários** | React Hook Form v7 + Zod |
| **Animações** | Framer Motion v12 |
| **Ícones** | Lucide React |
| **Gráficos** | Recharts |
| **PDF** | @react-pdf/renderer |
| **Notificações** | Sonner (toast) |
| **Backend** | Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions) |
| **Monitoramento** | Sentry (com ofuscação LGPD) |
| **PWA** | vite-plugin-pwa (Workbox) |
| **Pagamentos** | Asaas, Mercado Pago, Abacate Pay |
| **Node.js** | 24.x |

---

## 3. FUNCIONALIDADES POR MÓDULO

### 3.1 Módulo Acadêmico

| Funcionalidade | Descrição |
|----------------|-----------|
| **Matrículas** | Cadastro completo com fluxo de aprovação, documentação digital |
| **Turmas** | Gestão de turmas com capacidade, turno, grade horária, professores vinculados |
| **Disciplinas** | Catálogo de disciplinas com categorização BNCC |
| **Notas / Avaliações** | Configuração de avaliações, lançamento de notas, recuperações |
| **Boletins** | Geração de boletins com fechamento bimestral |
| **Frequência / Chamada** | Lançamento de presença, relatórios mensais, alertas de baixa frequência |
| **Planos de Aula** | Cadastro de planos vinculados a turmas e disciplinas |
| **Atividades / Materiais** | Disponibilização de atividades e materiais didáticos |
| **Transferências** | Fluxo completo: solicitação → aprovação → desligamento → integração |

### 3.2 Módulo Financeiro

| Funcionalidade | Descrição |
|----------------|-----------|
| **Cobranças (Contas a Receber)** | Geração automática de mensalidades, boletos, PIX, encargos por atraso |
| **Contas a Pagar** | Gestão de despesas da escola |
| **Gateway de Pagamento** | Integração com Asaas, Mercado Pago e Abacate Pay |
| **Configuração Pix** | Chave Pix para recebimento, conciliação automática |
| **Relatórios Financeiros** | Fluxo de caixa, inadimplência, receitas por período |
| **Extração de Relatórios** | Exportação CSV, XLSX e PDF |
| **Descontos / Overrides** | Descontos individuais, bolsas, convênios |
| **Webhook de Pagamentos** | Processamento em tempo real com proteção de concorrência |

### 3.3 Portal do Responsável (Família)

| Funcionalidade | Descrição |
|----------------|-----------|
| **Dashboard Familiar** | Visão consolidada de todos os alunos vinculados |
| **Acompanhamento Acadêmico** | Notas, frequência, boletins, calendário |
| **Financeiro** | Cobranças pendentes, histórico de pagamentos, upload de comprovantes |
| **Comunicação** | Avisos da escola, mural de recados |
| **Documentos** | Solicitação e download de documentos, contratos |
| **Transferências** | Solicitação de transferência do aluno |
| **Autorizações** | Autorização de saída, termos, eventos |
| **Fila Virtual** | Acompanhamento da fila da portaria em tempo real |
| **Materiais Didáticos** | Lista de livros e materiais |
| **Loja / Marketplace** | Compra de produtos e serviços |

### 3.4 Módulo do Professor

| Funcionalidade | Descrição |
|----------------|-----------|
| **Dashboard do Professor** | Visão do dia: turmas, pendências, saúde das turmas |
| **Smart Assistant** | Assistente com insights diários sobre desempenho das turmas |
| **Chamada / Frequência** | Lançamento rápido por turma |
| **Notas** | Lançamento por avaliação, recuperação |
| **Planos de Aula** | Criação e edição de planos |
| **Atividades** | Disponibilização de atividades para os alunos |
| **Agenda** | Calendário com eventos e aulas |
| **Alertas** | Notificações sobre alunos (pedagógico, saúde, frequência) |
| **Perfil** | Edição de dados pessoais |

### 3.5 Módulo Administrativo (Gestão da Escola)

| Funcionalidade | Descrição |
|----------------|-----------|
| **Dashboard Gerencial** | Indicadores: alunos, financeiro, frequência, evasão |
| **Alunos** | CRUD completo, importação em lote, histórico, alertas |
| **Funcionários** | Gestão de colaboradores, cargos, áreas de acesso |
| **Filiais / Unidades** | Gestão de múltiplas unidades da mesma rede |
| **Mural de Avisos** | Comunicação interna e com pais |
| **Agenda / Calendário Letivo** | Eventos, feriados, calendário acadêmico |
| **Almoxarifado** | Controle de estoque e movimentações |
| **Portaria Expressa** | Fila virtual de atendimento presencial |
| **Documentos** | Templates e emissão de documentos personalizados |
| **Configurações** | Personalização da escola, preferências, recados |

### 3.6 RBAC (Controle de Acesso)

| Funcionalidade | Descrição |
|----------------|-----------|
| **Perfis de Acesso** | Criação de perfis com permissões granulares |
| **Escopos de Permissão** | Hierarquia: self → minhas_turmas → minhas_disciplinas → minha_unidade → toda_escola → rede |
| **Override de Permissões** | Exceções por usuário |
| **Workflow de Aprovação** | Ações excepcionais requerem justificativa e aprovação |
| **Auditoria** | Log completo de todas as ações com metadados |
| **Cargos** | Estrutura hierárquica de cargos |
| **Permission Gate** | Controle granular de visibilidade de UI |

### 3.7 Super Admin (Administração da Plataforma)

| Funcionalidade | Descrição |
|----------------|-----------|
| **Dashboard Global** | Escolas ativas, faturamento, crescimento |
| **Gestão de Escolas** | Cadastro, suspensão, visualização de dados |
| **Planos / Assinaturas** | Criação de planos, módulos, precificação |
| **Faturamento** | Faturas das escolas, histórico |
| **Upgrades** | Solicitações de upgrade de plano |
| **Gateways** | Configuração global de gateways de pagamento |
| **Marketplace** | Configuração de categorias e lojistas |
| **Banners** | Gerenciamento de banners dos dashboards |
| **Preços** | Matriz de preços por filial |

### 3.8 Marketplace

| Funcionalidade | Descrição |
|----------------|-----------|
| **Cadastro de Lojistas** | Onboarding de vendedores de materiais escolares |
| **Cadastro de Profissionais** | Profissionais autônomos (reforço escolar, etc.) |
| **Loja no Portal** | Pais compram materiais e serviços |
| **Dashboard do Lojista** | Gestão de vendas e produtos |

---

## 4. EXPERIÊNCIA MULTIPLATAFORMA

### Design Responsivo e Adaptativo

A plataforma foi construída com uma abordagem **mobile-first** e **adaptive design**, oferecendo experiências distintas e otimizadas para cada dispositivo:

```
┌──────────────────────────────────────────────────────────────────┐
│                    ESTRATÉGIA ADAPTATIVA                          │
│                                                                   │
│  Desktop (> 768px)          Mobile (< 768px)                      │
│  ┌────────────────────┐    ┌────────────────────┐                │
│  │ Sidebar fixa (w-64) │    │ Bottom Navigation   │                │
│  │ Navegação completa  │    │ Sheet / Drawer      │                │
│  │ Tabelas e grids     │    │ Cards e listas      │                │
│  │ Modais centralizados│    │ Bottom Sheets        │                │
│  └────────────────────┘    └────────────────────┘                │
│                                                                   │
│  MUITAS PÁGINAS POSSUEM IMPLEMENTAÇÕES SEPARADAS:                 │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Exemplo: TurmasPage.tsx (barrel)                            │ │
│  │  ├── TurmasPage.web.tsx      (Desktop com tabela + sidebar)  │ │
│  │  ├── TurmasPage.mobile.tsx   (Mobile com cards + bottom nav) │ │
│  │  └── AdaptiveView faz a troca automática no breakpoint 768px │ │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Recursos Mobile Nativos

- **BottomSheet** com gestos de arrastar e spring animation
- **Pull-to-Refresh** para recarregar dados
- **Safe Area Insets** para notch e home indicator
- **100dvh** para altura correta em mobile
- **Targets de toque** otimizados (mín. 44px)
- **Barra de navegação inferior** estilo app nativo

### Progressive Web App (PWA)

- Instalável na tela inicial (Android e iOS)
- Service Worker com cache inteligente
- Atualização automática em background
- Ícones e splash screens personalizados

---

## 5. DIFERENCIAIS COMPETITIVOS

### 5.1 Arquitetura Moderna e Escalável

| Diferencial | Benefício |
|-------------|-----------|
| SPA com React 19 + Vite 7 | Performance superior, carregamento rápido (chunk splitting) |
| Supabase (BaaS) | Zero gerenciamento de servidores, escalabilidade automática |
| Multi-tenant nativo | Isolamento completo entre escolas (RLS + tenantId) |
| 30 módulos independentes | Evolução paralela, deploy independente por módulo |

### 5.2 RBAC V2.2 — Controle de Acesso Granular

Sistema de permissões hierárquico com **6 níveis de escopo** e **workflow de aprovação**:
- **Escopos:** Self → Minhas Turmas → Minhas Disciplinas → Minha Unidade → Toda Escola → Rede
- **Perfis customizáveis** por escola
- **Override** por usuário para exceções
- **Auditoria completa** com log imutável
- **Realtime** para invalidação de cache

### 5.3 Multi-Gateway de Pagamentos

Suporte nativo a **3 gateways** com processamento concorrente seguro:
- **Asaas**
- **Mercado Pago**
- **Abacate Pay**

Características:
- Rate limiting por IP (30 req/min)
- Detecção automática do gateway
- Idempotência (evita duplicidade)
- SELECT FOR UPDATE NOWAIT para segurança concorrente
- Webhook único unificado (`webhook-gateway`)

### 5.4 Segurança e Conformidade

| Aspecto | Implementação |
|---------|---------------|
| **LGPD** | Ofuscação de PII no Sentry, Consentimento de Cookies |
| **Autenticação** | Supabase Auth + Rate limiting + SessionStorage (evita vazamento) |
| **Autorização** | RLS no PostgreSQL + RBAC V2.2 + PermissionGate |
| **Sanitização** | DOMPurify para HTML, validação de arquivos (tipo + tamanho) |
| **Auditoria** | 3 níveis de audit log (sistema, RBAC, portal) |
| **Criptografia** | AES-GCM para rascunhos locais |
| **Senhas** | Validação de força (8+ chars, maiúscula, minúscula, número, símbolo) |

### 5.5 PWA com Experiência Nativa

- Instalação sem loja de aplicativos (Android/iOS)
- Cache inteligente (apenas dados públicos)
- Auto-update do service worker
- Design mobile-first com componentes nativos

### 5.6 Smart Assistant (Professor)

Assistente inteligente que oferece ao professor **insights diários** sobre:
- Saúde das turmas
- Pendências de notas e frequência
- Alertas de alunos

### 5.7 Ecossistema Integrado

```
       ┌──────────────┐
       │   ESCOLA      │
       │  (Gestor +    │
       │  Funcionários)│
       └──────┬───────┘
              │
    ┌─────────┼─────────┐
    ▼         ▼         ▼
┌────────┐ ┌────────┐ ┌──────────────┐
│Professor│ │ Família │ │  Marketplace │
│ Módulo  │ │ Portal  │ │  Lojistas /  │
│ próprio │ │  V2     │ │  Profission. │
└────────┘ └────────┘ └──────────────┘
              │
              ▼
      ┌──────────────┐
      │  FLUXOO       │
      │  Super Admin  │
      │  (Plataforma) │
      └──────────────┘
```

---

## 6. BANCO DE DADOS — PostgreSQL

### Visão Geral

- **75+ tabelas** com relacionamentos complexos
- **15+ views** otimizadas para consultas frequentes
- **20+ RPCs** (stored procedures) para operações críticas
- **RLS (Row-Level Security)** em todas as tabelas

### Principais Entidades

| Grupo | Tabelas |
|-------|---------|
| **Core** | escolas, filiais, alunos, turmas, funcionários, responsáveis |
| **Acadêmico** | matrículas, frequências, notas, avaliações, boletins, disciplinas, planos_aula, atividades, calendário_letivo, grade_horária |
| **Financeiro** | cobranças, contas_pagar, config_financeira, overrides_financeiros |
| **Pagamentos** | gateway_config, gateway_tenant_config, webhook_events_log |
| **Assinaturas** | planos, módulos, assinaturas, faturas, preços |
| **RBAC** | system_modules, permissions, perfis_acesso, perfil_permissions, cargos_v2, audit_logs_v2 |
| **Portal** | portal_audit_log, notificações_família, fila_virtual, selos, documentos, autorizações |
| **Comunicação** | mural_avisos, eventos, notificações |
| **Marketplace** | lojistas, marketplace_categorias |
| **Operacional** | almoxarifado_itens, almoxarifado_movimentações, transferências_escolares |

### Views Estratégicas

| View | Propósito |
|------|-----------|
| `vw_cobrancas_com_encargos` | Cálculo de multa e juros por atraso |
| `vw_boletim_completo` | Boletim com todas as disciplinas |
| `vw_professor_agenda_hoje` | Agenda do professor para o dia |
| `vw_radar_evasao` | Risco de evasão por aluno |
| `vw_alerta_evasao_familiar` | Alerta de evasão para famílias |
| `vw_aprovacoes_pendentes` | Workflows de aprovação pendentes |
| `vw_professor_saude_turmas` | Saúde das turmas (indicadores) |

---

## 7. MODELO DE NEGÓCIO

### SaaS Multi-tenant

- **Planos de assinatura** com diferentes módulos habilitados
- **Módulos independentes** que podem ser contratados separadamente
- **Precificação por filial** (cada unidade pode ter preços diferentes)
- **Faturamento recorrente** via gateways integrados
- **Upgrade de planos** com solicitação e aprovação

### Canais de Receita

1. **Assinatura mensal** das escolas (planos + módulos)
2. **Marketplace** (comissão sobre vendas de lojistas)
3. **Serviços de consultoria** em transformação digital
4. **Desenvolvimento** de soluções personalizadas

---

## 8. ESTRUTURA DO PROJETO

```
fluxoo-educacao/
├── src/                          # Código fonte principal
│   ├── main.tsx                  # Entry point + PWA
│   ├── App.tsx                   # Router + Providers
│   ├── components/
│   │   ├── ui/                   # 34 componentes shadcn/ui
│   │   ├── shared/               # Componentes compartilhados
│   │   ├── adaptive/             # AdaptiveView, AdaptiveModal
│   │   ├── mobile/               # BottomSheet, NativeCard, PullToRefresh
│   │   └── pwa/                  # PwaInstallPrompt
│   ├── layout/                   # 6 layouts (Admin, Professor, SuperAdmin, PortalV1, PortalV2, Shop)
│   ├── modules/                  # 30 módulos de negócio
│   ├── providers/                # RBACProvider
│   ├── stores/                   # Zustand stores
│   ├── hooks/                    # Hooks compartilhados
│   └── lib/                      # Utilitários (supabase, utils, validation, security, etc.)
├── supabase/
│   └── functions/
│       └── webhook-gateway/      # Edge Function de pagamentos
├── database/                     # Migrations SQL, schemas, fixes
├── e2e/                          # Testes Playwright
├── public/                       # Assets estáticos
└── .github/                      # GitHub Actions
```

---

## 9. INFRAESTRUTURA E DEPLOY

| Aspecto | Detalhe |
|---------|---------|
| **Hospedagem Frontend** | Vercel (SPA com rewrites e security headers) |
| **Hospedagem Backend** | Supabase (PostgreSQL gerenciado) |
| **Edge Functions** | Supabase (Deno runtime) |
| **Domínio** | Personalizável por cliente |
| **CDN** | Vercel Edge Network |
| **CSP** | Content Security Policy configurado |
| **Node.js** | 24.x (`.nvmrc`) |
| **CI/CD** | GitHub Actions (security checks) |
| **Git Hooks** | Husky v9 + lint-staged |

---

## 10. TESTES E QUALIDADE

| Tipo | Tecnologia | Cobertura |
|------|-----------|-----------|
| **E2E** | Playwright v1.57 | Fluxos críticos |
| **Lint** | ESLint + TypeScript | Todo o código |
| **Pré-commit** | Husky + lint-staged | Código modificado |
| **Security** | GitHub Actions | Análise estática |

---

## 11. PRÓXIMOS PASSOS (ROADMAP SUGERIDO)

1. ✅ **Core acadêmico + financeiro + portal** — 30 módulos operacionais
2. 🔄 **Marketplace** — Em implantação (lojistas, profissionais)
3. 📋 **Currículos** — Módulo em desenvolvimento
4. 🚀 **Próximas entregas sugeridas:**
   - App mobile nativo (React Native)
   - IA para predição de evasão escolar
   - Chat em tempo real escola-família
   - Integração com sistemas governamentais (SEDUC, etc.)
   - Assinatura digital de documentos
   - Dashboard com BI avançado

---

## 12. RESUMO EXECUTIVO

> **Fluxoo Educação** é uma plataforma SaaS de gestão educacional completa, construída com tecnologia de ponta (React 19, TypeScript, Supabase, Tailwind CSS v4) e arquitetura moderna (SPA + BaaS + PWA). Atende todos os stakeholders de uma instituição de ensino — da direção aos pais — em uma única plataforma integrada, mobile-first e com experiência nativa.
>
> **30 módulos**, **75+ tabelas**, **3 gateways de pagamento**, **RBAC V2.2 granular**, **Portal da Família V2**, **PWA instalável**, **LGPD compliance**, **multi-tenant escalável**.
>
> Pronto para implantação imediata com roadmap claro de evolução.

---

*Documento gerado em Julho/2026 — Análise completa do código-fonte v0.1.0*
