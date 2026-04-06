# Proposta: URLs Únicas para Funcionários

## 📋 Problema Atual

Hoje apenas **3 perfis** têm URLs dedicadas:
- ✅ Super Admin → `/admin/*`
- ✅ Escolas (Gestor/Admin) → `/dashboard`, `/alunos`, etc.
- ✅ Portal Família → `/portal/*`

**Funcionários não têm namespace próprio:**
- ❌ Professor → Usa `/dashboard` (compartilhado com escola)
- ❌ Funcionário → Sem rota dedicada
- ❌ Lojista → Tem `/loja/*` mas dentro do admin
- ❌ Profissional → Tem `/profissional/*` mas dentro do admin

## 🎯 Solução Proposta

Criar **namespaces dedicados** para cada tipo de funcionário:

### 1️⃣ **Professores** → `/professores/*`

```
/professores/dashboard          → ProfessorDashboardPage
/professores/alunos             → Lista de alunos do professor
/professores/alunos/:id         → Detalhe do aluno (notas, frequência)
/professores/turmas             → Turmas do professor
/professores/turmas/:id         → Detalhe da turma
/professores/frequencia         → Registro de frequência
/professores/frequencia/relatorio → Relatório de frequência
/professores/planos-aula        → Planos de aula
/professores/atividades         → Atividades/avalicações
/professores/notas              → Lançamento de notas
/professores/agenda             → Agenda de aulas
/professores/alertas            → Alertas do professor
/professores/perfil             → Meu Perfil
```

**✅ Vantagens:**
- URL clara e semântica
- Fácil de lembrar: `app.com/professores/alunos`
- Isolado das rotas de gestão escolar
- Pode ter layout próprio (ex: `ProfessorLayout`)

---

### 2️⃣ **Funcionários (Geral)** → `/funcionarios-portal/*`

Para funcionários que não são professores (secretaria, apoio, etc.):

```
/funcionarios-portal/dashboard  → Dashboard genérico
/funcionarios-portal/tarefas    → Tarefas atribuídas
/funcionarios-portal/agenda     → Agenda/escalas
/funcionarios-portal/perfil     → Meu Perfil
/funcionarios-portal/documentos → Documentos pessoais
```

**Nota:** O nome `funcionarios-portal` evita conflito com `/funcionarios` (gestão de RH).

---

### 3️⃣ **Lojistas** → `/lojista/*` (manter e expandir)

```
/lojista/dashboard              → LojistaDashboardPage
/lojista/produtos               → Gestão de produtos
/lojista/vendas                 → Histórico de vendas
/lojista/pedidos                → Pedidos recebidos
/lojista/relatorios             → Relatórios de vendas
/lojista/perfil                 → Perfil do lojista
```

**✅ Mudança:** Sair de `/dashboard` (dentro do admin) para namespace próprio.

---

### 4️⃣ **Profissionais** → `/profissional/*` (manter e expandir)

```
/profissional/dashboard         → ProfissionalDashboardPage
/profissional/curriculo         → Meu Currículo
/profissional/vagas             → Vagas disponíveis
/profissional/candidaturas      → Minhas candidaturas
/profissional/calendario        → Agenda/Disponibilidade
/profissional/relatorios        → Relatórios de atendimentos
/profissional/perfil            → Meu Perfil
```

---

## 🔧 Implementação Técnica

### Estrutura de Rotas (App.tsx)

```tsx
// ROTAS DE PROFESSORES
<Route 
  path="/professores/*" 
  element={
    <ProtectedRoute allowedRoles={['professor']}>
      <ProfessorLayout>
        <Routes>
          <Route path="dashboard" element={<ProfessorDashboardPage />} />
          <Route path="alunos" element={<ProfessorAlunosPage />} />
          <Route path="alunos/:id" element={<ProfessorAlunoDetalhePage />} />
          <Route path="turmas" element={<ProfessorTurmasPage />} />
          <Route path="turmas/:id" element={<ProfessorTurmaDetalhePage />} />
          <Route path="frequencia" element={<ProfessorFrequenciaPage />} />
          <Route path="planos-aula" element={<ProfessorPlanosAulaPage />} />
          <Route path="atividades" element={<ProfessorAtividadesPage />} />
          <Route path="notas" element={<ProfessorNotasPage />} />
          <Route path="agenda" element={<ProfessorAgendaPage />} />
          <Route path="alertas" element={<ProfessorAlertasPage />} />
          <Route path="perfil" element={<MeuPerfilPage />} />
        </Routes>
      </ProfessorLayout>
    </ProtectedRoute>
  }
/>

// ROTAS DE FUNCIONÁRIOS (não-professores)
<Route 
  path="/funcionarios-portal/*" 
  element={
    <ProtectedRoute allowedRoles={['funcionario']}>
      <FuncionarioLayout>
        <Routes>
          <Route path="dashboard" element={<FuncionarioDashboardPage />} />
          <Route path="tarefas" element={<FuncionarioTarefasPage />} />
          <Route path="agenda" element={<FuncionarioAgendaPage />} />
          <Route path="documentos" element={<FuncionarioDocumentosPage />} />
          <Route path="perfil" element={<MeuPerfilPage />} />
        </Routes>
      </FuncionarioLayout>
    </ProtectedRoute>
  }
/>

// ROTAS DE LOJISTAS (mover para namespace próprio)
<Route 
  path="/lojista/*" 
  element={
    <ProtectedRoute allowedRoles={['lojista']}>
      <LojistaLayout>
        <Routes>
          <Route path="dashboard" element={<LojistaDashboardPage />} />
          <Route path="produtos" element={<LojistaProdutosPage />} />
          <Route path="vendas" element={<LojistaVendasPage />} />
          <Route path="pedidos" element={<LojistaPedidosPage />} />
          <Route path="relatorios" element={<LojistaRelatoriosPage />} />
          <Route path="perfil" element={<MeuPerfilPage />} />
        </Routes>
      </LojistaLayout>
    </ProtectedRoute>
  }
/>

// ROTAS DE PROFISSIONAIS (mover para namespace próprio)
<Route 
  path="/profissional/*" 
  element={
    <ProtectedRoute allowedRoles={['profissional']}>
      <ProfissionalLayout>
        <Routes>
          <Route path="dashboard" element={<ProfissionalDashboardPage />} />
          <Route path="curriculo" element={<ProfissionalCurriculoPage />} />
          <Route path="vagas" element={<ProfissionalVagasPage />} />
          <Route path="candidaturas" element={<ProfissionalCandidaturasPage />} />
          <Route path="calendario" element={<ProfissionalCalendarioPage />} />
          <Route path="relatorios" element={<ProfissionalRelatoriosPage />} />
          <Route path="perfil" element={<MeuPerfilPage />} />
        </Routes>
      </ProfissionalLayout>
    </ProtectedRoute>
  }
/>
```

---

## 🔄 Redirecionamentos (Compatibilidade)

Manter compatibilidade com URLs antigas:

```tsx
// Redirecionar URLs antigas para novas
<Route path="/dashboard" element={<Navigate to="/professores/dashboard" replace />} /> 
  (quando isProfessor)
<Route path="/loja/dashboard" element={<Navigate to="/lojista/dashboard" replace />} />
<Route path="/profissional/dashboard" element={<Navigate to="/profissional/dashboard" replace />} />
```

---

## 🎨 Layouts Dedicados

Cada tipo pode ter seu próprio layout com:
- **Sidebar** customizada para o perfil
- **BottomNav** mobile específica
- **Header** com branding do perfil
- **Permissões** isoladas

```
src/layout/
├── ProfessorLayout.tsx      → Layout para professores
├── FuncionarioLayout.tsx    → Layout para funcionários
├── LojistaLayout.tsx        → Layout para lojistas
└── ProfissionalLayout.tsx   → Layout para profissionais
```

---

## 📊 Resumo de URLs

| Tipo de Usuário | URL Base | Exemplo Completo |
|-----------------|----------|------------------|
| **Super Admin** | `/admin/*` | `/admin/escolas` |
| **Gestor Escola** | `/*` | `/alunos`, `/financeiro` |
| **Professor** | `/professores/*` | `/professores/alunos` |
| **Funcionário** | `/funcionarios-portal/*` | `/funcionarios-portal/tarefas` |
| **Lojista** | `/lojista/*` | `/lojista/produtos` |
| **Profissional** | `/profissional/*` | `/profissional/vagas` |
| **Responsável** | `/portal/*` | `/portal/alunos` |

---

## ✅ Benefícios

1. **Clareza**: Cada tipo de usuário tem namespace próprio
2. **Segurança**: Isolamento natural por rota
3. **Escalabilidade**: Fácil adicionar novos perfis
4. **UX**: URLs intuitivas e memoráveis
5. **Manutenção**: Código mais organizado
6. **Analytics**: Tracking por segmento facilitado

---

## 🚀 Próximos Passos

Se aprovado, vou:

1. ✅ Criar os layouts dedicados (ProfessorLayout, FuncionarioLayout, etc.)
2. ✅ Migrar rotas para os novos namespaces
3. ✅ Criar as páginas que faltam (ex: ProfessorAlunosPage)
4. ✅ Adicionar redirecionamentos de compatibilidade
5. ✅ Atualizar ProtectedRoute com novas roles
6. ✅ Atualizar RootRedirect para cada tipo
7. ✅ Testar todas as rotas
8. ✅ Atualizar documentação

---

## 💡 Recomendação

**Recomendo começar com `/professores/*`** pois:
- É o tipo de funcionário mais crítico
- Já tem muitas páginas prontas que podem ser migradas
- Benefício imediato para UX e segurança
- Serve como modelo para os outros perfis

**O que acha desta abordagem?** Quer que eu implemente?
