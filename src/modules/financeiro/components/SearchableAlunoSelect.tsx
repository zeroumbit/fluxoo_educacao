import { Button } from '@/components/ui/button'
import { Command,CommandEmpty,CommandGroup,CommandInput,CommandItem,CommandList } from '@/components/ui/command'
import { Popover,PopoverContent,PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Check,ChevronsUpDown } from 'lucide-react'
import { useMemo,useState } from 'react'

interface ResponsavelInfo {
  nome: string
  cpf?: string | null
}

interface AlunoResponsavelItem {
  responsaveis?: ResponsavelInfo | null
}

interface AlunoData {
  id: string
  nome_completo: string
  cpf?: string | null
  aluno_responsavel?: AlunoResponsavelItem[] | null
}

interface SearchableAlunoSelectProps {
  alunos?: AlunoData[]
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  extraOptions?: { value: string; label: string }[]
}

export function SearchableAlunoSelect({
  alunos,
  value,
  onValueChange,
  disabled,
  placeholder = 'Selecione o aluno',
  extraOptions
}: SearchableAlunoSelectProps) {
  const [open, setOpen] = useState(false)

  const selectedLabel = useMemo(() => {
    if (!value) return null
    const extra = extraOptions?.find(o => o.value === value)
    if (extra) return extra.label
    const aluno = alunos?.find(a => a.id === value)
    return aluno?.nome_completo || null
  }, [alunos, extraOptions, value])

  const getSearchableValue = (aluno: AlunoData): string => {
    const responsaveis = aluno.aluno_responsavel
      ?.map(ar => [ar.responsaveis?.nome, ar.responsaveis?.cpf].filter(Boolean).join(' '))
      .filter(Boolean)
      .join(' ')
    return [aluno.nome_completo, aluno.cpf, responsaveis].filter(Boolean).join(' ')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between h-11 rounded-xl border-slate-200 bg-white font-normal"
        >
          <span className={cn('truncate', !selectedLabel && 'text-muted-foreground')}>
            {selectedLabel || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar por nome ou CPF..." />
          <CommandList>
            <CommandEmpty>Nenhum aluno encontrado.</CommandEmpty>
            <CommandGroup>
              {extraOptions?.map(opt => (
                <CommandItem
                  key={opt.value}
                  value={opt.value}
                  onSelect={() => {
                    onValueChange(opt.value)
                    setOpen(false)
                  }}
                >
                  <span>{opt.label}</span>
                  <Check className={cn('ml-auto h-4 w-4', value === opt.value ? 'opacity-100' : 'opacity-0')} />
                </CommandItem>
              ))}
              {alunos?.map(aluno => (
                <CommandItem
                  key={aluno.id}
                  value={getSearchableValue(aluno)}
                  onSelect={() => {
                    onValueChange(aluno.id)
                    setOpen(false)
                  }}
                >
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium truncate">{aluno.nome_completo}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {aluno.cpf && `CPF: ${aluno.cpf}`}
                      {aluno.aluno_responsavel?.some(r => r.responsaveis?.nome) && (
                        <> | Resp: {aluno.aluno_responsavel.filter(r => r.responsaveis?.nome).map(r => r.responsaveis!.nome).join(', ')}</>
                      )}
                    </span>
                  </div>
                  <Check className={cn('ml-auto h-4 w-4 shrink-0', value === aluno.id ? 'opacity-100' : 'opacity-0')} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
