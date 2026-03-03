## Qwen Added Memories

### Regras de Negócio - Super Admin
- **O Super Admin NÃO tem qualquer gerência sobre as ações funcionais/administrativas das escolas.**
- O Super Admin não pode criar, editar ou excluir dados administrativos das escolas (eventos, alunos, funcionários, turmas, financeiro, almoxarifado, etc.)
- O papel do Super Admin é restrito a:
  - Visualizar dados das escolas (leitura)
  - Gerenciar planos e assinaturas
  - Aprovar cadastros de escolas
  - Acesso global apenas para consulta/auditoria
- **Quem gerencia a escola:** Apenas o **Gestor** vinculado à escola (via `gestor_user_id`) tem permissões administrativas completas.

### UI/UX
- Ao ajustar campos Select (Radix UI) em grids, sempre adicionar `className="w-full"` no `SelectTrigger` para ocupar 100% da largura da coluna. Sem isso, o select não se expande mesmo dentro de `grid-cols-2`.
