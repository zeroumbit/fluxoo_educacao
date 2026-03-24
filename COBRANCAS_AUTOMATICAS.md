# 📅 Cobranças Automáticas - Nova Funcionalidade

## 🎯 Visão Geral

O sistema agora gera **automaticamente todas as mensalidades** de uma vez quando um aluno é matriculado, seguindo o dia de vencimento padrão configurado pela escola.

---

## 📋 Como Funcionava Antes

```
Aluno matrícula em 07/03/2026
↓
Sistema gera:
  ✅ Taxa de matrícula
  ✅ 1ª mensalidade proporcional (vence 30 dias depois = 06/04/2026)
↓
FIM! Escola precisa criar manualmente as próximas mensalidades
```

### Problemas:
- ❌ Datas de vencimento variáveis (06/04, 06/05, 06/06...)
- ❌ Trabalho manual para criar mensalidades futuras
- ❌ Pais recebem cobranças em datas aleatórias
- ❌ Risco de esquecer de gerar mensalidades

---

## ✨ Como Funciona Agora

### Configuração Nova:
**`qtd_mensalidades_automaticas`** (padrão: 12)

Define quantas mensalidades serão geradas automaticamente na matrícula.

---

### Exemplo Prático:

**Dados:**
- Aluno: Paula
- Data Matrícula: 07/03/2026
- Dia Vencimento Padrão: 10
- Qtd. Mensalidades: 12
- Valor Mensalidade: R$ 500,00

**Geração Automática:**

| # | Descrição | Valor | Vencimento |
|---|-----------|-------|------------|
| 1 | Taxa de Matrícula | R$ 500,00 | 07/03/2026 |
| 2 | 1ª Mensalidade Proporcional (25 dias de março) | R$ 403,22 | **10/04/2026** |
| 3 | Mensalidade Abril 2026 | R$ 500,00 | **10/04/2026** |
| 4 | Mensalidade Maio 2026 | R$ 500,00 | **10/05/2026** |
| 5 | Mensalidade Junho 2026 | R$ 500,00 | **10/06/2026** |
| 6 | Mensalidade Julho 2026 | R$ 500,00 | **10/07/2026** |
| 7 | Mensalidade Agosto 2026 | R$ 500,00 | **10/08/2026** |
| 8 | Mensalidade Setembro 2026 | R$ 500,00 | **10/09/2026** |
| 9 | Mensalidade Outubro 2026 | R$ 500,00 | **10/10/2026** |
| 10 | Mensalidade Novembro 2026 | R$ 500,00 | **10/11/2026** |
| 11 | Mensalidade Dezembro 2026 | R$ 500,00 | **10/12/2026** |
| 12 | Mensalidade Janeiro 2027 | R$ 500,00 | **10/01/2027** |
| 13 | Mensalidade Fevereiro 2027 | R$ 500,00 | **10/02/2027** |

---

## 🔧 Regras de Negócio

### 1. Cálculo da Primeira Mensalidade (Proporcional)

```typescript
diasRestantes = ultimoDiaMes - diaMatricula + 1
valorProporcional = (valorMensalidade / diasDoMes) × diasRestantes
```

**Exemplo:**
- Matrícula: 07/03/2026
- Dias restantes de março: 31 - 7 + 1 = **25 dias**
- Valor proporcional: (500 / 31) × 25 = **R$ 403,22**

### 2. Data de Vencimento da Proporcional

```typescript
dataVencimento = diaVencimentoPadrao do mês seguinte
```

**Exemplo:**
- Matrícula: 07/03/2026
- Dia vencimento: 10
- Vencimento proporcional: **10/04/2026**

### 3. Demais Mensalidades

- **Valor:** Cheio (sem proporcionalidade)
- **Vencimento:** Mesmo dia padrão em todos os meses
- **Quantidade:** `qtd_mensalidades_automaticas - 1` (porque a primeira já é a proporcional)

### 4. Ajuste de Dias do Mês

Se o dia de vencimento for maior que o último dia do mês, usa o último dia:

```typescript
// Exemplo: dia_vencimento = 30, mês = fevereiro (28 dias)
dataVencimento = 28/02/2027
```

---

## 📁 Arquivos Alterados

### 1. `src/modules/escolas/hooks/useTenantSettings.ts`
- Adicionado campo `qtd_mensalidades_automaticas: number` na interface `ConfigFinanceira`
- Valor padrão: `12`

### 2. `src/modules/financeiro/service.ts`
- Função `gerarCobrancasIniciaisGenerico()` atualizada
- Agora gera loop de `qtd_mensalidades_automaticas - 1` mensalidades cheias

### 3. `database/scripts/add_qtd_mensalidades_automaticas.sql`
- Script de migration para atualizar configurações existentes

---

## 🎨 UI - Configurações Financeiras

### Novo Campo:

```
┌─────────────────────────────────────────┐
│ Qtd. Mensalidades                       │
│ ┌─────────────────────────────────┐     │
│ │ 12                              │     │
│ └─────────────────────────────────┘     │
│ Gerar na matrícula (padrão: 12)         │
└─────────────────────────────────────────┘
```

**Range permitido:** 1 a 24 mensalidades

---

## 🔄 Migration SQL

Execute no banco de dados:

```sql
-- Atualiza configurações existentes para incluir valor padrão
UPDATE configuracoes_escola
SET config_financeira = config_financeira || '{"qtd_mensalidades_automaticas": 12}'::jsonb
WHERE config_financeira IS NOT NULL
  AND (config_financeira->>'qtd_mensalidades_automaticas') IS NULL
  AND vigencia_fim IS NULL;
```

---

## ✅ Benefícios

| Para a Escola | Para os Pais |
|---------------|--------------|
| ✅ Sem trabalho manual | ✅ Previsibilidade financeira |
| ✅ Sem risco de esquecer | ✅ Vencimento sempre no mesmo dia |
| ✅ Fluxo de caixa planejado | ✅ Sem surpresas com datas aleatórias |
| ✅ Profissionalização | ✅ Organização das finanças familiares |

---

## 🚀 Próximos Passos Sugeridos

1. **Configuração por Escola:**
   - Permitir que cada escola defina sua quantidade padrão (6, 12, 24 meses)

2. **Regeração Automática:**
   - Quando aluno é rematriculado, gerar novas mensalidades automaticamente

3. **Dashboard Financeiro:**
   - Mostrar total de mensalidades a receber nos próximos meses

4. **Notificações:**
   - Alertar pais 3 dias antes do vencimento de cada mensalidade

---

## 📞 Suporte

Dúvidas sobre a implementação? Consulte:
- `src/modules/financeiro/service.ts` - Lógica de geração
- `database/scripts/add_qtd_mensalidades_automaticas.sql` - Migration
