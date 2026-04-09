import { useState } from 'react'
import Papa, { type ParseResult } from 'papaparse'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/modules/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Upload, CheckCircle, FileDown, Loader2, ArrowLeft, FileUp } from 'lucide-react'

export function AlunosImportarPage() {
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const [data, setData] = useState<any[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [loteId] = useState(crypto.randomUUID())

  const baixarModeloCSV = () => {
    const headers = [
      'Nome Responsável', 'CPF Responsável', 'Email Responsável', 'Telefone Responsável',
      'Nome Aluno', 'Data Nascimento', 'Turma', 'Série', 'Mensalidade', 'Turno'
    ]
    const rows = [
      ['Exemplo Pai', '123.456.789-00', 'pai@email.com', '(11) 99999-9999', 'Exemplo Filho', '2015-05-20', '1º Ano A', 'EF1', '850.00', 'manha']
    ]
    
    const csvContent = Papa.unparse({ fields: headers, data: rows })
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', 'modelo_importacao_fluxoo.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: ParseResult<any>) => {
        if (results.errors.length > 0) {
          toast.error('Erro ao ler o arquivo CSV. Verifique o formato.')
          return
        }

        // Agrupamos por CPF do Responsável conforme solicitado pelo motor de staging
        const grouped = results.data.reduce((acc: any, row: any) => {
          const cpf = row['CPF Responsável']
          if (!cpf) return acc

          if (!acc[cpf]) {
            acc[cpf] = {
              responsavel: {
                nome: row['Nome Responsável'],
                cpf: cpf,
                email: row['Email Responsável'],
                telefone: row['Telefone Responsável']
              },
              alunos: []
            }
          }
          acc[cpf].alunos.push({
            nome_completo: row['Nome Aluno'],
            data_nascimento: row['Data Nascimento'],
            turma_nome: row['Turma'],
            serie: row['Série'],
            valor_mensalidade: parseFloat(row['Mensalidade']?.replace(',', '.') || '0')
          })
          return acc
        }, {})

        const finalData = Object.values(grouped)
        if (finalData.length === 0) {
          toast.error('Nenhum dado válido encontrado no arquivo.')
          return
        }

        setData(finalData)
        toast.success(`${results.data.length} registros lidos. ${finalData.length} famílias identificadas.`)
      }
    })
  }

  const handleProcessar = async () => {
    if (!authUser?.tenantId) {
      toast.error('Sessão inválida. Faça login novamente.')
      return
    }
    setIsUploading(true)

    try {
      // 1. Enviar para Staging Area
      const rowsToInsert = data.map(item => ({
        tenant_id: authUser.tenantId,
        lote_id: loteId,
        dados_agrupados: item,
        status: 'pendente'
      }))

      // Nota: A tabela e RPC foram criadas via Migration SQL anterior
      const { data: insertedRows, error: stagingError } = await supabase
        .from('importacoes_staging')
        .insert(rowsToInsert)
        .select('id')

      if (stagingError) throw stagingError

      const ids = insertedRows.map(r => r.id)

      // 2. Chamar RPC de Processamento Transacional
      const { data: result, error: rpcError } = await supabase.rpc('processar_lote_importacao', {
        p_lote_id: loteId,
        p_ids_selecionados: ids
      })

      if (rpcError) throw rpcError

      toast.success(`Importação finalizada! ${result.sucessos} sucessos e ${result.erros} falhas.`)
      
      if (result.erros > 0) {
         toast.warning('Alguns registros falharam. Verifique os dados no arquivo e tente novamente.')
      } else {
         navigate('/alunos')
      }
      
    } catch (error: any) {
      console.error('Erro na importação:', error)
      toast.error('Falha crítica no processamento: ' + error.message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/alunos')} size="icon" className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Importação em Massa</h1>
          <p className="text-slate-500 text-sm">Cadastre múltiplos alunos e responsáveis via arquivo CSV.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">1. Preparar Arquivo</CardTitle>
            <CardDescription>Use nosso modelo para garantir que os dados estejam no formato correto.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" onClick={baixarModeloCSV} className="w-full justify-start border-dashed">
              <FileDown className="w-4 h-4 mr-2 text-indigo-600" />
              Baixar Modelo .CSV
            </Button>
            
            <div className="pt-4 border-t border-slate-100">
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-white hover:border-indigo-400 transition-all border-slate-300">
                <div className="flex flex-col items-center justify-center p-4 text-center">
                  <FileUp className="w-8 h-8 mb-2 text-slate-400" />
                  <p className="text-sm font-medium text-slate-700">Clique para carregar</p>
                  <p className="text-xs text-slate-400 mt-1">Selecione o seu arquivo preenchido</p>
                </div>
                <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
              </label>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 shadow-md border-0 bg-white overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
            <div>
              <CardTitle className="text-lg">2. Pré-visualização dos Dados</CardTitle>
              <CardDescription>Revise as informações antes de salvar no banco de dados.</CardDescription>
            </div>
            {data.length > 0 && (
              <Button onClick={handleProcessar} disabled={isUploading} className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100">
                {isUploading ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : <CheckCircle className="mr-2 w-4 h-4" />}
                {isUploading ? 'Processando...' : 'Confirmar Importação'}
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {data.length === 0 ? (
              <div className="py-20 text-center">
                <Upload className="w-12 h-12 mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400">Nenhum dado carregado para visualização.</p>
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-white sticky top-0 shadow-sm z-10">
                    <TableRow>
                      <TableHead className="w-[250px]">Responsável</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Alunos e Turmas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((item, i) => (
                      <TableRow key={i} className="hover:bg-slate-50 transition-colors">
                        <TableCell>
                          <div className="font-bold text-slate-700">{item.responsavel.nome}</div>
                          <div className="text-xs text-slate-500">{item.responsavel.email}</div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-600">{item.responsavel.cpf}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {item.alunos.map((a: any, j: number) => (
                              <div key={j} className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-[10px] font-bold border border-indigo-100">
                                {a.nome_completo} • {a.turma_nome}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
