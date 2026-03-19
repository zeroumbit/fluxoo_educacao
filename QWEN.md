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
- UI/UX - Cards: Ao criar cards, sempre adicionar `className="pt-[30px]"` no CardHeader para evitar que títulos fiquem grudados no topo. Distância padrão de 30px é o ideal.
- Regra de cores da plataforma: Admin das Escolas usa cor azul como padrão; Portão dos Responsáveis usa cor verde como padrão.
- Quando houver erro "The requested module '/src/App.tsx' does not provide an export named 'default'": 1) Usar `export default function App()` direto na definição da função (mais robusto para Vite/HMR); 2) Em main.tsx, usar importação explícita `import App from './App.tsx'`; 3) Corrigir caracteres especiais em comentários que podem causar problemas de codificação; 4) Executar `npm run build` para validar sintaxe e exportação padrão.
- Padrão de altura para BottomSheet/Dialog mobile: usar size="full" para formulários de edição (com cabeçalho explicativo, campos com placeholder e botão fixo no rodapé com loading animado) e size="half" para dialogs de confirmação de ações destrutivas (com ícone grande, caixa de "Atenção" com lista de consequências e caixa de "Recomendação" com contexto). Isso proporciona melhor UX com informações completas antes de confirmar ações.
- Padrão de altura para BottomSheet/Dialog mobile atualizado: usar size="full" para formulários de edição E para dialogs de confirmação de ações destrutivas (com ícone grande, subtítulo explicativo, caixa de "O que acontece?" com lista numerada de consequências, caixa "Quando usar?" com contexto, e caixa "Importante" com observações adicionais). Botões fixos no rodapé com loading animado. Isso proporciona UX completa e informativa antes de confirmar ações importantes.
