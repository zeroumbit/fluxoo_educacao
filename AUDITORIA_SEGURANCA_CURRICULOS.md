# 🔒 Auditoria de Segurança - Módulo de Currículos

## Resumo Executivo

**Data da Auditoria:** 29 de março de 2026  
**Módulo:** Currículos (Banco de Talentos)  
**Status:** ⚠️ **ATENÇÃO - Política RLS Temporária Ativa**

---

## 🚨 Vulnerabilidades Críticas Encontradas

### 1. POLÍTICA RLS MUITO PERMISSIVA (CRÍTICO)

**Arquivo:** `database/curriculos_fix_emergencial.sql`

**Problema:**
```sql
CREATE POLICY "curriculos_acesso_liberado"
    ON public.curriculos
    FOR SELECT
    TO authenticated
    USING (true);
```

**Risco:**
- ✅ **QUALQUER usuário autenticado** pode ver TODOS os currículos
- ✅ Isso inclui **responsáveis (pais de alunos)** e **professores**
- ✅ Dados sensíveis de profissionais estão expostos
- ❌ Viola o princípio de menor privilégio

**Impacto:**
- Vazamento de dados de profissionais (nome, contato, formação, experiência)
- Possível uso indevido de informações pessoais
- Não conformidade com LGPD

**Solução Imediata:**
Execute o script `database/curriculos_rls_producao.sql` (ver seção de correções)

---

## ⚠️ Vulnerabilidades de Média Gravidade

### 2. SQL Injection na Busca (MÉDIO)

**Arquivo:** `src/modules/curriculos/service.ts`

**Código Vulnerável:**
```typescript
if (filtros?.search) {
  query = query.or(`
    resumo_profissional.ilike.%${filtros.search}%,
    observacoes.ilike.%${filtros.search}%
  `)
}
```

**Risco:**
- Interpolação direta de string na query SQL
- Usuário mal-intencionado pode injetar código SQL

**Exemplo de Ataque:**
```
search: "%); DROP TABLE curriculos; --
```

**Solução:**
```typescript
if (filtros?.search) {
  const searchTerm = filtros.search.replace(/%/g, '\\%');
  query = query.or(
    `resumo_profissional.ilike.%${searchTerm}%,observacoes.ilike.%${searchTerm}%`
  )
}
```

---

### 3. Dados Sensíveis Expostos na Página de Detalhes (MÉDIO)

**Arquivo:** `src/modules/curriculos/pages/CurriculoDetalhePage.tsx`

**Problema:**
- Exibe **todos** os dados do currículo sem controle de visibilidade
- Dados que deveriam ser visíveis apenas após contato estão públicos
- Sem mascaramento de informações sensíveis

**Dados Expostos:**
- ✅ Nome completo
- ✅ E-mail de contato
- ✅ Pretensão salarial
- ✅ Formação acadêmica completa
- ✅ Experiência profissional detalhada
- ✅ Habilidades
- ✅ Certificações

**Recomendação:**
- Criar níveis de visibilidade (público vs. após contato)
- Mascara e-mail até primeiro contato
- Ocultar pretensão salarial na listagem

---

### 4. Falta de Validação de Dados de Entrada (BAIXO)

**Arquivo:** `src/modules/curriculos/service.ts`

**Problema:**
```typescript
async salvar(data: CurriculoInsert) {
  const { data: result, error } = await supabase
    .from('curriculos')
    .upsert(data, { onConflict: 'user_id' })
    .select()
    .single()
```

**Risco:**
- Sem validação de tamanho de campos
- Sem sanitização de HTML/Scripts
- Sem validação de formato (ex: ano, valores numéricos)

**Solução:**
- Adicionar validação com Zod ou Yup antes de salvar
- Limitar tamanho de strings (evitar DoS)
- Sanitizar campos de texto livre

---

## ✅ Boas Práticas Implementadas

### 1. Filtros na Listagem
- ✅ Filtra apenas currículos `is_publico = true`
- ✅ Filtra apenas currículos `is_ativo = true`
- ✅ Filtra apenas `disponibilidade_emprego = true`

### 2. Placeholder nos Dados
- ✅ Service retorna "Profissional Disponível" ao invés do nome real
- ✅ Dados sensíveis nullificados antes de enviar ao frontend

### 3. Tratamento de Erros
- ✅ Páginas têm estados de erro e loading
- ✅ Mensagens genéricas para o usuário (não expõem detalhes técnicos)

### 4. Permissões RBAC
- ✅ Menu usa sistema de permissões (`gestao.curriculos.view`)
- ✅ Professores não veem o menu por padrão

---

## 📋 Regras de Negócio Verificadas

### ✅ Conformidade Total

| Regra | Status | Verificação |
|-------|--------|-------------|
| Apenas gestores veem currículos | ⚠️ Parcial | Política RLS temporária permite todos |
| Apenas currículos públicos aparecem | ✅ Sim | Filtro `is_publico = true` no service |
| Apenas currículos ativos aparecem | ✅ Sim | Filtro `is_ativo = true` no service |
| Apenas disponíveis aparecem | ✅ Sim | Filtro `disponibilidade_emprego = true` |
| Super Admin tem acesso global | ⚠️ Parcial | Depende da política RLS final |
| Escola não gerencia dados funcionais | ✅ Sim | Apenas visualização (leitura) |

### ⚠️ Atenção Necessária

| Regra | Status | Ação Necessária |
|-------|--------|-----------------|
| Política RLS restritiva | ❌ Não aplicada | Executar script de produção |
| Validação de dados | ❌ Ausente | Implementar Zod/Yup |
| LGPD - Consentimento | ❌ Ausente | Criar termo de aceite |
| Log de acessos | ❌ Ausente | Implementar auditoria |
| Rate limiting | ❌ Ausente | Prevenir scraping |

---

## 🔧 Correções Necessárias

### Prioridade 1 - CRÍTICA (Executar Imediato)

**Arquivo:** `database/curriculos_rls_producao.sql`

```sql
-- Dropar política emergencial
DROP POLICY IF EXISTS "curriculos_acesso_liberado" ON public.curriculos;

-- Criar políticas restritivas
CREATE POLICY "curriculos_gestores_select"
    ON public.curriculos
    FOR SELECT
    USING (
        is_publico = true 
        AND is_ativo = true
        AND EXISTS (
            SELECT 1 FROM public.escolas
            WHERE gestor_user_id = auth.uid()
        )
    );

CREATE POLICY "curriculos_superadmin"
    ON public.curriculos
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users au
            WHERE au.id = auth.uid()
            AND (au.raw_user_meta_data->>'role') = 'super_admin'
        )
    );
```

### Prioridade 2 - ALTA (Próxima Sprint)

1. **Implementar validação com Zod**
   ```typescript
   const curriculoSchema = z.object({
     resumo_profissional: z.string().max(2000),
     pretensao_salarial: z.number().positive().optional(),
     // ...
   });
   ```

2. **Adicionar rate limiting**
   ```typescript
   // No service ou middleware
   const { error } = await supabase.rpc('check_rate_limit', {
     p_user_id: authUser.id,
     p_action: 'curriculos_view'
   });
   ```

3. **Implementar log de auditoria**
   ```typescript
   await supabase.from('audit_logs').insert({
     action: 'curriculo_view',
     resource_id: curriculoId,
     user_id: authUser.id
   });
   ```

### Prioridade 3 - MÉDIA (Próximas Iterações)

1. **Termo de consentimento LGPD**
   - Checkbox "Concordo em ter meu currículo visível para escolas"
   - Data/hora do aceite
   - Possibilidade de revogar

2. **Níveis de visibilidade**
   - Público: nome, áreas, resumo
   - Após contato: dados completos

3. **Mascaramento de dados**
   - E-mail: `j***@gmail.com`
   - Telefone: `(11) 9****-****`

---

## 📊 Score de Segurança Atual

| Categoria | Score | Status |
|-----------|-------|--------|
| RLS (Row Level Security) | 2/10 | 🔴 Crítico |
| Validação de Dados | 4/10 | 🟡 Atenção |
| Exposição de Dados | 5/10 | 🟡 Atenção |
| Autenticação | 8/10 | 🟢 Bom |
| Autorização (RBAC) | 7/10 | 🟢 Bom |
| Logs e Auditoria | 0/10 | 🔴 Ausente |
| Rate Limiting | 0/10 | 🔴 Ausente |
| **Score Geral** | **4.3/10** | 🔴 **Risco Alto** |

---

## ✅ Checklist de Correção

### Imediato (Hoje)
- [ ] Executar `database/curriculos_rls_producao.sql`
- [ ] Remover política `curriculos_acesso_liberado`
- [ ] Testar acesso como gestor
- [ ] Testar acesso como professor (deve negar)
- [ ] Testar acesso como responsável (deve negar)

### Curto Prazo (1 semana)
- [ ] Implementar validação Zod no service
- [ ] Adicionar rate limiting
- [ ] Sanitizar busca (SQL injection)
- [ ] Criar política de retenção de dados

### Médio Prazo (1 mês)
- [ ] Implementar termo LGPD
- [ ] Criar níveis de visibilidade
- [ ] Adicionar log de auditoria
- [ ] Mascaramento de dados sensíveis

---

## 📝 Conclusão

O módulo de currículos foi implementado com **foco em funcionalidade**, mas a **segurança foi comprometida** temporariamente para resolver o erro 403.

**A política RLS emergencial (`curriculos_acesso_liberado`) deve ser removida IMEDIATAMENTE após os testes**, sob risco de:
- Vazamento de dados pessoais
- Violação da LGPD
- Exposição indevida de profissionais

**Recomenda-se:**
1. Executar correção RLS agora
2. Planejar sprint de segurança
3. Implementar auditoria contínua

---

**Auditor realizado por:** Fluxoo Security Team  
**Próxima auditoria:** Após correções de segurança
