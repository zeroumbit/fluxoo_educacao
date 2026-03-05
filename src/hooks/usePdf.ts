import { useState, useCallback } from 'react'
import { pdf, type DocumentProps } from '@react-pdf/renderer'
import { toast } from 'sonner'

interface UsePdfOptions {
  filename?: string
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function usePdf(options: UsePdfOptions = {}) {
  const { filename = 'documento.pdf', onSuccess, onError } = options
  const [isGenerating, setIsGenerating] = useState(false)

  const generateAndDownload = useCallback(async (pdfDocument: React.ReactElement<DocumentProps>, customFilename?: string) => {
    try {
      setIsGenerating(true)

      // Gerar o blob do PDF
      const blob = await pdf(pdfDocument).toBlob()

      // Criar download
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = customFilename || filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('PDF gerado com sucesso!')
      onSuccess?.()
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast.error('Erro ao gerar PDF')
      onError?.(error as Error)
    } finally {
      setIsGenerating(false)
    }
  }, [filename, onSuccess, onError])

  const generateAndView = useCallback(async (pdfDocument: React.ReactElement<DocumentProps>) => {
    try {
      setIsGenerating(true)

      // Gerar o blob do PDF
      const blob = await pdf(pdfDocument).toBlob()

      // Abrir em nova aba
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      URL.revokeObjectURL(url)

      toast.success('PDF aberto em nova aba!')
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast.error('Erro ao gerar PDF')
      onError?.(error as Error)
    } finally {
      setIsGenerating(false)
    }
  }, [onError])

  return {
    isGenerating,
    generateAndDownload,
    generateAndView,
  }
}
