import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, CreditCard, Users, ShieldCheck } from 'lucide-react'

export function SuperAdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gestão da Empresa</h1>
        <p className="text-muted-foreground">Visão global da plataforma e unidades escolares</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Escolas
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">-</div>
            <p className="text-xs text-muted-foreground mt-1">Instituições cadastradas</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Assinaturas Ativas
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">-</div>
            <p className="text-xs text-muted-foreground mt-1">Planos em vigor</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Usuários
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-violet-50 flex items-center justify-center">
              <Users className="h-5 w-5 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">-</div>
            <p className="text-xs text-muted-foreground mt-1">Em todas as unidades</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-indigo-50 to-blue-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-indigo-800">
              Status do Sistema
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-800">Online</div>
            <p className="text-xs text-indigo-700 mt-1">Todos os serviços ativos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-0 shadow-md">
          <CardHeader>
            <CardTitle>Escolas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-8">
              Controle de escolas e unidades para o Super Admin.
            </p>
          </CardContent>
        </Card>
        <Card className="col-span-3 border-0 shadow-md">
          <CardHeader>
            <CardTitle>Logs Recentes</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground text-center py-8">
              Atividades recentes de gestão.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
