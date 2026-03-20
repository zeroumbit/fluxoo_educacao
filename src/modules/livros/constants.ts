export const CATEGORIAS_MATERIAIS = [
  'Papelaria',
  'Escrita',
  'Geometria',
  'Artes',
  'Didático',
  'Educação Física',
  'Laboratório',
  'Tecnologia',
  'Uniforme',
  'Higiene',
  'Outros'
] as const

export const SUBCATEGORIAS_POR_CATEGORIA: Record<string, string[]> = {
  'Papelaria': ['Cadernos', 'Folhas', 'Envelopes', 'Pastas', 'Agenda', 'Blocos'],
  'Escrita': ['Lápis', 'Canetas', 'Borrachas', 'Apontadores', 'Lapiseiras', 'Grafite', 'Marcadores', 'Gizes'],
  'Geometria': ['Réguas', 'Esquadros', 'Transferidores', 'Compassos', 'Gabaritos'],
  'Artes': ['Tintas', 'Pincéis', 'Papéis especiais', 'Argila', 'Giz de cera', 'Lápis de cor', 'Massinha'],
  'Didático': ['Livros', 'Apostilas', 'Dicionários', 'Atlas', 'Cadernos de atividades'],
  'Educação Física': ['Uniformes', 'Tênis', 'Equipamentos', 'Protetor solar', 'Garrafa de água'],
  'Laboratório': ['EPIs', 'Vidrarias', 'Reagentes', 'Luvas', 'Jalecos'],
  'Tecnologia': ['Tablets', 'Carregadores', 'Fones de ouvido', 'Pendrive', 'Mochila'],
}

export const UNIDADES_MEDIDA = [
  'unidade(s)',
  'pacote(s)',
  'caixa(s)',
  'metro(s)',
  'par(es)',
  'jogo(s)',
  'kit(s)',
  'folha(s)',
  'caderno(s)'
] as const

export const PERIODOS_USO = [
  'Início do ano',
  'Durante o ano',
  'Específico'
] as const

export const STATUS_MATERIAL = [
  'Ativo',
  'Indiferente',
  'Inativo',
  'Descontinuado',
  'Em breve'
] as const

export const OBRIGATORIEDADE_MATERIAL = [
  'Obrigatório',
  'Recomendado',
  'Opcional'
] as const
