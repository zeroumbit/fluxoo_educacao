# Almoxarifado - Edição e Exclusão de Itens

## Funcionalidades Implementadas

### 1. Editar Item
- Botão azul com ícone de lápis em cada linha da tabela
- Abre dialog com formulário pré-preenchido
- Atualiza nome, categoria, quantidade, custo unitário e alerta de estoque mínimo

### 2. Excluir Item
- Botão vermelho com ícone de lixeira em cada linha da tabela
- Abre dialog de confirmação mostrando:
  - Nome do item
  - Quantidade atual
- Exclusão permanente (não reverte estoque automaticamente)

## Scripts SQL Necessários

### Executar no Supabase SQL Editor

Arquivo: `database/updates/025_almoxarifado_rls.sql`

Este script:
1. Habilita RLS nas tabelas `almoxarifado_itens` e `almoxarifado_movimentacoes`
2. Cria políticas para GESTOR (apenas)
3. Garante estrutura das tabelas
4. Cria índices para performance
5. Adiciona trigger para `updated_at`

**Importante:** Super Admin NÃO tem acesso aos dados do almoxarifado das escolas.

## Estrutura de Dados

### almoxarifado_itens
```
- id (UUID)
- tenant_id (UUID) → escolas.id
- nome (TEXT)
- categoria (TEXT): material_didatico, limpeza, papelaria, outro
- quantidade (INTEGER)
- alerta_estoque_minimo (INTEGER)
- custo_unitario (NUMERIC)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### almoxarifado_movimentacoes
```
- id (UUID)
- tenant_id (UUID) → escolas.id
- item_id (UUID) → almoxarifado_itens.id
- tipo (TEXT): entrada, saida
- quantidade (INTEGER)
- justificativa (TEXT)
- created_at (TIMESTAMPTZ)
```

## Políticas RLS

Todas as políticas são baseadas no gestor da escola:

```sql
-- Leitura
EXISTS (
  SELECT 1 FROM escolas
  WHERE escolas.id = almoxarifado_itens.tenant_id
  AND escolas.gestor_user_id = auth.uid()
)

-- Insert, Update, Delete usam a mesma lógica
```

## Hooks Disponíveis

```typescript
useItensAlmoxarifado()         // Lista todos os itens
useCriarItemAlmoxarifado()     // Cria novo item
useAtualizarItemAlmoxarifado() // Atualiza item existente
useDeletarItemAlmoxarifado()   // Exclui item
useMovimentacoes()             // Lista movimentações
useCriarMovimentacao()         // Registra entrada/saída
useDeletarMovimentacao()       // Exclui movimentação
```

## Uso na Interface

### Tabela de Estoque
| Item | Categoria | Quantidade | Custo Unit. | Alerta | Ações |
|------|-----------|------------|-------------|--------|-------|
| Papel A4 | Papelaria | 50 ⚠️ | R$ 25,00 | 10 | ✏️ 🗑️ |

- ⚠️: Aparece quando quantidade ≤ alerta_estoque_minimo
- ✏️: Botão de editar (azul)
- 🗑️: Botão de excluir (vermelho)

### Considerações Importantes

1. **Estoque**: A exclusão de um item não remove as movimentações históricas
2. **Movimentações**: Podem ser excluídas, mas isso não reverte o estoque automaticamente
3. **Permissões**: Apenas o gestor da escola pode gerenciar o almoxarifado
4. **Sincronização**: O estoque é atualizado automaticamente ao registrar movimentações

## Próximos Passos Sugeridos

1. ✅ Executar script SQL `025_almoxarifado_rls.sql` no Supabase
2. ✅ Testar edição de itens em http://localhost:5173/almoxarifado
3. ✅ Testar exclusão de itens
4. ⏳ Implementar reversão de estoque ao excluir movimentação
5. ⏳ Adicionar histórico de alterações nos itens
6. ⏳ Implementar relatório de consumo por período
