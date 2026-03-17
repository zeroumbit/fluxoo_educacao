import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/modules/auth/AuthContext'
import { useIsSuperAdmin } from '@/lib/hooks'
import { useDashboard } from '@/modules/alunos/dashboard.hooks'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
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
  X,
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
  Lock,
  TrendingUp,
  CarFront,
  Home
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRBACInit, useCanAccessModule, useHasPermission } from '@/hooks/usePermissions'

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
      { name: 'Frequência', href: '/frequencia', icon: CalendarCheck },
      { name: 'Turmas', href: '/turmas', icon: BookOpen },
      { name: 'Boletim', href: '/notas', icon: GraduationCap },
      { name: 'Livros', href: '/livros', icon: BookOpen },
      { name: 'Planos de Aula', href: '/planos-aula', icon: ClipboardList },
      { name: 'Atividades', href: '/atividades', icon: FileText },
      { name: 'Documentos', href: '/documentos', icon: FileText },
      { name: 'Portaria Expresso', href: '/portaria-expresso', icon: CarFront },
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
      { name: 'Relatórios', href: '/financeiro-relatorios', icon: TrendingUp },
      { name: 'Configurações', href: '/config-financeira', icon: Settings },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { name: 'Plano', href: '/plano', icon: CreditCard },
      { name: 'Funcionários', href: '/funcionarios', icon: Briefcase },
      { name: 'Unidades', href: '/filiais', icon: Building2 },
      { name: 'Almoxarifado', href: '/almoxarifado', icon: Package },
      { name: 'Perfil Escola', href: '/perfil-escola', icon: UserCog },
    ],
  },
  {
    label: 'Configurações',
    items: [
      { name: 'Perfis de Acesso', href: '/configuracoes/perfis', icon: Shield },
      { name: 'Auditoria', href: '/configuracoes/auditoria', icon: ClipboardList },
    ],
  },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { authUser, signOut } = useAuth()
  const isSuperAdmin = useIsSuperAdmin()

  // Inicializar RBAC para funcionários
  useRBACInit()

  // Super admin não tem dashboard com assinatura
  const { data: dashboard, isLoading } = isSuperAdmin
    ? { data: null, isLoading: false }
    : useDashboard()

  const status = dashboard?.statusAssinatura
  const metodo = dashboard?.metodoPagamento
  const isManual = metodo === 'pix' || metodo === 'boleto' || metodo === 'manual'

  // Só bloqueia se os dados foram carregados e o status atual for manual + não ativo
  const isBlocked = !isLoading && !!dashboard && status !== 'ativa' && isManual

  const handleSignOut = async () => {
    try {
      await signOut()
      // Uso de window.location.href garante que o estado da aplicação seja limpo
      window.location.href = '/login'
    } catch (error) {
      console.error('Erro ao sair:', error)
      window.location.href = '/login'
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo mobile-friendly no menu full-screen */}
      <div className="p-6 flex items-center justify-between lg:block">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center shadow-lg shadow-indigo-100">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-xl leading-tight tracking-tight">Fluxoo</h2>
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50">Educacional</p>
          </div>
        </div>
        {onNavigate && (
           <Button variant="ghost" size="icon" onClick={onNavigate} className="lg:hidden h-10 w-10 rounded-full bg-zinc-100">
              <X className="h-5 w-5 text-zinc-500" />
           </Button>
        )}
      </div>

      <Separator className="opacity-50" />

      {/* Navigation - Ampliado para mobile */}
      <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto scrollbar-hide">

        {navigationGroups.map((group) => {
          const isGroupBlocked = isBlocked && group.label !== 'Principal'

          return (
            <div key={group.label} className={cn(isGroupBlocked && "opacity-50 pointer-events-none")}>
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 flex items-center justify-between">
                {group.label}
                {isGroupBlocked && <Lock className="h-2.5 w-2.5" />}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.href}
                    to={isGroupBlocked ? '#' : item.href}
                    onClick={isGroupBlocked ? (e) => e.preventDefault() : onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 lg:gap-3 px-4 py-4 lg:px-3 lg:py-2 rounded-2xl lg:rounded-lg text-[16px] lg:text-sm font-semibold lg:font-medium transition-all duration-300 active:scale-[0.98] lg:active:scale-100 group',
                        isActive && !isGroupBlocked
                          ? 'bg-indigo-600 lg:bg-indigo-50 text-white lg:text-indigo-700 shadow-lg lg:shadow-none shadow-indigo-100'
                          : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900',
                        isGroupBlocked && "cursor-not-allowed grayscale"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={cn('h-5 w-5 lg:h-4 lg:w-4 transition-colors flex-shrink-0', (isActive && !isGroupBlocked) ? 'text-white lg:text-indigo-600' : 'text-zinc-400')} />
                        <span className="flex-1 truncate">{item.name}</span>
                        {(isActive && !isGroupBlocked) ? (
                          <div className="h-1.5 w-1.5 rounded-full bg-white lg:bg-indigo-400 opacity-50" />
                        ) : (
                          <ChevronRight className="h-4 w-4 lg:h-3.5 lg:w-3.5 text-zinc-300 flex-shrink-0 lg:opacity-0 group-hover:opacity-100" />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      <Separator />

      {/* User */}
      <div className="p-4 pb-24 lg:pb-4 space-y-2">
        <div className="flex items-center gap-3 py-2.5 px-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white text-xs">
              {authUser?.nome?.substring(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="text-left flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-sm font-medium truncate">{authUser?.nome}</p>
              {isSuperAdmin && <Shield className="h-3.5 w-3.5 text-indigo-600" />}
            </div>
            <p className="text-xs text-muted-foreground capitalize truncate">
              {isSuperAdmin ? 'Super Admin' : authUser?.role?.replace('_', ' ')}
            </p>
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

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: dashboard, isLoading } = useDashboard()
  const navigate = useNavigate()

  const status = dashboard?.statusAssinatura
  const metodo = dashboard?.metodoPagamento
  const isManual = metodo === 'pix' || metodo === 'boleto' || metodo === 'manual'
  
  // Consistência: só bloqueia se carregou e é manual + pendente
  const isBlocked = !isLoading && !!dashboard && status !== 'ativa' && isManual

  return (
    <div className="min-h-screen bg-zinc-50/50">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r bg-white/80 backdrop-blur-sm lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar - Agora acionado pelo BottomNav */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" showCloseButton={false} className="w-full sm:w-[400px] p-0 border-none shadow-2xl">
          <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
          <SheetDescription className="sr-only">Acesse as funcionalidades do sistema através do menu lateral.</SheetDescription>
          <SidebarContent onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Bottom Navigation para Mobile (App Style) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-t border-zinc-200/50 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.05)]">
        <div className="mx-auto w-full max-w-[640px] flex items-center justify-around h-20 px-4">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1.5 transition-all duration-300",
                isActive ? "text-indigo-600 scale-110" : "text-zinc-400"
              )
            }
          >
            <Home className="h-6 w-6" />
            <span className="text-[10px] font-bold tracking-tight">Home</span>
          </NavLink>

          <NavLink
            to="/alunos"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1.5 transition-all duration-300",
                isActive ? "text-indigo-600 scale-110" : "text-zinc-400"
              )
            }
          >
            <Users className="h-6 w-6" />
            <span className="text-[10px] font-bold tracking-tight">Alunos</span>
          </NavLink>

          {/* Botão Central de Menu */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center justify-center -translate-y-4 bg-gradient-to-br from-indigo-600 to-blue-700 h-16 w-16 rounded-2xl shadow-lg shadow-indigo-200 active:scale-90 transition-transform"
          >
            <Menu className="h-7 w-7 text-white" />
          </button>

          <NavLink
            to="/financeiro"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1.5 transition-all duration-300",
                isActive ? "text-indigo-600 scale-110" : "text-zinc-400"
              )
            }
          >
            <CreditCard className="h-6 w-6" />
            <span className="text-[10px] font-bold tracking-tight">Cobranças</span>
          </NavLink>

          <NavLink
            to="/perfil-escola"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1.5 transition-all duration-300",
                isActive ? "text-indigo-600 scale-110" : "text-zinc-400"
              )
            }
          >
            <UserCog className="h-6 w-6" />
            <span className="text-[10px] font-bold tracking-tight">Perfil</span>
          </NavLink>
        </div>
      </nav>

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="lg:p-8 max-w-7xl mx-auto min-h-screen">
          {isBlocked && window.location.pathname !== '/dashboard' ? (
            <div className="p-6 flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                <Lock className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-zinc-900">Funcionalidade Bloqueada</h2>
                <p className="text-zinc-500 max-w-md mx-auto">
                  Esta seção só estará disponível após a aprovação do seu cadastro pelo Fluxoo Educação.
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Voltar para o Dashboard
              </Button>
            </div>
          ) : (
            <div className="pb-32 lg:pb-0">
               <Outlet />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
