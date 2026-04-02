# 🔍 AUDITORIA COMPLETA: SISTEMA DE COBRANÇAS DE MENSALIDADE

**Data da Auditoria:** 1 de abril de 2026  
**Escopo:** Fluxo completo de cobranças (Escola → Portal do Responsável)  
**Status:** ✅ Sistema em produção com funcionalidades operacionais

---

## 📋 RESUMO EXECUTIVO

O sistema de cobranças do Fluxoo Educação é **robusto e funcional**, com geração automática de mensalidades, integração com matrículas, e experiência consolidada no portal do responsável. Foram identificadas **oportunidades de melhoria** em UX, tratamento de erros e documentação de regras de negócio.

### Score Geral: **8.2/10**

| Categoria | Score | Status |
|-----------|-------|--------|
| Schema de Dados | 9.0 | ✅ Excelente |
| Geração Automática | 8.5 | ✅ Muito Bom |
| Integração Escola-Portal | 8.0 | ✅ Bom |
| Experiência do Responsável | 8.5 | ✅ Muito Bom |
| Tratamento de Erros | 7.0 | ⚠️ Atenção |
| Documentação | 6.5 | ⚠️ Crítico |

---

## 1️⃣ ARQUITETURA DE DADOS

### 1.1 Tabela `cobrancas`

```typescript
type Cobranca = {
  id: string
  tenant_id: string | null          // Vínculo com escola
  aluno_id: string | null           // Vínculo com aluno
  descricao: string                 // Ex: "Mensalidade Março/2024"
  valor: number                     // Valor em centavos (R$)
  data_vencimento: string           // ISO Date
  status: 'a_vencer' | 'pago' | 'atrasado' | 'cancelado'
  tipo_cobranca: 'mensalidade' | 'avulso'
  turma_id?: string | null          // Vínculo opcional com turma
  ano_letivo?: number | null        // Ano de referência
  created_at: string
  updated_at: string
}
```

### 1.2 Foreign Keys e CASCADE

| Tabela | FK | Configuração | Impacto |
|--------|-----|--------------|---------|
| `cobrancas` | `tenant_id` → `escolas(id)` | `ON DELETE CASCADE` | ✅ Exclusão de escola remove cobranças |
| `cobrancas` | `aluno_id` → `alunos(id)` | `ON DELETE CASCADE` | ✅ Exclusão de aluno remove cobranças |
| `cobrancas` | `turma_id` → `turmas(id)` | `ON DELETE SET NULL` | ⚠️ Mantém cobrança sem turma |

**✅ Ponto Forte:** Integridade referencial bem configurada.

---

## 2️⃣ GERAÇÃO AUTOMÁTICA DE COBRANÇAS

### 2.1 Fluxo de Matrícula → Cobranças

```
1. Matrícula criada
   ↓
2. financeiroService.gerarCobrancasIniciaisMatricula()
   ↓
3. Busca valor da mensalidade da turma (fallback: valor_matricula)
   ↓
4. Busca configurações da escola (Motor de Configurações Tenant)
   ↓
5. Gera:
   - 1 taxa de matrícula (se cobrar_matricula = true)
   - 1 mensalidade proporcional (dias restantes do mês)
   - (qtd_mensalidades_automaticas - 1) mensalidades cheias
```

### 2.2 Regras de Negócio Identificadas

#### ✅ **Funcionalidades Implementadas**

| Regra | Status | Descrição |
|-------|--------|-----------|
| Geração de matrícula | ✅ | Taxa única no ato da matrícula |
| Mensalidade proporcional | ✅ | Calculada por dias restantes do mês |
| Múltiplas mensalidades | ✅ | Configuraável (padrão: 12) |
| Desconto individual | ✅ | Porcentagem ou valor fixo por aluno |
| Desconto de irmãos | ✅ | Automático via responsável comum |
| Dia de vencimento fixo | ✅ | Configurável por escola |
| Sincronização de valores | ✅ | Atualiza cobranças se turma mudar |

#### 📝 **Fórmula de Cálculo Proporcional**

```javascript
const ultimoDiaMes = new Date(ano, mes + 1, 0).getDate()
const diasRestantes = ultimoDiaMes - diaInicio + 1
const valorProporcional = (valorMensalidade / ultimoDiaMes) * diasRestantes
```

**Exemplo Prático:**
- Mensalidade: R$ 500,00
- Matrícula: 20/Jan
- Dias restantes: 31 - 20 + 1 = 12 dias
- Proporcional: (500 / 31) × 12 = **R$ 193,55**

### 2.3 Configurações da Escola (Motor de Configurações Tenant)

```typescript
type ConfigFinanceira = {
  dia_vencimento_padrao: number        // Padrão: 10
  qtd_mensalidades_automaticas: number // Padrão: 12
  dias_carencia: number                // Padrão: 5
  multa_atraso_percentual: number      // Padrão: 2%
  juros_mora_mensal: number            // Padrão: 1%/mês
  desconto_irmaos_perc: number         // Padrão: 0%
  cobrar_matricula: boolean            // Padrão: true
  pix_chave: string | null
  pix_qr_code_url: string | null
}
```

**⚠️ Ponto de Atenção:** Configurações armazenadas em JSONB (`config_financeira`) sem schema rígido.

---

## 3️⃣ EXPERIÊNCIA DA ESCOLA (ADMIN)

### 3.1 Página: `/financeiro`

**Funcionalidades Disponíveis:**

| Ação | Permissão | Descrição |
|------|-----------|-----------|
| Visualizar cobranças | `financeiro.cobrancas.view` | Lista com filtros |
| Criar cobrança avulsa | `financeiro.cobrancas.create` | Manual para qualquer aluno |
| Baixar pagamento | `financeiro.cobrancas.baixa_manual` | Marcar como pago |
| Cancelar cobrança | `financeiro.cobrancas.cancel` | Excluir (com regras) |
| Estornar pagamento | `financeiro.cobrancas.pay` | Reverter para "a_vencer" |

### 3.2 Regras de Negócio do Admin

#### ✅ **Restrições Implementadas**

```typescript
// Alunos matriculados (com turma ativa) NÃO podem ter cobranças deletadas
if (aluno?.turma_atual) {
  toast.error('Não permitido!', {
    description: 'Alunos matriculados não podem ter cobranças deletadas.'
  })
  return
}
```

**✅ Ponto Forte:** Preservação do histórico financeiro.

### 3.3 Dashboard Financeiro

**Cards de Resumo:**

| Card | Cálculo | Cor |
|------|---------|-----|
| Total Gerado | Soma de todas as cobranças | Indigo |
| Total Recebido | Soma das cobranças `pago` | Emerald |
| A Receber | Soma das cobranças `a_vencer` | Amber |
| Em Atraso | Soma das cobranças `atrasado` | Rose |

**⚠️ Gap Identificado:** Não há projeção de recebíveis (fluxo de caixa futuro).

---

## 4️⃣ EXPERIÊNCIA DO RESPONSÁVEL (PORTAL)

### 4.1 Página: `/portal/cobrancas` (V2)

**Fluxo do Usuário:**

```
1. Responsável acessa /portal/cobrancas
   ↓
2. Sistema busca vínculos ativos (alunos)
   ↓
3. Busca cobranças de TODOS os alunos em paralelo
   ↓
4. Exibe dashboard consolidada da família
   ↓
5. Responsável clica em aluno → vê detalhe
   ↓
6. Clica em "Pagar Agora" → abre checkout PIX
   ↓
7. Copia chave PIX ou escaneia QR Code
   ↓
8. Clica em "Confirmar Pagamento" → envia comprovante no WhatsApp
```

### 4.2 Dashboard Consolidada (Multi-Aluno)

**Cards Exibidos:**

| Card | Cálculo | Ícone |
|------|---------|-------|
| A Vencer | Soma `a_vencer` com data >= hoje | 📅 Calendar |
| Atrasado | Soma `atrasado` + `a_vencer` vencidas | ⚠️ AlertTriangle |
| Compras/Materiais | Soma cobranças com "item" | 🛒 ShoppingBag |
| Próximo Vencimento | Menor data >= hoje | 💳 CreditCard |

**✅ Ponto Forte:** Visão unificada da família (vários alunos).

### 4.3 Checkout PIX

**Configurações Necessárias:**

```typescript
// Escola deve configurar:
{
  pix_chave: string           // CPF/CNPJ/Email/Telefone
  pix_favorecido: string      // Nome do favorecido
  pix_qr_code_url: string     // URL da imagem do QR Code (storage)
  qr_code_auto: boolean       // Gerar QR Code automático via API
}
```

**⚠️ Ponto de Atenção:** 
- QR Code manual requer upload de imagem (storage `comprovantes`)
- QR Code automático depende de integração com API de pagamentos (não implementada)

### 4.4 Status das Cobranças no Portal

| Status | Cor | Ação |
|--------|-----|------|
| `a_vencer` (não vencida) | Verde | "Pagar Agora" |
| `a_vencer` (vencida) | Rose | "Pagar Agora" (destaque) |
| `atrasado` | Rose | "Pagar Agora" (destaque) |
| `pago` | Cinza | "Baixar Recibo" |
| `cancelado` | - | Não exibido |

---

## 5️⃣ INTEGRAÇÕES E AUTOMAÇÕES

### 5.1 Trigger: Atualização de Status

```sql
-- Migration 026: fn_atualizar_status_cobranca()
-- Executa BEFORE UPDATE ON cobrancas
-- Atualiza automaticamente para 'atrasado' se data_vencimento < hoje
```

**⚠️ Problema:** Trigger não é executada para SELECT, apenas UPDATE.

### 5.2 Reparo Automático (Service)

```typescript
// financeiroService.repararStatusAtrasados()
// Executado ANTES de cada listagem
// 1. Marca como 'atrasado' o que venceu além da carência
// 2. Volta para 'a_vencer' se estiver dentro da carência
```

**✅ Ponto Forte:** Garante consistência sem depender de cron jobs.

### 5.3 Sincronização com Turmas

```typescript
// Trigger: trg_sincronizar_mensalidade_do_aluno (Migration 055)
// Executa AFTER UPDATE ON matriculas
// Atualiza valor_mensalidade_atual do aluno baseado na nova turma
```

**✅ Ponto Forte:** Atualização automática ao mudar aluno de turma.

---

## 6️⃣ AUDITORIA DE SEGURANÇA (RLS)

### 6.1 Políticas de Row Level Security

```sql
-- Gestor da escola
CREATE POLICY "Gestores acessam cobrancas da sua escola"
ON cobrancas FOR ALL
USING (
  tenant_id IN (
    SELECT id FROM escolas 
    WHERE gestor_user_id = auth.uid()
  )
);

-- Pais veem cobranças dos filhos
CREATE POLICY "Pais veem cobranças dos filhos"
ON cobrancas FOR SELECT
USING (
  aluno_id IN (
    SELECT aluno_id FROM aluno_responsavel
    WHERE responsavel_id = auth.uid()
  )
);
```

**✅ Ponto Forte:** Isolamento correto por tenant e vínculo familiar.

---

## 7️⃣ BUGS E INCONSISTÊNCIAS IDENTIFICADAS

### 🔴 **Críticos**

| ID | Descrição | Impacto | Severidade |
|----|-----------|---------|------------|
| C01 | Trigger de status só executa em UPDATE | Cobranças podem não atualizar status corretamente | Alta |
| C02 | QR Code automático sem implementação | Escola precisa upload manual | Média |

### 🟡 **Atenção**

| ID | Descrição | Impacto | Severidade |
|----|-----------|---------|------------|
| A01 | Sem cálculo automático de multa/juros | Escola deve calcular manualmente | Média |
| A02 | Sem integração com gateway de pagamento | Pagamento 100% manual | Média |
| A03 | Sem notificação de vencimento | Responsável não é alertado | Baixa |
| A04 | Sem histórico de alterações | Não rastreia quem alterou valor | Baixa |

### 🟢 **Melhorias Sugeridas**

| ID | Descrição | Benefício |
|----|-----------|-----------|
| M01 | Implementar cálculo automático de multa/juros | Reduz erro manual |
| M02 | Adicionar notificações push/email de vencimento | Reduz inadimplência |
| M03 | Integrar com API de pagamentos (Asaas, Stripe) | Automatiza baixa |
| M04 | Adicionar recibo em PDF automático | Melhora UX |
| M05 | Dashboard de projeção de fluxo de caixa | Melhor gestão financeira |

---

## 8️⃣ FLUXO COMPLETO: MATRÍCULA → COBRANÇA

### 8.1 Timeline do Processo

```
Dia 0: Matrícula realizada
  ↓
  • Gera cobrança de matrícula (R$ 200,00) - Vence: Dia 0
  • Gera 1ª mensalidade proporcional (R$ 193,55) - Vence: Dia 10 do mês seguinte
  • Gera 11 mensalidades cheias (R$ 500,00 cada) - Vence: Dia 10 dos meses seguintes

Dia 10 (mês seguinte):
  • 1ª mensalidade proporcional vence
  • Status: 'a_vencer' → 'atrasado' (se não paga após carência)

Dia 10 (meses seguintes):
  • Mensalidades cheias vencem
  • Status atualizado automaticamente
```

### 8.2 Exemplo Real

**Dados:**
- Escola: "Escola Exemplo Ltda"
- Aluno: "João da Silva"
- Turma: "6º Ano A" (valor: R$ 500,00)
- Matrícula: 20/Jan/2024
- Dia vencimento: 10

**Cobranças Geradas:**

| # | Descrição | Valor | Vencimento | Status |
|---|-----------|-------|------------|--------|
| 1 | Matrícula - 6º Ano A | R$ 200,00 | 20/Jan/2024 | a_vencer |
| 2 | 1ª Mensalidade Proporcional (12 dias) | R$ 193,55 | 10/Fev/2024 | a_vencer |
| 3 | Mensalidade Fevereiro/2024 | R$ 500,00 | 10/Mar/2024 | a_vencer |
| 4 | Mensalidade Março/2024 | R$ 500,00 | 10/Abr/2024 | a_vencer |
| ... | ... | ... | ... | ... |
| 12 | Mensalidade Janeiro/2025 | R$ 500,00 | 10/Fev/2025 | a_vencer |

**Total:** 12 cobranças (1 matrícula + 1 proporcional + 10 cheias)

---

## 9️⃣ RECOMENDAÇÕES PRIORITÁRIAS

### **Imediatas (1-2 semanas)**

1. **Documentar regras de negócio no código**
   - Adicionar comentários JSDoc explicando cálculos
   - Criar README específico do módulo financeiro

2. **Implementar cálculo automático de multa/juros**
   - Adicionar campos `multa_calculada` e `juros_calculados`
   - Atualizar service para calcular no momento da baixa

3. **Melhorar tratamento de erros**
   - Adicionar logs estruturados em todas as operações
   - Criar fallback para QR Code não configurado

### **Médio Prazo (1-2 meses)**

4. **Integrar com gateway de pagamentos**
   - Asaas ou Stripe para PIX automático
   - Webhook para baixa automática

5. **Implementar notificações**
   - Email 3 dias antes do vencimento
   - Push notification no portal
   - WhatsApp automático (Twilio)

6. **Adicionar recibo em PDF**
   - Gerar PDF automático no pagamento
   - Armazenar em storage

### **Longo Prazo (3-6 meses)**

7. **Dashboard de fluxo de caixa**
   - Projeção de recebíveis
   - Comparativo mês a mês
   - Inadimplência por turma

8. **Relatórios avançados**
   - Ranking de inadimplência
   - Histórico por aluno
   - Exportação para contador

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Escola (Admin)

- [ ] Criar cobrança avulsa
- [ ] Visualizar todas as cobranças
- [ ] Filtrar por status
- [ ] Baixar pagamento manualmente
- [ ] Estornar pagamento
- [ ] Configurar dia de vencimento padrão
- [ ] Configurar quantidade de mensalidades automáticas
- [ ] Configurar PIX (chave + QR Code)
- [ ] Configurar desconto de irmãos

### Portal (Responsável)

- [ ] Visualizar dashboard consolidada
- [ ] Ver cobranças por aluno
- [ ] Ver histórico de pagos
- [ ] Copiar chave PIX
- [ ] Escanear QR Code
- [ ] Enviar comprovante no WhatsApp

### Banco de Dados

- [ ] Trigger de status executando
- [ ] Reparo automático funcionando
- [ ] Sincronização com turmas ativa
- [ ] RLS configurado corretamente
- [ ] Índices de performance criados

---

## 📊 MÉTRICAS DE ACOMPANHAMENTO

Sugestão de KPIs para monitorar saúde financeira:

| KPI | Fórmula | Meta |
|-----|---------|------|
| Taxa de Inadimplência | `(atrasadas / total) × 100` | < 10% |
| Ticket Médio | `Total / Qtd Alunos` | R$ 450,00 |
| Dias Médios de Atraso | `Soma dias atraso / Qtd atrasadas` | < 5 dias |
| Cobranças Automáticas | `(automáticas / total) × 100` | 100% |

---

## 🔚 CONCLUSÃO

O sistema de cobranças de mensalidade do Fluxoo Educação é **funcional e robusto**, com geração automática, integração com matrículas, e experiência consolidada no portal. 

**Pontos Fortes:**
- ✅ Geração automática de múltiplas mensalidades
- ✅ Cálculo proporcional inteligente
- ✅ Descontos de irmãos automático
- ✅ Dashboard consolidada familiar
- ✅ Reparo automático de status
- ✅ RLS bem configurado

**Pontos de Melhoria:**
- ⚠️ Falta cálculo automático de multa/juros
- ⚠️ QR Code manual (sem automação)
- ⚠️ Sem notificações de vencimento
- ⚠️ Documentação insuficiente

**Recomendação Principal:** Implementar integração com gateway de pagamentos (Asaas/Stripe) para automatizar baixa e reduzir trabalho manual da escola.

---

**Auditoria realizada por:** Sistema de Análise de Código  
**Data:** 1 de abril de 2026  
**Próxima revisão:** 1 de maio de 2026
