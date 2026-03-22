# Implementação: Padrão Universal RLS e Governança (V3.1 Final)

Este plano reflete as novas diretrizes de segurança enterprise e governança informadas na especificação técnica para reestruturar as políticas do sistema Fluxoo EDU.

## 1. Nova Arquitetura de Acesso (Anti-Patterns Superados)

- **Performance (Fim do Table Scan):** Funções customizadas (ex: `is_school_staff`) estão proibidas dentro de `USING` em consultas para evitar Múltiplas Chamadas (Table Scans). O RLS lerá os metadados e pemissões diretamente via [(auth.jwt() ->> 'tenant_id')](file:///c:/PROJETOS/01%20FLUXOO/01%20fluxoo-edu/src/lib/database.types.ts#368-377) e JSONB permissions.
- **Separação Obrigatória:** Fim das políticas `FOR ALL`. As políticas `SELECT` (leitura), `UPDATE`, `INSERT` e `DELETE` serão construídas e mantidas separadamente.
- **Isolamento de Domínios (4 Níveis):**
   1. **Super Admin:** JWT claim `is_super_admin = true`. Tem Bypass para Leitura, mas é **BLOQUEADO** em Writes (Update/Delete/Insert) nas tabelas transacionais dos alunos (Garantia de Lisura da plataforma).
   2. **Staff da Escola (Gestores/Funcionários):** Casamento do `tenant_id` no JWT com a coluna + Check de claim especifica `permissions ? 'modulo.actio'`.
   3. **Responsáveis:** Isolamento por casamento de `responsavel_financeiro_cpf` ou tabelas de relacionamento validadas via JWT CPF/ID.
   4. **Acesso Compartilhado (Parceiros/Professores):** JOIN com a tabela `consent_logs` (LGPD).

## 2. Ações de Banco de Dados Obrigatórias na Migration 111

A migration central deverá varrer e limpar todas as políticas fragmentadas e substituí-las por uma versão robusta conforme os exemplos abaixo.

### 2.1 Política Universal de Leitura (`FOR SELECT`)
Baseada integralmente no JWT para Níveis 1, 2, 3 e JOIN com `consent_logs` para Nível 4.
_Exemplo em Alunos:_
```sql
CREATE POLICY "Universal_Select_Alunos" ON public.alunos FOR SELECT TO authenticated USING (
    (auth.jwt() ->> 'is_super_admin')::boolean = TRUE
    OR
    (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND (auth.jwt() -> 'permissions')::jsonb ? 'alunos.view')
    OR
    (responsavel_financeiro_cpf = (auth.jwt() ->> 'cpf')::text)
    OR
    EXISTS (SELECT 1 FROM public.consent_logs cl ... )
);
```

### 2.2 Política Universal de Escrita (`FOR UPDATE`)
_Exemplo em Alunos:_ Somente a escola pode modificar (com trava anti-hijacking). O Super Admin **não** modifica dados acadêmicos.
```sql
CREATE POLICY "Universal_Update_Alunos" ON public.alunos FOR UPDATE TO authenticated USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND (auth.jwt() -> 'permissions')::jsonb ? 'alunos.edit'
) WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
);
```

## 3. Segurança Estrutural
- **Soft Delete:** A deleção física (`DELETE`) em transacionais é estritamente proibida. Campos `status = 'deleted'`, `deleted_by`, `deleted_at` devem ser atualizados. `deleted_at IS NULL` no frontend/views é regra.
- **Security Invoker:** Toda RPC/Função criada precisará de `SECURITY INVOKER` e `SET search_path = public` para forçar que passem sempre pela RLS do próprio usuário.
- **Índices de Performance:**
   ```sql
   CREATE INDEX idx_consent_logs_active ON consent_logs (aluno_global_id, shared_with)
   WHERE acao = 'grant' AND (expires_at IS NULL OR expires_at > NOW());
   ```

## Checklist de Aprovação para Migration
1. [ ] Todas as `DROP POLICY IF EXISTS` incluídas.
2. [ ] RLS Universal de `SELECT` usa apenas JWT e não chama funções customizadas.
3. [ ] Super Admin **bloqueado** no RLS em tabelas acadêmicas/financeiras de UPDATE/INSERT.
4. [ ] Travas anti-hijacking de `tenant_id` implementadas nos `WITH CHECK`.
5. [ ] Configuração de índices para performance (`consent_logs`).
