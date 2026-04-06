import { useState, useEffect } from 'react'
import { Link, useLocation, Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '@/modules/auth/AuthContext'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  Users,
  Calendar,
  ClipboardCheck,
  FileText,
  AlertTriangle,
  LayoutDashboard,
  GraduationCap,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  Bell,
  School
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
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

const professorNavGroups = [
  {
    title: 'Principal',
    items: [
      {
        name: 'Dashboard',
        href: '/professores/dashboard',
        icon: LayoutDashboard,
      },
      {
        name: 'Minhas Turmas',
        href: '/professores/turmas',
        icon: School,
      },
      {
        name: 'Alunos',
        href: '/professores/alunos',
        icon: Users,
      },
    ],
  },
  {
    title: 'Aulas & Avaliações',
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
    title: 'Comunicação',
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
  {
    title: 'Perfil',
    items: [
      {
        name: 'Meu Perfil',
        href: '/professores/perfil',
        icon: User,
      },
    ],
  },
]

export function ProfessorLayout() {
  const { authUser, signOut } = useAuth()
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fechar menu mobile ao mudar rota
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Redirecionar se não é professor
  if (!authUser?.isProfessor) {
    return <Navigate to="/dashboard" replace />
  }

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && !mobile && (
            <div className="min-w-0">
              <h1 className="font-bold text-zinc-900 truncate">Fluxoo Professor</h1>
              <p className="text-xs text-zinc-500 truncate">{authUser.nome}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {professorNavGroups.map((group) => (
          <div key={group.title}>
            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-3">
                {group.title}
              </h3>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative',
                        active
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                      )}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!isCollapsed && (
                        <>
                          <span className="truncate">{item.name}</span>
                          {item.badge && (
                            <Badge variant="destructive" className="ml-auto text-xs">
                              !
                            </Badge>
                          )}
                        </>
                      )}
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full" />
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-zinc-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full justify-start gap-2 text-zinc-600"
          disabled={mobile}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
          {!isCollapsed && <span>Recolher</span>}
        </Button>
      </div>
    </div>
  )

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-zinc-50">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <div className="h-full bg-white">
                  <SidebarContent mobile />
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-zinc-900">Fluxoo Professor</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  <Badge variant="destructive" className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs">
                    !
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="px-3 py-2 border-b border-zinc-200">
                  <p className="font-semibold text-sm">Notificações</p>
                </div>
                <div className="py-6 text-center text-zinc-500 text-sm">
                  Nenhuma notificação
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Mobile Content */}
        <main className="pb-20">
          <Outlet />
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 shadow-lg z-40 safe-area-bottom">
          <div className="flex items-center justify-around py-2">
            <Link
              to="/professores/dashboard"
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-0 flex-1',
                isActive('/professores/dashboard')
                  ? 'text-blue-600'
                  : 'text-zinc-500'
              )}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-xs font-medium truncate">Dashboard</span>
            </Link>
            <Link
              to="/professores/turmas"
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-0 flex-1',
                isActive('/professores/turmas')
                  ? 'text-blue-600'
                  : 'text-zinc-500'
              )}
            >
              <School className="w-5 h-5" />
              <span className="text-xs font-medium truncate">Turmas</span>
            </Link>
            <Link
              to="/professores/frequencia"
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-0 flex-1',
                isActive('/professores/frequencia')
                  ? 'text-blue-600'
                  : 'text-zinc-500'
              )}
            >
              <ClipboardCheck className="w-5 h-5" />
              <span className="text-xs font-medium truncate">Frequência</span>
            </Link>
            <Link
              to="/professores/perfil"
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-0 flex-1',
                isActive('/professores/perfil')
                  ? 'text-blue-600'
                  : 'text-zinc-500'
              )}
            >
              <User className="w-5 h-5" />
              <span className="text-xs font-medium truncate">Perfil</span>
            </Link>
          </div>
        </nav>
      </div>
    )
  }

  // Desktop Layout
  return (
    <div className="flex h-screen bg-zinc-50">
      {/* Sidebar */}
      <aside
        className={cn(
          'bg-white border-r border-zinc-200 flex-shrink-0 transition-all duration-300 relative',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">
              {professorNavGroups
                .flatMap(g => g.items)
                .find(item => isActive(item.href))?.name || 'Professor'}
            </h2>
            <p className="text-sm text-zinc-500">
              Bem-vindo, {authUser.nome}
            </p>
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                    {authUser.nome?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{authUser.nome}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2 border-b border-zinc-200">
                  <p className="font-semibold text-sm">{authUser.nome}</p>
                  <p className="text-xs text-zinc-500">{authUser.user.email}</p>
                </div>
                <DropdownMenuItem asChild>
                  <Link to="/professores/perfil" className="cursor-pointer">
                    <User className="w-4 h-4 mr-2" />
                    Meu Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="text-red-600 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default ProfessorLayout
