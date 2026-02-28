import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { useFiliais, useCriarFilial, useAtualizarFilial, useExcluirFilial } from '../hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Plus, Loader2, Building2, Pencil, Trash2, MapPin, AlertTriangle } from 'lucide-react'
import { mascaraCNPJ, validarCNPJ, mascaraCEP } from '@/lib/validacoes'
import { cn } from '@/lib/utils'
import { useViaCEP } from '@/hooks/use-viacep'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEffect } from 'react'
import type { Filial } from '@/lib/database.types'

const filialSchema = z.object({
  nome_unidade: z.string().min(2, 'Nome é obrigatório'),
  cnpj_proprio: z.string().optional().or(z.literal('')),
  cep: z.string().optional().or(z.literal('')),
  logradouro: z.string().optional().or(z.literal('')),
  numero: z.string().optional().or(z.literal('')),
  bairro: z.string().optional().or(z.literal('')),
  estado: z.string().optional().or(z.literal('')),
  cidade: z.string().optional().or(z.literal('')),
  is_matriz: z.boolean(),
}).refine((data) => !data.cnpj_proprio || validarCNPJ(data.cnpj_proprio), {
  message: 'CNPJ inválido',
  path: ['cnpj_proprio'],
})

type FilialFormValues = z.infer<typeof filialSchema>

export function FiliaisPage() {
  const { authUser } = useAuth()
  const { data: filiais, isLoading } = useFiliais()
  const criarFilial = useCriarFilial()
  const atualizarFilial = useAtualizarFilial()
  const excluirFilial = useExcluirFilial()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<Filial | null>(null)
  const [excluirDialogOpen, setExcluirDialogOpen] = useState(false)
  const [filialParaExcluir, setFilialParaExcluir] = useState<string | null>(null)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FilialFormValues>({
    resolver: zodResolver(filialSchema),
    defaultValues: { is_matriz: false },
  })

  const isMatriz = watch('is_matriz')

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value
    setValue('cnpj_proprio', mascaraCNPJ(valor), { shouldValidate: true })
  }

  const abrirNovo = () => {
    setEditando(null)
    reset({ 
      nome_unidade: '', 
      cnpj_proprio: '', 
      cep: '', 
      logradouro: '', 
      numero: '', 
      bairro: '', 
      estado: '', 
      cidade: '', 
      is_matriz: false 
    })
    setDialogOpen(true)
  }

  const { fetchAddressByCEP, fetchCitiesByUF, cities, loadingCities, loading: buscandoCep, estados } = useViaCEP()
  const selectedEstado = watch('estado')

  useEffect(() => {
    if (selectedEstado) {
      fetchCitiesByUF(selectedEstado)
    }
  }, [selectedEstado])

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = mascaraCEP(e.target.value)
    setValue('cep', valor)
    if (valor.replace(/\D/g, '').length === 8) {
      const data = await fetchAddressByCEP(valor)
      if (data && !('error' in data)) {
        setValue('logradouro', data.logradouro || '', { shouldValidate: true })
        setValue('bairro', data.bairro || '', { shouldValidate: true })
        setValue('estado', data.estado || '', { shouldValidate: true })
        setTimeout(() => {
          setValue('cidade', data.cidade || '', { shouldValidate: true })
        }, 500)
      }
    }
  }

  const abrirEdicao = (filial: Filial) => {
    setEditando(filial)
    reset({
      nome_unidade: filial.nome_unidade,
      cnpj_proprio: filial.cnpj_proprio || '',
      cep: filial.cep || '',
      logradouro: filial.logradouro || '',
      numero: filial.numero || '',
      bairro: filial.bairro || '',
      estado: filial.estado || '',
      cidade: filial.cidade || '',
      is_matriz: filial.is_matriz,
    })
    setDialogOpen(true)
  }

  const onSubmit = async (data: FilialFormValues) => {
    if (!authUser) return
    try {
      // Valida: só pode existir uma matriz por escola
      const matrizExistente = filiais?.find(f => f.is_matriz)
      if (data.is_matriz && matrizExistente && (!editando || editando.id !== matrizExistente.id)) {
        toast.error('Já existe uma unidade matriz cadastrada. Só é permitido uma matriz por escola.')
        return
      }

      const payload = {
        ...data,
        cnpj_proprio: data.cnpj_proprio || null,
        cep: data.cep || null,
        logradouro: data.logradouro || null,
        bairro: data.bairro || null,
        numero: data.numero || null,
        estado: data.estado || null,
        cidade: data.cidade || null,
      }

      if (editando) {
        await atualizarFilial.mutateAsync({
          id: editando.id,
          filial: payload,
        })
        toast.success('Unidade atualizada!')
      } else {
        await criarFilial.mutateAsync({
          ...payload,
          tenant_id: authUser.tenantId,
        })
        toast.success('Unidade criada!')
      }
      setDialogOpen(false)
    } catch {
      toast.error('Erro ao salvar')
    }
  }

  const handleExcluir = async (id: string) => {
    setFilialParaExcluir(id)
    setExcluirDialogOpen(true)
  }

  const confirmarExclusao = async () => {
    if (!filialParaExcluir) return
    try {
      await excluirFilial.mutateAsync(filialParaExcluir)
      toast.success('Unidade excluída!')
      setExcluirDialogOpen(false)
      setFilialParaExcluir(null)
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Unidades / Filiais</h1>
          <p className="text-muted-foreground">Gerencie as unidades da escola</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={abrirNovo} className="bg-gradient-to-r from-indigo-600 to-blue-600 shadow-md">
              <Plus className="mr-2 h-4 w-4" /> Nova Unidade
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editando ? 'Editar Unidade' : 'Nova Unidade'}</DialogTitle>
              <DialogDescription>
                Preencha as informações para cadastrar a unidade.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome_unidade">Nome da Unidade *</Label>
                <Input 
                  id="nome_unidade" 
                  placeholder="Ex: Unidade Centro" 
                  {...register('nome_unidade')} 
                />
                {errors.nome_unidade && (
                  <p className="text-sm text-destructive">{errors.nome_unidade.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj_proprio">CNPJ Próprio</Label>
                <Input
                  id="cnpj_proprio"
                  placeholder="00.000.000/0000-00 (opcional)"
                  {...register('cnpj_proprio')}
                  onChange={handleCnpjChange}
                  maxLength={18}
                />
                {errors.cnpj_proprio && (
                  <p className="text-sm text-destructive">{errors.cnpj_proprio.message}</p>
                )}
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="cep" 
                      placeholder="00000-000" 
                      {...register('cep')} 
                      onChange={handleCepChange}
                      maxLength={9} 
                      className="flex-1"
                    />
                    {buscandoCep && <Loader2 className="h-4 w-4 animate-spin mt-3" />}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-3 space-y-2">
                    <Label htmlFor="logradouro">Rua / Logradouro</Label>
                    <Input id="logradouro" placeholder="Ex: Rua das Flores" {...register('logradouro')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input id="numero" placeholder="Nº" {...register('numero')} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input id="bairro" placeholder="Bairro" {...register('bairro')} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Select value={watch('estado')} onValueChange={(val) => setValue('estado', val)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {estados.map(est => <SelectItem key={est.value} value={est.value}>{est.value}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Select value={watch('cidade')} onValueChange={(val) => setValue('cidade', val)} disabled={!selectedEstado || loadingCities}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={loadingCities ? "..." : "Selecione"} />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map(city => <SelectItem key={city.value} value={city.value}>{city.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Switch
                    id="is_matriz"
                    checked={isMatriz}
                    onCheckedChange={(v) => setValue('is_matriz', v)}
                    disabled={!!(filiais?.some(f => f.is_matriz) && !editando?.is_matriz)}
                  />
                  <Label htmlFor="is_matriz">Esta é a unidade matriz</Label>
                </div>
                {filiais?.some(f => f.is_matriz) && !editando?.is_matriz && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Já existe uma matriz cadastrada. Só é permitido uma matriz por escola.
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={excluirDialogOpen} onOpenChange={setExcluirDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. A unidade será permanentemente removida do sistema.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExcluirDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmarExclusao}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filiais?.map((filial: Filial) => (
          <Card 
            key={filial.id} 
            className={cn(
              "border-0 shadow-md hover:shadow-lg transition-all group relative overflow-hidden",
              filial.is_matriz && "ring-2 ring-indigo-500/20 bg-gradient-to-br from-white to-indigo-50/10"
            )}
          >
            {filial.is_matriz && (
              <div className="absolute top-0 right-0 p-3">
                <Badge className="bg-indigo-600 text-white shadow-sm border-0">UNIDADE MATRIZ</Badge>
              </div>
            )}
            <CardContent className="pt-8">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "h-12 w-12 rounded-xl flex items-center justify-center transition-colors",
                    filial.is_matriz ? "bg-indigo-100 text-indigo-600" : "bg-violet-50 text-violet-600"
                  )}>
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 leading-tight">{filial.nome_unidade}</h3>
                    <div className="flex gap-1 mt-1.5">
                      {filial.cnpj_proprio && (
                        <Badge variant="outline" className="text-[10px] font-mono tracking-wider opacity-70">
                          {filial.cnpj_proprio}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => abrirEdicao(filial)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {!filial.is_matriz && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleExcluir(filial.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="mt-6 flex items-start gap-2 text-sm text-muted-foreground border-t pt-4">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  {filial.logradouro
                    ? `${filial.logradouro}${filial.numero ? `, ${filial.numero}` : ''}${filial.bairro ? ` - ${filial.bairro}` : ''} - ${filial.cidade}/${filial.estado}`
                    : filial.numero || filial.cidade || filial.estado
                      ? `${filial.numero || ''}${filial.cidade ? `, ${filial.cidade}` : ''}${filial.estado ? `/${filial.estado}` : ''}`.trim()
                      : 'Endereço não informado'}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!filiais || filiais.length === 0) && (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p>Nenhuma unidade cadastrada.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
