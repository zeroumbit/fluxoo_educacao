import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import type { Banner } from '@/types/shared'
import { useBanners, useCidadesComEscolas, useDeleteBanners, useUpsertBanner } from '../hooks'
import { superAdminService } from '../service'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function BannersPage() {
  const { data: banners, isLoading } = useBanners()
  const { data: cidades } = useCidadesComEscolas()
  const upsertBanner = useUpsertBanner()
  const deleteBanners = useDeleteBanners()

  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  
  // Controle de exclusão (Dupla Confirmação)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [bannersToDelete, setBannersToDelete] = useState<string[]>([])
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  
  // Seleção múltipla
  const [selectedBanners, setSelectedBanners] = useState<string[]>([])

  // Estado de upload de imagem
  const [isUploading, setIsUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    nome: '',
    link_redirecionamento: '',
    cidade: '',
    url_imagem: '',
    data_inicio: '',
    data_fim: '',
    status: 'ativo' as 'ativo' | 'inativo',
  })

  const filteredBanners = banners?.filter((b: Banner) =>
    b.nome.toLowerCase().includes(search.toLowerCase()) ||
    b.cidade.toLowerCase().includes(search.toLowerCase())
  )

  const handleOpenModal = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner)
      setImagePreview(banner.url_imagem)
      setImageFile(null)
      setFormData({
        nome: banner.nome,
        link_redirecionamento: banner.link_redirecionamento,
        cidade: banner.cidade,
        url_imagem: banner.url_imagem,
        data_inicio: banner.data_inicio ? format(new Date(banner.data_inicio), "yyyy-MM-dd'T'HH:mm") : '',
        data_fim: banner.data_fim ? format(new Date(banner.data_fim), "yyyy-MM-dd'T'HH:mm") : '',
        status: banner.status,
      })
    } else {
      setEditingBanner(null)
      setImagePreview(null)
      setImageFile(null)
      setFormData({
        nome: '',
        link_redirecionamento: '',
        cidade: '',
        url_imagem: '',
        data_inicio: '',
        data_fim: '',
        status: 'ativo',
      })
    }
    setIsModalOpen(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar formato (aceita pelo MIME type ou pela extensão do arquivo)
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp', 'image/x-png']
    const fileExt = '.' + file.name.slice(((file.name.lastIndexOf('.') - 1) >>> 0) + 1).toLowerCase()
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.webp']

    const isValidMime = allowedMimeTypes.includes(file.type)
    const isValidExt = allowedExtensions.includes(fileExt)

    if (!isValidMime && !isValidExt) {
      toast.error('Formato inválido! Escolha uma imagem PNG, JPEG, SVG ou WEBP.')
      return
    }

    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.cidade) {
      toast.error('Selecione uma cidade!')
      return
    }

    if (new Date(formData.data_inicio) >= new Date(formData.data_fim)) {
      toast.error('A data de início deve ser anterior à data de término!')
      return
    }

    try {
      let finalImageUrl = formData.url_imagem

      if (imageFile) {
        setIsUploading(true)
        finalImageUrl = await superAdminService.uploadBannerImage(imageFile)
        setIsUploading(false)
      } else if (!finalImageUrl) {
        toast.error('Envie uma imagem para o banner!')
        return
      }

      await upsertBanner.mutateAsync({
        ...(editingBanner?.id ? { id: editingBanner.id } : {}),
        ...formData,
        url_imagem: finalImageUrl,
        data_inicio: new Date(formData.data_inicio).toISOString(),
        data_fim: new Date(formData.data_fim).toISOString(),
      })

      toast.success(editingBanner ? 'Banner atualizado!' : 'Banner criado com sucesso!')
      setIsModalOpen(false)
    } catch (error: unknown) {
      setIsUploading(false)
      const errMsg = error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error(errMsg)
    }
  }

  const handleOpenDeleteModal = (ids: string[]) => {
    setBannersToDelete(ids)
    setDeleteConfirmText('')
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (deleteConfirmText.trim().toLowerCase() !== 'excluir') {
      toast.error('Digite a palavra "excluir" corretamente para confirmar!')
      return
    }

    try {
      await deleteBanners.mutateAsync(bannersToDelete)
      toast.success('Banner(s) excluído(s) com sucesso!')
      setSelectedBanners([])
      setIsDeleteModalOpen(false)
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Erro ao excluir banner(s).'
      toast.error(errMsg)
    }
  }

  const toggleSelectBanner = (id: string) => {
    if (selectedBanners.includes(id)) {
      setSelectedBanners(selectedBanners.filter(bId => bId !== id))
    } else {
      setSelectedBanners([...selectedBanners, id])
    }
  }

  const toggleSelectAll = () => {
    if (selectedBanners.length === filteredBanners?.length) {
      setSelectedBanners([])
    } else {
      setSelectedBanners(filteredBanners?.map(b => b.id) || [])
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Megaphone className="h-8 w-8 text-indigo-600" />
            Banners para Escolas
          </h1>
          <p className="text-slate-500 font-medium">Banners informativos exibidos nas dashboards operacionais das escolas.</p>
        </div>

        <div className="flex items-center gap-3">
          {selectedBanners.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => handleOpenDeleteModal(selectedBanners)}
              className="h-11 px-5 rounded-xl font-bold shadow-lg shadow-red-100 active:scale-95 transition-all"
            >
              <Trash2 className="mr-2 h-5 w-5" /> Excluir Selecionados ({selectedBanners.length})
            </Button>
          )}

          <Button onClick={() => handleOpenModal()} className="bg-indigo-600 hover:bg-indigo-700 h-11 px-6 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95">
            <Plus className="mr-2 h-5 w-5" /> Novo Banner
          </Button>
        </div>
      </div>

      {/* Formulário de Criação/Edição */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl border-0 shadow-2xl overflow-y-auto max-h-[90vh]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{editingBanner ? 'Editar Banner' : 'Cadastrar Novo Banner'}</DialogTitle>
              <DialogDescription className="font-medium text-slate-500">
                Preencha todos os campos do banner promocional.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-xs font-bold uppercase tracking-widest text-slate-400">Nome identificador</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Campanha de Matrículas Junho"
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  required
                  className="h-11 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link_redirecionamento" className="text-xs font-bold uppercase tracking-widest text-slate-400">Link de redirecionamento</Label>
                <Input
                  id="link_redirecionamento"
                  type="url"
                  placeholder="https://exemplo.com/pagina"
                  value={formData.link_redirecionamento}
                  onChange={e => setFormData({ ...formData, link_redirecionamento: e.target.value })}
                  required
                  className="h-11 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Ao clicar, o link abrirá automaticamente em outra aba.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Cidade Alvo</Label>
                <Select
                  value={formData.cidade}
                  onValueChange={value => setFormData({ ...formData, cidade: value })}
                >
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 w-full">
                    <SelectValue placeholder="Selecione a cidade com escolas criadas" />
                  </SelectTrigger>
                  <SelectContent>
                    {cidades?.map(c => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                    {(!cidades || cidades.length === 0) && (
                      <SelectItem value="none" disabled>Nenhuma cidade cadastrada no sistema</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data_inicio" className="text-xs font-bold uppercase tracking-widest text-slate-400">Exibir de (Data/Hora)</Label>
                  <Input
                    id="data_inicio"
                    type="datetime-local"
                    value={formData.data_inicio}
                    onChange={e => setFormData({ ...formData, data_inicio: e.target.value })}
                    required
                    className="h-11 rounded-xl border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_fim" className="text-xs font-bold uppercase tracking-widest text-slate-400">Exibir até (Data/Hora)</Label>
                  <Input
                    id="data_fim"
                    type="datetime-local"
                    value={formData.data_fim}
                    onChange={e => setFormData({ ...formData, data_fim: e.target.value })}
                    required
                    className="h-11 rounded-xl border-slate-200"
                  />
                </div>
              </div>

              {/* Upload de Imagem */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Imagem do Banner</Label>
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-4 transition-all bg-slate-50/50 relative group">
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg,.webp"
                    onChange={handleImageChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {imagePreview ? (
                    <div className="w-full flex flex-col items-center gap-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-20 w-full object-cover rounded-lg border border-slate-200"
                      />
                      <span className="text-xs text-slate-500 font-medium">Clique ou arraste outra imagem para trocar</span>
                    </div>
                  ) : (
                    <div className="text-center py-4 space-y-1">
                      <Upload className="h-8 w-8 text-slate-400 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">Clique para enviar imagem</p>
                      <p className="text-[10px] text-slate-400 font-medium">Formatos aceitos: PNG, JPG, JPEG, SVG ou WEBP</p>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wide">Recomendável: formato WEBP, com largura de 1216px por 250px de altura.</p>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <Label className="text-sm font-bold text-slate-700">Status</Label>
                <Badge
                  variant={formData.status === 'ativo' ? 'default' : 'secondary'}
                  className="cursor-pointer px-3 py-1 rounded-md font-bold uppercase text-[10px]"
                  onClick={() => setFormData({ ...formData, status: formData.status === 'ativo' ? 'inativo' : 'ativo' })}
                >
                  {formData.status === 'ativo' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl font-bold h-11 text-slate-500"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={upsertBanner.isPending || isUploading}
                className="bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold h-11 px-8 shadow-lg shadow-indigo-100"
              >
                {(upsertBanner.isPending || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Banner
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação de exclusão (Dupla Confirmação) */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md rounded-2xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6" /> Confirmar Exclusão
            </DialogTitle>
            <DialogDescription className="font-medium text-slate-500 pt-2">
              Tem certeza que deseja excluir o(s) {bannersToDelete.length} banner(s) selecionado(s)? Esta ação é definitiva e não poderá ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Digite <span className="font-extrabold text-red-600">excluir</span> para confirmar
            </Label>
            <Input
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="Digite excluir"
              className="h-11 rounded-xl border-slate-200"
            />
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsDeleteModalOpen(false)}
              className="rounded-xl font-bold h-11 text-slate-500"
            >
              Cancelar
            </Button>
            <Button
              disabled={deleteConfirmText.toLowerCase() !== 'excluir' || deleteBanners.isPending}
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold h-11 px-6 shadow-lg shadow-red-100"
            >
              {deleteBanners.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir Definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lista de Banners Cadastrados */}
      <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-white">
        <CardHeader className="border-b border-slate-50 p-8 pt-10 bg-slate-50/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-2xl font-black tracking-tighter text-slate-900">Catálogo de Banners</CardTitle>
              <CardDescription className="font-medium">Lista de todos os banners cadastrados por período e filtros.</CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome ou cidade..."
                className="pl-10 h-10 rounded-xl bg-white border-slate-200 shadow-sm focus:border-indigo-500 transition-all font-medium"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12 pl-8">
                    <Checkbox
                      checked={
                        filteredBanners?.length > 0 &&
                        selectedBanners.length === filteredBanners?.length
                      }
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest pl-2">Imagem</TableHead>
                  <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Nome</TableHead>
                  <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Cidade</TableHead>
                  <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Período Exibição</TableHead>
                  <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest text-center">Status</TableHead>
                  <TableHead className="text-right font-bold text-slate-400 uppercase text-[10px] tracking-widest pr-8">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center bg-slate-50/20">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                        <p className="text-sm font-bold text-slate-400 animate-pulse uppercase tracking-wider">Carregando banners...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredBanners?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center bg-slate-50/20">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                          <Megaphone className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">Nenhum banner cadastrado</p>
                          <p className="text-sm text-slate-400 font-medium">Clique em "Novo Banner" para começar.</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBanners?.map((banner: Banner) => (
                    <TableRow key={banner.id} className="group hover:bg-slate-50/50 transition-colors">
                      <TableCell className="pl-8">
                        <Checkbox
                          checked={selectedBanners.includes(banner.id)}
                          onCheckedChange={() => toggleSelectBanner(banner.id)}
                        />
                      </TableCell>
                      <TableCell className="pl-2">
                        <div className="h-10 w-24 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center">
                          {banner.url_imagem ? (
                            <img src={banner.url_imagem} alt={banner.nome} className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-slate-300" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-slate-900">
                        <div className="flex flex-col">
                          <span>{banner.nome}</span>
                          {banner.link_redirecionamento && (
                            <a
                              href={banner.link_redirecionamento}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 mt-0.5"
                            >
                              Testar Link <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-slate-700">{banner.cidade}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5 text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1">
                            De: {format(new Date(banner.data_inicio), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </span>
                          <span className="flex items-center gap-1">
                            Até: {format(new Date(banner.data_fim), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {banner.status === 'ativo' ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100">
                            <CheckCircle2 className="h-3.5 w-3.5" /> ATIVO
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-400 text-xs font-bold border border-slate-100">
                            <XCircle className="h-3.5 w-3.5" /> INATIVO
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenModal(banner)}
                            className="h-9 w-9 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 border border-transparent hover:border-indigo-100"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100"
                            onClick={() => handleOpenDeleteModal([banner.id])}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
