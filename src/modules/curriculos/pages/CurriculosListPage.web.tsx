import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurriculosPublicos } from '../hooks'
import { useAuth } from '@/modules/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search,
  MapPin,
  Clock,
  DollarSign,
  ChevronRight,
  FileUser,
  AlertCircle,
} from 'lucide-react'
import { AREAS_INTERESSE, DISPONIBILIDADE_TIPOS } from '../types'
import { cn } from '@/lib/utils'

export function CurriculosListPage() {
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [areaFiltro, setAreaFiltro] = useState<string | null>(null)

  const { data: curriculos, isLoading, error } = useCurriculosPublicos({
    areas: areaFiltro ? [areaFiltro] : undefined,
    search: searchTerm || undefined,
  })

  const handleVerDetalhes = (id: string) => {
    navigate(`/curriculos/${id}`)
  }

  const getAreaLabel = (value: string) => {
    return AREAS_INTERESSE.find(a => a.value === value)?.label || value
  }

  const getDisponibilidadeLabel = (tipos: string[]) => {
    if (!tipos || tipos.length === 0) return 'Não informado'
    return tipos.map(t => DISPONIBILIDADE_TIPOS.find(d => d.value === t)?.label || t).join(', ')
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-900">Erro ao carregar currículos</h3>
          <p className="text-sm text-red-600">Tente novamente em instantes</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Banco de Currículos</h1>
          <p className="text-sm text-slate-500 mt-1">
            Encontre profissionais disponíveis para compor sua equipe
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="bg-white">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome, resumo ou habilidades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filtro por área */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setAreaFiltro(null)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                areaFiltro === null
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              Todas
            </button>
            {AREAS_INTERESSE.map((area) => (
              <button
                key={area.value}
                onClick={() => setAreaFiltro(area.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  areaFiltro === area.value
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {area.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Currículos */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-white">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !curriculos || curriculos.length === 0 ? (
        <Card className="bg-white">
          <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <FileUser className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900">Nenhum currículo encontrado</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md">
              {searchTerm || areaFiltro
                ? 'Não encontramos currículos com os filtros selecionados. Tente ajustar sua busca.'
                : 'Ainda não há currículos disponíveis no momento.'}
            </p>
            {(searchTerm || areaFiltro) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setAreaFiltro(null)
                }}
                className="mt-4"
              >
                Limpar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {curriculos.map((curriculo) => (
            <Card
              key={curriculo.id}
              className="bg-white hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => handleVerDetalhes(curriculo.id)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                      {curriculo.funcionarios?.nome_completo || 'Profissional'}
                    </h3>
                    {curriculo.funcionarios?.funcao && (
                      <p className="text-sm text-slate-500 truncate">
                        {curriculo.funcionarios.funcao}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-600 transition-colors flex-shrink-0" />
                </div>

                {curriculo.resumo_profissional && (
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {curriculo.resumo_profissional}
                  </p>
                )}

                {/* Áreas de interesse */}
                <div className="flex flex-wrap gap-1.5">
                  {curriculo.areas_interesse?.slice(0, 3).map((area) => (
                    <Badge key={area} variant="secondary" className="text-xs bg-indigo-50 text-indigo-700">
                      {getAreaLabel(area)}
                    </Badge>
                  ))}
                  {curriculo.areas_interesse && curriculo.areas_interesse.length > 3 && (
                    <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                      +{curriculo.areas_interesse.length - 3}
                    </Badge>
                  )}
                </div>

                {/* Disponibilidade */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="truncate">
                    {getDisponibilidadeLabel(curriculo.disponibilidade_tipo)}
                  </span>
                </div>

                {/* Pretensão salarial */}
                {curriculo.pretensao_salarial && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(curriculo.pretensao_salarial)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Resultado */}
      {!isLoading && curriculos && curriculos.length > 0 && (
        <div className="text-center text-sm text-slate-500">
          {curriculos.length} currículo{curriculos.length !== 1 ? 's' : ''} encontrado{curriculos.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
