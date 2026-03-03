# 🎓 Fluxoo Educação

> Plataforma digital multitenant para gestão de escolas

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646cff.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.2-38bdf8.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E.svg)](https://supabase.com/)

---

## 📖 Sobre

O **Fluxoo Educação** é uma plataforma SaaS multitenant desenvolvida para gestão completa de instituições de ensino. O sistema permite o gerenciamento de múltiplas escolas de forma isolada e segura, com diferentes níveis de acesso e funcionalidades específicas para cada perfil de usuário.

### ✨ Funcionalidades

- 🏫 **Gestão de Escolas** - Cadastro e administração de múltiplas escolas (tenants)
- 👥 **Gestão de Usuários** - Super Admin, Administrador, Gestor, Agente, Escolas e Entidades
- 👨‍🎓 **Alunos** - Matrículas, histórico, frequência e desempenho
- 👨‍💼 **Funcionários** - Cadastro, lotação e acompanhamento de equipe
- 🏢 **Filiais** - Gerenciamento de unidades vinculadas
- 📊 **Dashboard** - Métricas e indicadores em tempo real
- 🔐 **Autenticação** - Sistema seguro com Supabase Auth
- 📱 **Responsivo** - Interface adaptável para desktop e mobile

---

## 🚀 Quick Start

### Pré-requisitos

- Node.js v18+
- npm ou yarn
- Conta no [Supabase](https://supabase.com)

### Instalação

```bash
# Clonar o repositório
git clone https://github.com/zeroumbit/fluxoo_educacao.git
cd fluxoo_educacao

# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Editar .env com suas credenciais do Supabase
# VITE_SUPABASE_URL=sua-url
# VITE_SUPABASE_ANON_KEY=sua-chave

# Iniciar servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em: **http://localhost:5173**

---

## 🛠️ Tecnologias

| Categoria | Tecnologias |
|-----------|-------------|
| **Frontend** | React 19, TypeScript, Vite 7 |
| **Estilização** | Tailwind CSS 4, Radix UI |
| **Estado** | React Query, React Hook Form |
| **Validação** | Zod |
| **Backend** | Supabase (PostgreSQL, Auth, APIs) |
| **Roteamento** | React Router v7 |
| **UI Components** | shadcn/ui patterns |

---

## 📁 Estrutura do Projeto

```
fluxoo_educacao/
├── src/
│   ├── components/         # Componentes reutilizáveis
│   │   ├── ui/            # Componentes base
│   │   └── shared/        # Componentes compartilhados
│   ├── modules/           # Módulos por funcionalidade
│   │   ├── auth/          # Autenticação
│   │   ├── dashboard/     # Dashboard
│   │   ├── escolas/       # Gestão de escolas
│   │   ├── alunos/        # Gestão de alunos
│   │   └── funcionarios/  # Gestão de funcionários
│   ├── pages/             # Páginas/Rotas
│   ├── layout/            # Layouts (Admin, Auth)
│   ├── lib/               # Utilitários e configs
│   └── services/          # Serviços e APIs
├── database/               # Scripts SQL e migrations
├── public/                 # Arquivos estáticos
├── scripts/                # Scripts utilitários
└── docs/                   # Documentação
```

---

## 👥 Tipos de Usuários

| Role | Descrição | Permissões |
|------|-----------|------------|
| **Super Admin** | Administrador da plataforma | Acesso global, gestão de planos e assinaturas |
| **Administrador** | Secretário da escola | Gestão completa da escola |
| **Gestor** | Responsável pela unidade | Administração da filial |
| **Agente** | Equipe operacional | Operações do dia a dia |
| **Escolas** | Instituição | Visualização institucional |
| **Entidades** | Organizações vinculadas | Acesso restrito |

---

## 🔐 Configurar Super Admin

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Vá em **Authentication** → **Users**
3. Clique em **Add user** → **Create new user**
4. Preencha:
   - **Email:** `zeroumti@gmail.com`
   - **Senha:** (defina uma senha segura)
5. Faça login na aplicação com as credenciais criadas

---

## 📚 Documentação

| Arquivo | Descrição |
|---------|-----------|
| [README_LOCAL.md](./README_LOCAL.md) | Guia de configuração local |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Guia de desenvolvimento |
| [SUPER_ADMIN.md](./SUPER_ADMIN.md) | Documentação do Super Admin |
| [QWEN.md](./QWEN.md) | Regras de negócio e memória do projeto |

---

## 🧪 Comandos Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento

# Build
npm run build        # Gera build de produção
npm run preview      # Preview do build

# Qualidade de código
npm run lint         # Executa ESLint
npm run check-env    # Verifica configuração do ambiente
```

---

## 🔗 Links Úteis

- [Repositório GitHub](https://github.com/zeroumbit/fluxoo_educacao)
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/)

---

## 📝 Licença

Este projeto está sob licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Desenvolvedor

**zeroumbit**  
GitHub: [@zeroumbit](https://github.com/zeroumbit)

---

<div align="center">

**Fluxoo Educação** © 2026

</div>
