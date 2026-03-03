# 🚀 Configuração para Desenvolvimento Local

Este guia vai ajudar você a configurar o ambiente de desenvolvimento local do **Fluxoo Educação**.

## 🔗 Repositório

- **GitHub:** [zeroumbit/fluxoo_educacao](https://github.com/zeroumbit/fluxoo_educacao)

## 📋 Pré-requisitos

Certifique-se de ter instalado:

- **Node.js** versão 18 ou superior ([Download](https://nodejs.org/))
- **npm** (gerenciado junto com Node.js)
- **Git** ([Download](https://git-scm.com/))

### Verificando versões

```bash
node --version  # Deve ser v18+
npm --version   # Deve ser 9+
```

---

## 🛠️ Passo a Passo da Configuração

### 1. Instalar Dependências

```bash
npm install
```

Isso instalará todos os pacotes necessários listados no `package.json`.

---

### 2. Configurar Variáveis de Ambiente

#### Opção A: Copiar arquivo de exemplo

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# Windows (CMD)
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

#### Opção B: Criar manualmente

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

#### Opção C: Usar chaves do Supabase

1. Acesse [Supabase Dashboard](https://app.supabase.com/)
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

---

### 3. Rodar o Servidor de Desenvolvimento

```bash
npm run dev
```

O servidor iniciará em:
- **URL**: `http://localhost:5173`
- **Hot Reload**: Ativo (atualizações automáticas)

---

## 🔑 Credenciais de Acesso

### Super Admin

- **E-mail**: `zeroumti@gmail.com`
- **Senha**: (definida no Supabase Auth)

### Configurar Super Admin no Supabase

1. Acesse [Supabase Dashboard](https://app.supabase.com/)
2. Vá em **Authentication** → **Users**
3. Clique em **Add user** → **Create new user**
4. Preencha:
   - **Email**: `zeroumti@gmail.com`
   - **Password**: (defina uma senha segura)
5. Clique em **Create user**

---

## 📁 Estrutura do Projeto

```
EDUCACAO/
├── src/
│   ├── components/     # Componentes reutilizáveis
│   ├── pages/          # Páginas da aplicação
│   ├── modules/        # Módulos por funcionalidade
│   ├── layout/         # Layouts e templates
│   ├── lib/            # Utilitários e configurações
│   └── services/       # Serviços e APIs
├── public/             # Arquivos estáticos
├── database/           # Scripts e migrations do banco
├── .env                # Variáveis de ambiente (NÃO COMMITAR)
├── .env.example        # Exemplo de variáveis
└── package.json        # Dependências e scripts
```

---

## 🧪 Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Gera build de produção |
| `npm run preview` | Preview do build em produção |
| `npm run lint` | Executa ESLint para análise de código |

---

## 🐛 Troubleshooting

### Erro: "Cannot find module..."

```bash
# Limpe cache e reinstale
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Port 5173 already in use"

```bash
# Matar processo na porta 5173
# Windows (PowerShell)
Stop-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess -Force

# Linux/Mac
lsof -ti:5173 | xargs kill -9
```

### Erro: "Supabase connection failed"

1. Verifique se as chaves no `.env` estão corretas
2. Confirme que o projeto Supabase está ativo
3. Teste a conexão: https://seu-projeto.supabase.co/rest/v1/

---

## 📦 Tecnologias Utilizadas

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| React | 19.2.0 | Biblioteca UI |
| TypeScript | 5.9.3 | Tipagem estática |
| Vite | 7.3.1 | Build tool |
| Tailwind CSS | 4.2.1 | Framework CSS |
| Supabase | 2.98.0 | Backend as a Service |
| React Router | 7.13.1 | Roteamento |
| Radix UI | 1.4.3 | Componentes acessíveis |
| React Hook Form | 7.71.2 | Gerenciamento de formulários |
| Zod | 4.3.6 | Validação de schemas |

---

## 🔗 Links Úteis

- [Documentação Supabase](https://supabase.com/docs)
- [Documentação React](https://react.dev/)
- [Documentação Vite](https://vitejs.dev/)
- [Documentação Tailwind CSS](https://tailwindcss.com/docs)
- [Documentação Radix UI](https://www.radix-ui.com/)

---

## ✅ Checklist de Configuração

- [ ] Node.js instalado (v18+)
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` configurado
- [ ] Servidor de desenvolvimento rodando (`npm run dev`)
- [ ] Acesso ao Supabase configurado
- [ ] Super Admin criado no Supabase Auth

---

## 🆘 Precisa de Ajuda?

Se encontrar problemas:

1. Verifique os logs no terminal
2. Consulte a documentação oficial das tecnologias
3. Verifique os arquivos de log em `errors.txt` (se existirem)
