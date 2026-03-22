# Guia de Tipografia Nativa - iOS HIG & Material Design 3

## 📐 Escala Tipográfica Padrão

### iOS Human Interface Guidelines

| Estilo | Tamanho | Peso | Uso |
|--------|---------|------|-----|
| **Large Title** | 28px | Bold (700) | Títulos de página principais |
| **Title 1** | 22px | Regular (400) | Títulos de seção |
| **Title 2** | 17px | Semibold (600) | Títulos de cards, headers |
| **Title 3** | 17px | Regular (400) | Títulos secundários |
| **Body** | 15px | Regular (400) | Conteúdo principal |
| **Callout** | 15px | Regular (400) | Texto destacado |
| **Subhead** | 14px | Regular (400) | Subtítulos |
| **Caption 1** | 13px | Regular (400) | Legendas, metadata |
| **Caption 2** | 12px | Regular (400) | Legendas pequenas |
| **Footnote** | 11px | Regular (400) | Notas de rodapé |

### Material Design 3 (Android)

| Estilo | Tamanho | Peso | Uso |
|--------|---------|------|-----|
| **Headline Large** | 28px | Bold (700) | Títulos de página |
| **Headline Medium** | 22px | Regular (400) | Títulos de seção |
| **Title Large** | 17px | Semibold (600) | Títulos de cards |
| **Title Medium** | 17px | Regular (400) | Títulos secundários |
| **Title Small** | 14px | Medium (500) | Títulos pequenos |
| **Body Large** | 16px | Regular (400) | Conteúdo principal |
| **Body Medium** | 15px | Regular (400) | Conteúdo secundário |
| **Body Small** | 13px | Regular (400) | Texto auxiliar |
| **Label Large** | 14px | Medium (500) | Labels de botões |
| **Label Medium** | 12px | Medium (500) | Labels secundários |
| **Label Small** | 11px | Medium (500) | Chips, badges |

---

## ✅ Padrão Unificado (Portal Mobile)

### Títulos

```tsx
// Large Title - Página Principal
<h1 className="text-[28px] font-bold text-slate-900">
  Título da Página
</h1>

// Title 2 / Title Large - Seções
<h2 className="text-[17px] font-semibold text-slate-900">
  Seção
</h2>

// Title 3 / Title Medium - Subseções
<h3 className="text-[17px] text-slate-900">
  Subseção
</h3>
```

### Corpo de Texto

```tsx
// Body / Body Medium - Conteúdo principal
<p className="text-[15px] text-slate-900">
  Conteúdo do texto
</p>

// Body Small / Caption - Texto secundário
<p className="text-[13px] text-slate-500">
  Texto auxiliar
</p>
```

### Labels e Legendas

```tsx
// Label Large - Botões
<span className="text-[14px] font-medium text-slate-700">
  Texto do botão
</span>

// Label Medium - Formulários
<label className="text-[12px] font-medium text-slate-600">
  Nome do campo
</label>

// Label Small - Badges
<span className="text-[11px] font-medium text-slate-600 uppercase">
  Badge
</span>
```

---

## 🎨 Pesos de Fonte

### Regra Geral

| Elemento | Peso | Justificativa |
|----------|------|---------------|
| Títulos de página | Bold (700) | Hierarquia visual clara |
| Títulos de seção | Semibold (600) | Destaque moderado |
| Corpo de texto | Regular (400) | Legibilidade ideal |
| Labels | Medium (500) | Legibilidade em tamanhos pequenos |
| Legendas | Regular (400) | Texto secundário discreto |

### ❌ ERROS COMUNS

```tsx
// ❌ NÃO FAZER
text-[15px] font-medium    // Body não usa medium
text-[17px] font-bold      // Title 2 não usa bold
text-[11px] font-bold      // Label small não usa bold
text-[13px] font-semibold  // Caption não usa semibold
```

### ✅ CORRETO

```tsx
// ✅ FAZER
text-[15px]                // Body - Regular (default)
text-[17px] font-semibold  // Title 2
text-[11px] font-medium    // Label Small
text-[13px]                // Caption 1 - Regular (default)
```

---

## 📱 Exemplos Práticos

### Header de Página

```tsx
<header className="pt-[env(safe-area-inset-top,12px)] px-4 pb-2">
  {/* Large Title - 28px Bold */}
  <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">
    Meus Dados
  </h1>
  {/* Caption 1 - 13px Regular */}
  <p className="text-[13px] text-slate-500 uppercase tracking-widest">
    Informações do Responsável
  </p>
</header>
```

### Card de Informação

```tsx
<Card>
  {/* Title 2 - 17px Semibold */}
  <h3 className="text-[17px] font-semibold text-slate-900">
    Dados Pessoais
  </h3>
  
  {/* Body - 15px Regular */}
  <p className="text-[15px] text-slate-900">
    Nome: {responsavel.nome}
  </p>
  
  {/* Caption 1 - 13px Regular */}
  <p className="text-[13px] text-slate-500">
    Última atualização: {data}
  </p>
</Card>
```

### Formulário

```tsx
<form>
  {/* Label Medium - 12px Medium */}
  <label className="text-[12px] font-medium text-slate-600 uppercase">
    Nome Completo
  </label>
  
  {/* Input - 15px Regular */}
  <input className="text-[15px] text-slate-900" />
  
  {/* Helper Text - 12px Regular */}
  <p className="text-[12px] text-slate-500">
    Digite seu nome completo
  </p>
</form>
```

### Badge / Chip

```tsx
{/* Label Small - 11px Medium */}
<span className="text-[11px] font-medium text-slate-600 uppercase tracking-wide">
  Pendente
</span>
```

---

## 🎯 Checklist de Validação

Antes de commitar, verifique:

- [ ] Títulos de página usam `text-[28px] font-bold`
- [ ] Títulos de seção usam `text-[17px] font-semibold`
- [ ] Corpo de texto usa `text-[15px]` (Regular)
- [ ] Labels usam `text-[11px/12px/14px] font-medium`
- [ ] Legendas usam `text-[12px/13px]` (Regular)
- [ ] Nenhum `font-bold` em texto de corpo
- [ ] Nenhum `font-medium` em captions
- [ ] Contraste ≥ 4.5:1 (WCAG AA)

---

## 📊 Contraste de Cores (WCAG AA)

| Cor | Uso | Contraste | Status |
|-----|-----|-----------|--------|
| `slate-900` | Títulos, body | 12.6:1 | ✅ Aprovado |
| `slate-700` | Títulos secundários | 6.1:1 | ✅ Aprovado |
| `slate-600` | Labels | 5.2:1 | ✅ Aprovado |
| `slate-500` | Legendas | 4.5:1 | ✅ Aprovado |
| `slate-400` | Placeholder | 3.2:1 | ❌ Não usar |

---

## 🔗 Referências

- [iOS Human Interface Guidelines - Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
- [Material Design 3 - Type Scale](https://m3.material.io/styles/typography/type-scale-tokens)
- [WCAG 2.2 - Contrast Requirements](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

---

**Última atualização:** 22 de março de 2026
**Versão:** 1.0
