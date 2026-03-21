# 📚 MEMÓRIA DO PROJETO - FLUXOO EDUCAÇÃO

**Data:** 21 de março de 2026  
**Versão:** 0.1.0  
**Status:** 11/12 correções implementadas, 1 em andamento (turmas)

---

## 🎯 REGRAS DE NEGÓCIO PRINCIPAIS

### Super Admin
- **NÃO gerencia escolas** (apenas auditoria)
- **Acesso global** para visualização
- **Email configurado** em `VITE_SUPER_ADMIN_EMAIL`
- **Identificado por claim JWT** `is_super_admin`

### Gestor
- **DONO da escola** - acesso TOTAL e IRRESTRITO
- **Identificado por** `gestor_user_id` na tabela `escolas`
- **Pode:** Ver, Criar, Editar, Excluir TUDO da sua escola
- **tenant_id** deve estar no JWT (metadata do Supabase Auth)

### Funcionário
- **Segue RBAC** (perfis de acesso)
- **Permissões por perfil** (view, create, edit, delete)
- **Escopos:** self, minhas_turmas, minha_unidade, toda_escola, rede

### Responsável (Portal da Família)
- **Login por CPF**
- **Acesso limitado** ao Portal
- **Vê apenas** dados dos seus filhos
- **Não acessa** Admin da escola

---

## 🔐 SEGURANÇA IMPLEMENTADA

### Senhas
- **Login:** Aceita 6+ caracteres (retrocompatibilidade)
- **Cadastro/Troca:** Exige 8+ caracteres e 1 maiúscula
- **Schema:** `loginPasswordSchema` vs `strongPasswordSchema`

### Rate Limiting
- **5 tentativas** de login por hora
- **Bloqueio:** 60 minutos após exceder limite
- **Hook:** `useLoginRateLimit`

### RLS (Row Level Security)
- **Habilitado** em todas as tabelas
- **Política única:** `gestor_acesso_total`
- **Regra:** `tenant_id = (auth.jwt() ->> 'tenant_id')::uuid`

### Logger
- **Centralizado:** `src/lib/logger.ts`
- **Sanitização:** Remove dados sensíveis
- **Produção:** Apenas erros críticos
- **Desenvolvimento:** Todos os níveis

---

## 📁 ESTRUTURA DE ARQUIVOS

### Migrations (database/updates)
```
001-050: Migrations iniciais
050: RBAC V2 Enterprise
060: Relatório financeiro
067: Blindagem RLS
071-073: Security hardening
078: Fix contas pagar permissions
079: Fix RBAC email hardcoded ✅
080: Enable RLS all tables ⚠️
081: Fix responsaveis login CPF ✅
082: Hardening RBAC gestor ✅
083: Materialized view fechamento ✅
084: Fix matrículas access ✅
085: Fix gestor acesso completo ✅
086: Fix emergencial simples ✅
087: Fix JWT tenant claims ⏳
088: Gestor acesso total irrestrito ✅
089: Gestor acesso total limpeza ✅
090: Correção definitiva gestor ⏳
```

### Documentos (raiz)
```
README.md - Visão geral
DEVELOPMENT.md - Guia de desenvolvimento
QWEN.md - Regras de negócio e memória
SUPER_ADMIN.md - Configuração Super Admin
CORRECAO_*.md - Documentação das correções
RELATORIO_COMPLETO_CORRECOES.md - Resumo geral
GUIA_EMERGENCIA_TURMAS.md - Resolver problema turmas
```

### Módulos (src/modules)
```
academico/ - Alunos, matrículas, turmas, etc.
agenda/ - Eventos
almoxarifado/ - Controle de estoque
alunos/ - Gestão de alunos
assinatura/ - Planos e pagamentos
auth/ - Autenticação e autorização
autorizacoes/ - Autorizações escolares
comunicacao/ - Mural, recados
configuracoes/ - Configurações gerais
documentos/ - Emissão de documentos
escolas/ - Gestão de escolas
escola-perfil/ - Perfil da escola
filiais/ - Gestão de filiais
financeiro/ - Cobranças, contas a pagar
frequencia/ - Frequência escolar
funcionarios/ - Gestão de funcionários
livros/ - Livros e materiais
portal/ - Portal da Família
rbac/ - Controle de acesso
super-admin/ - Administração da plataforma
turmas/ - Gestão de turmas
```

---

## 🚨 PROBLEMAS CONHECIDOS

### Turmas Não Aparecem (EM ANDAMENTO)

**Sintoma:** 9 turmas cadastradas não aparecem após migration 080

**Causa:** `tenant_id` não está no JWT

**Solução:**
1. Executar migration 087
2. Fazer logout e login
3. Validar JWT
4. Executar migration 090
5. Recarregar página

**Arquivo:** `GUIA_EMERGENCIA_TURMAS.md`

---

## 🛠️ COMANDOS ÚTEIS

### Desenvolvimento
```bash
npm run dev          # Iniciar desenvolvimento
npm run build        # Build de produção
npm run lint         # ESLint
npm run check-env    # Verificar .env
```

### Validação
```bash
# Verificar se VITE_SUPER_ADMIN_EMAIL está definida
npm run check-env

# Validar build
npm run build
```

### Git
```bash
git status
git add .
git commit -m "Descrição da mudança"
git push origin DESENVOLVIMENTO
```

---

## 📊 TECNOLOGIAS

| Categoria | Tecnologia | Versão |
|-----------|------------|--------|
| Frontend | React | 19.2 |
| Linguagem | TypeScript | 5.7 |
| Build | Vite | 7.3 |
| Estilo | Tailwind CSS | 4.2 |
| UI | Radix UI | 1.4 |
| Estado | Zustand | 5.0 |
| Cache | React Query | 5.90 |
| Forms | React Hook Form | 7.71 |
| Validação | Zod | 3.23 |
| Backend | Supabase | 2.9 |
| Banco | PostgreSQL | 15+ |
| Auth | Supabase Auth | - |
| Rotas | React Router | 7.13 |

---

## 📝 CHECKLIST DE DEPLOY

### Pré-Deploy
- [ ] Todas as migrations executadas
- [ ] JWT validado (tenant_id não null)
- [ ] Turmas aparecendo
- [ ] Matrículas aparecendo
- [ ] Contas a pagar aparecendo
- [ ] Login com senha antiga funciona
- [ ] Cadastro com senha forte funciona
- [ ] Logout funciona
- [ ] Rate limiting funciona
- [ ] Build sem erros

### Deploy
- [ ] Variáveis de ambiente configuradas
- [ ] `VITE_SUPER_ADMIN_EMAIL` definida
- [ ] `VITE_SUPABASE_URL` definida
- [ ] `VITE_SUPABASE_ANON_KEY` definida
- [ ] Build gerado com sucesso
- [ ] Deploy na Vercel

### Pós-Deploy
- [ ] Login funciona
- [ ] Turmas aparecem
- [ ] Criação de turma funciona
- [ ] Logout funciona
- [ ] Rate limiting funciona

---

## 🔗 LINKS ÚTEIS

- **Repositório:** https://github.com/zeroumbit/fluxoo_educacao
- **Supabase:** https://app.supabase.com
- **Vercel:** https://vercel.com
- **Documentação:** `/RELATORIO_COMPLETO_CORRECOES.md`
- **Emergência:** `/GUIA_EMERGENCIA_TURMAS.md`

---

**Última atualização:** 21 de março de 2026  
**Próxima revisão:** Após resolução do problema das turmas
