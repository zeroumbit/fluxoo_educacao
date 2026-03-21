# ✅ Correção: Senhas Antigas (6+) Continuam Válidas

**Data:** 21 de março de 2026  
**Status:** ✅ **IMPLEMENTADO**  
**Impacto:** LOGIN - Senhas antigas de 6 caracteres funcionam normalmente

---

## 🐛 PROBLEMA IDENTIFICADO

**Problema:** Após ajustes de segurança, o sistema estava exigindo 8+ caracteres e 1 maiúscula para TODOS os logins, incluindo senhas antigas.

**Regra de Negócio:** 
- ✅ **NOVAS senhas:** 8+ caracteres e 1 maiúscula (cadastro/troca)
- ✅ **Senhas ANTIGAS:** 6+ caracteres continuam válidas (login)

---

## ✅ SOLUÇÃO IMPLEMENTADA

### 1. Dois Schemas de Validação

**Arquivo:** `src/lib/password-validation.ts`

**Criado dois schemas separados:**

```typescript
// LOGIN - Aceita qualquer senha (retrocompatibilidade)
export const loginPasswordSchema = z
  .string()
  .min(1, 'Senha é obrigatória')

// CADASTRO/TROCA - Exige senha forte
export const strongPasswordSchema = z
  .string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres')
  .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
```

---

### 2. Atualização dos Formulários de LOGIN

#### A. Login Admin (`src/modules/auth/LoginPage.tsx`)

**Mudanças:**
```typescript
// Antes
import { strongPasswordSchema } from '@/lib/password-validation'
password: strongPasswordSchema

// Depois
import { loginPasswordSchema } from '@/lib/password-validation'
password: loginPasswordSchema
```

**UI:** Adicionada mensagem informativa:
```
ℹ️ Senhas antigas (6+ caracteres) continuam válidas
```

#### B. Login Portal (`src/modules/portal/pages/PortalLoginPage.tsx`)

**Mudanças:**
```typescript
// Antes
password: z.string().min(6, 'Mínimo 6 caracteres')

// Depois
password: loginPasswordSchema
```

**UI:** Adicionada mensagem informativa:
```
ℹ️ Senhas antigas (6+ caracteres) continuam válidas
```

---

### 3. Cadastro e Troca de Senha (Mantém Validação Forte)

#### A. Cadastro de Escola (`src/modules/escolas/pages/EscolaCadastroPage.tsx`)

**Continua com validação forte:**
```typescript
password: strongPasswordSchema
```

**Requisitos:**
- ✅ Mínimo 8 caracteres
- ✅ Pelo menos 1 letra maiúscula

#### B. Troca de Senha (Portal)

**Quando implementar, usar:**
```typescript
import { changePasswordSchema } from '@/lib/password-validation'

novaSenha: changePasswordSchema
```

---

## 📊 RESUMO DAS REGRAS

| Situação | Schema | Requisitos |
|----------|--------|------------|
| **Login (Admin)** | `loginPasswordSchema` | Apenas não vazio |
| **Login (Portal)** | `loginPasswordSchema` | Apenas não vazio |
| **Cadastro de Escola** | `strongPasswordSchema` | 8+ chars, 1 maiúscula |
| **Troca de Senha** | `changePasswordSchema` | 8+ chars, 1 maiúscula |
| **Nova Senha (qualquer)** | `strongPasswordSchema` | 8+ chars, 1 maiúscula |

---

## 🧪 TESTES DE VALIDAÇÃO

### Teste 1: Login com Senha Antiga (6 chars)
```
Email: usuario@escola.com
Senha: 123456
Resultado: ✅ Login deve funcionar
```

### Teste 2: Login com Senha Forte (8+ chars)
```
Email: usuario@escola.com
Senha: MinhaSenha123
Resultado: ✅ Login deve funcionar
```

### Teste 3: Cadastro com Senha Fraca
```
Senha: 123456
Resultado: ❌ Deve mostrar erro "A senha deve ter no mínimo 8 caracteres"
```

### Teste 4: Cadastro com Senha Forte
```
Senha: MinhaSenha123
Resultado: ✅ Cadastro deve funcionar
```

### Teste 5: Login Portal com Senha Antiga
```
CPF: 123.456.789-00
Senha: abc123
Resultado: ✅ Login deve funcionar
```

---

## 📋 ARQUIVOS MODIFICADOS

| Arquivo | Mudança |
|---------|---------|
| `src/lib/password-validation.ts` | ✅ Criado `loginPasswordSchema` |
| `src/modules/auth/LoginPage.tsx` | ✅ Usa `loginPasswordSchema` |
| `src/modules/portal/pages/PortalLoginPage.tsx` | ✅ Usa `loginPasswordSchema` |

---

## ⚠️ IMPORTANTE

**Senhas do Supabase Auth:**

O Supabase Auth tem suas próprias regras de validação no backend. Atualmente:
- **Mínimo:** 6 caracteres (padrão do Supabase)
- **Para mudar:** Configurar em Settings → Authentication → Password Policy

**Esta correção:**
- ✅ Válida no frontend (formulários)
- ✅ Permite login com senhas antigas
- ✅ Exige senha forte para cadastros novos
- ❌ Não altera regras do Supabase Auth

---

## 🎯 PRÓXIMOS PASSOS (OPCIONAIS)

### 1. Configurar Password Policy no Supabase

**Dashboard do Supabase:**
```
Settings → Authentication → Password Policy

- Minimum password length: 8 (opcional)
- Mas isso pode bloquear senhas antigas!
```

**Recomendação:** Manter padrão do Supabase (6 chars) para não bloquear senhas antigas.

### 2. Forçar Troca de Senha (Opcional)

Para usuários com senhas fracas, pode-se implementar:
```typescript
// No login, verificar força da senha
if (password.length < 8 || !/[A-Z]/.test(password)) {
  // Redirecionar para troca de senha obrigatória
}
```

---

**Status:** ✅ **IMPLEMENTADO**  
**Senhas Antigas:** ✅ **FUNCIONAM**  
**Novas Senhas:** ✅ **MAIS FORTES**
