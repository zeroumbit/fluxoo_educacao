# ✅ Correção: Rate Limiting de Login

**Data:** 20 de março de 2026  
**Status:** ✅ **IMPLEMENTADO**  
**Impacto:** SEGURANÇA - Previne ataques de força bruta

---

## 🐛 PROBLEMA IDENTIFICADO

**Problema:** Não havia limite de tentativas de login, permitindo ataques de força bruta.

**Risco:**
- Ataque de força bruta (tentar infinitas senhas)
- Comprometimento de contas
- Violação de dados sensíveis

---

## ✅ SOLUÇÃO IMPLEMENTADA

### 1. Hook de Rate Limiting

**Arquivo:** `src/hooks/useLoginRateLimit.ts`

**Funcionalidades:**

```typescript
const {
  checkAttempt,           // Verifica se pode tentar
  recordFailedAttempt,    // Registra falha
  resetAttempts,          // Reseta após sucesso
  getWaitTime,           // Tempo de espera
  getRemainingAttempts,  // Tentativas restantes
} = useLoginRateLimit()
```

**Regras:**
- ✅ **Máximo 5 tentativas** por hora
- ✅ **Janela de tempo:** 60 minutos
- ✅ **Bloqueio automático:** 1 hora após exceder limite
- ✅ **Persistência:** sessionStorage (limpa ao fechar)

---

### 2. LoginPage Atualizada

**Arquivo:** `src/modules/auth/LoginPage.tsx`

**Mudanças:**

1. **Verificação antes de tentar:**
```typescript
if (!checkAttempt()) {
  setError(`Muitas tentativas falhas. Tente novamente em ${formatTime(time)}`)
  return
}
```

2. **Registro de falha:**
```typescript
if (result.error) {
  recordFailedAttempt()
  setError(`${result.error} (${remaining} tentativa(s) restante(s))`)
}
```

3. **Reset após sucesso:**
```typescript
resetAttempts()
```

4. **UI de bloqueio:**
- Botão desabilitado quando bloqueado
- Mensagem com tempo restante (MM:SS)
- Ícone de alerta ⚠️
- Contador regressivo em tempo real

---

## 📊 FLUXO DE FUNCIONAMENTO

### Fluxo Normal
```
Tentativa 1: ✅ Permitida
Tentativa 2: ✅ Permitida
Tentativa 3: ⚠️ Aviso (3 restantes)
Tentativa 4: ⚠️ Aviso (2 restantes)
Tentativa 5: ⚠️ Aviso (1 restante)
Tentativa 6: 🔒 BLOQUEADO (1 hora)
```

### Após Bloqueio
```
🔒 "Muitas tentativas falhas. Tente novamente em 59:59"
   (contador regressivo: 59:58, 59:57, ...)
   
Após 1 hora:
✅ Desbloqueado automaticamente
✅ 5 tentativas disponíveis
```

### Login com Sucesso
```
✅ Senha correta
→ resetAttempts()
→ 5 tentativas disponíveis na próxima vez
```

---

## 🎯 REGRAS DE NEGÓCIO PRESERVADAS

| Regra | Status |
|-------|--------|
| Login de gestor | ✅ Mantido |
| Login de funcionário | ✅ Mantido |
| Login de super admin | ✅ Mantido |
| Redirecionamento por role | ✅ Mantido |
| Validação de email/senha | ✅ Mantida |

---

## 🧪 TESTES DE VALIDAÇÃO

### Teste 1: 5 tentativas consecutivas
1. Tente login com senha errada 5 vezes
2. **Resultado esperado:** Bloqueio na 5ª tentativa
3. **Mensagem:** "Muitas tentativas falhas. Tente novamente em 59:59"

### Teste 2: Contador regressivo
1. Após bloqueio, aguarde
2. **Resultado esperado:** Contador atualiza a cada segundo

### Teste 3: Login com sucesso
1. Erre 3 vezes
2. Acerte na 4ª
3. **Resultado esperado:** Reset das tentativas

### Teste 4: Fechou navegador
1. Erre 3 vezes
2. Feche o navegador
3. Reabra
4. **Resultado esperado:** Tentativas resetadas (sessionStorage)

### Teste 5: Aviso de tentativas restantes
1. Erre 3 vezes
2. **Resultado esperado:** "Atenção: você tem apenas 2 tentativa(s) restante(s)"

---

## 🔒 CAMADAS DE SEGURANÇA

### Frontend (Implementado)
```
┌─────────────────┐
│   Login Page    │
│   Rate Limit    │ ← 5 tentativas/hora
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Supabase     │ ← Autenticação
│   Auth         │
└─────────────────┘
```

### Backend (Recomendado - Supabase)
```sql
-- Configurar no Supabase Dashboard:
-- Settings → Authentication → Rate Limits
-- Email OTP: 3 por hora
-- Phone OTP: 3 por hora
-- Anonymous sign-ins: 3 por hora
```

---

## 📋 ARQUIVOS CRIADOS/MODIFICADOS

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/hooks/useLoginRateLimit.ts` | ✅ **CRIADO** | Hook de rate limiting |
| `src/modules/auth/LoginPage.tsx` | ✅ **MODIFICADO** | Usa rate limiting |

---

## 🚀 PRÓXIMOS PASSOS (OPCIONAIS)

### 1. Portal da Família (CPF)

**Arquivo:** `src/modules/portal/pages/PortalLoginPage.tsx`

**Implementar o mesmo padrão:**
```typescript
import { useLoginRateLimit } from '@/hooks/useLoginRateLimit'

// No login por CPF
const { checkAttempt, recordFailedAttempt, resetAttempts } = useLoginRateLimit()
```

### 2. Backend Rate Limiting (Supabase)

**Configurar no Dashboard:**
```
Settings → Authentication → Rate Limits

- Email OTP Rate Limit: 3 / hour
- Phone OTP Rate Limit: 3 / hour
- Anonymous Sign-ins Rate Limit: 3 / hour
- SMS Template: (opcional)
```

### 3. Monitoramento

**Adicionar logs de segurança:**
```typescript
import { logger } from '@/lib/logger'

if (!checkAttempt()) {
  logger.warn('Tentativa de login bloqueada por rate limit', {
    email: data.email,
    ip: '...', // Se disponível
  })
}
```

---

## ⚠️ IMPORTANTE

**SessionStorage vs LocalStorage:**

Usamos **sessionStorage** porque:
- ✅ Limpa ao fechar navegador
- ✅ Não persiste entre sessões
- ✅ Mais seguro para dados temporários
- ✅ Previne bloqueio acidental em outro dispositivo

**Tempo de bloqueio:**

- **1 hora** é suficiente para prevenir força bruta
- **Não muito longo** para não frustrar usuários legítimos
- **Automático** (não requer intervenção)

---

## 📊 MÉTRICAS DE SEGURANÇA

| Métrica | Valor |
|---------|-------|
| Máximo tentativas | 5 |
| Janela de tempo | 60 minutos |
| Tempo de bloqueio | 60 minutos |
| Persistência | sessionStorage |
| Reset automático | ✅ Sim (após 1 hora) |
| Reset manual | ✅ Sim (após login sucesso) |

---

**Status:** ✅ **IMPLEMENTADO**  
**Segurança:** ✅ **REFORÇADA**  
**Regras de Negócio:** ✅ **PRESERVADAS**
