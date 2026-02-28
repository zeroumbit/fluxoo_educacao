import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/modules/auth/AuthContext'
import { useIsSuperAdmin } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarCheck,
  Megaphone,
  CreditCard,
  Menu,
  LogOut,
  GraduationCap,
  ChevronRight,
  Building2,
  Shield,
  Briefcase,
  ClipboardList,
  FileText,
  Calendar,
  Settings,
  Wallet,
  Package,
  UserCog,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigationGroups = [
  {
    label: 'Principal',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Acadêmico',
    items: [
      { name: 'Alunos', href: '/alunos', icon: Users },
      { name: 'Matrículas', href: '/matriculas', icon: GraduationCap },
      { name: 'Turmas', href: '/turmas', icon: BookOpen },
      { name: 'Frequência', href: '/frequencia', icon: CalendarCheck },
      { name: 'Planos de Aula', href: '/planos-aula', icon: ClipboardList },
      { name: 'Atividades', href: '/atividades', icon: FileText },
      { name: 'Documentos', href: '/documentos', icon: FileText },
    ],
  },
  {
    label: 'Comunicação',
    items: [
      { name: 'Mural', href: '/mural', icon: Megaphone },
      { name: 'Agenda', href: '/agenda', icon: Calendar },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { name: 'Cobranças', href: '/financeiro', icon: CreditCard },
      { name: 'Contas a Pagar', href: '/contas-pagar', icon: Wallet },
      { name: 'Configurações', href: '/config-financeira', icon: Settings },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { name: 'Funcionários', href: '/funcionarios', icon: Briefcase },
      { name: 'Unidades', href: '/filiais', icon: Building2 },
      { name: 'Almoxarifado', href: '/almoxarifado', icon: Package },
      { name: 'Perfil Escola', href: '/perfil-escola', icon: UserCog },
    ],
  },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { authUser, signOut } = useAuth()
  const isSuperAdmin = useIsSuperAdmin()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center shadow-md">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">Gestão Escolar</h2>
            <p className="text-xs text-muted-foreground">Painel Administrativo</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {navigationGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group',
                      isActive
                        ? 'bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={cn('h-4 w-4 transition-colors flex-shrink-0', isActive ? 'text-indigo-600' : '')} />
                      <span className="flex-1 truncate">{item.name}</span>
                      {isActive && <ChevronRight className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <Separator />

      {/* User */}
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 h-auto py-2.5 px-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white text-xs">
                  {authUser?.nome?.substring(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="text-left flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-medium truncate">{authUser?.nome}</p>
                  {isSuperAdmin && <Shield className="h-3.5 w-3.5 text-indigo-600" />}
                </div>
                <p className="text-xs text-muted-foreground capitalize">
                  {isSuperAdmin ? 'Super Admin' : authUser?.role?.replace('_', ' ')}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-zinc-50/50">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r bg-white/80 backdrop-blur-sm lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-40 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
