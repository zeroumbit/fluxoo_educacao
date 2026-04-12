# 📋 Atualização do Onboarding - Configurações Obrigatórias

## Resumo da Mudança

Adicionado **3 novos passos críticos** no guia de configuração inicial (onboarding) das escolas:

1. ✅ **Cadastrar Funcionário** - Registro de funcionários da escola
2. ✅ **Configurar Financeiro** - Cobranças automáticas e dados de pagamento
3. ✅ **Configurar Autorizações** - Modelos de autorização para saída e atividades

---

## 🎯 Por Que Esta Mudança?

**Problema identificado:** Escolas começavam a usar o sistema sem configurar:
- ❌ Cadastro de funcionários
- ❌ Sistema de cobranças automáticas
- ❌ Modelos de autorizações para alunos
- ❌ Dados financeiros básicos

**Impacto:**
- Escolas sem gestão de equipe (funcionários não registrados)
- Escolas tinham que cobrar manualmente (ineficiente)
- Alunos saíam sem autorização registrada
- Problemas jurídicos e de segurança

**Solução:** Tornar estas configurações **obrigatórias** no onboarding.

---

## 📝 O Que Mudou

### 1. Guia de Onboarding (`OnboardingGuide.tsx`)

**Antes:** 4 passos
```typescript
[
  'perfil',
  'filial',
  'turma',
  'aluno'
]
```

**Agora:** 7 passos
```typescript
[
  'perfil',           // Perfil da Escola
  'filial',           // Unidades/Filiais
  'turma',            // Turmas
  'aluno',            // Alunos
  'funcionario',      // ⭐ NOVO - Cadastro de Funcionários
  'financeiro',       // Configurações Financeiras
  'autorizacoes'      // Modelos de Autorização
]
```

**Ícones:**
- Funcionário: `UserPlus` (usuário com sinal de mais)
- Financeiro: `Wallet` (carteira)
- Autorizações: `FileCheck` (documento com check)

---

### 2. Dashboard Service (`dashboard.service.ts`)

**Novas verificações:**

```typescript
// Verifica se escola tem funcionários cadastrados
const funcionarioRes = await supabase
  .from('funcionarios')
  .select('id')
  .eq('tenant_id', tenantId)
  .maybeSingle()

// Verifica se escola tem configuração financeira
const configFinanceiraRes = await supabase
  .from('config_financeira')
  .select('id')
  .eq('tenant_id', tenantId)
  .maybeSingle()

// Verifica se escola tem modelos de autorização
const autorizacoesRes = await supabase
  .from('autorizacoes_modelos')
  .select('id')
  .eq('tenant_id', tenantId)
  .maybeSingle()
```

**Retorno do onboarding:**
```typescript
onboarding: {
  perfilCompleto: boolean,
  possuiFilial: boolean,
  possuiTurma: boolean,
  possuiAluno: boolean,
  possuiFuncionario: boolean,  // ⭐ NOVO
  configFinanceira: boolean,
  autorizacoes: boolean
}
```

---

### 3. Dashboard Pages (Web + Mobile)

**Atualizado para passar novos status:**

```typescript
const onboardingStatus = {
  needsOnboarding: false,
  perfilCompleto: dashboardData?.onboarding?.perfilCompleto,
  possuiFilial: dashboardData?.onboarding?.possuiFilial,
  possuiTurma: dashboardData?.onboarding?.possuiTurma,
  possuiAluno: dashboardData?.onboarding?.possuiAluno,
  possuiFuncionario: dashboardData?.onboarding?.possuiFuncionario,  // ⭐ NOVO
  configFinanceira: dashboardData?.onboarding?.configFinanceira,
  autorizacoes: dashboardData?.onboarding?.autorizacoes,
}
```

**Condição de onboarding atualizada:**
```typescript
// Escola precisa completar onboarding se faltar:
onboardingStatus.needsOnboarding =
  !perfilCompleto ||
  !possuiFilial ||
  !possuiTurma ||
  !possuiAluno ||
  !possuiFuncionario ||     // ⭐ NOVO
  !configFinanceira ||
  !autorizacoes
```

---

## 🎨 UI/UX

### Card de Onboarding

**Layout:** Grid com 7 cards (antes 4)

**Cada card mostra:**
- ✅ Ícone (colorido se pendente, verde se completo)
- ✅ Título descritivo
- ✅ Breve descrição
- ✅ Link para a página de configuração
- ✅ Status (check verde se completo)

**Progresso:** Barra de progresso atualiza de ~14.28% por passo (100/7)

---

## 📍 Links de Configuração

| Passo | Link | Descrição |
|-------|------|-----------|
| Funcionário | `/funcionarios` | Cadastro de funcionários |
| Financeiro | `/configuracoes` | Configurações financeiras e cobranças |
| Autorizações | `/autorizacoes` | Modelos de autorização para alunos |

---

## 🔒 Regras de Negócio

### Quando Onboarding é Exibido?

**Para Gestor/Funcionário:**
```
Mostrar onboarding SE:
  - perfil NÃO completo
  - OU não tem filial
  - OU não tem turma
  - OU não tem aluno
  - OU não tem funcionário       ⭐ NOVO
  - OU NÃO tem config financeira
  - OU NÃO tem autorizacoes
```

**Para Professor:**
```
NÃO mostra onboarding (sempre pula)
```

---

## 📊 Critérios de "Completo"

| Configuração | Considerado Completo Quando |
|--------------|----------------------------|
| **Perfil** | Escola tem endereço preenchido |
| **Filial** | Existe pelo menos 1 filial/unidade |
| **Turma** | Existe pelo menos 1 turma |
| **Aluno** | Existe pelo menos 1 aluno |
| **Financeiro** ⭐ | Existe registro em `config_financeira` |
| **Autorizações** ⭐ | Existe pelo menos 1 modelo em `autorizacoes_modelos` |

---

## 🧪 Testes Necessários

### 1. Escola Nova (Sem Configurações)
- [ ] Onboarding aparece com 6 passos
- [ ] Todos os passos aparecem como "pendentes"
- [ ] Barra de progresso mostra 0%
- [ ] Clicar em "Configurar Financeiro" vai para `/configuracoes`
- [ ] Clicar em "Configurar Autorizações" vai para `/autorizacoes`

### 2. Escola com Config Financeira
- [ ] Passo "Financeiro" aparece como completo
- [ ] Barra de progresso mostra 83% (5/6 completos)
- [ ] Onboarding ainda aparece (falta autorizações)

### 3. Escola Completa
- [ ] Todos 6 passos completos
- [ ] Onboarding NÃO aparece
- [ ] Dashboard normal exibida

### 4. Professor
- [ ] Onboarding NUNCA aparece
- [ ] Acesso normal ao dashboard

---

## 📁 Arquivos Alterados

| Arquivo | Mudanças |
|---------|----------|
| `src/modules/alunos/components/OnboardingGuide.tsx` | +2 passos, novos ícones, nova interface |
| `src/modules/alunos/dashboard.service.ts` | +2 queries, +2 campos no retorno |
| `src/modules/alunos/pages/DashboardPage.web.tsx` | +2 status, condição atualizada |
| `src/modules/alunos/pages/DashboardPage.mobile.tsx` | +2 status, condição atualizada |

---

## 🚀 Implantação

### Banco de Dados

**Nenhuma mudança necessária!** As tabelas já existem:
- `config_financeira` - Já criada
- `autorizacoes_modelos` - Já criada

### Frontend

1. Fazer build: `npm run build`
2. Testar localmente
3. Deploy em produção

---

## 💡 Próximos Passos (Sugestões)

### 1. Melhorar Verificações

Atualmente verifica apenas "existe registro". Podemos melhorar:

```typescript
// Em vez de apenas existir, verificar se está completo
configFinanceira: !!(
  config.cobranca_automatica_ativa &&
  config.chave_pix &&
  config.dados_bancarios
)
```

### 2. Adicionar Mais Passos (Opcional)

Sugestões futuras:
- [ ] Configurar perfis de acesso (RBAC)
- [ ] Cadastrar pelo menos 1 funcionário
- [ ] Configurar e-mail institucional
- [ ] Integrar com WhatsApp

### 3. Gamificação

- [ ] Mostrar "Escola 100% Configurada" quando completo
- [ ] Badge/selo de "Escola Verificada"
- [ ] Progresso por categoria (Acadêmico, Financeiro, etc.)

---

## 📞 Dúvidas?

Este update garante que **todas as escolas comecem com o pé direito**, configurando desde o início as funcionalidades mais importantes para operação diária.

**Autor:** Fluxoo Development Team  
**Data:** 29 de março de 2026  
**Versão:** 2.1.0
