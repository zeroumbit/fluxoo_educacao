import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/modules/auth/AuthContext'
import { User, Mail, Phone, Shield, LogOut, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PortalPerfilPage() {
  const { authUser, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/login'
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Meu Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informações de acesso</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="border-0 shadow-md md:col-span-2">
          <CardHeader className="pt-8">
            <CardTitle>Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="h-12 w-12 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-600">
                <User size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nome Completo</p>
                <p className="font-bold text-slate-700">{authUser?.nome || 'Não informado'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="h-12 w-12 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-600">
                <Mail size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">E-mail de Acesso</p>
                <p className="font-bold text-slate-700">{authUser?.user?.email || 'Não informado'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="h-12 w-12 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-600">
                <Shield size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nível de Acesso</p>
                <p className="font-bold text-slate-700">Responsável</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pt-8">
            <CardTitle>Ações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
             <Button variant="outline" className="w-full justify-start gap-2" disabled>
                <Settings size={16} /> Alterar Senha
             </Button>
             <Button 
              variant="destructive" 
              className="w-full justify-start gap-2"
              onClick={handleSignOut}
             >
                <LogOut size={16} /> Sair do Portal
             </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
