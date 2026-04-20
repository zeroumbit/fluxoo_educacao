import * as React from "react"
import { X, Check, ChevronsUpDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface Option {
  label: string
  value: string
  group?: string  // opcional: agrupa itens por categoria no dropdown
}

interface MultiSelectProps {
  options: Option[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Selecione as opções...",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleUnselect = (item: string) => {
    onChange(selected.filter((i) => i !== item))
  }

  const handleSelect = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((i) => i !== value)
        : [...selected, value]
    )
  }

  // Agrupa as opções por category (group) se informado
  const groupedOptions = React.useMemo(() => {
    const hasGroups = options.some(o => o.group)
    if (!hasGroups) return { '': options }

    return options.reduce<Record<string, Option[]>>((acc, opt) => {
      const key = opt.group || 'Outros'
      if (!acc[key]) acc[key] = []
      acc[key].push(opt)
      return acc
    }, {})
  }, [options])

  const groupKeys = Object.keys(groupedOptions)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between hover:bg-background h-auto min-h-[40px] py-2",
            className
          )}
        >
          <div className="flex gap-1 flex-wrap">
            {selected.length > 0 ? (
              selected.map((item) => (
                <Badge
                  variant="secondary"
                  key={item}
                  className="mr-1 mb-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleUnselect(item)
                  }}
                >
                  {options.find((o) => o.value === item)?.label || item}
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label="Remover"
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                    onKeyDown={(e) => { if (e.key === "Enter") handleUnselect(item) }}
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
                    onClick={(e) => { e.stopPropagation(); handleUnselect(item) }}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </span>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[9999]" align="start">
        <Command className="w-full">
          <CommandInput placeholder="Buscar..." />
          <CommandList className="max-h-72 overflow-y-auto">
            <CommandEmpty>Nenhuma opção encontrada.</CommandEmpty>

            {groupKeys.map((groupKey) => (
              <CommandGroup
                key={groupKey}
                heading={groupKey || undefined}
                className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-black [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-zinc-400 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:bg-zinc-50/80 [&_[cmdk-group-heading]]:border-t [&_[cmdk-group-heading]]:border-zinc-100"
              >
                {groupedOptions[groupKey].map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary shrink-0",
                        selected.includes(option.value)
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <Check className="h-4 w-4" />
                    </div>
                    <span className="text-sm">{option.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
