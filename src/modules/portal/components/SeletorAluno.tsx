import { usePortalContext } from '../context'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Users } from 'lucide-react'

export function SeletorAluno() {
  const { vinculos, alunoSelecionado, selecionarAluno } = usePortalContext()

  if (!vinculos || vinculos.length <= 1) return null

  return (
    <Card className="border border-[#E2E8F0] shadow-sm bg-white mb-6 overflow-hidden">
      <CardContent className="p-0 flex items-stretch gap-0">
        <div className="w-1.5 bg-[#14B8A6] shrink-0" />
        <div className="p-4 flex items-center gap-5 flex-1">
          <div className="h-10 w-10 rounded-xl bg-[#CCFBF1] flex items-center justify-center shrink-0 border border-teal-100 shadow-sm">
            <Users className="h-5 w-5 text-[#14B8A6]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#64748B] mb-2 ml-1">Alternar Perfil do Aluno</h3>
            <Select
              value={alunoSelecionado?.id}
              onValueChange={(id) => {
                const vinculo = vinculos.find((v) => v.aluno?.id === id)
                if (vinculo) selecionarAluno(vinculo)
              }}
            >
              <SelectTrigger className="w-full bg-slate-50 border-slate-100 focus:ring-[#14B8A6] h-11 font-bold text-[#1E293B] rounded-xl">
                <SelectValue placeholder="Selecione um aluno..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                {vinculos.map((v) => (
                  <SelectItem key={v.aluno.id} value={v.aluno.id} className="font-medium text-slate-700 focus:bg-teal-50 focus:text-[#134E4A]">
                    {v.aluno.nome_social || v.aluno.nome_completo}
                    {v.aluno.filial ? <span className="text-[10px] text-slate-400 font-bold ml-2">[{v.aluno.filial.nome_unidade}]</span> : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
