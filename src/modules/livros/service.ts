import { validateFileExtension } from '@/lib/validate-file'
import type { DisciplinaDb, DisciplinaDbInsert } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'
import type { Livro, MaterialEscolar } from './types'

type LivroInsert = Omit<Livro, 'id' | 'created_at' | 'updated_at' | 'disciplina' | 'turmas'>
type MaterialEscolarInsert = Omit<MaterialEscolar, 'id' | 'created_at' | 'updated_at' | 'disciplina' | 'turmas'>

type LivroRow = LivroInsert & {
  id: string
  created_at?: string
  updated_at?: string
}

type MaterialEscolarRow = MaterialEscolarInsert & {
  id: string
  created_at?: string
  updated_at?: string
}

type TurmaVinculo = { turma_id: string; tenant_id?: string | null }
type LivroComRelacionamentos = LivroRow & {
  disciplina: { nome: string } | null
  livros_turmas: TurmaVinculo[] | null
}
type MaterialComRelacionamentos = MaterialEscolarRow & {
  disciplina: { nome: string } | null
  materiais_turmas: TurmaVinculo[] | null
}
type LivroTurmaInsert = { livro_id: string; turma_id: string; tenant_id: string }
type MaterialTurmaInsert = { material_id: string; turma_id: string; tenant_id: string }

type QueryResult<T> = { data: T | null; error: unknown }
type QueryBuilder<T> = PromiseLike<QueryResult<T[]>> & {
  select(columns?: string): QueryBuilder<T>
  eq(column: string, value: unknown): QueryBuilder<T>
  order(column: string, options?: { ascending?: boolean }): QueryBuilder<T>
  insert(values: Partial<T> | Partial<T>[]): QueryBuilder<T>
  update(values: Partial<T>): QueryBuilder<T>
  delete(): QueryBuilder<T>
  single(): Promise<QueryResult<T>>
}

type LivrosLegacyClient = {
  from(table: 'livros'): QueryBuilder<LivroComRelacionamentos>
  from(table: 'livros_turmas'): QueryBuilder<LivroTurmaInsert>
  from(table: 'materiais_escolares'): QueryBuilder<MaterialComRelacionamentos>
  from(table: 'materiais_turmas'): QueryBuilder<MaterialTurmaInsert>
}

const livrosLegacyClient = supabase as unknown as LivrosLegacyClient

const mapTurmas = (vinculos: TurmaVinculo[] | null | undefined) =>
  (vinculos || []).map((vinculo) => ({ id: vinculo.turma_id, nome: '' }))

export const livrosService = {
  async listarDisciplinas(tenantId: string): Promise<DisciplinaDb[]> {
    const { data, error } = await supabase
      .from('disciplinas')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('nome')

    if (error) throw error
    return data || []
  },

  async criarDisciplina(tenantId: string, nome: string) {
    const insertPayload: DisciplinaDbInsert = { tenant_id: tenantId, nome }
    const { error } = await supabase
      .from('disciplinas')
      .insert(insertPayload)
      .select()
      .single()

    if (error) throw error
    return true
  },

  async uploadCapa(file: File) {
    const extResult = validateFileExtension(file, ['.jpg', '.jpeg', '.png', '.webp'])
    if (!extResult.valid) throw new Error(extResult.error)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
    const filePath = `capas/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('livros')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('livros')
      .getPublicUrl(filePath)

    return data.publicUrl
  },

  async listarLivros(tenantId: string): Promise<Livro[]> {
    const { data, error } = await livrosLegacyClient
      .from('livros')
      .select(`
        *,
        disciplina:disciplinas(nome),
        livros_turmas( turma_id )
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map((livro) => ({
      ...livro,
      disciplina: livro.disciplina || undefined,
      turmas: mapTurmas(livro.livros_turmas)
    }))
  },

  async criarLivro(livro: LivroInsert, turmasIds: string[]) {
    const result = await livrosLegacyClient
      .from('livros')
      .insert(livro)
      .select()
      .single()
    const errLivro = result.error
    const novoLivro = result.data

    if (errLivro) throw errLivro
    if (!novoLivro) throw new Error('Livro nao foi criado.')

    if (turmasIds.length > 0) {
      const insertsTurmas: LivroTurmaInsert[] = turmasIds.map((id) => ({
        livro_id: novoLivro.id,
        turma_id: id,
        tenant_id: livro.tenant_id
      }))
      const { error: errTurmas } = await livrosLegacyClient
        .from('livros_turmas')
        .insert(insertsTurmas)

      if (errTurmas) throw errTurmas
    }

    return novoLivro
  },

  async editarLivro(livroId: string, livro: Partial<Livro>, turmasIds: string[]) {
    const { error: errLivro } = await livrosLegacyClient
      .from('livros')
      .update({
        titulo: livro.titulo,
        autor: livro.autor,
        editora: livro.editora,
        disciplina_id: livro.disciplina_id,
        ano_letivo: livro.ano_letivo,
        descricao: livro.descricao,
        isbn: livro.isbn,
        estado: livro.estado,
        link_referencia: livro.link_referencia,
        capa_url: livro.capa_url,
      })
      .eq('id', livroId)

    if (errLivro) throw errLivro

    await livrosLegacyClient.from('livros_turmas').delete().eq('livro_id', livroId)

    if (turmasIds.length > 0 && livro.tenant_id) {
      const insertsTurmas: LivroTurmaInsert[] = turmasIds.map((id) => ({
        livro_id: livroId,
        turma_id: id,
        tenant_id: livro.tenant_id
      }))
      const { error: errTurmas } = await livrosLegacyClient
        .from('livros_turmas')
        .insert(insertsTurmas)

      if (errTurmas) throw errTurmas
    }
  },

  async excluirLivro(livroId: string) {
    const { error } = await livrosLegacyClient
      .from('livros')
      .delete()
      .eq('id', livroId)

    if (error) throw error
  },

  async listarMateriais(tenantId: string): Promise<MaterialEscolar[]> {
    const { data, error } = await livrosLegacyClient
      .from('materiais_escolares')
      .select(`
        *,
        disciplina:disciplinas(nome),
        materiais_turmas( turma_id )
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map((material) => ({
      ...material,
      disciplina: material.disciplina || undefined,
      turmas: mapTurmas(material.materiais_turmas)
    }))
  },

  async criarMaterial(material: MaterialEscolarInsert, turmasIds: string[]) {
    const result = await livrosLegacyClient
      .from('materiais_escolares')
      .insert(material)
      .select()
      .single()

    if (result.error) throw result.error
    const novoMaterial = result.data
    if (!novoMaterial) throw new Error('Material nao foi criado.')

    if (turmasIds.length > 0) {
      const insertsTurmas: MaterialTurmaInsert[] = turmasIds.map((id) => ({
        material_id: novoMaterial.id,
        turma_id: id,
        tenant_id: material.tenant_id
      }))
      const { error: errTurmas } = await livrosLegacyClient
        .from('materiais_turmas')
        .insert(insertsTurmas)

      if (errTurmas) throw errTurmas
    }

    return novoMaterial
  },

  async editarMaterial(materialId: string, material: Partial<MaterialEscolar>, turmasIds: string[]) {
    const { error: errMaterial } = await livrosLegacyClient
      .from('materiais_escolares')
      .update(material)
      .eq('id', materialId)

    if (errMaterial) throw errMaterial

    await livrosLegacyClient.from('materiais_turmas').delete().eq('material_id', materialId)

    if (turmasIds.length > 0 && material.tenant_id) {
      const insertsTurmas: MaterialTurmaInsert[] = turmasIds.map((id) => ({
        material_id: materialId,
        turma_id: id,
        tenant_id: material.tenant_id
      }))
      const { error: errTurmas } = await livrosLegacyClient
        .from('materiais_turmas')
        .insert(insertsTurmas)

      if (errTurmas) throw errTurmas
    }
  },

  async excluirMaterial(materialId: string) {
    const { error } = await livrosLegacyClient
      .from('materiais_escolares')
      .delete()
      .eq('id', materialId)

    if (error) throw error
  },

  async uploadImagemMaterial(file: File) {
    const fileExt = file.name.split('.').pop()
    const fileName = `material-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
    const filePath = `materiais/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('livros')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('livros')
      .getPublicUrl(filePath)

    return data.publicUrl
  },
}
