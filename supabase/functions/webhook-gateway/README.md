# Motor Financeiro v2 - Webhook Gateway + Concorrência

## Visão Geral

Sistema completo para recebimento de pagamentos via gateways (Asaas/Mercado Pago) com:
- **Idempotência** via `webhook_events_log`
- **Concorrência segura** via `SELECT FOR UPDATE NOWAIT`
- **Multi-tenant**: cada escola configura seus tokens independentemente
- **Controle do Super Admin**: ativa/desativa gateways globalmente

---

## Arquitetura de Ativação de Gateways

```
┌─────────────────────────────────────────────────────────────┐
│  SUPER ADMIN                                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ GatewayConfigPage                                      │ │
│  │ - Ativa/desativa gateways (ativo_global)               │ │
│  │ - Define quais gateways estão disponíveis na plataforma │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │ gateway_config.ativo_global = true
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  ESCOLA (Tenant)                                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ GatewayTenantConfigPage                                │ │
│  │ - Vê apenas gateways com ativo_global = true            │ │
│  │ - Configura seus tokens (api_token, webhook_token, etc) │ │
│  │ - Ativa/desativa para si mesma                          │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │ gateway_tenant_config (tokens da escola)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  EDGE FUNCTION (webhook-gateway)                            │
│  1. Recebe webhook do gateway                               │
│  2. Identifica tenant via externalReference (cobranca.id)    │
│  3. Busca tokens da escola no banco                          │
│  4. Valida token do webhook                                  │
│  5. Checa idempotência                                       │
│  6. Chama RPC com SELECT FOR UPDATE                          │
│  7. Retorna 200 para o gateway                               │
└──────────────────────┬──────────────────────────────────────┘
                       │ RPC: registrar_pagamento_webhook
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  POSTGRESQL (RPC)                                           │
│  SELECT * FROM cobrancas WHERE id = ? FOR UPDATE NOWAIT     │
│  → Se lock falha: retry                                     │
│  → Se já pago: rejeita (dupla proteção)                     │
│  → Calcula encargos                                         │
│  → UPDATE cobrancas SET pago = TRUE                         │
│  → INSERT audit_logs_v2                                     │
│  → INSERT webhook_events_log (idempotência)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Entregáveis

### 1. Migration: `137_motor_financeiro_v2.sql`

**Executar:**
```bash
supabase db push
# ou
psql -f database/updates/137_motor_financeiro_v2.sql
```

**Cria:**

| Objeto | Descrição |
|---|---|
| `gateway_config` | Tabela global (Super Admin ativa/desativa gateways) |
| `gateway_tenant_config` | Tokens criptografados por escola |
| `webhook_events_log` | Idempotência de webhooks |
| `vw_gateways_disponiveis` | View para UI da escola |
| `registrar_pagamento_webhook()` | RPC com `FOR UPDATE NOWAIT` |
| `baixar_boleto_concorrencia()` | RPC para baixa manual com `FOR UPDATE` |
| `gateway_disponivel_para_tenant()` | Verifica disponibilidade |
| `buscar_config_gateway_tenant()` | Retorna config (tokens) da escola |
| Colunas em `cobrancas` | `gateway_event_id`, `gateway_origem`, `webhook_payload` |
| Módulo `gateway_pagamento` | Registrado automaticamente |

### 2. Edge Function: `webhook-gateway/index.ts`

**Deploy:**
```bash
supabase functions deploy webhook-gateway
```

**Variáveis de ambiente:**
```bash
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

> **Nota:** Tokens dos gateways agora são armazenados no banco (`gateway_tenant_config`), não em variáveis de ambiente. A Edge Function busca as credenciais corretas para cada tenant automaticamente.

### 3. Páginas UI

| Página | Caminho | Quem usa |
|---|---|---|
| `GatewayConfigPage` | `/admin/gateways` | Super Admin |
| `GatewayTenantConfigPage` | `/financeiro/gateways` | Gestor da Escola |

---

## Fluxo Completo de Ativação

### Passo 1: Super Admin ativa o gateway

1. Super Admin acessa `/admin/gateways`
2. Vê lista de gateways disponíveis (Asaas, Mercado Pago, etc.)
3. Clica no **switch** para ativar `Asaas`
4. Sistema confirma: "Ativar o gateway Asaas para todas as escolas?"
5. `gateway_config.ativo_global = true`

### Passo 2: Escola configura seus tokens

1. Gestor acessa `/financeiro/gateways`
2. Vê `Asaas` como disponível (pois `ativo_global = true`)
3. Clica para expandir
4. Preenche os campos:
   - **API Token** (obtido no painel Asaas)
   - **Webhook Token** (obtido no painel Asaas)
   - **Modo Sandbox** (toggle para teste)
5. Ativa o gateway (toggle "Gateway ativo")
6. Clica em **Salvar Configuração**
7. `gateway_tenant_config` é criado com `ativo = true`

### Passo 3: Escola configura webhook no Asaas

1. No painel do Asaas, configurar webhook URL:
   ```
   https://<project-ref>.functions.supabase.co/webhook-gateway
   ```
2. O Asaas enviará eventos de pagamento para esta URL

### Passo 4: Pagamento recebido

1. Responsável paga mensalidade via PIX/Boleto no Asaas
2. Asaas envia webhook para Edge Function
3. Edge Function:
   - Identifica o tenant pelo `externalReference` (cobranca.id)
   - Busca tokens da escola no banco
   - Valida webhook token
   - Verifica idempotência em `webhook_events_log`
   - Chama `registrar_pagamento_webhook()` RPC
4. RPC:
   - `SELECT FOR UPDATE NOWAIT` na cobrança
   - Verifica se já está paga (dupla proteção)
   - Calcula encargos se houver atraso
   - Atualiza `cobrancas` com `pago = TRUE`
   - Registra em `audit_logs_v2` e `webhook_events_log`
5. Retorna 200 para o Asaas

---

## Fluxo de Idempotência

```
Evento 1: { event_id: "pay_123" } → Processado → INSERT webhook_events_log (status=processed)
Evento 2: { event_id: "pay_123" } → SELECT webhook_events_log → FOUND → Retorna 200 { ignored_duplicate }
```

**Garantia no banco:** Índice UNIQUE em `(gateway, gateway_event_id)` impede duplicatas mesmo em concorrência extrema.

---

## Concorrência SQL - Baixa Manual de Boletos

**Problema:** Dois gestores clicam "Baixar Boleto" simultaneamente → duas transações tentam atualizar a mesma cobrança.

**Solução:** `SELECT ... FOR UPDATE NOWAIT`

```sql
-- Na RPC baixar_boleto_concorrencia:
SELECT * FROM cobrancas WHERE id = p_cobranca_id AND deleted_at IS NULL
FOR UPDATE NOWAIT;
```

**Resultados possíveis:**

| Cenário | Resultado |
|---|---|
| Ninguém bloqueou | Transação adquire lock, processa, retorna sucesso |
| Outra transação já bloqueou | `lock_not_available` → retorna `{ success: false, concorrencia: true }` |
| Já estava pago | Retorna `{ success: false, ja_pago: true }` |

**Frontend deve tratar:**
```typescript
try {
  const result = await financeiroService.baixarBoletoComConcorrencia(cobrancaId)
  toast.success('Baixa realizada!')
} catch (err: any) {
  if (err.concorrencia) {
    toast.info('Processando... aguarde um momento.')
  } else if (err.jaPago) {
    toast.success('Já foi baixada anteriormente.')
  } else {
    toast.error(err.message)
  }
}
```

---

## Respostas HTTP da Edge Function

| Status | Quando | Gateway deve... |
|---|---|---|
| `200` | Sucesso OU duplicata ignorada | Parar (não reenviar) |
| `400` | Payload inválido / sem externalReference | Não reenviar |
| `401` | Token do webhook inválido | Não reenviar |
| `403` | Gateway não ativado pelo Super Admin ou escola | Não reenviar |
| `404` | Cobrança não encontrada | Não reenviar |
| `422` | RPC retornou erro de lógica | Não reenviar |
| `500` | Erro interno / banco indisponível | Reenviar (retry automático) |

---

## Segurança

### RLS (Row Level Security)

| Tabela | Política |
|---|---|
| `gateway_config` | Apenas Service Role (Super Admin via UI) |
| `gateway_tenant_config` | Gestor vê apenas configurações da própria escola |
| `webhook_events_log` | Apenas Service Role (Edge Function) |

### Tokens

- Tokens são armazenados em `gateway_tenant_config.configuracao` (JSONB)
- **Em produção:** usar `pgcrypto` para criptografar tokens no banco
- Comparação de tokens usa `constantTimeCompare` (previne timing attacks)

### Validações

| Nível | Validação |
|---|---|
| Edge Function | Token do webhook, estrutura do payload, gateway ativo |
| RPC (DB) | FOR UPDATE NOWAIT, dupla baixa, gateway suportado |
| View | Só mostra gateways com `ativo_global = true` |

---

## Monitoramento

### Consultas úteis

```sql
-- Gateways ativos por escola
SELECT e.razao_social, gtc.gateway, gtc.ativo, gtc.modo_teste, gtc.updated_at
FROM gateway_tenant_config gtc
JOIN escolas e ON e.id = gtc.tenant_id
WHERE gtc.ativo = true
ORDER BY gtc.updated_at DESC;

-- Eventos duplicados ignorados (indicam retries do gateway)
SELECT gateway, COUNT(*) as duplicatas
FROM webhook_events_log
WHERE processing_status = 'ignored_duplicate'
GROUP BY gateway;

-- Eventos com erro
SELECT gateway_event_id, gateway, processing_details, received_at
FROM webhook_events_log
WHERE processing_status = 'error'
ORDER BY received_at DESC
LIMIT 20;

-- Cobranças baixadas via webhook
SELECT c.id, c.valor_pago, c.gateway_origem, c.gateway_event_id, c.data_pagamento
FROM cobrancas c
WHERE c.gateway_event_id IS NOT NULL
ORDER BY c.data_pagamento DESC
LIMIT 20;

-- Latência média de processamento
SELECT gateway,
  AVG(EXTRACT(EPOCH FROM (processed_at - received_at))) as media_segundos
FROM webhook_events_log
WHERE processing_status = 'processed'
GROUP BY gateway;
```

---

## Checklist de Deploy

- [ ] Executar migration `137_motor_financeiro_v2.sql`
- [ ] Deploy da Edge Function: `supabase functions deploy webhook-gateway`
- [ ] Super Admin acessa `/admin/gateways` e ativa gateway(s) desejado(s)
- [ ] Escola acessa `/financeiro/gateways` e configura tokens
- [ ] Configurar URL do webhook no painel do gateway (Asaas/MP)
- [ ] Testar com pagamento de teste no sandbox
- [ ] Verificar logs em `webhook_events_log` após primeiro evento
- [ ] Configurar alertas para `processing_status = 'error'`

---

## Estrutura de Arquivos

```
database/updates/
  137_motor_financeiro_v2.sql        ← Migration completo

supabase/functions/webhook-gateway/
  index.ts                           ← Edge Function (multi-tenant)
  README.md                          ← Esta documentação

src/modules/super-admin/
  pages/GatewayConfigPage.tsx        ← UI do Super Admin
  service.ts                         ← Métodos getGatewayConfig, toggleGatewayGlobal
  hooks.ts                           ← useGatewayConfig, useToggleGatewayGlobal

src/modules/financeiro/
  pages/GatewayTenantConfigPage.tsx  ← UI da Escola
  service-avancado.ts                ← Métodos de gateway por tenant
  hooks-avancado.ts                  ← Hooks React Query
  service.ts                         ← baixarBoletoComConcorrencia()

src/lib/
  database.types.ts                  ← Tipos TypeScript atualizados
```
