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
import { mascaraCNPJ, validarCNPJ } from '@/lib/validacoes'
import { cn } from '@/lib/utils'
import type { Filial } from '@/lib/database.types'

const filialSchema = z.object({
  nome_unidade: z.string().min(2, 'Nome é obrigatório'),
  cnpj_proprio: z.string().optional().or(z.literal('')),
  endereco_completo: z.string().optional(),
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
    reset({ nome_unidade: '', cnpj_proprio: '', endereco_completo: '', is_matriz: false })
    setDialogOpen(true)
  }

  const abrirEdicao = (filial: Filial) => {
    setEditando(filial)
    reset({
      nome_unidade: filial.nome_unidade,
      cnpj_proprio: filial.cnpj_proprio || '',
      endereco_completo: filial.endereco_completo || '',
      is_matriz: filial.is_matriz,
    })
    setDialogOpen(true)
  }

  const onSubmit = async (data: FilialFormValues) => {
    if (!authUser) return
    try {
      if (editando) {
        await atualizarFilial.mutateAsync({
          id: editando.id,
          filial: { ...data, cnpj_proprio: data.cnpj_proprio || null, endereco_completo: data.endereco_completo || null },
        })
        toast.success('Unidade atualizada!')
      } else {
        await criarFilial.mutateAsync({
          ...data,
          tenant_id: authUser.tenantId,
          cnpj_proprio: data.cnpj_proprio || null,
          endereco_completo: data.endereco_completo || null,
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
              <div className="space-y-2">
                <Label htmlFor="endereco_completo">Endereço Completo</Label>
                <Input 
                  id="endereco_completo" 
                  placeholder="Rua, número, bairro, cidade - UF" 
                  {...register('endereco_completo')} 
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch 
                  id="is_matriz"
                  checked={isMatriz} 
                  onCheckedChange={(v) => setValue('is_matriz', v)} 
                />
                <Label htmlFor="is_matriz">Esta é a unidade matriz</Label>
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
                  {filial.endereco_completo || 'Endereço não informado'}
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
