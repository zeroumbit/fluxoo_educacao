# 🔍 Auditoria de UX/UI Nativa - Portal da Família (Mobile)

**Data:** 29 de março de 2026  
**Versão Auditada:** Portal V2 Mobile  
**Plataforma:** React Web App (PWA)

---

## ✅ O Que Está SEGUINDO Regras Nativas

### 1. Safe Areas e Notch (iOS/Android) ✅

**Implementado Corretamente:**
```tsx
// Header com safe area top
<header className="flex items-start justify-between pt-[env(safe-area-inset-top,12px)] mt-2 pb-2">

// Main com safe area bottom
<main className="flex-1 w-full max-w-md mx-auto pb-[env(safe-area-inset-bottom,120px)]">
```

**Por Que Está Correto:**
- `env(safe-area-inset-top)` respeita notch do iPhone e barra de status Android
- `env(safe-area-inset-bottom)` respeita home indicator (iOS) e gesture bar (Android)
- Previne que conteúdo fique atrás de elementos do sistema

---

### 2. Touch Targets Mínimos (48x48px) ✅

**Implementado Corretamente:**
```tsx
// Botões com 48px mínimo
<button className="w-12 h-12 flex items-center justify-center min-h-[48px] min-w-[48px]">
  <ArrowLeft className="w-6 h-6" />
</button>

// Touch target para navegação
<button className="min-h-[48px] px-3 flex items-center justify-center rounded-[12px]">
```

**Por Que Está Correto:**
- Segue **Human Interface Guidelines (iOS)**: 44x44px mínimo
- Segue **Material Design (Android)**: 48x48px mínimo
- Acessibilidade para usuários com dificuldades motoras

---

### 3. Haptic Feedback (Vibração) ✅

**Implementado Corretamente:**
```tsx
const vibrate = (ms: number | number[] = 20) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(ms);
  }
}

// Uso em interações
onClick={() => {
  vibrate(15); // Feedback tátil leve
  setSelectedAluno(aluno);
}}
```

**Por Que Está Correto:**
- Feedback tátil em ações importantes
- Duração apropriada (15-40ms)
- Fallback para dispositivos sem vibração

---

### 4. Skeleton Loading (iOS/Android) ✅

**Implementado Corretamente:**
```tsx
function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-4 animate-pulse">
      <div className="h-4 w-20 bg-slate-100 rounded" />
      <div className="h-8 w-40 bg-slate-200 rounded-lg" />
    </div>
  )
}
```

**Por Que Está Correto:**
- Animação `animate-pulse` simula carregamento
- Cores sutis (slate-100, slate-200)
- Estrutura espelha layout real
- Reduz percepção de tempo de espera

---

### 5. Page Transitions (iOS/Android) ✅

**Implementado Corretamente:**
```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={location.pathname}
    initial={{ opacity: 0, x: 16 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -16 }}
    transition={{ type: 'spring', stiffness: 350, damping: 32, mass: 0.9 }}
  >
    <Outlet />
  </motion.div>
</AnimatePresence>
```

**Por Que Está Correto:**
- **iOS**: Transição da direita para esquerda (back da esquerda)
- **Spring physics**: Sensação natural de física
- **Duração**: ~300ms (padrão nativo)

---

### 6. Bottom Sheet (iOS Sheet / Android Bottom Sheet) ✅

**Implementado Corretamente:**
```tsx
<Sheet open={!!selectedAluno} onOpenChange={(open) => !open && setSelectedAluno(null)}>
  <SheetContent side="bottom" className="rounded-t-[32px] p-0 border-t">
    {/* Handle Indicator */}
    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-slate-200 rounded-full" />
    <DetailDrawerMobile />
  </SheetContent>
</Sheet>
```

**Por Que Está Correto:**
- **Handle indicator**: Barra cinza no topo (padrão iOS)
- **Bordas arredondadas**: `rounded-t-[32px]` (visual moderno)
- **Slide de baixo**: `side="bottom"`
- **Max height**: `max-h-[90vh]` (não ocupa tela toda)

---

### 7. Tipografia Hierárquica ✅

**Implementado Corretamente:**
```tsx
// Large Title (iOS) / Headline Small (Material)
<h1 className="text-[28px] font-bold text-slate-900 tracking-tight leading-[34px]">

// Title 2 (iOS) / Title Small (Material)
<h2 className="text-[17px] font-semibold text-slate-900">

// Body (iOS/Android)
<span className="text-[15px] text-slate-900 leading-tight">

// Caption (iOS Caption 2 / Material Label Small)
<span className="text-[12px] font-medium text-slate-500">
```

**Por Que Está Correto:**
- Segue escala de tipografia nativa
- Contraste adequado (slate-900, slate-500)
- Line-height apropriado para leitura

---

### 8. Horizontal Scroll Snap ✅

**Implementado Corretamente:**
```tsx
<div
  className="flex gap-3 overflow-x-auto pb-4 px-1 snap-x hide-scrollbar scroll-smooth"
  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
>
  <motion.div className="min-w-[85vw] max-w-[340px] snap-start">
```

**Por Que Está Correto:**
- `snap-x` e `snap-start`: Scroll magnético (iOS Cards)
- `hide-scrollbar`: Esconde scrollbar (visual limpo)
- `scroll-smooth`: Suavização nativa

---

## ❌ O Que NÃO Está Seguindo Regras Nativas

### 1. ❌ Ausência de Pull-to-Refresh

**Problema:**
```tsx
// Não implementado
// Usuários esperam puxar para baixo para atualizar
```

**Impacto:**
- Usuários de iOS/Android esperam gesto de pull-to-refresh
- Sem feedback de atualização
- Precisa clicar em botão manual (não nativo)

**Solução Recomendada:**
```tsx
import { PullToRefresh } from '@/components/ui/pull-to-refresh'

<PullToRefresh onRefresh={async () => await refetch()}>
  <main>
    {/* Conteúdo */}
  </main>
</PullToRefresh>
```

**Prioridade:** ALTA  
**Tempo estimado:** 2 horas

---

### 2. ❌ Ausência de Error Boundaries

**Problema:**
```tsx
// Não implementado
// Erros não tratados quebram o app inteiro
```

**Impacto:**
- Tela branca em caso de erro
- Sem mensagem de erro amigável
- Sem botão de "Tentar Novamente"

**Solução Recomendada:**
```tsx
<ErrorBoundary
  fallback={({ error, resetErrorBoundary }) => (
    <div className="flex flex-col items-center justify-center p-6">
      <AlertTriangle className="h-12 w-12 text-rose-500 mb-4" />
      <h2 className="text-lg font-bold text-rose-900 mb-2">
        Ops! Algo deu errado
      </h2>
      <p className="text-rose-600 text-sm mb-4">
        {error?.message || 'Erro desconhecido'}
      </p>
      <Button onClick={resetErrorBoundary} className="bg-rose-600">
        Tentar Novamente
      </Button>
    </div>
  )}
>
  <Outlet />
</ErrorBoundary>
```

**Prioridade:** CRÍTICA  
**Tempo estimado:** 3 horas

---

### 3. ❌ Ausência de Offline Detection

**Problema:**
```tsx
// Não implementado
// App não avisa quando está offline
```

**Impacto:**
- Usuário não sabe se está offline
- Requisições falham silenciosamente
- Frustração do usuário

**Solução Recomendada:**
```tsx
const { isOnline } = useNetworkStatus()

if (!isOnline) {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-amber-50">
      <WifiOff className="h-12 w-12 text-amber-500 mb-4" />
      <h2 className="text-lg font-bold text-amber-900">
        Você está offline
      </h2>
      <p className="text-amber-700 text-sm">
        Algumas funcionalidades podem não estar disponíveis
      </p>
    </div>
  )
}
```

**Prioridade:** ALTA  
**Tempo estimado:** 4 horas

---

### 4. ❌ Ausência de Loading States em Botões

**Problema:**
```tsx
<Button onClick={handlePagar}>
  Pagar Agora
</Button>

// Deveria ser:
<Button onClick={handlePagar} disabled={isLoading}>
  {isLoading ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : (
    'Pagar Agora'
  )}
</Button>
```

**Impacto:**
- Usuário clica múltiplas vezes
- Múltiplas requisições ao servidor
- Possível cobrança duplicada

**Solução Recomendada:**
```tsx
const [isLoading, setIsLoading] = useState(false)

const handlePagar = async () => {
  setIsLoading(true)
  try {
    await pagarCobranca(id)
  } finally {
    setIsLoading(false)
  }
}

<Button onClick={handlePagar} disabled={isLoading}>
  {isLoading ? (
    <span className="flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      Processando...
    </span>
  ) : (
    'Pagar Agora'
  )}
</Button>
```

**Prioridade:** ALTA  
**Tempo estimado:** 6 horas

---

### 5. ❌ Ausência de Confirmação para Ações Destrutivas

**Problema:**
```tsx
// Não implementado
// Usuário pode acidentalmente cancelar matrícula
```

**Impacto:**
- Ações acidentais
- Perda de dados
- Suporte sobrecarregado

**Solução Recomendada:**
```tsx
<AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
      <AlertDialogDescription>
        Esta ação não pode ser desfeita. A matrícula será cancelada.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction onClick={handleCancelar}>
        Sim, Cancelar
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Prioridade:** MÉDIA  
**Tempo estimado:** 3 horas

---

### 6. ❌ Scroll Restoration Não Implementado

**Problema:**
```tsx
// Navegar para outra página e voltar perde posição do scroll
```

**Impacto:**
- Usuário volta para o topo da página
- Perde contexto
- Experiência frustrante

**Solução Recomendada:**
```tsx
// No React Router
<BrowserRouter
  window={window}
  scrollRestoration="auto"
>
```

**Prioridade:** BAIXA  
**Tempo estimado:** 1 hora

---

### 7. ❌ Ausência de Focus Management (Acessibilidade)

**Problema:**
```tsx
// Elementos focáveis não têm indicação visual
// Navegação por teclado não funciona
```

**Impacto:**
- Usuários com deficiência visual não conseguem navegar
- Violação de WCAG 2.1
- Possível processo por acessibilidade

**Solução Recomendada:**
```tsx
// Adicionar focus states em todos os elementos interativos
<button
  className="focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
>
```

**Prioridade:** CRÍTICA  
**Tempo estimado:** 8 horas

---

### 8. ❌ Ausência de Aria Labels em Ícones

**Problema:**
```tsx
<button onClick={() => navigate('/portal/avisos')}>
  <ArrowRight className="w-[18px] h-[18px]" />
</button>

// Deveria ser:
<button
  onClick={() => navigate('/portal/avisos')}
  aria-label="Ver todos os avisos"
>
  <ArrowRight className="w-[18px] h-[18px]" aria-hidden="true" />
</button>
```

**Impacto:**
- Leitores de tela não descrevem botões
- Usuários cegos não entendem funcionalidade

**Solução Recomendada:**
```tsx
// Adicionar aria-label em todos os botões com ícones
<button aria-label="Voltar">
  <ArrowLeft aria-hidden="true" />
</button>
```

**Prioridade:** ALTA  
**Tempo estimado:** 4 horas

---

## 📊 Score de Conformidade Nativa

| Categoria | Score | Status |
|-----------|-------|--------|
| **Safe Areas** | 10/10 | ✅ Excelente |
| **Touch Targets** | 10/10 | ✅ Excelente |
| **Haptic Feedback** | 8/10 | ✅ Bom |
| **Skeleton Loading** | 9/10 | ✅ Excelente |
| **Page Transitions** | 9/10 | ✅ Excelente |
| **Bottom Sheets** | 9/10 | ✅ Excelente |
| **Tipografia** | 9/10 | ✅ Excelente |
| **Scroll Snap** | 10/10 | ✅ Excelente |
| **Pull-to-Refresh** | 0/10 | ❌ Crítico |
| **Error Boundaries** | 0/10 | ❌ Crítico |
| **Offline Detection** | 0/10 | ❌ Crítico |
| **Loading States** | 3/10 | ⚠️ Atenção |
| **Confirmações** | 2/10 | ⚠️ Atenção |
| **Scroll Restoration** | 0/10 | ❌ Crítico |
| **Focus Management** | 0/10 | ❌ Crítico |
| **Aria Labels** | 5/10 | ⚠️ Atenção |
| **Score Geral** | **5.3/10** | ⚠️ **Precisa Melhorar** |

---

## 🎯 Prioridades de Correção

### Crítico (Esta Sprint)
1. ✅ **Error Boundaries** - Prevenir telas brancas
2. ✅ **Focus Management** - Acessibilidade (WCAG)
3. ✅ **Offline Detection** - Feedback de conexão

### Alto (Próxima Sprint)
4. ✅ **Pull-to-Refresh** - Gesto nativo esperado
5. ✅ **Loading States** - Prevenir cliques múltiplos
6. ✅ **Aria Labels** - Acessibilidade

### Médio (Próximas Iterações)
7. ✅ **Confirmações** - Prevenir ações acidentais
8. ✅ **Scroll Restoration** - Melhorar UX de navegação

---

## 📱 Comparação com Apps Nativos

| Funcionalidade | WhatsApp | Instagram | Portal Família |
|----------------|----------|-----------|----------------|
| Safe Areas | ✅ | ✅ | ✅ |
| Pull-to-Refresh | ✅ | ✅ | ❌ |
| Skeleton Loading | ✅ | ✅ | ✅ |
| Error States | ✅ | ✅ | ❌ |
| Offline Mode | ✅ | ⚠️ | ❌ |
| Haptic Feedback | ✅ | ✅ | ✅ |
| Bottom Sheets | ✅ | ✅ | ✅ |
| Focus States | ✅ | ✅ | ❌ |

---

## 🔧 Recomendações Técnicas

### 1. Implementar React Query Error Boundaries
```tsx
import { ErrorBoundary } from 'react-error-boundary'

function QueryErrorBoundary({ children }) {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div className="p-6 text-center">
          <h2 className="text-lg font-bold">Erro ao carregar</h2>
          <p className="text-sm text-slate-500">{error.message}</p>
          <Button onClick={resetErrorBoundary}>Tentar Novamente</Button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}
```

### 2. Hook de Network Status
```tsx
function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline }
}
```

### 3. Pull-to-Refresh Component
```tsx
import { usePullToRefresh } from '@/hooks/usePullToRefresh'

function Page() {
  const { refetch, isRefreshing } = usePullToRefresh()

  return (
    <PullToRefresh refreshing={isRefreshing} onRefresh={refetch}>
      {/* Conteúdo */}
    </PullToRefresh>
  )
}
```

---

## ✅ Conclusão

O Portal da Família Mobile tem **boa base de UI nativa** (safe areas, touch targets, transitions), mas precisa de melhorias críticas em:

1. **Tratamento de Erros** - Error boundaries
2. **Acessibilidade** - Focus states, aria labels
3. **Feedback de Conexão** - Offline detection
4. **Gestos Nativos** - Pull-to-refresh

**Score atual: 5.3/10**  
**Score potencial: 9/10** (após correções)

---

**Auditor realizado por:** Fluxoo UX/UI Team  
**Próxima auditoria:** Após implementação das correções críticas
