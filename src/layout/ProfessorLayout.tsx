import { useState, useEffect } from 'react'
import { Link, useLocation, Outlet, Navigate, NavLink } from 'react-router-dom'
import { useAuth } from '@/modules/auth/AuthContext'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  Users,
  Calendar,
  ClipboardCheck,
  FileText,
  AlertTriangle,
  House,
  GraduationCap,
  Menu,
  X,
  User,
  LogOut,
  Bell,
  School,
  ChevronRight,
  Home,
  Sparkles
} from 'lucide-react'
import { SmartAssistant } from '@/modules/professor/components/SmartAssistant'
import { useDailyInsights } from '@/modules/professor/hooks/useDailyInsights'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import CorujaIcon from '@/assets/coruja_ANDROID.svg'

const professorNavGroups = [
  {
    label: 'Principal',
    items: [
      {
        name: 'Dashboard',
        href: '/professores/dashboard',
        icon: House,
      },
      {
        name: 'Minhas Turmas',
        href: '/professores/turmas',
        icon: Users,
      },
      {
        name: 'Alunos',
        href: '/professores/alunos',
        icon: User,
      },
    ],
  },
  {
    label: 'Aulas & Avaliações',
    items: [
      {
        name: 'Frequência',
        href: '/professores/frequencia',
        icon: ClipboardCheck,
      },
      {
        name: 'Planos de Aula',
        href: '/professores/planos-aula',
        icon: BookOpen,
      },
      {
        name: 'Atividades',
        href: '/professores/atividades',
        icon: FileText,
      },
      {
        name: 'Notas',
        href: '/professores/notas',
        icon: GraduationCap,
      },
    ],
  },
  {
    label: 'Comunicação',
    items: [
      {
        name: 'Agenda',
        href: '/professores/agenda',
        icon: Calendar,
      },
      {
        name: 'Alertas',
        href: '/professores/alertas',
        icon: AlertTriangle,
        badge: true,
      },
    ],
  },
]

// Itens fixos na parte inferior da sidebar (sempre por último)
const bottomNavigationItems = [
  { name: 'Meu Perfil', href: '/professores/perfil', icon: User },
]

function SidebarContent({
  onNavigate,
}: {
  onNavigate?: () => void,
}) {
  const { authUser, signOut } = useAuth()
  const location = useLocation()

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = '/login'
    } catch (error) {
      console.error('Erro ao sair:', error)
      window.location.href = '/login'
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo mobile-friendly no menu full-screen */}
      <div className="h-16 px-6 flex items-center justify-between lg:h-16 lg:px-6 lg:flex lg:items-center">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 lg:h-9 lg:w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center shadow-lg shadow-indigo-100 flex-shrink-0">
            <img src={CorujaIcon} alt="Fluxoo" className="h-5 w-5 lg:h-4.5 lg:w-4.5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-lg lg:text-base leading-tight tracking-tight truncate">Fluxoo</h2>
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50 truncate">Professor</p>
          </div>
        </div>
        {onNavigate && (
           <Button variant="ghost" size="icon" onClick={onNavigate} className="lg:hidden h-9 w-9 rounded-full bg-zinc-100">
              <X className="h-5 w-5 text-zinc-500" />
           </Button>
        )}
      </div>

      <Separator className="opacity-50" />

      {/* Navigation - Ampliado para mobile */}
      <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto scrollbar-hide">
        {professorNavGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href)
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={onNavigate}
                    className={cn(
                      'flex items-center gap-3 lg:gap-3 px-4 py-4 lg:px-3 lg:py-2 rounded-2xl lg:rounded-lg text-[16px] lg:text-sm font-semibold lg:font-medium transition-all duration-300 active:scale-[0.98] lg:active:scale-100 group',
                      active
                        ? 'bg-indigo-600 lg:bg-indigo-50 text-white lg:text-indigo-700 shadow-lg lg:shadow-none shadow-indigo-100'
                        : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900',
                    )}
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={cn('h-5 w-5 lg:h-4 lg:w-4 transition-colors flex-shrink-0', isActive ? 'text-white lg:text-indigo-600' : 'text-zinc-400')} />
                        <span className="flex-1 truncate">{item.name}</span>
                        {item.badge && !isActive && (
                          <Badge variant="destructive" className="text-xs">!</Badge>
                        )}
                        {isActive ? (
                          <div className="h-1.5 w-1.5 rounded-full bg-white lg:bg-indigo-400 opacity-50" />
                        ) : (
                          <ChevronRight className="h-4 w-4 lg:h-3.5 lg:w-3.5 text-zinc-300 flex-shrink-0 lg:opacity-0 group-hover:opacity-100" />
                        )}
                      </>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}

        {/* Itens de navegação inferior (sempre por último) */}
        {bottomNavigationItems.length > 0 && (
          <>
            <Separator className="opacity-50" />
            <div>
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Minha Conta
              </p>
              <div className="space-y-0.5">
                {bottomNavigationItems.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      onClick={onNavigate}
                      className={cn(
                        'flex items-center gap-3 lg:gap-3 px-4 py-4 lg:px-3 lg:py-2 rounded-2xl lg:rounded-lg text-[16px] lg:text-sm font-semibold lg:font-medium transition-all duration-300 active:scale-[0.98] lg:active:scale-100 group',
                        active
                          ? 'bg-indigo-600 lg:bg-indigo-50 text-white lg:text-indigo-700 shadow-lg lg:shadow-none shadow-indigo-100'
                          : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900',
                      )}
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon className={cn('h-5 w-5 lg:h-4 lg:w-4 transition-colors flex-shrink-0', isActive ? 'text-white lg:text-indigo-600' : 'text-zinc-400')} />
                          <span className="flex-1 truncate">{item.name}</span>
                          {isActive ? (
                            <div className="h-1.5 w-1.5 rounded-full bg-white lg:bg-indigo-400 opacity-50" />
                          ) : (
                            <ChevronRight className="h-4 w-4 lg:h-3.5 lg:w-3.5 text-zinc-300 flex-shrink-0 lg:opacity-0 group-hover:opacity-100" />
                          )}
                        </>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </nav>

      <Separator />

      {/* User */}
      <div className="p-4 pb-24 lg:pb-4 space-y-2">
        <div className="flex items-center gap-3 py-2.5 px-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white text-xs">
              {authUser?.nome?.substring(0, 2).toUpperCase() || 'P'}
            </AvatarFallback>
          </Avatar>
          <div className="text-left flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{authUser?.nome}</p>
            <p className="text-xs text-muted-foreground truncate">Professor</p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="w-full justify-start gap-3 h-10 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span className="font-medium">Sair do Sistema</span>
        </Button>
      </div>
    </div>
  )
}

export function ProfessorLayout() {
  const { authUser } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Redirecionar se não é professor
  if (!authUser?.isProfessor) {
    return <Navigate to="/dashboard" replace />
  }

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  const hideBottomNav = location.pathname === '/professores/perfil'

  return (
    <div className="min-h-[100dvh] bg-zinc-50/50 dark:bg-slate-950">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r bg-white/80 backdrop-blur-sm lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" showCloseButton={false} className="w-full sm:w-[400px] p-0 border-none shadow-2xl">
          <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
          <SheetDescription className="sr-only">Acesse as funcionalidades do professor através do menu lateral.</SheetDescription>
          <SidebarContent
            onNavigate={() => setSidebarOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Bottom Navigation para Mobile (App Style) */}
      {!hideBottomNav && (
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        <div className="mx-auto w-full flex items-stretch justify-between h-20 px-6 relative">
          {/* Lado Esquerdo */}
          <div className="flex items-center gap-3 flex-1 justify-start">
            <NavLink
              to="/professores/dashboard"
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 min-w-[56px] transition-all duration-300",
                  isActive ? "text-indigo-600 scale-110" : "text-zinc-400"
                )
              }
            >
              <Home className="h-6 w-6" />
              <span className="text-[10px] font-bold tracking-tight">Home</span>
            </NavLink>

            <NavLink
              to="/professores/turmas"
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 min-w-[56px] transition-all duration-300",
                  isActive ? "text-indigo-600 scale-110" : "text-zinc-400"
                )
              }
            >
              <Users className="h-6 w-6" />
              <span className="text-[10px] font-bold tracking-tight">Turmas</span>
            </NavLink>
          </div>

          {/* Botão Central de Menu */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-indigo-600 to-blue-700 h-16 w-16 rounded-2xl shadow-lg shadow-indigo-200 active:scale-90 transition-transform flex items-center justify-center z-10"
          >
            <Menu className="h-7 w-7 text-white" />
          </button>

          {/* Lado Direito */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            <NavLink
              to="/professores/frequencia"
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 min-w-[56px] transition-all duration-300",
                  isActive ? "text-indigo-600 scale-110" : "text-zinc-400"
                )
              }
            >
              <ClipboardCheck className="h-6 w-6" />
              <span className="text-[10px] font-bold tracking-tight">Frequência</span>
            </NavLink>

            <NavLink
              to="/professores/perfil"
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 min-w-[56px] transition-all duration-300",
                  isActive ? "text-indigo-600 scale-110" : "text-zinc-400"
                )
              }
            >
              <User className="h-6 w-6" />
              <span className="text-[10px] font-bold tracking-tight">Perfil</span>
            </NavLink>
          </div>
        </div>
      </nav>
      )}

      {/* Main Content */}
      <main className="lg:pl-64 flex flex-col min-h-[100dvh]">
        {/* Top Header - Desktop Only */}
        <header className="hidden lg:flex sticky top-0 z-30 h-16 items-center justify-between border-b bg-white/80 backdrop-blur-md px-8">
          <div className="flex items-center gap-4">
            <h1 className="text-base font-semibold text-zinc-900 tracking-tight">
              {professorNavGroups
                .flatMap(g => g.items)
                .find(item => isActive(item.href))?.name || 'Professor'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  <Badge variant="destructive" className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs">
                    3
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="px-3 py-2 border-b border-zinc-200">
                  <p className="font-semibold text-sm">Notificações</p>
                </div>
                <div className="py-6 text-center text-zinc-500 text-sm">
                  Nenhuma notificação pendente
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <div className={cn("lg:p-8 max-w-7xl mx-auto flex-1 w-full overflow-y-auto", !hideBottomNav && "pb-36 lg:pb-0")}>
          <Outlet />
        </div>
      </main>

      {/* Assistente Inteligente (FAB + Drawer) */}
      <ProfessorSmartAssistantWrapper />
    </div>
  )
}

function ProfessorSmartAssistantWrapper() {
  const { authUser } = useAuth()
  const { insights } = useDailyInsights()
  
  return (
    <SmartAssistant 
      insights={insights} 
      professorName={authUser?.nome || 'Professor'} 
    />
  )
}

export default ProfessorLayout
