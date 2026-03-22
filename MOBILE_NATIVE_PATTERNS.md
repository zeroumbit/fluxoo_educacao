# Boas Práticas de Aplicativo Nativo Aplicadas - Portal Mobile

## 📱 Visão Geral

Este documento descreve todas as boas práticas de aplicativos nativos iOS e Android aplicadas às páginas mobile do Portal (/portal).

---

## ✅ Arquivos Modificados

### 1. `src/modules/portal/v2/pages/PortalHomeV2.mobile.tsx`
### 2. `src/modules/portal/v2/components/BottomNavV2.tsx`
### 3. `src/modules/portal/v2/PortalLayoutV2.mobile.tsx`
### 4. `src/modules/portal/v2/pages/PortalAlunosListV2.mobile.tsx`
### 5. `src/modules/portal/v2/pages/PortalAlunoPerfilV2.mobile.tsx`
### 6. `src/modules/portal/v2/pages/PortalAvisosPageV2.mobile.tsx` ✨ NOVO
### 7. `src/modules/portal/v2/pages/PortalCobrancasPageV2.mobile.tsx` ✨ NOVO - Financeiro
### 8. `src/modules/portal/pages/PortalPerfilPage.mobile.tsx` ✨ NOVO - Perfil
### 9. `src/index.css` (Utilitários globais)

---

## 📐 Padrões Aplicados

### 1. **Safe Area Insets (iOS/Android)**

```css
/* Suporte para notch do iPhone e gesture bar do Android */
padding-top: env(safe-area-inset-top, 16px);
padding-bottom: env(safe-area-inset-bottom, 16px);
```

**Onde foi aplicado:**
- Header de todas as páginas
- Bottom navigation
- Modais e bottom sheets
- Footer de formulários

---

### 2. **Touch Targets (WCAG 2.2, iOS HIG, Material Design 3)**

| Plataforma | Mínimo | Recomendado |
|------------|--------|-------------|
| **iOS** | 44pt × 44pt | 48pt × 48pt |
| **Android** | 48dp × 48dp | 56dp × 56dp |

**Implementação:**
```tsx
// Botões e elementos interativos
className="min-h-[48px] min-w-[48px] touch-manipulation"
```

**Onde foi aplicado:**
- Todos os botões
- Links de navegação
- Ícones clicáveis
- Cards interativos
- Bottom navigation items (60px altura)

---

### 3. **Hierarquia Tipográfica Nativa**

#### iOS Human Interface Guidelines
| Estilo | Tamanho | Peso | Uso |
|--------|---------|------|-----|
| Large Title | 28-34px | Bold | Títulos de página |
| Title 1/2/3 | 22-28px | Bold | Títulos de seção |
| Body | 15-17px | Regular | Conteúdo principal |
| Caption 1/2 | 11-13px | Medium | Legendas, metadata |

#### Material Design 3
| Estilo | Tamanho | Peso | Uso |
|--------|---------|------|-----|
| Headline Medium | 22-28px | Bold | Títulos |
| Title Medium | 17-20px | Bold | Títulos de cards |
| Body Medium | 15-17px | Regular | Texto corrido |
| Label Small | 11-13px | Bold | Labels, chips |

**Implementação:**
```tsx
// Títulos de página (iOS Large Title / Material Headline)
<h1 className="text-[28px] font-bold leading-[34px]">

// Corpo de texto (iOS Body / Material Body Medium)
<p className="text-[15px] font-medium leading-tight">

// Legendas (iOS Caption / Material Label Small)
<span className="text-[13px] font-semibold">
```

---

### 4. **Navegação Nativa**

#### iOS - Edge Swipe Gesture
```tsx
// Transição de página com slide da direita para esquerda
<AnimatePresence mode="wait">
  <motion.div
    initial={{ opacity: 0, x: 16 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -16 }}
    transition={{ type: 'spring', stiffness: 350, damping: 32 }}
  >
```

#### Android - Back Button
- Botões de voltar em todos os headers
- Bottom sheets com botão de fechar
- Navegação hierárquica clara

---

### 5. **Bottom Navigation (Padrão Nativo)**

```tsx
// Especificações aplicadas:
- Altura do item: 60px (acima do mínimo de 48px)
- Ícones: 24px (SF Symbols / Material Icons equivalent)
- Labels: 11px (Caption 1 iOS / Label Small Material)
- Safe area bottom: env(safe-area-inset-bottom)
- Border radius top: 28px (visual moderno)
- Shadow: 0 -2px 20px rgba(0,0,0,0.04)
```

---

### 6. **Feedback Tátil Visual**

```tsx
// Press states em todos os botões
<motion.button
  whileTap={{ scale: 0.97 }}
  className="active:scale-97 transition-transform touch-manipulation"
>

// Estados hover/active
className="active:bg-slate-100 transition-colors"
```

---

### 7. **Acessibilidade (WCAG 2.2)**

```tsx
// Labels em todos os elementos interativos
<button aria-label="Voltar para home">
<button aria-label="Ver todos os avisos">

// Current page indication
<NavLink aria-current={isActive ? 'page' : undefined}>

// Elementos decorativos marcados
<div aria-hidden="true">
<Icon aria-hidden="true" />

// Roles semânticos
<div role="alert">
<div role="region" aria-label="Lista horizontal de avisos">
```

---

### 8. **Espaçamentos e Layout**

#### Padding Horizontal (iOS/Android)
```tsx
className="px-4" // 16px - padrão para conteúdo principal
```

#### Gap entre Elementos
```tsx
className="gap-3" // 12px - espaçamento mínimo recomendado
className="gap-4" // 16px - espaçamento confortável
```

#### Border Radius (Visual Moderno)
```tsx
className="rounded-[24px]" // Cards
className="rounded-[16px]" // Botões, ícones
className="rounded-[28px]" // Containers grandes
```

---

## 🎨 Utilitários CSS Criados

### Safe Area
```css
.pb-safe { padding-bottom: env(safe-area-inset-bottom, 16px); }
.pt-safe { padding-top: env(safe-area-inset-top, 16px); }
.pl-safe { padding-left: env(safe-area-inset-left, 16px); }
.pr-safe { padding-right: env(safe-area-inset-right, 16px); }
.p-safe  { padding em todos os lados }
```

### Touch Targets
```css
.touch-target-sm { min-height: 44px; min-width: 44px; }
.touch-target-md { min-height: 48px; min-width: 48px; }
.touch-target-lg { min-height: 56px; min-width: 56px; }
.touch-manipulation { touch-action: manipulation; }
```

### Tipografia Nativa
```css
.font-native-display   { clamp(28px, 5vw, 34px) }
.font-native-headline  { clamp(22px, 4vw, 28px) }
.font-native-title     { clamp(17px, 3vw, 20px) }
.font-native-body      { clamp(15px, 2.5vw, 17px) }
.font-native-caption   { clamp(11px, 2vw, 13px) }
.font-native-label     { clamp(13px, 2.5vw, 15px) }
```

### Shadows (Material Design 3)
```css
.shadow-card-sm { 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06) }
.shadow-card-md { 0 4px 8px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04) }
.shadow-card-lg { 0 8px 24px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04) }
```

---

## 📋 Checklist de Verificação

### ✅ Touch Targets
- [x] Todos os botões têm mínimo 48px de altura
- [x] Ícones clicáveis têm área de toque adequada
- [x] Links em listas têm área de toque estendida
- [x] Bottom navigation items têm 60px de altura

### ✅ Tipografia
- [x] Títulos de página: 28px bold
- [x] Títulos de seção: 17-20px bold
- [x] Corpo de texto: 15-17px
- [x] Legendas: 11-13px
- [x] Line-height adequado para legibilidade

### ✅ Safe Areas
- [x] Header com padding top seguro
- [x] Bottom navigation com padding bottom seguro
- [x] Modais/sheets com safe area
- [x] Conteúdo principal respeita safe area

### ✅ Navegação
- [x] Botões de voltar em todas as páginas
- [x] Transições suaves entre páginas
- [x] Bottom navigation com estados ativos claros
- [x] aria-current em navegação

### ✅ Acessibilidade
- [x] aria-label em botões icônicos
- [x] aria-hidden em elementos decorativos
- [x] Roles semânticos (alert, region)
- [x] Focus states visíveis

### ✅ Feedback Visual
- [x] Press states em todos os botões
- [x] Scale animation no tap
- [x] Hover states em desktop
- [x] Active states claros

---

## 🚀 Próximos Passos Sugeridos

1. **Implementar em outras páginas mobile:**
   - `PortalAvisosPageV2.tsx`
   - `PortalFinanceiroV2.tsx`
   - `PortalCobrancasPageV2.tsx`

2. **Adicionar componentes reutilizáveis:**
   - `Button` com padrões nativos
   - `Card` com shadows Material Design
   - `ListItem` com touch targets adequados

3. **Otimizações de performance:**
   - Lazy loading de imagens
   - Virtualização de listas longas
   - Code splitting por página

---

## 📚 Referências

- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design 3](https://m3.material.io/)
- [WCAG 2.2 Accessibility](https://www.w3.org/TR/WCAG22/)
- [Mobile-First Design Guidelines](https://developers.google.com/web/fundamentals/design-and-ux/responsive/)

---

**Build Status:** ✅ Aprovado
**Data:** 22 de março de 2026
**Versão:** 1.0
