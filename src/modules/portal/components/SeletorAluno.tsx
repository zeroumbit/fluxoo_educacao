import { usePortalContext } from '../context'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Users } from 'lucide-react'

export function SeletorAluno() {
  const { vinculos, alunoSelecionado, selecionarAluno } = usePortalContext()

  if (!vinculos || vinculos.length <= 1) return null

  return (
    <Card className="border-0 shadow-sm bg-indigo-50/50 mb-6">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
          <Users className="h-5 w-5 text-indigo-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-indigo-900 mb-1">Selecione o Aluno</h3>
          <Select
            value={alunoSelecionado?.id}
            onValueChange={(id) => {
              const vinculo = vinculos.find((v) => v.aluno?.id === id)
              if (vinculo) selecionarAluno(vinculo)
            }}
          >
            <SelectTrigger className="w-full bg-white border-indigo-200 focus:ring-indigo-500">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {vinculos.map((v) => (
                <SelectItem key={v.aluno.id} value={v.aluno.id}>
                  {v.aluno.nome_social || v.aluno.nome_completo}
                  {v.aluno.filial ? ` • ${v.aluno.filial.nome_unidade}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
