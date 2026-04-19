import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, Save, User, Mail, Smartphone, Shield, Lock, MapPin } from 'lucide-react'
import { mascaraCPF, mascaraTelefone, mascaraCEP } from '@/lib/validacoes'
import { useViaCEP } from '@/hooks/use-viacep'
import { useFuncionarioLogado } from '@/modules/funcionarios/hooks'

export function MeuPerfilPageWeb() {
  const { authUser } = useAuth()
  const { data: funcionario, isLoading: loadingFunc } = useFuncionarioLogado()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmSenha, setConfirmSenha] = useState('')
  const [alterandoSenha, setAlterandoSenha] = useState(false)
  const [form, setForm] = useState({
    nome_completo: '',
    cpf: '',
    email: '',
    telefone: '',
    cargo: '',
    cep: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
  })

  // Carregar dados do funcionário
  useEffect(() => {
    if (funcionario) {
      setForm({
        nome_completo: funcionario.nome_completo || '',
        cpf: funcionario.cpf || '',
        email: funcionario.email || authUser?.email || '',
        telefone: funcionario.telefone || '',
        cargo: funcionario.cargo || funcionario.funcao || '',
        cep: funcionario.cep || '',
        logradouro: funcionario.logradouro || '',
        numero: funcionario.numero || '',
        bairro: funcionario.bairro || '',
        cidade: funcionario.cidade || '',
        estado: funcionario.estado || '',
      })
      setLoading(false)
    } else if (!loadingFunc && authUser) {
      // Se não é funcionário, usa dados do authUser
      setForm({
        nome_completo: authUser.nome || '',
        cpf: '',
        email: authUser.email || '',
        telefone: '',
        cargo: authUser.role || '',
        cep: '',
        logradouro: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: '',
      })
      setLoading(false)
    }
  }, [funcionario, loadingFunc, authUser])

  const { fetchAddressByCEP, fetchCitiesByUF, _cities, _loadingCities, _estados } = useViaCEP()

  useEffect(() => {
    if (form.estado) {
      fetchCitiesByUF(form.estado)
    }
  }, [form.estado])

  const buscarCep = async () => {
    if (form.cep.length < 9) return
    const data = await fetchAddressByCEP(form.cep)
    if (data && !('error' in data)) {
      setForm(prev => ({
        ...prev,
        logradouro: (data as any).logradouro || '',
        bairro: (data as any).bairro || '',
        estado: (data as any).estado || '',
      }))
      toast.success('Endereço encontrado!')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const dadosAtualizados = {
        nome_completo: form.nome_completo.trim(),
        cpf: form.cpf.replace(/\D/g, ''),
        telefone: form.telefone,
        cep: form.cep,
        logradouro: form.logradouro,
        numero: form.numero,
        bairro: form.bairro,
        cidade: form.cidade,
        estado: form.estado,
        updated_at: new Date().toISOString(),
      }

      if (funcionario?.id) {
        const { data, error } = await supabase
          .from('funcionarios')
          .update(dadosAtualizados)
          .eq('id', funcionario.id)
          .select()
          .single()

        if (error) {
          console.error('Erro ao salvar funcionário:', error)
          throw error
        }

        console.log('Funcionário atualizado com sucesso:', data)
      } else if (authUser?.funcionarioId) {
        // Fallback: usa funcionarioId do authUser
        const { data, error } = await supabase
          .from('funcionarios')
          .update(dadosAtualizados)
          .eq('id', authUser.funcionarioId)
          .select()
          .single()

        if (error) throw error
        console.log('Funcionário atualizado via authUser:', data)
      }

      toast.success('Perfil atualizado com sucesso!')
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error)
      toast.error(error.message || 'Erro ao salvar perfil')
    } finally {
      setSaving(false)
    }
  }

  const handleTrocarSenha = async () => {
    if (novaSenha !== confirmSenha) {
      toast.error('As senhas não coincidem')
      return
    }
    if (novaSenha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setAlterandoSenha(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha })
      if (error) throw error
      toast.success('Senha alterada com sucesso!')
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmSenha('')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao alterar senha')
    } finally {
      setAlterandoSenha(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
  }

  const iniciais = form.nome_completo.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4">
      <div className="text-left">
        <h1 className="text-2xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-muted-foreground">Gerencie seus dados pessoais e senha</p>
      </div>

      {/* Card de identificação */}
      <Card className="border-0 shadow-md bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <CardContent className="pt-8">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 border-2 border-white shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white text-2xl font-bold">
                {iniciais}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-zinc-900">{form.nome_completo || authUser?.nome}</h2>
              <p className="text-sm text-zinc-500 capitalize">{form.cargo || authUser?.role?.replace('_', ' ')}</p>
              <div className="flex items-center gap-2 mt-2">
                <Shield className="h-4 w-4 text-indigo-600" />
                <span className="text-xs font-medium text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                  {authUser?.isProfessor ? 'Professor' : authUser?.isGestor ? 'Gestor' : 'Funcionário'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados Pessoais */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pt-8">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-600" />
            Dados Pessoais
          </CardTitle>
          <CardDescription>Seus dados de identificação e contato</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input value={form.nome_completo} onChange={(e) => setForm({ ...form, nome_completo: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>CPF</Label>
              <Input
                value={form.cpf}
                onChange={(e) => setForm({ ...form, cpf: mascaraCPF(e.target.value) })}
                maxLength={14}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Mail className="h-4 w-4" /> E-mail</Label>
              <Input type="email" value={form.email} readOnly className="bg-zinc-50" />
              <p className="text-[10px] text-zinc-400">E-mail de login (não editável)</p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Smartphone className="h-4 w-4" /> Telefone</Label>
              <Input
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: mascaraTelefone(e.target.value) })}
                maxLength={15}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endereço */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pt-8">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-indigo-600" />
            Endereço
          </CardTitle>
          <CardDescription>Seu endereço residencial</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="space-y-2 flex-1">
              <Label>CEP</Label>
              <Input
                value={form.cep}
                onChange={(e) => setForm({ ...form, cep: mascaraCEP(e.target.value) })}
                maxLength={9}
              />
            </div>
            <Button type="button" variant="outline" onClick={buscarCep} className="mt-7">
              Buscar CEP
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Logradouro</Label>
              <Input value={form.logradouro} onChange={(e) => setForm({ ...form, logradouro: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Número</Label>
              <Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Bairro</Label>
              <Input value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Estado/UF</Label>
              <Input
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
                maxLength={2}
                className="uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alterar Senha */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pt-8">
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-indigo-600" />
            Alterar Senha
          </CardTitle>
          <CardDescription>Atualize sua senha de acesso</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Senha Atual</Label>
            <Input
              type="password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              placeholder="Digite sua senha atual"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <Input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirmar Nova Senha</Label>
              <Input
                type="password"
                value={confirmSenha}
                onChange={(e) => setConfirmSenha(e.target.value)}
                placeholder="Repita a nova senha"
              />
            </div>
          </div>
          <Button onClick={handleTrocarSenha} disabled={alterandoSenha || !novaSenha || !confirmSenha} className="bg-indigo-600 hover:bg-indigo-700">
            {alterandoSenha ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
            Alterar Senha
          </Button>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end gap-3">
        <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-indigo-600 to-blue-600 shadow-md min-w-[200px]">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar Alterações
        </Button>
      </div>
    </div>
  )
}
