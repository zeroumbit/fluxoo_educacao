import { useParams, useNavigate } from 'react-router-dom'
import { useCurriculo } from '../hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  Clock,
  DollarSign,
  FileText,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { AREAS_INTERESSE, DISPONIBILIDADE_TIPOS } from '../types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function CurriculoDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: curriculo, isLoading, error } = useCurriculo(id || '')

  const getAreaLabel = (value: string) => {
    return AREAS_INTERESSE.find(a => a.value === value)?.label || value
  }

  const getDisponibilidadeLabel = (valor: string) => {
    return DISPONIBILIDADE_TIPOS.find(d => d.value === valor)?.label || valor
  }

  const getNivelFormacaoLabel = (nivel: string) => {
    const niveis: Record<string, string> = {
      fundamental: 'Ensino Fundamental',
      medio: 'Ensino Médio',
      tecnico: 'Ensino Técnico',
      superior: 'Ensino Superior',
      pos_graduacao: 'Pós-Graduação',
      mestrado: 'Mestrado',
      doutorado: 'Doutorado',
    }
    return niveis[nivel] || nivel
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/curriculos')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>
        <Card className="bg-white">
          <CardContent className="p-6 space-y-4">
            <div className="h-6 w-3/4 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-slate-200 rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !curriculo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-900">Currículo não encontrado</h3>
          <p className="text-sm text-red-600">Este currículo pode ter sido removido.</p>
        </div>
        <Button onClick={() => navigate('/curriculos')} className="mt-4">
          Voltar para lista
        </Button>
      </div>
    )
  }

  const nomeProfissional = curriculo.funcionarios?.nome_completo || 'Profissional'
  const emailContato = curriculo.usuarios_sistema?.email_login || ''

  return (
    <div className="space-y-6">
      {/* Cabeçalho com botão voltar */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/curriculos')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-slate-900">Detalhes do Currículo</h1>
      </div>

      {/* Card principal */}
      <Card className="bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
                {nomeProfissional.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {nomeProfissional}
                </h2>
                {curriculo.funcionarios?.funcao && (
                  <p className="text-sm text-slate-500">{curriculo.funcionarios.funcao}</p>
                )}
                {emailContato && (
                  <div className="flex items-center gap-1 mt-2 text-sm text-slate-500">
                    <Mail className="h-4 w-4" />
                    <span>{emailContato}</span>
                  </div>
                )}
              </div>
            </div>
            <Badge className={curriculo.is_ativo ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}>
              {curriculo.is_ativo ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Ativo
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Inativo
                </>
              )}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Informações principais */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Áreas de Interesse */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Briefcase className="h-4 w-4" />
                Áreas de Interesse
              </div>
              <div className="flex flex-wrap gap-1.5">
                {curriculo.areas_interesse?.map((area) => (
                  <Badge key={area} variant="secondary" className="bg-indigo-50 text-indigo-700">
                    {getAreaLabel(area)}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Disponibilidade */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Clock className="h-4 w-4" />
                Disponibilidade
              </div>
              <div className="flex flex-wrap gap-1.5">
                {curriculo.disponibilidade_tipo?.map((tipo) => (
                  <Badge key={tipo} variant="outline" className="text-slate-600">
                    {getDisponibilidadeLabel(tipo)}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Pretensão Salarial */}
            {curriculo.pretensao_salarial && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <DollarSign className="h-4 w-4" />
                  Pretensão Salarial
                </div>
                <p className="text-sm text-slate-600">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(curriculo.pretensao_salarial)}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Resumo Profissional */}
          {curriculo.resumo_profissional && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <FileText className="h-4 w-4" />
                Resumo Profissional
              </div>
              <p className="text-sm text-slate-600 whitespace-pre-line">
                {curriculo.resumo_profissional}
              </p>
            </div>
          )}

          {/* Formação Acadêmica */}
          {curriculo.formacao && curriculo.formacao.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <GraduationCap className="h-4 w-4" />
                  Formação Acadêmica
                </div>
                <div className="space-y-3">
                  {curriculo.formacao.map((form, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <GraduationCap className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {getNivelFormacaoLabel(form.nivel)} - {form.area}
                        </p>
                        <p className="text-sm text-slate-600">{form.instituicao}</p>
                        <p className="text-xs text-slate-500">Conclusão: {form.ano_conclusao}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Experiência Profissional */}
          {curriculo.experiencia && curriculo.experiencia.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Briefcase className="h-4 w-4" />
                  Experiência Profissional
                </div>
                <div className="space-y-3">
                  {curriculo.experiencia.map((exp, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <Briefcase className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{exp.cargo}</p>
                        <p className="text-sm text-slate-600">{exp.empresa}</p>
                        <p className="text-xs text-slate-500">{exp.periodo}</p>
                        {exp.atividades && (
                          <p className="text-xs text-slate-500 mt-1">{exp.atividades}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Habilidades */}
          {curriculo.habilidades && curriculo.habilidades.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Award className="h-4 w-4" />
                  Habilidades
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {curriculo.habilidades.map((habilidade) => (
                    <Badge key={habilidade} variant="outline" className="text-slate-600">
                      {habilidade}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Certificações */}
          {curriculo.certificacoes && curriculo.certificacoes.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Award className="h-4 w-4" />
                  Certificações
                </div>
                <div className="space-y-3">
                  {curriculo.certificacoes.map((cert, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <Award className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{cert.nome}</p>
                        <p className="text-sm text-slate-600">{cert.instituicao}</p>
                        <p className="text-xs text-slate-500">
                          Ano: {cert.ano}
                          {cert.carga_horaria && ` • ${cert.carga_horaria}h`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Observações */}
          {curriculo.observacoes && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FileText className="h-4 w-4" />
                  Observações
                </div>
                <p className="text-sm text-slate-600 whitespace-pre-line">
                  {curriculo.observacoes}
                </p>
              </div>
            </>
          )}

          {/* Informações de cadastro */}
          <Separator />
          <div className="text-xs text-slate-400">
            <p>Cadastrado em: {format(new Date(curriculo.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
            <p>Atualizado em: {format(new Date(curriculo.updated_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
          </div>
        </CardContent>

        {/* Ações */}
        <div className="p-6 pt-0 flex gap-3">
          <Button 
            className="flex-1" 
            onClick={() => emailContato && window.open(`mailto:${emailContato}`)}
            disabled={!emailContato}
          >
            <Mail className="h-4 w-4 mr-2" />
            Entrar em Contato
          </Button>
          <Button variant="outline" onClick={() => navigate('/curriculos')}>
            Voltar
          </Button>
        </div>
      </Card>
    </div>
  )
}
