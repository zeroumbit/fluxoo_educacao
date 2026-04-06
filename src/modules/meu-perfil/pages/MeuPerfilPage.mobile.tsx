import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, Save, User, Mail, Smartphone, Shield, Lock, MapPin, ChevronLeft } from 'lucide-react'
import { mascaraCPF, mascaraTelefone, mascaraCEP } from '@/lib/validacoes'
import { useViaCEP } from '@/hooks/use-viacep'
import { useFuncionarioLogado } from '@/modules/funcionarios/hooks'
import { useNavigate } from 'react-router-dom'

export function MeuPerfilPageMobile() {
  const navigate = useNavigate()
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

  const { fetchAddressByCEP } = useViaCEP()

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
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-10 w-10 animate-spin text-indigo-600" /></div>
  }

  const iniciais = form.nome_completo.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()
  const roleLabel = authUser?.isProfessor ? 'Professor' : authUser?.isGestor ? 'Gestor' : 'Funcionário'

  return (
    <div className="min-h-[100dvh] bg-white dark:bg-slate-950 animate-in fade-in duration-300">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
            <ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-zinc-900 truncate">Meu Perfil</h1>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Seus dados pessoais</p>
          </div>
        </div>
      </div>

      {/* Conteúdo com padding inferior natural */}
      <div className="px-4 pb-8">
        {/* Card de identificação */}
        <Card className="mt-4 border-0 shadow-sm bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
          <CardContent className="p-6 flex flex-col items-center text-center gap-3">
            <Avatar className="h-20 w-20 border-2 border-white shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white text-2xl font-bold">
                {iniciais}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-bold text-zinc-900">{form.nome_completo || authUser?.nome}</h2>
              <p className="text-sm text-zinc-500 capitalize">{form.cargo || roleLabel}</p>
            </div>
            <span className="text-xs font-medium text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full flex items-center gap-1">
              <Shield className="h-3 w-3" /> {roleLabel}
            </span>
          </CardContent>
        </Card>

        {/* Seções em vez de abas - tudo em scroll */}
        <div className="space-y-6 mt-6">
          {/* Seção Dados */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <User className="h-4 w-4 text-indigo-600" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Dados Pessoais</h3>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Nome Completo</Label>
                <Input value={form.nome_completo} onChange={(e) => setForm({ ...form, nome_completo: e.target.value })} className="h-11 bg-slate-50 border-0 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">CPF</Label>
                <Input
                  value={form.cpf}
                  onChange={(e) => setForm({ ...form, cpf: mascaraCPF(e.target.value) })}
                  maxLength={14}
                  className="h-11 bg-slate-50 border-0 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Mail className="h-3 w-3" /> E-mail</Label>
                <Input type="email" value={form.email} readOnly className="h-11 bg-slate-100 border-0 rounded-xl text-slate-400" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Smartphone className="h-3 w-3" /> Telefone</Label>
                <Input
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: mascaraTelefone(e.target.value) })}
                  maxLength={15}
                  placeholder="(00) 00000-0000"
                  className="h-11 bg-slate-50 border-0 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Separador */}
          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          {/* Seção Endereço */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-indigo-600" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Endereço</h3>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="space-y-1.5 flex-1">
                  <Label className="text-[10px] font-semibold text-slate-400 uppercase">CEP</Label>
                  <Input
                    value={form.cep}
                    onChange={(e) => setForm({ ...form, cep: mascaraCEP(e.target.value) })}
                    maxLength={9}
                    className="h-11 bg-slate-50 border-0 rounded-xl"
                  />
                </div>
                <Button type="button" variant="outline" onClick={buscarCep} className="mt-6 h-11 px-4 rounded-xl text-xs font-semibold flex-shrink-0">
                  Buscar
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold text-slate-400 uppercase">Logradouro</Label>
                <Input value={form.logradouro} onChange={(e) => setForm({ ...form, logradouro: e.target.value })} className="h-11 bg-slate-50 border-0 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold text-slate-400 uppercase">Número</Label>
                  <Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} className="h-11 bg-slate-50 border-0 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold text-slate-400 uppercase">Bairro</Label>
                  <Input value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} className="h-11 bg-slate-50 border-0 rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold text-slate-400 uppercase">Estado</Label>
                  <Input value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase() })} maxLength={2} className="h-11 bg-slate-50 border-0 rounded-xl uppercase" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold text-slate-400 uppercase">Cidade</Label>
                  <Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} className="h-11 bg-slate-50 border-0 rounded-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Separador */}
          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          {/* Seção Senha */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Lock className="h-4 w-4 text-indigo-600" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Alterar Senha</h3>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                  Ao alterar sua senha, você precisará fazer login novamente.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold text-slate-400 uppercase flex items-center gap-1.5"><Lock className="h-3 w-3" /> Senha Atual</Label>
                <Input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} placeholder="Digite sua senha atual" className="h-11 bg-slate-50 border-0 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold text-slate-400 uppercase">Nova Senha</Label>
                  <Input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} placeholder="Mín. 6 caracteres" className="h-11 bg-slate-50 border-0 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold text-slate-400 uppercase">Confirmar</Label>
                  <Input type="password" value={confirmSenha} onChange={(e) => setConfirmSenha(e.target.value)} placeholder="Repita a senha" className="h-11 bg-slate-50 border-0 rounded-xl" />
                </div>
              </div>
              <Button
                onClick={handleTrocarSenha}
                disabled={alterandoSenha || !novaSenha || !confirmSenha}
                className="w-full h-11 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 font-semibold text-xs uppercase tracking-wider"
              >
                {alterandoSenha ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                Alterar Senha
              </Button>
            </div>
          </div>
        </div>

        {/* Botão Salvar - inline no fluxo, sem fixed */}
        <div className="mt-8">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-14 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 shadow-lg shadow-indigo-200 dark:shadow-none font-bold text-sm uppercase tracking-wider"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
            Salvar Alterações
          </Button>
        </div>
      </div>
    </div>
  )
}
