import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { logger } from '@/lib/logger';
import {
  User, MapPin, Activity, Save, Camera,
  Loader2, Plus, X, Trash2, RefreshCw, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { usePortalContext } from '../../context';
import { useUpdateAlunoPortal } from '../../hooks';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const alunoCadastroSchema = z.object({
  nome_social: z.string().optional().nullable(),
  genero: z.string().optional().nullable(),
  cep: z.string().optional().nullable(),
  logradouro: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
  complemento: z.string().optional().nullable(),
  bairro: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  estado: z.string().optional().nullable(),
  patologias: z.array(z.string()).default([]),
  medicamentos: z.array(z.string()).default([]),
  observacoes_saude: z.string().optional().nullable(),
});

type AlunoCadastroForm = z.infer<typeof alunoCadastroSchema>;

export function PortalAlunoCadastroV2() {
  const { alunoSelecionado, responsavel, refreshData } = usePortalContext();
  const [activeTab, setActiveTab] = useState<'pessoal' | 'endereco' | 'saude'>('pessoal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeletePhotoDialog, setShowDeletePhotoDialog] = useState(false);
  const mutation = useUpdateAlunoPortal();

  const [newPatologia, setNewPatologia] = useState('');
  const [newMedicamento, setNewMedicamento] = useState('');

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<AlunoCadastroForm>({
    resolver: zodResolver(alunoCadastroSchema),
  });

  // 1. SINCRONIZAÇÃO ROBUSTA (Garante que Saúde apareça mesmo se o banco vir estranho)
  useEffect(() => {
    if (alunoSelecionado) {
      logger.debug('DEBUG PORTAL: Carregando aluno:', alunoSelecionado);
      reset({
        nome_social: alunoSelecionado.nome_social || '',
        genero: alunoSelecionado.genero || '',
        cep: alunoSelecionado.cep || '',
        logradouro: alunoSelecionado.logradouro || '',
        numero: alunoSelecionado.numero || '',
        complemento: alunoSelecionado.complemento || '',
        bairro: alunoSelecionado.bairro || '',
        cidade: alunoSelecionado.cidade || '',
        estado: alunoSelecionado.estado || '',
        // Força conversão para Array se vier nulo ou string
        patologias: Array.isArray(alunoSelecionado.patologias) ? alunoSelecionado.patologias : [],
        medicamentos: Array.isArray(alunoSelecionado.medicamentos) ? alunoSelecionado.medicamentos : [],
        observacoes_saude: alunoSelecionado.observacoes_saude || '',
      });
    }
  }, [alunoSelecionado, reset]);

  const patologias = watch('patologias') || [];
  const medicamentos = watch('medicamentos') || [];

  const addPatologia = () => {
    if (newPatologia.trim() && !patologias.includes(newPatologia.trim())) {
      setValue('patologias', [...patologias, newPatologia.trim()]);
      setNewPatologia('');
    }
  };

  const removePatologia = (item: string) => setValue('patologias', patologias.filter(i => i !== item));

  const addMedicamento = () => {
    if (newMedicamento.trim() && !medicamentos.includes(newMedicamento.trim())) {
      setValue('medicamentos', [...medicamentos, newMedicamento.trim()]);
      setNewMedicamento('');
    }
  };

  const removeMedicamento = (item: string) => setValue('medicamentos', medicamentos.filter(i => i !== item));

  // 2. GESTÃO DE FOTO (Upload / Troca / Deleção)
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !alunoSelecionado) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem válida.');
      return;
    }
    
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${alunoSelecionado.id}_${Date.now()}.${fileExt}`;
      const filePath = `alunos/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('alunos_fotos').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('alunos_fotos').getPublicUrl(filePath);

      await mutation.mutateAsync({
        alunoId: alunoSelecionado.id,
        responsavelId: responsavel.id,
        dados: { foto_url: publicUrl }
      });

      toast.success('Foto atualizada!');
      await refreshData();
    } catch (err: any) {
      toast.error('Erro ao subir foto: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!alunoSelecionado) return;

    setIsUploading(true);
    try {
      // 1. Limpar no banco
      await mutation.mutateAsync({
        alunoId: alunoSelecionado.id,
        responsavelId: responsavel!.id,
        dados: { foto_url: null }
      });

      toast.success('Foto removida!');
      await refreshData();
      setShowDeletePhotoDialog(false);
    } catch (err: any) {
      toast.error('Erro ao remover foto.');
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: AlunoCadastroForm) => {
    if (!alunoSelecionado || !responsavel) return;

    setIsSubmitting(true);
    try {
      await mutation.mutateAsync({
        alunoId: alunoSelecionado.id,
        responsavelId: responsavel.id,
        dados: data
      });
      toast.success('Dados salvos com sucesso!');
      await refreshData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar dados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Abas Superiores */}
      <div className="flex border-b border-slate-100 bg-slate-50/50">
        {[
          { id: 'pessoal', label: 'Dados Pessoais', icon: User },
          { id: 'endereco', label: 'Endereço', icon: MapPin },
          { id: 'saude', label: 'Saúde', icon: Activity },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all ${activeTab === tab.id ? 'text-teal-600 bg-white border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'pessoal' && (
            <motion.div key="pessoal" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-6">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Foto 3x4 com Gestão Completa */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    <div className="w-32 h-40 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shadow-inner group-hover:border-teal-400 transition-colors">
                      {isUploading ? (
                        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                      ) : alunoSelecionado?.foto_url ? (
                        <img src={alunoSelecionado.foto_url} alt="Foto Aluno" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-10 h-10 text-slate-300" />
                      )}
                    </div>
                    
                    {/* Botões de Ação na Foto */}
                    <div className="absolute -bottom-2 -right-2 flex gap-1">
                      {alunoSelecionado?.foto_url && (
                        <button type="button" onClick={() => setShowDeletePhotoDialog(true)} className="w-8 h-8 bg-white text-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-50 border border-red-100 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <label className="w-10 h-10 bg-teal-600 text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-teal-700 transition-colors border-2 border-white">
                        {alunoSelecionado?.foto_url ? <RefreshCw className="w-5 h-5" /> : <Plus className="w-6 h-6" />}
                        <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                      </label>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Foto Estudantil oficial</span>
                </div>

                {/* Campos Pessoais */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Nome Completo (Admin)</label>
                    <input type="text" value={alunoSelecionado?.nome_completo || ''} readOnly className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 cursor-not-allowed italic font-semibold" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Nome Social / Apelido</label>
                    <input {...register('nome_social')} className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all font-bold text-slate-700" placeholder="Ex: Gabi" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Gênero</label>
                    <select {...register('genero')} className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 font-bold text-slate-700">
                      <option value="">Selecione...</option>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'endereco' && (
            <motion.div key="endereco" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-black text-slate-500 uppercase mb-1.5">CEP</label>
                <input {...register('cep')} className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 font-bold" placeholder="00000-000" />
              </div>
              <div className="md:col-span-4">
                <label className="block text-[11px] font-black text-slate-500 uppercase mb-1.5">Logradouro / Rua</label>
                <input {...register('logradouro')} className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 font-bold" />
              </div>
              <div className="md:col-span-1">
                <label className="block text-[11px] font-black text-slate-500 uppercase mb-1.5">Número</label>
                <input {...register('numero')} className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 font-bold" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] font-black text-slate-500 uppercase mb-1.5">Complemento</label>
                <input {...register('complemento')} className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 font-bold" />
              </div>
              <div className="md:col-span-3">
                <label className="block text-[11px] font-black text-slate-500 uppercase mb-1.5">Bairro</label>
                <input {...register('bairro')} className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 font-bold" />
              </div>
            </motion.div>
          )}

          {activeTab === 'saude' && (
            <motion.div key="saude" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-6">
              {/* Alergias / Patologias */}
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-4">Alergias e Patologias</label>
                <div className="flex flex-wrap gap-2 mb-4 min-h-[40px]">
                  {patologias.map((p, idx) => (
                    <span key={idx} className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-xl text-xs font-black border border-red-200 shadow-sm">
                      {p}
                      <button type="button" onClick={() => removePatologia(p)} className="hover:text-red-900"><X className="w-4 h-4" /></button>
                    </span>
                  ))}
                  {patologias.length === 0 && <p className="text-slate-400 text-sm font-medium italic">Nenhuma informação registrada.</p>}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newPatologia} onChange={(e) => setNewPatologia(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPatologia())} className="flex-1 p-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 font-bold" placeholder="Ex: Alergia a Amendoim" />
                  <button type="button" onClick={addPatologia} className="w-14 h-14 bg-white text-slate-600 rounded-2xl border border-slate-200 shadow-sm hover:bg-teal-50 hover:text-teal-600 transition-all flex items-center justify-center"><Plus className="w-6 h-6" /></button>
                </div>
              </div>

              {/* Medicamentos */}
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-4">Medicamentos Contínuos</label>
                <div className="flex flex-wrap gap-2 mb-4 min-h-[40px]">
                  {medicamentos.map((m, idx) => (
                    <span key={idx} className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl text-xs font-black border border-blue-200 shadow-sm">
                      {m}
                      <button type="button" onClick={() => removeMedicamento(m)} className="hover:text-blue-900"><X className="w-4 h-4" /></button>
                    </span>
                  ))}
                  {medicamentos.length === 0 && <p className="text-slate-400 text-sm font-medium italic">Nenhum medicamento registrado.</p>}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newMedicamento} onChange={(e) => setNewMedicamento(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMedicamento())} className="flex-1 p-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 font-bold" placeholder="Ex: Insulina" />
                  <button type="button" onClick={addMedicamento} className="w-14 h-14 bg-white text-slate-600 rounded-2xl border border-slate-200 shadow-sm hover:bg-teal-50 hover:text-teal-600 transition-all flex items-center justify-center"><Plus className="w-6 h-6" /></button>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2">Observações Adicionais</label>
                <textarea {...register('observacoes_saude')} rows={4} className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 font-bold text-slate-700" placeholder="Outras informações importantes para a escola..." />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-10 pt-8 border-t border-slate-100 flex justify-end">
          <button type="submit" disabled={isSubmitting} className="flex items-center gap-3 px-10 py-4 bg-teal-600 text-white rounded-2xl font-black hover:bg-teal-700 active:scale-95 transition-all shadow-xl shadow-teal-500/20 disabled:opacity-50">
            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
            Salvar Tudo
          </button>
        </div>
      </form>

      {/* Dialog de Confirmação para Excluir Foto */}
      <Dialog open={showDeletePhotoDialog} onOpenChange={setShowDeletePhotoDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              Excluir Foto do Aluno
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 pt-2">
              Deseja realmente remover a foto de <strong>{alunoSelecionado?.nome_completo}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-2">
            <div className="flex items-start gap-2 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>Esta ação não pode ser desfeita. A foto será removida permanentemente do perfil do aluno.</p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeletePhotoDialog(false)}
              className="h-12 rounded-xl font-bold"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeletePhoto}
              disabled={isUploading}
              className="h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removendo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Sim, Excluir
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
