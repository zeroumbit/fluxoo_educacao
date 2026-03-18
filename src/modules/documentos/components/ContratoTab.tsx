import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/modules/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Save, FileText, Eye, EyeOff, LayoutPanelLeft, Download, Printer } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import DOMPurify from 'dompurify'

const CONTRATO_PADRAO = `
<div class="contract-container">
  <div style="text-align: center; margin-bottom: 2em;">
    <h1 style="font-size: 1.5em; font-weight: bold; text-transform: uppercase;">TERMO DE CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS</h1>
    <h2 style="font-size: 1.25em; font-weight: bold;">Documento Padrão para Aceite Eletrônico</h2>
  </div>

  <h3 style="font-size: 1.1em; font-weight: bold; margin-bottom: 0.5em;">PREÂMBULO</h3>
  <p><strong>Este é um documento padrão da ESCOLA {{escola_nome}}, inscrita no CNPJ sob o nº {{escola_cnpj}}, com sede na {{escola_endereco}}, doravante denominada simplesmente ESCOLA.</strong></p>

  <p><strong>AO ACEITAR ESTE TERMO, O RESPONSÁVEL LEGAL:</strong></p>
  <ul>
    <li>Declara ter lido e compreendido todas as cláusulas e condições abaixo;</li>
    <li>Reconhece que este contrato se aplica a si, na qualidade de responsável financeiro e legal;</li>
    <li>Reconhece que este contrato se aplica ao aluno sob sua responsabilidade que estiver matriculado;</li>
    <li>Concorda integralmente com os termos aqui estabelecidos;</li>
    <li>Está ciente de que este documento tem validade jurídica para todos os fins de direito.</li>
  </ul>

  <p><strong>A ACEITAÇÃO DESTE TERMO VINCULA:</strong></p>
  <ul>
    <li>O Responsável Legal que realizou o aceite;</li>
    <li>O Aluno beneficiário dos serviços educacionais;</li>
    <li>Todos os dados cadastrais fornecidos no momento da matrícula;</li>
    <li>Todas as comunicações futuras entre as partes.</li>
  </ul>

  <h2 style="font-size: 1.25em; font-weight: bold; margin-top: 1.5em; margin-bottom: 0.5em; border-bottom: 1px solid #eee;">CLÁUSULA 1ª – DO OBJETO E ABRANGÊNCIA</h2>
  <p><strong>1.1</strong> O presente instrumento tem por objeto a prestação de serviços educacionais pela ESCOLA ao ALUNO indicado no ato da matrícula, para o ano letivo correspondente, de acordo com a proposta pedagógica da instituição e a legislação de ensino aplicável.</p>
  <p><strong>1.2</strong> Ao aceitar este termo, o RESPONSÁVEL assume todas as obrigações financeiras, legais e de acompanhamento escolar previstas neste contrato, em nome próprio e em nome do ALUNO, que é o beneficiário dos serviços.</p>
  <p><strong>1.3</strong> A vigência deste contrato inicia-se na data do aceite eletrônico e estende-se por todo o período letivo em que o ALUNO permanecer matriculado, renovando-se automaticamente para os anos letivos subsequentes, mediante nova aceitação ou na forma prevista em legislação específica.</p>

  <h2 style="font-size: 1.25em; font-weight: bold; margin-top: 1.5em; margin-bottom: 0.5em; border-bottom: 1px solid #eee;">CLÁUSULA 2ª – DA BASE LEGAL E DOCUMENTOS INTEGRANTES</h2>
  <p><strong>2.1</strong> Este contrato rege-se pelas seguintes legislações: Lei nº 8.069/1990 (Estatuto da Criança e do Adolescente), Lei nº 8.078/1990 (Código de Defesa do Consumidor), Lei nº 9.394/1996 (Lei de Diretrizes e Bases da Educação), Lei nº 9.870/1999 (Anuidades Escolares), Lei nº 13.146/2015 (Lei Brasileira de Inclusão), Lei nº 13.709/2018 (Lei Geral de Proteção de Dados - LGPD) e demais normas aplicáveis à educação no Brasil.</p>
  <p><strong>2.2</strong> Integram este contrato, como se aqui estivessem transcritos, os seguintes documentos, disponíveis para consulta no site da ESCOLA ou na secretaria: a) Projeto Político-Pedagógico (PPP); b) Regimento Escolar; c) Manual do Aluno / Manual da Família; d) Tabela de valores e condições de pagamento vigentes; e) Política de Privacidade (LGPD).</p>
  <p><strong>2.3</strong> O RESPONSÁVEL declara ter pleno conhecimento e aceitar integralmente o conteúdo de todos os documentos mencionados, sendo seu dever consultá-los sempre que necessário.</p>

  <h2 style="font-size: 1.25em; font-weight: bold; margin-top: 1.5em; margin-bottom: 0.5em; border-bottom: 1px solid #eee;">CLÁUSULA 3ª – DAS OBRIGAÇÕES DA ESCOLA</h2>
  <p><strong>3.1</strong> Constituem obrigações da ESCOLA: a) Oferecer ensino de qualidade alinhado ao seu Projeto Político-Pedagógico; b) Disponibilizar infraestrutura, materiais e recursos didáticos adequados; c) Manter corpo docente e equipe técnico-administrativa habilitados; d) Garantir ambiente escolar seguro, saudável e inclusivo; e) Comunicar às famílias sobre o desenvolvimento acadêmico, frequência e comportamento do ALUNO; f) Utilizar os canais oficiais (aplicativo, e-mail, agenda) para comunicação; g) Proteger os dados pessoais nos termos da LGPD.</p>

  <h2 style="font-size: 1.25em; font-weight: bold; margin-top: 1.5em; margin-bottom: 0.5em; border-bottom: 1px solid #eee;">CLÁUSULA 4ª – DAS OBRIGAÇÕES DO RESPONSÁVEL</h2>
  <p><strong>4.1</strong> Ao aceitar este termo, o RESPONSÁVEL assume, em caráter irretratável, as seguintes obrigações: a) Efetuar pontualmente o pagamento de todos os valores devidos; b) Manter seus dados cadastrais sempre atualizados; c) Acompanhar a vida escolar do ALUNO, comparecendo às reuniões quando convocado; d) Responsabilizar-se civilmente por atos do ALUNO que causem danos à ESCOLA ou a terceiros; e) Comunicar previamente à ESCOLA qualquer condição de saúde ou necessidade específica do ALUNO; f) Garantir que o ALUNO cumpra as normas disciplinares previstas no Regimento e Manual; g) Respeitar e fazer respeitar os princípios de convivência ética, inclusive no ambiente digital.</p>
  <p><strong>4.2</strong> O descumprimento de qualquer das obrigações acima poderá acarretar as sanções previstas neste contrato e na legislação aplicável.</p>

  <h2 style="font-size: 1.25em; font-weight: bold; margin-top: 1.5em; margin-bottom: 0.5em; border-bottom: 1px solid #eee;">CLÁUSULA 5ª – DOS VALORES E CONDIÇÕES DE PAGAMENTO</h2>
  <p><strong>5.1</strong> O RESPONSÁVEL declara ciência e aceitação dos valores constantes na tabela vigente no momento da matrícula, que prevê taxa de matrícula, mensalidades escolares, materiais didáticos e atividades extracurriculares contratadas.</p>
  <p><strong>5.2</strong> Os valores serão pagos nas condições e prazos estabelecidos, através de boleto bancário, cartão de crédito ou outra forma disponibilizada pela ESCOLA.</p>
  <p><strong>5.3</strong> Em caso de atraso, incidirão: Multa de 2% (dois por cento), juros de mora de 1% (um por cento) ao mês e correção monetária por índice legal.</p>
  <p><strong>5.4</strong> A inadimplência não autoriza a suspensão de provas ou retenção de documentos escolares, conforme vedação legal, mas os valores poderão ser cobrados judicial ou extrajudicialmente.</p>

  <h2 style="font-size: 1.25em; font-weight: bold; margin-top: 1.5em; margin-bottom: 0.5em; border-bottom: 1px solid #eee;">CLÁUSULA 6ª – DA INCLUSÃO E ATENDIMENTO ESPECIALIZADO</h2>
  <p><strong>6.1</strong> A ESCOLA assegura vaga e atendimento educacional ao ALUNO com deficiência, transtornos globais, altas habilidades ou outras necessidades específicas, nos termos da Lei 13.146/15.</p>
  <p><strong>6.2</strong> Para viabilizar o adequado suporte, o RESPONSÁVEL DEVE: a) Apresentar laudos e relatórios atualizados no ato da matrícula ou assim que obtidos; b) Manter a ESCOLA informada sobre acompanhamentos terapêuticos externos; c) Autorizar a comunicação entre profissionais, quando necessário.</p>
  <p><strong>6.3</strong> O Atendimento Educacional Especializado (AEE) e adaptações curriculares necessárias serão oferecidos sem custo adicional.</p>

  <h2 style="font-size: 1.25em; font-weight: bold; margin-top: 1.5em; margin-bottom: 0.5em; border-bottom: 1px solid #eee;">CLÁUSULA 7ª – DA COMUNICAÇÃO E USO DE IMAGEM</h2>
  <p><strong>7.1</strong> Os canais oficiais de comunicação (aplicativo, e-mail, agenda) são considerados meios legítimos para envio de comunicados pedagógicos, administrativos e financeiros.</p>
  <p><strong>7.3</strong> O uso de imagem, voz ou nome do ALUNO em materiais institucionais dependerá de autorização específica, manifestada em campo próprio no ato da matrícula, podendo ser revogada a qualquer tempo.</p>

  <h2 style="font-size: 1.25em; font-weight: bold; margin-top: 1.5em; margin-bottom: 0.5em; border-bottom: 1px solid #eee;">CLÁUSULA 8ª – DA PROTEÇÃO DE DADOS (LGPD)</h2>
  <p><strong>8.1</strong> Os dados pessoais fornecidos pelo RESPONSÁVEL e pelo ALUNO serão tratados pela ESCOLA exclusivamente para execução do contrato, cumprimento de obrigações legais, comunicação institucional e atividades pedagógicas.</p>
  <p><strong>8.4</strong> Ao aceitar este termo, o RESPONSÁVEL consente com o tratamento dos dados nos termos aqui previstos.</p>

  <h2 style="font-size: 1.25em; font-weight: bold; margin-top: 1.5em; margin-bottom: 0.5em; border-bottom: 1px solid #eee;">CLÁUSULA 9ª – DA RESCISÃO E CANCELAMENTO</h2>
  <p><strong>9.1</strong> O RESPONSÁVEL poderá rescindir este contrato a qualquer momento, mediante comunicação formal por escrito à ESCOLA, com antecedência mínima de 30 (trinta) dias.</p>
  <p><strong>9.2</strong> Em caso de desistência ou transferência durante o período letivo, será devida multa rescisória de 10% (dez por cento) sobre o valor total das parcelas vincendas, em razão da ocupação da vaga.</p>

  <h2 style="font-size: 1.25em; font-weight: bold; margin-top: 1.5em; margin-bottom: 0.5em; border-bottom: 1px solid #eee;">CLÁUSULA 10ª – DAS DISPOSIÇÕES GERAIS</h2>
  <p><strong>10.4</strong> O RESPONSÁVEL declara estar ciente de que o aceite eletrônico tem a mesma validade jurídica da assinatura física, nos termos da legislação aplicável.</p>

  <h2 style="font-size: 1.25em; font-weight: bold; margin-top: 1.5em; margin-bottom: 0.5em; border-bottom: 1px solid #eee;">CLÁUSULA 11ª – DO FORO</h2>
  <p><strong>11.1</strong> Fica eleito o foro da comarca de {{cidade}} - {{estado}} para dirimir quaisquer controvérsias decorrentes deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.</p>

  <div style="margin-top: 3em; padding: 2em; background: #fafafa; border: 1px solid #eee; border-radius: 12px;">
    <h3 style="font-size: 1.1em; font-weight: bold; margin-bottom: 1em;">ACEITE ELETRÔNICO</h3>
    <p><strong>Ao clicar em "ACEITAR", "CONCORDAR" ou realizar o pagamento da matrícula/rematrícula, o RESPONSÁVEL LEGAL:</strong></p>
    <p>✓ Declara ter lido, compreendido e aceitado integralmente todas as cláusulas e condições deste Termo de Contrato de Prestação de Serviços Educacionais;<br>
    ✓ Reconhece que este documento se aplica a si e ao ALUNO sob sua responsabilidade;<br>
    ✓ Concorda com o tratamento de seus dados pessoais e do ALUNO nos termos da Política de Privacidade da ESCOLA;<br>
    ✓ Constitui-se como responsável financeiro e legal por todas as obrigações aqui previstas;<br>
    ✓ Está ciente de que este aceite tem validade jurídica e produz efeitos legais imediatos.</p>
    
    <div style="margin-top: 1.5em; font-size: 0.8em; color: #666;">
        <p><strong>Data e hora do aceite:</strong> [Registrado automaticamente pelo sistema]</p>
        <p><strong>IP do aceite:</strong> [Registrado automaticamente pelo sistema]</p>
        <p><strong>Identificador único da transação:</strong> [Gerado automaticamente pelo sistema]</p>
    </div>
  </div>
</div>
`.trim()

export function ContratoTab() {
  const { authUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [contrato, setContrato] = useState(CONTRATO_PADRAO)
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    async function loadConfig() {
      if (!authUser?.tenantId) return
      
      try {
        setLoading(true)
        
        // Busca dados da escola para processar o contrato
        const { data: school } = await supabase.from('escolas').select('*').eq('id', authUser.tenantId).maybeSingle()
        
        const { data, error } = await supabase
          .from('config_financeira' as any)
          .select('contrato_modelo')
          .eq('tenant_id', authUser.tenantId)
          .maybeSingle() as any

        let textoFinal = data?.contrato_modelo || CONTRATO_PADRAO

        // Substituição automática para usuários leigos verem os dados reais já no editor
        const replacements: Record<string, string> = {
            '{{escola_nome}}': school?.razao_social || '',
            '{{escola_cnpj}}': school?.cnpj || '',
            '{{escola_endereco}}': school ? `${school.logradouro}, ${school.numero} - ${school.bairro}` : '',
            '{{cidade}}': school?.cidade || '',
            '{{estado}}': school?.estado || '',
        }

        Object.entries(replacements).forEach(([tag, value]) => {
          textoFinal = textoFinal.replace(new RegExp(tag, 'g'), value)
        })

        setContrato(textoFinal)
      } catch (err) {
        console.error('Erro ao carregar contrato:', err)
      } finally {
        setLoading(false)
      }
    }

    loadConfig()
  }, [authUser?.tenantId])

  const handleSave = async () => {
    if (!authUser?.tenantId) return
    
    setSaving(true)
    try {
      const { error } = await supabase
        .from('config_financeira' as any)
        .update({ contrato_modelo: contrato } as any)
        .eq('tenant_id', authUser.tenantId)

      if (error) throw error
      toast.success('Contrato atualizado com sucesso!')
    } catch (err) {
      console.error('Erro ao salvar contrato:', err)
      toast.error('Erro ao salvar contrato.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 uppercase">Modelo do Contrato</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Este texto será apresentado para aceite eletrônico dos responsáveis nas matrículas.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={() => setPreviewMode(!previewMode)}
            className="flex-1 md:flex-none border-slate-100 rounded-xl h-11 font-bold"
          >
            {previewMode ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
            {previewMode ? 'Sair da Prévia' : 'Visualizar'}
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100/50 rounded-xl h-11 font-bold"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Contrato
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
        {/* Editor Side */}
        <div className={cn(
          "transition-all duration-500",
          previewMode ? "lg:col-span-5" : "lg:col-span-12"
        )}>
          <Card className="border-slate-100 shadow-sm overflow-hidden rounded-[32px]">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
               <div className="flex items-center gap-2">
                 <FileText className="h-4 w-4 text-indigo-600" />
                 <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Editor Visual do Contrato</CardTitle>
               </div>
            </CardHeader>
            <CardContent className="p-0">
              <RichTextEditor
                value={contrato}
                onChange={setContrato}
                className="border-none rounded-none min-h-[600px]"
              />
            </CardContent>
          </Card>
        </div>

        {/* Preview Side */}
        {previewMode && (
          <div className="lg:col-span-7 animate-in fade-in slide-in-from-right-4 duration-500">
            <Card className="border-indigo-100 shadow-xl overflow-hidden min-h-full rounded-[32px]">
               <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100 py-4 flex flex-row items-center justify-between">
                 <div className="flex items-center gap-2">
                   <LayoutPanelLeft className="h-4 w-4 text-indigo-600" />
                   <CardTitle className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Visualização do Responsável</CardTitle>
                 </div>
                 <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white shadow-sm border border-indigo-100"><Printer className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white shadow-sm border border-indigo-100"><Download className="h-3 w-3" /></Button>
                 </div>
               </CardHeader>
                <CardContent className="p-0 overflow-y-auto max-h-[800px] bg-white">
                  <div 
                    className="contract-review-preview font-serif text-zinc-800 leading-[1.4] p-12 text-base bg-white"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contrato) }}
                  />
                  <style dangerouslySetInnerHTML={{ __html: `
                    .contract-review-preview p { margin-bottom: 0.5em; }
                    .contract-review-preview h1 { font-size: 1.5em; font-weight: bold; margin-bottom: 0.8em; margin-top: 1em; line-height: 1.2; text-align: center; text-transform: uppercase; }
                    .contract-review-preview h2 { font-size: 1.25em; font-weight: bold; margin-bottom: 0.6em; margin-top: 0.8em; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.2em; }
                    .contract-review-preview h3 { font-size: 1.1em; font-weight: bold; margin-bottom: 0.4em; }
                    .contract-review-preview ul, .contract-review-preview ol { margin-bottom: 1em; padding-left: 1.5em; }
                  `}} />
                </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
