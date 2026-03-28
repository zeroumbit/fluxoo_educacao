import { Suspense, lazy } from "react"
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider, useAuth } from '@/modules/auth/AuthContext'
import { ProtectedRoute } from '@/modules/auth/ProtectedRoute'
import { RBACProvider } from '@/providers/RBACProvider'
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { LoginPage } from '@/modules/auth/LoginPage'
import { AdminLayout } from '@/layout/AdminLayout'
import { SuperAdminLayout } from '@/layout/SuperAdminLayout'
import { PortalLayout } from '@/layout/PortalLayout'
import { CookieConsent } from '@/components/shared/CookieConsent'
import { PortalLayoutV2 } from '@/modules/portal/v2/PortalLayoutV2'
import { PwaInstallPrompt } from '@/components/pwa/PwaInstallPrompt'

// Pages - Admin (Escola)
const DashboardPage = lazy(() => import('@/modules/alunos/pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const AlunosListPage = lazy(() => import('@/modules/alunos/pages/AlunosListPage').then(m => ({ default: m.AlunosListPage })))
const AlunoCadastroPage = lazy(() => import('@/modules/alunos/pages/AlunoCadastroPage').then(m => ({ default: m.AlunoCadastroPage })))
const AlunoDetalhePage = lazy(() => import('@/modules/alunos/pages/AlunoDetalhePage').then(m => ({ default: m.AlunoDetalhePage })))
const TurmasPage = lazy(() => import('@/modules/turmas/pages/TurmasPage').then(m => ({ default: m.TurmasPage })))
const FrequenciaPage = lazy(() => import('@/modules/frequencia/pages/FrequenciaPage').then(m => ({ default: m.FrequenciaPage })))
const RelatorioMensalFrequenciaPage = lazy(() => import('@/modules/frequencia/pages/RelatorioMensalFrequenciaPage.web').then(m => ({ default: m.RelatorioMensalFrequenciaPage })))
const FilaVirtualAdminPage = lazy(() => import('@/modules/frequencia/pages/FilaVirtualAdminPage').then(m => ({ default: m.FilaVirtualAdminPage })))
const MuralPage = lazy(() => import('@/modules/comunicacao/pages/MuralPage').then(m => ({ default: m.MuralPage })))
const FinanceiroPage = lazy(() => import('@/modules/financeiro/pages/FinanceiroPage').then(m => ({ default: m.FinanceiroPage })))
const FiliaisPage = lazy(() => import('@/modules/filiais/pages/FiliaisPage').then(m => ({ default: m.FiliaisPage })))
const EscolaCadastroPage = lazy(() => import('@/modules/escolas/pages/EscolaCadastroPage').then(m => ({ default: m.EscolaCadastroPage })))

const LivrosPage = lazy(() => import('@/modules/livros/pages/LivrosPage').then(m => ({ default: m.LivrosPage })))
const FuncionariosPage = lazy(() => import('@/modules/funcionarios/pages/FuncionariosPage').then(m => ({ default: m.FuncionariosPage })))
const MatriculaPage = lazy(() => import('@/modules/academico/pages/MatriculaPage'))
const MatriculaFormPage = lazy(() => import('@/modules/academico/pages/MatriculaFormPage').then(m => ({ default: m.MatriculaFormPage })))
const PlanoAulaPage = lazy(() => import('@/modules/academico/pages/PlanoAulaPage').then(m => ({ default: m.PlanoAulaPage })))
const AtividadesPage = lazy(() => import('@/modules/academico/pages/AtividadesPage').then(m => ({ default: m.AtividadesPage })))
const NotasPage = lazy(() => import('@/modules/academico/pages/NotasPage').then(m => ({ default: m.NotasPage })))
const EventosPage = lazy(() => import('@/modules/agenda/pages/EventosPage').then(m => ({ default: m.EventosPage })))
const ConfiguracoesPage = lazy(() => import('@/modules/configuracoes/pages/ConfiguracoesPage').then(m => ({ default: m.ConfiguracoesPage })))
const ContasPagarPage = lazy(() => import('@/modules/financeiro/pages/ContasPagarPage').then(m => ({ default: m.ContasPagarPage })))
const FinanceiroRelatoriosPage = lazy(() => import('@/modules/financeiro/pages/FinanceiroRelatoriosPage').then(m => ({ default: m.FinanceiroRelatoriosPage })))
const DocumentosPage = lazy(() => import('@/modules/documentos/pages/DocumentosPage').then(m => ({ default: m.DocumentosPage })))
const AlmoxarifadoPage = lazy(() => import('@/modules/almoxarifado/pages/AlmoxarifadoPage').then(m => ({ default: m.AlmoxarifadoPage })))
const PerfilEscolaPage = lazy(() => import('@/modules/escola-perfil/pages/PerfilEscolaPage').then(m => ({ default: m.PerfilEscolaPage })))
const PlanoPage = lazy(() => import('@/modules/assinatura/pages/PlanoPage').then(m => ({ default: m.PlanoPage })))
const PerfisPage = lazy(() => import('@/modules/rbac/pages/PerfisPage').then(m => ({ default: m.PerfisPage })))
const AuditoriaPage = lazy(() => import('@/modules/rbac/pages/AuditoriaPage').then(m => ({ default: m.AuditoriaPage })))

// Pages - Super Admin
const SuperAdminDashboardPage = lazy(() => import('@/modules/super-admin/pages/SuperAdminDashboardPage').then(m => ({ default: m.SuperAdminDashboardPage })))
const PlanosPage = lazy(() => import('@/modules/super-admin/pages/PlanosPage').then(m => ({ default: m.PlanosPage })))
const EscolasPage = lazy(() => import('@/modules/super-admin/pages/EscolasPage').then(m => ({ default: m.EscolasPage })))
const FaturasPage = lazy(() => import('@/modules/super-admin/pages/FaturasPage').then(m => ({ default: m.FaturasPage })))
const UpgradesPage = lazy(() => import('@/modules/super-admin/pages/UpgradesPage').then(m => ({ default: m.UpgradesPage })))
const ConfigRecebimentoPage = lazy(() => import('@/modules/super-admin/pages/ConfigRecebimentoPage').then(m => ({ default: m.ConfigRecebimentoPage })))
const MarketplaceConfigPage = lazy(() => import('@/modules/super-admin/pages/MarketplaceConfigPage').then(m => ({ default: m.MarketplaceConfigPage })))

// Pages - Portal
const PortalDashboardPage = lazy(() => import('@/modules/portal/pages/PortalDashboardPage').then(m => ({ default: m.PortalDashboardPage })))
const PortalFrequenciaPage = lazy(() => import('@/modules/portal/pages/PortalFrequenciaPage').then(m => ({ default: m.PortalFrequenciaPage })))
const PortalAvisosPage = lazy(() => import('@/modules/portal/pages/PortalAvisosPage').then(m => ({ default: m.PortalAvisosPage })))
const PortalCobrancasPage = lazy(() => import('@/modules/portal/pages/PortalCobrancasPage'))
const PortalFilaVirtualPage = lazy(() => import('@/modules/portal/pages/PortalFilaVirtualPage').then(m => ({ default: m.PortalFilaVirtualPage })))
const PortalLoginPage = lazy(() => import('@/modules/portal/pages/PortalLoginPage').then(m => ({ default: m.PortalLoginPage })))
const PortalBoletimPage = lazy(() => import('@/modules/portal/pages/PortalBoletimPage').then(m => ({ default: m.PortalBoletimPage })))
const PortalLivrosPage = lazy(() => import('@/modules/portal/pages/PortalLivrosPage').then(m => ({ default: m.PortalLivrosPage })))
const PortalAgendaPage = lazy(() => import('@/modules/portal/pages/PortalAgendaPage').then(m => ({ default: m.PortalAgendaPage })))
const PortalLojaPage = lazy(() => import('@/modules/portal/pages/PortalLojaPage').then(m => ({ default: m.PortalLojaPage })))
const PortalDocumentosPage = lazy(() => import('@/modules/portal/pages/PortalDocumentosPage').then(m => ({ default: m.PortalDocumentosPage })))
const PortalPerfilPage = lazy(() => import('@/modules/portal/pages/PortalPerfilPage').then(m => ({ default: m.PortalPerfilPage })))
const PortalAutorizacoesPage = lazy(() => import('@/modules/portal/pages/PortalAutorizacoesPage').then(m => ({ default: m.PortalAutorizacoesPage })))
const TermosUsoPage = lazy(() => import('@/modules/portal/pages/TermosUsoPage').then(m => ({ default: m.TermosUsoPage })))
const PrivacidadePage = lazy(() => import('@/modules/portal/pages/PrivacidadePage').then(m => ({ default: m.PrivacidadePage })))
const CookiesPage = lazy(() => import('@/modules/portal/pages/CookiesPage').then(m => ({ default: m.CookiesPage })))

// Novas Páginas - Portal V2
const PortalHomeV2 = lazy(() => import('@/modules/portal/v2/pages/PortalHomeV2').then(m => ({ default: m.PortalHomeV2 })))
const PortalAlunosListV2 = lazy(() => import('@/modules/portal/v2/pages/PortalAlunosListV2').then(m => ({ default: m.PortalAlunosListV2 })))
const PortalAlunoPerfilV2 = lazy(() => import('@/modules/portal/v2/pages/PortalAlunoPerfilV2').then(m => ({ default: m.PortalAlunoPerfilV2 })))
const PortalAvisosV2 = lazy(() => import('@/modules/portal/v2/pages/PortalAvisosV2').then(m => ({ default: m.PortalAvisosV2 })))
const PortalFinanceiroV2 = lazy(() => import('@/modules/portal/v2/pages/PortalFinanceiroV2').then(m => ({ default: m.PortalFinanceiroV2 })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

function RootRedirect() {
  const { authUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!authUser) return <Navigate to="/login" replace />
  if (authUser.role === 'super_admin') return <Navigate to="/admin/dashboard" replace />
  if (authUser.role === 'responsavel') return <Navigate to="/portal" replace />
  return <Navigate to="/dashboard" replace />
}

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'fluxoo_rbac_cache',
  throttleTime: 2000,
})

persistQueryClient({
  queryClient,
  persister,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <RBACProvider>
            <Suspense fallback={
              <div className="flex h-[60vh] items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            }>
            <Routes>
            {/* Root redirect */}
            <Route path="/" element={<RootRedirect />} />

            {/* Login */}
            <Route path="/login" element={<LoginPage />} />

            {/* Login do Portal */}
            <Route path="/portal/login" element={<PortalLoginPage />} />

            {/* Cadastro de Escola - Público */}
            <Route path="/cadastro" element={<EscolaCadastroPage />} />

            {/* Termos de Uso - Público */}
            <Route path="/termos-de-uso" element={<TermosUsoPage />} />
            <Route path="/politica-privacidade" element={<PrivacidadePage />} />
            <Route path="/politica-cookies" element={<CookiesPage />} />

            {/* Super Admin Routes */}
            <Route
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <SuperAdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/admin/dashboard" element={<SuperAdminDashboardPage />} />
              <Route path="/admin/escolas" element={<EscolasPage />} />
              <Route path="/admin/marketplace" element={<MarketplaceConfigPage />} />
              <Route path="/admin/planos" element={<PlanosPage />} />
              <Route path="/admin/faturas" element={<FaturasPage />} />
              <Route path="/admin/upgrades" element={<UpgradesPage />} />
              <Route path="/admin/config-recebimento" element={<ConfigRecebimentoPage />} />
              <Route path="/admin/logs" element={<div className="p-8"><h1 className="text-2xl font-bold">Logs do Sistema</h1><p>Em breve: Auditoria global.</p></div>} />
            </Route>

            {/* Admin Routes (School) */}
            <Route
              element={
                <ProtectedRoute allowedRoles={['gestor', 'admin', 'funcionario']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/alunos" element={<AlunosListPage />} />
              <Route path="/alunos/novo" element={<AlunoCadastroPage />} />
              <Route path="/alunos/:id" element={<AlunoDetalhePage />} />
              <Route path="/turmas" element={<TurmasPage />} />
              <Route path="/frequencia" element={<FrequenciaPage />} />
              <Route path="/frequencia/relatorio" element={<RelatorioMensalFrequenciaPage />} />
              <Route path="/mural" element={<MuralPage />} />
              <Route path="/financeiro" element={<FinanceiroPage />} />
              <Route path="/filiais" element={<FiliaisPage />} />
              <Route path="/livros" element={<LivrosPage />} />
              {/* Novos Módulos */}
              <Route path="/funcionarios" element={<FuncionariosPage />} />
              <Route path="/matriculas" element={<MatriculaPage />} />
              <Route path="/matriculas/nova" element={<MatriculaFormPage />} />
              <Route path="/planos-aula" element={<PlanoAulaPage />} />
              <Route path="/atividades" element={<AtividadesPage />} />
              <Route path="/notas" element={<NotasPage />} />
              <Route path="/agenda" element={<EventosPage />} />
              <Route path="/configuracoes" element={<ConfiguracoesPage />} />
              <Route path="/contas-pagar" element={<ContasPagarPage />} />
              <Route path="/financeiro-relatorios" element={<FinanceiroRelatoriosPage />} />
              <Route path="/documentos" element={<DocumentosPage />} />
              <Route path="/almoxarifado" element={<AlmoxarifadoPage />} />
              <Route path="/portaria-expresso" element={<FilaVirtualAdminPage />} />
              <Route path="/perfil-escola" element={<PerfilEscolaPage />} />
              <Route path="/plano" element={<PlanoPage />} />
              {/* RBAC V2.2 - Configurações */}
              <Route path="/configuracoes/perfis" element={<PerfisPage />} />
              <Route path="/configuracoes/auditoria" element={<AuditoriaPage />} />
            </Route>

            {/* Portal do Responsável V2 */}
            <Route
              element={
                <ProtectedRoute allowedRoles={['responsavel']}>
                  <PortalLayoutV2 />
                </ProtectedRoute>
              }
            >
              <Route path="/portal" element={<PortalHomeV2 />} />
              <Route path="/portal/v2" element={<Navigate to="/portal" replace />} />
              <Route path="/portal/alunos" element={<PortalAlunosListV2 />} />
              <Route path="/portal/alunos/:id" element={<PortalAlunoPerfilV2 />} />
              <Route path="/portal/financeiro" element={<PortalFinanceiroV2 />} />
              <Route path="/portal/avisos" element={<PortalAvisosV2 />} />
              <Route path="/portal/loja" element={<PortalLojaPage />} />
              <Route path="/portal/perfil" element={<PortalPerfilPage />} />
              
              {/* Páginas Antigas e Outras Funcionalidades que não ganharam V2 ainda */}
              <Route path="/portal/frequencia" element={<PortalFrequenciaPage />} />
              <Route path="/portal/fila" element={<PortalFilaVirtualPage />} />
              <Route path="/portal/boletim" element={<PortalBoletimPage />} />
              <Route path="/portal/livros" element={<PortalLivrosPage />} />
              <Route path="/portal/agenda" element={<PortalAgendaPage />} />
              <Route path="/portal/documentos" element={<PortalDocumentosPage />} />
              <Route path="/portal/autorizacoes" element={<PortalAutorizacoesPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
          <Toaster richColors position="top-right" />
          <CookieConsent />
          <PwaInstallPrompt />
          </RBACProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App

