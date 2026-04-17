import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/modules/auth/AuthContext'
import { useIsSuperAdmin } from '@/lib/hooks'
import { useDashboard } from '@/modules/alunos/dashboard.hooks'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  House,
  User,
  Users,
  BookOpen,
  BookType,
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
  Home,
  Bell,
  FileUser,
  Search,
  Pencil,
  KeyRound,
  ArrowRightLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { NotificationBell } from '@/components/NotificationBell'
import { useEscolaNotifications } from '@/hooks/useNotifications'
import { usePermissions } from '@/providers/RBACProvider'
import CorujaIcon from '@/assets/coruja_ANDROID.svg'
import { useEscola } from '@/modules/escolas/hooks'
import { Skeleton } from '@/components/ui/skeleton'
import { useMarketplaceCategorias } from '@/modules/super-admin/marketplace.hooks'

const navigationGroups = [
  {
    label: 'Principal',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: House, permission: 'dashboard.view' },
    ],
  },
  {
    label: 'Acadêmico',
    items: [
      { name: 'Alunos', href: '/alunos', icon: User, permission: 'academico.alunos.view' },
      { name: 'Turmas', href: '/turmas', icon: Users, permission: 'academico.turmas.view' },
      { name: 'Matrículas', href: '/matriculas', icon: GraduationCap, permission: 'academico.matriculas.view' },
      { name: 'Transferências', href: '/transferencias', icon: ArrowRightLeft, permission: 'academico.matriculas.view' },
      { name: 'Frequência', href: '/frequencia', icon: CalendarCheck, permission: 'academico.frequencia.view' },
      { name: 'Boletim', href: '/notas', icon: GraduationCap, permission: 'academico.notas.view' },
      { name: 'Disciplinas', href: '/disciplinas', icon: BookType, permission: 'academico.disciplinas.view' },
      { name: 'Livros e Materiais', href: '/livros', icon: BookOpen, permission: 'academico.livros.view' },
      { name: 'Planos de Aula', href: '/planos-aula', icon: ClipboardList, permission: 'academico.planos_aula.view' },
      { name: 'Atividades', href: '/atividades', icon: Pencil, permission: 'academico.atividades.view' },
      { name: 'Documentos', href: '/documentos', icon: FileText, permission: 'academico.documentos.view' },
      { name: 'Portaria Expresso', href: '/portaria-expresso', icon: CarFront, permission: 'academico.portaria.view' },
    ],
  },
  {
    label: 'Comunicação',
    items: [
      { name: 'Mural', href: '/mural', icon: Megaphone, permission: 'comunicacao.mural.view' },
      { name: 'Agenda', href: '/agenda', icon: Calendar, permission: 'comunicacao.agenda.view' },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { name: 'Cobranças', href: '/financeiro', icon: CreditCard, permission: 'financeiro.cobrancas.view' },
      { name: 'Contas a Pagar', href: '/contas-pagar', icon: Wallet, permission: 'financeiro.contas_pagar.view' },
      { name: 'Relatórios', href: '/financeiro-relatorios', icon: TrendingUp, permission: 'financeiro.relatorios.view' },
      { name: 'Configurações', href: '/configuracoes', icon: Settings, permission: 'financeiro.config.view' },
    ],
  },
  {
    label: 'Capital Humano',
    items: [
      { name: 'Funcionários', href: '/funcionarios', icon: Briefcase, permission: 'gestao.funcionarios.view' },
      // MÓDULO EM IMPLEMENTAÇÃO - Reativar quando pronto
      // { name: 'Currículos', href: '/curriculos', icon: FileUser, permission: 'gestao.curriculos.view' },
    ],
  },
  {
    label: 'Configurações',
    items: [
      { name: 'Perfil Escola', href: '/perfil-escola', icon: UserCog, permission: 'gestao.perfil_escola.view' },
      { name: 'Unidades', href: '/filiais', icon: Building2, permission: 'gestao.filiais.view' },
      { name: 'Plano', href: '/plano', icon: CreditCard, permission: 'gestao.plano.view' },
      // Gateway temporariamente escondido - reativar quando módulo de pagamentos estiver completo
      // { name: 'Gateway', href: '/gateway', icon: KeyRound, permission: 'financeiro.config.view' },
      { name: 'Almoxarifado', href: '/almoxarifado', icon: Package, permission: 'gestao.almoxarifado.view' },
      { name: 'Perfis de Acesso', href: '/configuracoes/perfis', icon: Shield, permission: 'configuracoes.perfis.view' },
    ],
  },
]

// Itens fixos na parte inferior da sidebar (sempre por último)
const bottomNavigationItems = [
  { name: 'Meu Perfil', href: '/meu-perfil', icon: User, permission: 'all' },
]

function SidebarContent({ 
  onNavigate, 
  dashboardData, 
  isLoadingDashboard 
}: { 
  onNavigate?: () => void, 
  dashboardData?: any, 
  isLoadingDashboard?: boolean 
}) {
  const { authUser, signOut } = useAuth()
  const isSuperAdmin = useIsSuperAdmin()
  const { hasPermission, isLoading: rbacLoading } = usePermissions()
  const status = dashboardData?.statusAssinatura
  const metodo = dashboardData?.metodoPagamento
  const isManual = metodo === 'pix' || metodo === 'pix_manual' || metodo === 'boleto' || metodo === 'manual'

  const { data: mCategorias } = useMarketplaceCategorias()

  const isGestor = authUser?.isGestor || isSuperAdmin
  const isProfessor = authUser?.isProfessor
  const isLojista = authUser?.role === 'lojista'
  const isProfissional = authUser?.role === 'profissional'

  // Filtrar grupos que possuem pelo menos um item permitido
  let visibleGroups = navigationGroups
    .map(group => {
      // Regras de negócio restritivas: Professores NUNCA veem Financeiro, Capital Humano ou Configurações
      if (isProfessor && (group.label === 'Financeiro' || group.label === 'Capital Humano' || group.label === 'Configurações')) {
        return { ...group, items: [] }
      }

      const items = group.items.filter(item =>
        item.permission === 'all' || isGestor || hasPermission(item.permission)
      )
      return { ...group, items }
    })
    .filter(group => group.items.length > 0)

  // Filtrar itens de navegação inferior
  const visibleBottomItems = bottomNavigationItems.filter(item =>
    item.permission === 'all' || isGestor || hasPermission(item.permission)
  )

  // Adicionar Grupos Específicos para Marketplace Partners
  if (isLojista) {
    visibleGroups = [
      {
        label: 'Minha Loja',
        items: [
          { name: 'Dashboard', href: '/loja/dashboard', icon: House, permission: 'all' },
          { name: 'Meus Produtos', href: '/loja/produtos', icon: Package, permission: 'all' },
          { name: 'Minhas Vendas', href: '/loja/vendas', icon: Wallet, permission: 'all' },
        ]
      },
      {
        label: 'Categorias Permitidas',
        items: (mCategorias || [])
          .filter(c => c.ativo)
          .map(c => ({
            name: c.nome,
            href: `/loja/produtos?categoria=${c.id}`,
            icon: Package,
            permission: 'all'
          }))
      }
    ]
  }

  if (isProfissional) {
    visibleGroups = [
      {
        label: 'Meu Perfil',
        items: [
          { name: 'Meu Currículo', href: '/profissional/curriculo', icon: FileUser, permission: 'all' },
          { name: 'Buscar Vagas', href: '/profissional/vagas', icon: Search, permission: 'all' },
          { name: 'Meus Serviços', href: '/profissional/servicos', icon: Settings, permission: 'all' },
        ]
      },
      {
        label: 'Categorias de Atuação',
        items: (mCategorias || [])
          .filter(c => c.ativo)
          .map(c => ({
            name: c.nome,
            href: `/profissional/servicos?categoria=${c.id}`,
            icon: Briefcase,
            permission: 'all'
          }))
      }
    ]
  }

  // Só bloqueia se os dados foram carregados e o status atual for manual + não ativo
  const isBlocked = !isLoadingDashboard && !!dashboardData && status !== 'ativa' && isManual

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
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50 truncate">Educacional</p>
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

        {visibleGroups.map((group) => {
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

        {/* Itens de navegação inferior (sempre por último) */}
        {visibleBottomItems.length > 0 && (
          <>
            <Separator className="opacity-50" />
            <div>
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Minha Conta
              </p>
              <div className="space-y-0.5">
                {visibleBottomItems.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 lg:gap-3 px-4 py-4 lg:px-3 lg:py-2 rounded-2xl lg:rounded-lg text-[16px] lg:text-sm font-semibold lg:font-medium transition-all duration-300 active:scale-[0.98] lg:active:scale-100 group',
                        isActive
                          ? 'bg-indigo-600 lg:bg-indigo-50 text-white lg:text-indigo-700 shadow-lg lg:shadow-none shadow-indigo-100'
                          : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900',
                      )
                    }
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
                ))}
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
              {authUser?.nome?.substring(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="text-left flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-sm font-medium truncate">{authUser?.nome}</p>
              {isSuperAdmin && <Shield className="h-3.5 w-3.5 text-indigo-600" />}
            </div>
            <p className="text-xs text-muted-foreground capitalize truncate">
              {isSuperAdmin ? 'Super Admin' : isProfessor ? 'Professor' : authUser?.role?.replace('_', ' ')}
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
  const { authUser } = useAuth()
  const isSuperAdmin = useIsSuperAdmin()
  const { hasPermission } = usePermissions()
  const { data: dashboard, isLoading: isLoadingDashboard } = useDashboard()
  const { data: notifications, isLoading: isLoadingNotifs } = useEscolaNotifications(authUser?.tenantId && authUser.tenantId !== 'PENDING_TENANT' ? authUser.tenantId : '')
  const { data: escola, isLoading: isLoadingEscola } = useEscola(authUser?.tenantId && authUser.tenantId !== 'super_admin' && authUser.tenantId !== 'PENDING_TENANT' ? authUser.tenantId : '')
  const navigate = useNavigate()
  const location = useLocation()
  const hideBottomNav = location.pathname === '/meu-perfil'

  const isGestor = authUser?.isGestor || isSuperAdmin
  const isProfessor = authUser?.isProfessor
  const status = dashboard?.statusAssinatura
  const metodo = dashboard?.metodoPagamento
  const isManual = metodo === 'pix' || metodo === 'pix_manual' || metodo === 'boleto' || metodo === 'manual'
  
  // Consistência: só bloqueia se carregou e é manual + pendente
  const isBlocked = !isLoadingDashboard && !!dashboard && status !== 'ativa' && isManual

  return (
    <div className="min-h-[100dvh] bg-zinc-50/50 dark:bg-slate-950">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r bg-white/80 backdrop-blur-sm lg:block">
        <SidebarContent dashboardData={dashboard} isLoadingDashboard={isLoadingDashboard} />
      </aside>

      {/* Mobile Sidebar - Agora acionado pelo BottomNav */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" showCloseButton={false} className="w-full sm:w-[400px] p-0 border-none shadow-2xl">
          <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
          <SheetDescription className="sr-only">Acesse as funcionalidades do sistema através do menu lateral.</SheetDescription>
          <SidebarContent 
            onNavigate={() => setSidebarOpen(false)} 
            dashboardData={dashboard} 
            isLoadingDashboard={isLoadingDashboard} 
          />
        </SheetContent>
      </Sheet>

      {/* Bottom Navigation para Mobile (App Style) - escondida em /meu-perfil */}
      {!hideBottomNav && (
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        <div className="mx-auto w-full flex items-stretch justify-between h-20 px-6 relative">
          {/* Lado Esquerdo */}
          <div className="flex items-center gap-3 flex-1 justify-start">
            <NavLink
              to="/dashboard"
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

            {(isGestor || isProfessor || hasPermission('academico.alunos.view')) && (
              <NavLink
                to="/alunos"
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center gap-1 min-w-[56px] transition-all duration-300",
                    isActive ? "text-indigo-600 scale-110" : "text-zinc-400"
                  )
                }
              >
                <Users className="h-6 w-6" />
                <span className="text-[10px] font-bold tracking-tight">Alunos</span>
              </NavLink>
            )}
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
            {isProfessor && (
              <NavLink
                to="/frequencia"
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center gap-1 min-w-[56px] transition-all duration-300",
                    isActive ? "text-indigo-600 scale-110" : "text-zinc-400"
                  )
                }
              >
                <CalendarCheck className="h-6 w-6" />
                <span className="text-[10px] font-bold tracking-tight">Frequência</span>
              </NavLink>
            )}

            {(!isProfessor && (isGestor || hasPermission('financeiro.cobrancas.view'))) && (
              <NavLink
                to="/financeiro"
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center gap-1 min-w-[56px] transition-all duration-300",
                    isActive ? "text-indigo-600 scale-110" : "text-zinc-400"
                  )
                }
              >
                <CreditCard className="h-6 w-6" />
                <span className="text-[10px] font-bold tracking-tight">Cobranças</span>
              </NavLink>
            )}

            {(isProfessor || (authUser?.role === 'funcionario' && !isGestor)) && (
              <NavLink
                to="/meu-perfil"
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
            )}

            {isGestor && hasPermission('gestao.perfil_escola.view') && (
              <NavLink
                to="/perfil-escola"
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center gap-1 min-w-[56px] transition-all duration-300",
                    isActive ? "text-indigo-600 scale-110" : "text-zinc-400"
                  )
                }
              >
                <UserCog className="h-6 w-6" />
                <span className="text-[10px] font-bold tracking-tight">Escola</span>
              </NavLink>
            )}
          </div>
        </div>
      </nav>
      )}

      {/* Main Content */}
      <main className="lg:pl-64 flex flex-col min-h-[100dvh]">
        {/* Top Header - Desktop Only (Mobile uses BottomNav) */}
        <header className="hidden lg:flex sticky top-0 z-30 h-16 items-center justify-between border-b bg-white/80 backdrop-blur-md px-8">
          <div className="flex items-center gap-4">
             {isLoadingEscola ? (
               <Skeleton className="h-6 w-48" />
             ) : (
               <h1 className="text-base font-semibold text-zinc-900 tracking-tight">
                 {authUser?.role === 'super_admin' ? 'Administração Fluxoo' : ((escola as any)?.nome_fantasia || escola?.razao_social || 'Minha Escola')}
               </h1>
             )}
          </div>
          <div className="flex items-center gap-3">
             <NotificationBell
               count={notifications?.total || 0}
               items={notifications?.items || []}
               isLoading={isLoadingNotifs}
             />
          </div>
        </header>

        <div className="lg:p-8 max-w-7xl mx-auto flex-1 w-full">
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
            <div className={cn("lg:pb-0 overflow-y-auto", !hideBottomNav && "pb-36")}>
               <Outlet />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
