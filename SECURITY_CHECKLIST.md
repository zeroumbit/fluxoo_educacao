# ✅ Checklist de Correções de Segurança

**Objetivo:** Resolver todas as vulnerabilidades identificadas no SECURITY_AUDIT.md

---

## 🔴 FASE 1 - CRÍTICO (24-48 horas)

### 1.1 Remover Emails Hardcoded
- [ ] `src/lib/config.ts` - Remover fallback de email do SUPER_ADMIN_EMAIL
- [ ] `database/updates/067_rbac_blindagem_rls.sql` - Remover email hardcoded da função has_permission()
- [ ] Adicionar validação no build para exigir VITE_SUPER_ADMIN_EMAIL
- [ ] Atualizar .env.example com instrução de preenchimento obrigatório

### 1.2 Reabilitar RLS em Todas as Tabelas
- [ ] Criar migration de emergência: `database/updates/068_enable_rls_all_tables.sql`
- [ ] Habilitar RLS em: escolas, turmas, filiais
- [ ] Habilitar RLS em todas as tabelas do 008_modulos_avancados
- [ ] Habilitar RLS em atividades_turmas, planos_aula_turmas
- [ ] Habilitar RLS em tabelas de autorizações (041_autorizacoes_responsaveis)
- [ ] Criar políticas RLS baseadas em tenant_id
- [ ] Testar isolamento de tenants em staging

### 1.3 Corrigir Bypass de Permissão
- [ ] Remover bypass por email hardcoded em has_permission()
- [ ] Remover bypass total para role 'gestor'
- [ ] Implementar validação granular de permissões
- [ ] Criar testes unitários para função has_permission()

### 1.4 Sanitizar dangerouslySetInnerHTML
- [ ] `npm install dompurify`
- [ ] `npm install --save-dev @types/dompurify`
- [ ] `src/modules/portal/components/ModalContratoEscola.tsx` - Adicionar DOMPurify
- [ ] `src/modules/documentos/components/ContratoTab.tsx` - Adicionar DOMPurify
- [ ] `src/components/ui/RichTextEditor.tsx` - Adicionar DOMPurify
- [ ] Testar com payloads XSS conhecidos

---

## 🟠 FASE 2 - ALTO (1 semana)

### 2.1 Validação de Role no Backend
- [ ] Implementar claims JWT no Supabase
- [ ] Adicionar validação de claims em todas as políticas RLS
- [ ] Remover lógica de validação de super_admin do AuthContext
- [ ] Testar validação em staging

### 2.2 Proteger Dados no AuthContext
- [ ] Remover dados sensíveis não essenciais do contexto
- [ ] Implementar criptografia para dados sensíveis no storage
- [ ] Configurar session timeout de 30 minutos
- [ ] Migrar de localStorage para sessionStorage

### 2.3 Validar Sessão no Backend
- [ ] Criar Edge Function para signup de alunos
- [ ] Configurar rate limiting no Supabase (10 req/min por IP)
- [ ] Habilitar email confirmation obrigatório
- [ ] Testar fluxo completo de signup

### 2.4 Proteger Chaves do Supabase
- [ ] Auditar todas as políticas RLS existentes
- [ ] Configurar rate limiting no Supabase
- [ ] Implementar monitoramento de requisições suspeitas
- [ ] Documentar políticas de acesso

---

## 🟡 FASE 3 - MÉDIO (2-4 semanas)

### 3.1 Remover Console Logs de Produção
- [ ] Criar módulo de logger centralizado (`src/utils/logger.ts`)
- [ ] Substituir console.log em `src/modules/alunos/service.ts`
- [ ] Substituir console.log em `src/modules/alunos/pages/AlunoCadastroPage.web.tsx`
- [ ] Substituir console.log em `src/stores/rbac.store.ts`
- [ ] Integrar com Sentry (opcional)

### 3.2 Proteger Armazenamento Local
- [ ] Migrar rbac.store de localStorage para sessionStorage
- [ ] Implementar criptografia simples para dados sensíveis
- [ ] Adicionar verificação de integridade do estado

### 3.3 Validar APIs Externas
- [ ] Adicionar validação Zod em `src/hooks/use-viacep.ts`
- [ ] Implementar timeout nas requisições (5 segundos)
- [ ] Adicionar tratamento de erro robusto
- [ ] Validar resposta da API do IBGE também

### 3.4 Implementar Rate Limiting
- [ ] Rate limiting para login (5 tentativas/hora)
- [ ] Rate limiting para signup (3 tentativas/hora)
- [ ] Configurar Cloudflare rate limiting (se aplicável)
- [ ] Implementar backoff exponencial no frontend

### 3.5 Fortalecer Validação de Senha
- [ ] Aumentar mínimo para 8 caracteres
- [ ] Requerer letra maiúscula
- [ ] Requerer letra minúscula
- [ ] Requerer número
- [ ] Requerer símbolo
- [ ] Implementar verificação de senhas comuns

---

## 🟢 FASE 4 - BAIXO (Melhorias Contínuas)

### 4.1 Melhorar CSP
- [ ] Remover 'unsafe-inline' da CSP em produção
- [ ] Remover 'unsafe-eval' da CSP em produção
- [ ] Usar nonces para scripts inline necessários
- [ ] Testar todas as funcionalidades pós-mudança

### 4.2 Melhorias de Validação
- [ ] Manter e expandir validações com Zod
- [ ] Adicionar validação de CPF/CNPJ
- [ ] Implementar validação de telefone

---

## 📋 FASE 5 - PRÉ-PRODUÇÃO (1 mês)

### 5.1 Segurança Avançada
- [ ] Implementar 2FA para super admins e gestores
- [ ] Migrar operações sensíveis para Edge Functions
- [ ] Implementar auditoria de logs automatizada
- [ ] Criar dashboard de monitoramento de segurança

### 5.2 Testes e Validação
- [ ] Contratar pentest profissional
- [ ] Implementar testes automatizados de segurança
- [ ] Criar testes de isolamento de tenants
- [ ] Realizar testes de carga com segurança

### 5.3 Processos
- [ ] Criar plano de resposta a incidentes
- [ ] Documentar políticas de segurança
- [ ] Treinar equipe em segurança
- [ ] Estabelecer revisões periódicas de segurança

---

## 📊 Status do Checklist

| Fase | Total | Concluído | Pendente | % |
|------|-------|-----------|----------|---|
| Fase 1 - Crítico | 0 | 0 | 0 | 0% |
| Fase 2 - Alto | 0 | 0 | 0 | 0% |
| Fase 3 - Médio | 0 | 0 | 0 | 0% |
| Fase 4 - Baixo | 0 | 0 | 0 | 0% |
| Fase 5 - Pré-Produção | 0 | 0 | 0 | 0% |
| **TOTAL** | **0** | **0** | **0** | **0%** |

---

## 🎯 Critérios de Aceite por Fase

### Fase 1 (Crítico)
- ✅ Nenhum email hardcoded no código
- ✅ 100% das tabelas com RLS habilitado
- ✅ Nenhum bypass de permissão no banco
- ✅ Todo dangerouslySetInnerHTML sanitizado
- ✅ Testes de XSS passando

### Fase 2 (Alto)
- ✅ Validação de roles no backend
- ✅ Dados sensíveis protegidos no frontend
- ✅ Signup validado no backend
- ✅ Rate limiting configurado

### Fase 3 (Médio)
- ✅ Zero console.logs em produção
- ✅ SessionStorage usado para dados sensíveis
- ✅ APIs externas validadas com Zod
- ✅ Senhas fortes obrigatórias

### Fase 4 (Baixo)
- ✅ CSP sem unsafe-inline/unsafe-eval
- ✅ Validações robustas com Zod

### Fase 5 (Pré-Produção)
- ✅ Pentest realizado sem críticas/altas
- ✅ 2FA implementado
- ✅ Monitoramento ativo
- ✅ Plano de resposta a incidentes documentado

---

**Última Atualização:** 18 de março de 2026  
**Responsável:** @development-team  
**Próxima Revisão:** Após conclusão da Fase 1
