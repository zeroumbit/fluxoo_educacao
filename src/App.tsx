import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider, useAuth } from '@/modules/auth/AuthContext'
import { ProtectedRoute } from '@/modules/auth/ProtectedRoute'
import { LoginPage } from '@/modules/auth/LoginPage'
import { AdminLayout } from '@/layout/AdminLayout'
import { SuperAdminLayout } from '@/layout/SuperAdminLayout'
import { PortalLayout } from '@/layout/PortalLayout'

// Pages - Admin (Escola)
import { DashboardPage } from '@/modules/alunos/pages/DashboardPage'
import { AlunosListPage } from '@/modules/alunos/pages/AlunosListPage'
import { AlunoCadastroPage } from '@/modules/alunos/pages/AlunoCadastroPage'
import { AlunoDetalhePage } from '@/modules/alunos/pages/AlunoDetalhePage'
import { TurmasPage } from '@/modules/turmas/pages/TurmasPage'
import { FrequenciaPage } from '@/modules/frequencia/pages/FrequenciaPage'
import { FilaVirtualAdminPage } from '@/modules/frequencia/pages/FilaVirtualAdminPage'
import { MuralPage } from '@/modules/comunicacao/pages/MuralPage'
import { FinanceiroPage } from '@/modules/financeiro/pages/FinanceiroPage'
import { FiliaisPage } from '@/modules/filiais/pages/FiliaisPage'
import { EscolaCadastroPage } from '@/modules/escolas/pages/EscolaCadastroPage'

// Novos módulos - Escola
import { FuncionariosPage } from '@/modules/funcionarios/pages/FuncionariosPage'
import { MatriculaPage } from '@/modules/academico/pages/MatriculaPage'
import { PlanoAulaPage } from '@/modules/academico/pages/PlanoAulaPage'
import { AtividadesPage } from '@/modules/academico/pages/AtividadesPage'
import { EventosPage } from '@/modules/agenda/pages/EventosPage'
import { ConfigFinanceiraPage } from '@/modules/financeiro/pages/ConfigFinanceiraPage'
import { ContasPagarPage } from '@/modules/financeiro/pages/ContasPagarPage'
import { FinanceiroRelatoriosPage } from '@/modules/financeiro/pages/FinanceiroRelatoriosPage'
import { DocumentosPage } from '@/modules/documentos/pages/DocumentosPage'
import { AlmoxarifadoPage } from '@/modules/almoxarifado/pages/AlmoxarifadoPage'
import { PerfilEscolaPage } from '@/modules/escola-perfil/pages/PerfilEscolaPage'
import { PlanoPage } from '@/modules/assinatura/pages/PlanoPage'

// Pages - Super Admin
import { SuperAdminDashboardPage } from '@/modules/super-admin/pages/SuperAdminDashboardPage'
import { PlanosPage } from '@/modules/super-admin/pages/PlanosPage'
import { EscolasPage } from '@/modules/super-admin/pages/EscolasPage'
import { FaturasPage } from '@/modules/super-admin/pages/FaturasPage'
import { UpgradesPage } from '@/modules/super-admin/pages/UpgradesPage'
import { ConfigRecebimentoPage } from '@/modules/super-admin/pages/ConfigRecebimentoPage'

// Pages - Portal
import { PortalDashboardPage } from '@/modules/portal/pages/PortalDashboardPage'
import { PortalFrequenciaPage } from '@/modules/portal/pages/PortalFrequenciaPage'
import { PortalAvisosPage } from '@/modules/portal/pages/PortalAvisosPage'
import { PortalCobrancasPage } from '@/modules/portal/pages/PortalCobrancasPage'
import { PortalFilaVirtualPage } from '@/modules/portal/pages/PortalFilaVirtualPage'
import { PortalLoginPage } from '@/modules/portal/pages/PortalLoginPage'

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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Root redirect */}
            <Route path="/" element={<RootRedirect />} />

            {/* Login */}
            <Route path="/login" element={<LoginPage />} />

            {/* Login do Portal */}
            <Route path="/portal/login" element={<PortalLoginPage />} />

            {/* Cadastro de Escola - Público */}
            <Route path="/cadastro" element={<EscolaCadastroPage />} />

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
              <Route path="/mural" element={<MuralPage />} />
              <Route path="/financeiro" element={<FinanceiroPage />} />
              <Route path="/filiais" element={<FiliaisPage />} />
              {/* Novos Módulos */}
              <Route path="/funcionarios" element={<FuncionariosPage />} />
              <Route path="/matriculas" element={<MatriculaPage />} />
              <Route path="/planos-aula" element={<PlanoAulaPage />} />
              <Route path="/atividades" element={<AtividadesPage />} />
              <Route path="/agenda" element={<EventosPage />} />
              <Route path="/config-financeira" element={<ConfigFinanceiraPage />} />
              <Route path="/contas-pagar" element={<ContasPagarPage />} />
              <Route path="/financeiro-relatorios" element={<FinanceiroRelatoriosPage />} />
              <Route path="/documentos" element={<DocumentosPage />} />
              <Route path="/almoxarifado" element={<AlmoxarifadoPage />} />
              <Route path="/portaria-expresso" element={<FilaVirtualAdminPage />} />
              <Route path="/perfil-escola" element={<PerfilEscolaPage />} />
              <Route path="/plano" element={<PlanoPage />} />
            </Route>

            {/* Portal do Responsável */}
            <Route
              element={
                <ProtectedRoute allowedRoles={['responsavel']}>
                  <PortalLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/portal" element={<PortalDashboardPage />} />
              <Route path="/portal/frequencia" element={<PortalFrequenciaPage />} />
              <Route path="/portal/avisos" element={<PortalAvisosPage />} />
              <Route path="/portal/cobrancas" element={<PortalCobrancasPage />} />
              <Route path="/portal/fila" element={<PortalFilaVirtualPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
