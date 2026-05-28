import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Loader2, Download, FileText, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { exportService } from '../export.service'
import type { ExportFormat } from '../export-registry'

interface ExportButtonProps {
  reportKey: string
  label?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'icon'
  formats?: ExportFormat[]
  filters?: Record<string, unknown>
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function ExportButton({
  reportKey,
  label = 'Exportar',
  variant = 'outline',
  size = 'sm',
  formats = ['csv', 'pdf'],
  filters,
  onSuccess,
  onError,
}: ExportButtonProps) {
  const { authUser } = useAuth()
  const [isExporting, setIsExporting] = useState<ExportFormat | null>(null)

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (!authUser) {
        toast.error('Usuário não autenticado.')
        return
      }

      setIsExporting(format)
      try {
        await exportService.execute({
          reportKey,
          format,
          authUser,
          filters,
        })
        toast.success(
          `Relatório exportado como ${format.toUpperCase()} com sucesso!`,
        )
        onSuccess?.()
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Erro ao exportar relatório.'
        toast.error(message)
        onError?.(error instanceof Error ? error : new Error(message))
      } finally {
        setIsExporting(null)
      }
    },
    [authUser, reportKey, filters, onSuccess, onError],
  )

  const isExportingAny = isExporting !== null

  const formatLabels: Record<ExportFormat, { label: string; icon: React.ElementType }> = {
    csv: { label: 'CSV', icon: FileText },
    xlsx: { label: 'XLSX', icon: FileSpreadsheet },
    pdf: { label: 'PDF', icon: FileText },
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={isExportingAny}
          className="gap-2"
        >
          {isExportingAny ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {size !== 'icon' && (isExportingAny ? 'Exportando...' : label)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Formato
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {formats.map((format) => {
          const Icon = formatLabels[format].icon
          return (
            <DropdownMenuItem
              key={format}
              onClick={() => handleExport(format)}
              disabled={isExportingAny}
              className="gap-3 cursor-pointer"
            >
              <Icon className="h-4 w-4 text-zinc-500" />
              <span className="text-sm font-medium">
                {formatLabels[format].label}
              </span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
