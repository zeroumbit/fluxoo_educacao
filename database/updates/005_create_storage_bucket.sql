-- ==========================================================
-- SCRIPT PARA CRIAR BUCKET DE COMPROVANTES NO SUPABASE
-- ==========================================================

-- 1. Criar o bucket 'comprovantes' se não existir
-- Definido como público para facilitar a visualização pelo Super Admin via link direto
insert into storage.buckets (id, name, public)
values ('comprovantes', 'comprovantes', true)
on conflict (id) do nothing;

-- 2. Expandir permissões para o bucket 'comprovantes'
-- Permitir que novos gestores (anônimos durante o cadastro) enviem o comprovante
create policy "Permitir upload público de comprovantes"
on storage.objects for insert
to public
with check (bucket_id = 'comprovantes');

-- Permitir que todos visualizem os comprovantes (necessário para o bucket público funcionar via policies)
create policy "Permitir visualização de comprovantes"
on storage.objects for select
to public
using (bucket_id = 'comprovantes');

-- 3. (Opcional) Restringir tipos de arquivo para segurança
update storage.buckets
set allowed_mime_types = '{image/jpeg,image/png,application/pdf}',
    file_size_limit = 5242880 -- Limite de 5MB
where id = 'comprovantes';
