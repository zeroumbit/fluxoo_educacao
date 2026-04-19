import { supabase } from '@/lib/supabase'
import type { Livro, MaterialEscolar, VwItemEscolar } from './types'

export const livrosService = {
  // LER DISCIPLINAS
  async listarDisciplinas(tenantId: string) {
    const { data, error } = await supabase
      .from('disciplinas' as any)
      .select('*')
      .eq('tenant_id', tenantId)
      .order('nome')

    if (error) throw error
    return data || []
  },

  // CRIAR DISCIPLINA
  async criarDisciplina(tenantId: string, nome: string) {
    const { data, error } = await supabase
      .from('disciplinas' as any)
      .insert({ tenant_id: tenantId, nome })
      .select()
      .single()

    if (error) throw error
    return true
  },

  async uploadCapa(file: File) {
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

  // LER LIVROS
  async listarLivros(tenantId: string): Promise<any[]> {
    // Busca livros e suas relacionadas, como as tabelas não estão tipadas no types, fazemos workaround
    const { data, error } = await supabase
      .from('livros' as any)
      .select(`
        *,
        disciplina:disciplinas(nome),
        livros_turmas( turma_id )
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Formata o resultado para a interface local Livro
    return (data || []).map((l: any) => ({
      ...l,
      turmas: (l.livros_turmas || []).map((lt: any) => ({ id: lt.turma_id }))
    }))
  },

  // CRIAR LIVRO
  async criarLivro(livro: Omit<Livro, 'id' | 'created_at' | 'updated_at' | 'disciplina' | 'turmas'>, turmasIds: string[]) {
    // Insere livro
    const result = await supabase
      .from('livros' as any)
      .insert(livro as any)
      .select()
      .single()
    const errLivro = result.error
    const novoLivro = result.data as any

    if (errLivro) throw errLivro

    // Insere ligações turmas
    if (turmasIds && turmasIds.length > 0) {
      const insertsTurmas = turmasIds.map((id) => ({
        livro_id: novoLivro.id,
        turma_id: id,
        tenant_id: livro.tenant_id
      }))
      const { error: errTurmas } = await supabase
        .from('livros_turmas' as any)
        .insert(insertsTurmas)

      if (errTurmas) throw errTurmas
    }

    return novoLivro
  },

  // EDITAR LIVRO
  async editarLivro(livroId: string, livro: Partial<Livro>, turmasIds: string[]) {
    const { error: errLivro } = await supabase
      .from('livros' as any)
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

    // Atualiza turmas - Remove antigas, insere novas
    await supabase.from('livros_turmas' as any).delete().eq('livro_id', livroId)

    if (turmasIds && turmasIds.length > 0) {
      const insertsTurmas = turmasIds.map((id) => ({
        livro_id: livroId,
        turma_id: id,
        tenant_id: livro.tenant_id
      }))
      const { error: errTurmas } = await supabase
        .from('livros_turmas' as any)
        .insert(insertsTurmas)

      if (errTurmas) throw errTurmas
    }
  },

  // EXCLUIR LIVRO
  async excluirLivro(livroId: string) {
    const { error } = await supabase
      .from('livros' as any)
      .delete()
      .eq('id', livroId)

    if (error) throw error
  },

  // --- MATERIAIS ESCOLARES ---

  async listarMateriais(tenantId: string): Promise<MaterialEscolar[]> {
    const { data, error } = await supabase
      .from('materiais_escolares' as any)
      .select(`
        *,
        disciplina:disciplinas(nome),
        materiais_turmas( turma_id )
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map((m: any) => ({
      ...m,
      turmas: (m.materiais_turmas || []).map((mt: any) => ({ id: mt.turma_id }))
    }))
  },

  async criarMaterial(material: Omit<MaterialEscolar, 'id' | 'created_at' | 'updated_at' | 'disciplina' | 'turmas'>, turmasIds: string[]) {
    const result = await supabase
      .from('materiais_escolares' as any)
      .insert(material as any)
      .select()
      .single()
    
    if (result.error) throw result.error
    const novoMaterial = result.data as any

    if (turmasIds && turmasIds.length > 0) {
      const insertsTurmas = turmasIds.map((id) => ({
        material_id: novoMaterial.id,
        turma_id: id,
        tenant_id: material.tenant_id
      }))
      const { error: errTurmas } = await supabase
        .from('materiais_turmas' as any)
        .insert(insertsTurmas)

      if (errTurmas) throw errTurmas
    }

    return novoMaterial
  },

  async editarMaterial(materialId: string, material: Partial<MaterialEscolar>, turmasIds: string[]) {
    const { error: errMaterial } = await supabase
      .from('materiais_escolares' as any)
      .update(material)
      .eq('id', materialId)

    if (errMaterial) throw errMaterial

    await supabase.from('materiais_turmas' as any).delete().eq('material_id', materialId)

    if (turmasIds && turmasIds.length > 0) {
      const insertsTurmas = turmasIds.map((id) => ({
        material_id: materialId,
        turma_id: id,
        tenant_id: material.tenant_id
      }))
      const { error: errTurmas } = await supabase
        .from('materiais_turmas' as any)
        .insert(insertsTurmas)

      if (errTurmas) throw errTurmas
    }
  },

  async excluirMaterial(materialId: string) {
    const { error } = await supabase
      .from('materiais_escolares' as any)
      .delete()
      .eq('id', materialId)

    if (error) throw error
  },

  async uploadImagemMaterial(file: File) {
    const fileExt = file.name.split('.').pop()
    const fileName = `material-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
    const filePath = `materiais/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('livros') // Reutilizando bucket de livros ou usar um novo se existir
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('livros')
      .getPublicUrl(filePath)

    return data.publicUrl
  },
}
