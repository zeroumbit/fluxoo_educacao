# 📘 Fluxoo Educação - Guia de Desenvolvimento

## Visão Geral do Projeto

**Fluxoo Educação** é uma plataforma digital multitenant para gestão de escolas, utilizando:

- **Repositório:** [zeroumbit/fluxoo_educacao](https://github.com/zeroumbit/fluxoo_educacao)
- **Frontend**: React 19 + TypeScript + Vite 7
- **UI**: Tailwind CSS 4 + Radix UI + shadcn/ui patterns
- **Backend**: Supabase (PostgreSQL, Auth, APIs)
- **Estado**: React Query + React Hook Form + Zod

---

## 🏗️ Arquitetura

### Multitenancy

O sistema suporta múltiplas escolas (tenants) isoladas:

```
┌─────────────────────────────────────────┐
│           Super Admin                   │
│  (acesso global a todas as escolas)     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  Escola A  │  Escola B  │  Escola C     │
│  (tenant)  │  (tenant)  │  (tenant)     │
└─────────────────────────────────────────┘
```

### Tipos de Usuários

| Role | Permissões |
|------|-----------|
| **Super Admin** | Acesso global (leitura/auditoria), gestão de planos |
| **Administrador** | Gestão completa da escola |
| **Gestor** | Administração da unidade |
| **Agente** | Operações do dia a dia |
| **Escolas** | Visualização institucional |
| **Entidades** | Acesso restrito |

---

## 📂 Estrutura de Pastas

```
src/
├── components/         # Componentes UI reutilizáveis
│   ├── ui/            # Componentes base (button, input, etc.)
│   └── shared/        # Componentes compartilhados
├── modules/           # Módulos por feature
│   ├── auth/          # Autenticação e autorização
│   ├── dashboard/     # Dashboard e home
│   ├── escolas/       # Gestão de escolas
│   ├── funcionarios/  # Gestão de funcionários
│   ├── alunos/        # Gestão de alunos
│   └── ...
├── pages/             # Páginas (rotas)
├── layout/            # Layouts (AdminLayout, AuthLayout)
├── lib/               # Utilitários e configs
│   ├── config.ts      # Configurações globais
│   ├── hooks.ts       # Hooks compartilhados
│   ├── supabase.ts    # Cliente Supabase
│   └── utils.ts       # Funções utilitárias
└── services/          # Serviços e integrações
```

---

## 🔐 Autenticação

### Fluxo de Login

1. Usuário insere credenciais
2. Supabase Auth valida
3. `AuthContext` armazena sessão
4. `ProtectedRoute` verifica permissões
5. Redirecionamento baseado no role

### Super Admin

O Super Admin é identificado pelo e-mail configurado:

```typescript
// src/lib/config.ts
export const SUPER_ADMIN_EMAIL = 'zeroumti@gmail.com'
```

**Hooks úteis:**
```typescript
import { useIsSuperAdmin, useSuperAdminEmail } from '@/lib/hooks'

const isSuperAdmin = useIsSuperAdmin()
const adminEmail = useSuperAdminEmail()
```

---

## 🎨 Componentes UI

### Padrão de Componentes

Todos os componentes seguem o padrão shadcn/ui:

```tsx
// Exemplo: Button
import { cn } from '@/lib/utils'
import { cva } from 'class-variance-authority'

const buttonVariants = cva('...', {
  variants: {
    variant: {
      default: '...',
      secondary: '...',
    },
    size: {
      default: '...',
      sm: '...',
    },
  },
})

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants.variants
  size?: keyof typeof buttonVariants.variants
}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}
```

### Select em Grids

⚠️ **Importante**: Selects do Radix UI em grids precisam de `w-full`:

```tsx
<SelectTrigger className="w-full">
  {/* Sem isso, o select não expande na coluna */}
</SelectTrigger>
```

---

## 🗄️ Banco de Dados

### Schema Principal

```
├── tenants/tenants_escolas       # Escolas (tenants)
├── tenants/tenants_filialis      # Filiais
├── tenants/tenants_gestor_user   # Gestores
├── escola/alunos                 # Alunos
├── escola/funcionarios           # Funcionários
├── auth.users                    # Usuários (Supabase Auth)
```

### Row Level Security (RLS)

O Supabase usa RLS para isolamento de tenants:

```sql
-- Exemplo de política RLS
CREATE POLICY "Usuarios veem apenas dados da sua escola"
ON tabela
FOR ALL
USING (
  escola_id IN (
    SELECT escola_id FROM tenants_gestor_user
    WHERE user_id = auth.uid()
  )
)
```

---

## 🔄 Comandos Git

### Setup Inicial

```bash
git init
git add .
git commit -m "Initial commit"
```

### Branches

```bash
# Criar branch para feature
git checkout -b feature/nova-funcionalidade

# Voltar para main
git checkout main

# Merge
git merge feature/nova-funcionalidade
```

---

## 🧪 Boas Práticas

### TypeScript

- ✅ Use tipos explícitos para props de componentes
- ✅ Use interfaces para objetos complexos
- ✅ Evite `any` - use `unknown` se necessário

### Componentes

- ✅ Componentes pequenos e focados
- ✅ Custom hooks para lógica reutilizável
- ✅ Props tipadas com interfaces

### Nomenclatura

```
Componentes: PascalCase (UserProfile.tsx)
Hooks: camelCase com prefixo (useAuth.ts)
Utils: camelCase (formatDate.ts)
Constants: UPPER_SNAKE_CASE (API_URL)
```

---

## 🐛 Debugging

### React DevTools

Instale a extensão [React Developer Tools](https://react.dev/learn/react-developer-tools) para:

- Inspecionar árvore de componentes
- Verificar estado e props
- Profiler de performance

### React Query DevTools

```typescript
// Habilitar em desenvolvimento
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

function App() {
  return (
    <>
      <YourApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  )
}
```

### Logs do Supabase

```typescript
// Habilitar logs no cliente Supabase
const supabase = createClient(url, key, {
  debug: true,
})
```

---

## 📦 Deploy

### Build de Produção

```bash
npm run build
npm run preview  # Testar build localmente
```

### Variáveis de Ambiente em Produção

Configure as mesmas variáveis do `.env` no seu serviço de deploy:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 🔗 Recursos Úteis

- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Docs](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [React Query](https://tanstack.com/query/latest)
