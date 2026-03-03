# Configuração do Super Admin

## E-mail do Super Admin

O e-mail configurado para acesso do **Super Admin** é:

```
zeroumti@gmail.com
```

## Como Configurar no Supabase

### Passo 1: Criar o Usuário no Supabase Auth

1. Acesse o dashboard do Supabase
2. Vá em **Authentication** → **Users**
3. Clique em **Add user** → **Create new user**
4. Preencha:
   - **Email**: `zeroumti@gmail.com`
   - **Password**: (defina uma senha segura)
   - **User Metadata** (opcional):
     ```json
     {
       "full_name": "Super Admin"
     }
     ```
5. Clique em **Create user**

### Passo 2: Confirmar o Usuário

Se necessário, confirme o e-mail do usuário:

1. Na lista de usuários, localize `zeroumti@gmail.com`
2. Clique nos **três pontos** → **Send confirmation email**
3. Ou marque como confirmado manualmente

### Passo 3: Testar o Acesso

1. Acesse a aplicação em `/login`
2. Faça login com:
   - **E-mail**: `zeroumti@gmail.com`
   - **Senha**: (a senha definida no passo 1)
3. Você será redirecionado para `/dashboard`
4. No canto inferior da sidebar, você verá:
   - Nome do usuário
   - Badge **Super Admin** com ícone de escudo

## Como Funciona

O sistema identifica o super admin automaticamente pelo e-mail:

1. **Verificação por e-mail**: O AuthContext verifica se o e-mail do usuário logado corresponde ao e-mail configurado (`zeroumti@gmail.com`)
2. **Acesso total**: O super admin tem acesso a todas as rotas administrativas
3. **Tenant especial**: O super admin usa `tenantId: 'super_admin'`, permitindo acesso global

## Arquivos de Configuração

| Arquivo | Descrição |
|---------|-----------|
| `src/lib/config.ts` | Define o e-mail do super admin |
| `src/lib/hooks.ts` | Hooks `useIsSuperAdmin()` e `useSuperAdminEmail()` |
| `src/modules/auth/AuthContext.tsx` | Lógica de identificação do super admin |
| `src/modules/auth/ProtectedRoute.tsx` | Permite acesso total ao super admin |
| `src/layout/AdminLayout.tsx` | Exibe badge de Super Admin na UI |

## Alterar o E-mail do Super Admin

Para mudar o e-mail do super admin, edite o arquivo `src/lib/config.ts`:

```typescript
export const SUPER_ADMIN_EMAIL = 'novo-email@exemplo.com'
```

## Permissões do Super Admin

O super admin pode:

- ✅ Acessar todas as rotas administrativas
- ✅ Visualizar e gerenciar todas as escolas/tenants
- ✅ Ignorar verificações de permissão por role
- ✅ Criar, editar e excluir qualquer recurso

## Observações Importantes

1. **Segurança**: Mantenha o e-mail do super admin em segredo
2. **Senha forte**: Use uma senha complexa e única
3. **2FA**: Considere ativar autenticação de dois fatores no Supabase
4. **Backup**: Tenha um e-mail de backup para recuperação de acesso
