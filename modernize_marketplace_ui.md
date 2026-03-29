# Task: Modernize Marketplace Registration UI

Align "Lojistas e Profissionais" registration with "Escola" premium UI.

## Context
The user wants the Marketplace registration (Professionals and Shopkeepers) to look exactly like the School registration, using the same layout (sidebar + main card), but keeping a black/zinc-900 color scheme for the sidebar.

## Plan

### Phase 1: Preparation
- [ ] Identify reference styles in `EscolaCadastroPage.tsx`.
- [ ] List all steps for "Profissional" and "Lojista" for the sidebar markers.

### Phase 2: Structural Changes
- [ ] Introduce the `Escola` registration layout (Flexbox with sidebar and main content).
- [ ] Implement the dynamic sidebar that switches steps based on `tipoAtivo`.
- [ ] Maintain `Tabs` but inside step content OR integrate selection as step 1.

### Phase 3: Component Styling
- [ ] Style inputs, labels, and buttons according to the reference page.
- [ ] Add the premium touches: `bg-gradient`, `shadow-2xl`, `rounded-3xl`, and micro-animations.

### Phase 4: Finalization
- [ ] Test form submission flow.
- [ ] Verify phone/mask functionality.
- [ ] Ensure mobile responsiveness.
