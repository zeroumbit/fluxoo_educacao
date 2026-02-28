import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider, useAuth } from '@/modules/auth/AuthContext'
import { ProtectedRoute } from '@/modules/auth/ProtectedRoute'
import { LoginPage } from '@/modules/auth/LoginPage'
import { AdminLayout } from '@/layout/AdminLayout'
import { SuperAdminLayout } from '@/layout/SuperAdminLayout'
import { PortalLayout } from '@/layout/PortalLayout'

// Pages - Admin
import { DashboardPage } from '@/modules/alunos/pages/DashboardPage'
import { AlunosListPage } from '@/modules/alunos/pages/AlunosListPage'
import { AlunoCadastroPage } from '@/modules/alunos/pages/AlunoCadastroPage'
import { AlunoDetalhePage } from '@/modules/alunos/pages/AlunoDetalhePage'
import { TurmasPage } from '@/modules/turmas/pages/TurmasPage'
import { FrequenciaPage } from '@/modules/frequencia/pages/FrequenciaPage'
import { MuralPage } from '@/modules/comunicacao/pages/MuralPage'
import { FinanceiroPage } from '@/modules/financeiro/pages/FinanceiroPage'
import { FiliaisPage } from '@/modules/filiais/pages/FiliaisPage'
import { EscolaCadastroPage } from '@/modules/escolas/pages/EscolaCadastroPage'

// Pages - Super Admin
import { SuperAdminDashboardPage } from '@/modules/super-admin/pages/SuperAdminDashboardPage'

// Pages - Portal
import { PortalAlunoPage } from '@/modules/auth/pages/PortalAlunoPage'
import { PortalFrequenciaPage } from '@/modules/auth/pages/PortalFrequenciaPage'
import { PortalAvisosPage } from '@/modules/auth/pages/PortalAvisosPage'
import { PortalCobrancasPage } from '@/modules/auth/pages/PortalCobrancasPage'

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
              <Route path="/admin/escolas" element={<div className="p-8"><h1 className="text-2xl font-bold">Gestão de Escolas</h1><p>Em breve: Lista de tenants e configurações globais.</p></div>} />
              <Route path="/admin/planos" element={<div className="p-8"><h1 className="text-2xl font-bold">Planos e Preços</h1><p>Em breve: Gestão de planos da plataforma.</p></div>} />
              <Route path="/admin/assinaturas" element={<div className="p-8"><h1 className="text-2xl font-bold">Assinaturas</h1><p>Em breve: Histórico global de pagamentos.</p></div>} />
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
            </Route>

            {/* Portal do Responsável */}
            <Route
              element={
                <ProtectedRoute allowedRoles={['responsavel']}>
                  <PortalLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/portal" element={<PortalAlunoPage />} />
              <Route path="/portal/frequencia" element={<PortalFrequenciaPage />} />
              <Route path="/portal/avisos" element={<PortalAvisosPage />} />
              <Route path="/portal/cobrancas" element={<PortalCobrancasPage />} />
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
