-- ==========================================
-- SCHEMA COMPLETO: FATURAMENTO E ASSINATURAS
-- Fluxoo Educação — Conformidade total com regras de negócio
-- Execute este script no Editor SQL do Supabase
-- ==========================================

-- EXTENSÕES
create extension if not exists "uuid-ossp";

-- FUNÇÃO GLOBAL updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ==========================================
-- 1. PLANOS (já existe, mas garante consistência)
-- ==========================================
-- Tabela 'planos' já criada anteriormente, apenas garante campos extras
ALTER TABLE public.planos ADD COLUMN IF NOT EXISTS descricao_curta text;

-- ==========================================
-- 2. MÓDULOS
-- ==========================================
create table if not exists public.modulos (
    id uuid primary key default uuid_generate_v4(),
    nome text not null,
    codigo text unique not null,
    descricao text,
    created_at timestamptz default now()
);

create table if not exists public.plano_modulo (
    plano_id uuid references public.planos(id) on delete cascade,
    modulo_id uuid references public.modulos(id) on delete cascade,
    primary key (plano_id, modulo_id)
);

-- Seed: Módulos padrão
INSERT INTO public.modulos (nome, codigo, descricao) VALUES
  ('Acadêmico', 'academico', 'Gestão de turmas, alunos e frequência'),
  ('Financeiro', 'financeiro', 'Cobranças, mensalidades e relatórios financeiros'),
  ('Agenda', 'agenda', 'Calendário escolar e eventos'),
  ('Comunicação', 'comunicacao', 'Mural de avisos e mensagens'),
  ('Portal do Responsável', 'portal_responsavel', 'Acesso dos pais/responsáveis')
ON CONFLICT (codigo) DO NOTHING;

-- ==========================================
-- 3. ASSINATURAS (CONTRATO ATIVO)
-- ==========================================
create table if not exists public.assinaturas (
    id uuid primary key default uuid_generate_v4(),
    tenant_id uuid not null references public.escolas(id) on delete cascade,
    plano_id uuid not null references public.planos(id),
    valor_por_aluno_contratado numeric(10,2) not null,
    limite_alunos_contratado integer not null,
    valor_total_contratado numeric(10,2) not null,
    dia_vencimento integer not null check (dia_vencimento between 1 and 28),
    status text not null check (status in ('ativa','inadimplente','cancelada')),
    data_inicio date not null,
    data_fim date,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create trigger trg_assinaturas_updated
before update on public.assinaturas
for each row execute function public.set_updated_at();

create index if not exists idx_assinaturas_tenant on public.assinaturas(tenant_id);
create index if not exists idx_assinaturas_status on public.assinaturas(status);

-- ==========================================
-- 4. HISTÓRICO DE ASSINATURA (IMUTÁVEL)
-- ==========================================
create table if not exists public.historico_assinatura (
    id uuid primary key default uuid_generate_v4(),
    tenant_id uuid references public.escolas(id) on delete cascade,
    plano_id uuid references public.planos(id),
    valor_por_aluno_contratado numeric(10,2) not null,
    limite_alunos_contratado integer not null,
    valor_total_contratado numeric(10,2) not null,
    data_inicio date not null,
    data_fim date,
    created_at timestamptz default now()
);

create index if not exists idx_historico_tenant on public.historico_assinatura(tenant_id);

-- ==========================================
-- 5. FATURAS (MENSALIDADE DA PLATAFORMA)
-- ==========================================
create table if not exists public.faturas (
    id uuid primary key default uuid_generate_v4(),
    tenant_id uuid not null references public.escolas(id) on delete cascade,
    assinatura_id uuid not null references public.assinaturas(id) on delete cascade,
    competencia date not null,
    valor numeric(10,2) not null,
    data_vencimento date not null,
    data_pagamento date,
    status text not null check (
        status in ('pendente','pendente_confirmacao','pago','atrasado','cancelado')
    ),
    forma_pagamento text,
    gateway_referencia text,
    comprovante_url text,
    confirmado_por uuid,
    data_confirmacao timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create trigger trg_faturas_updated
before update on public.faturas
for each row execute function public.set_updated_at();

create index if not exists idx_faturas_tenant on public.faturas(tenant_id);
create index if not exists idx_faturas_status on public.faturas(status);
create index if not exists idx_faturas_competencia on public.faturas(competencia);

-- ==========================================
-- 6. SOLICITAÇÕES DE UPGRADE
-- ==========================================
create table if not exists public.solicitacoes_upgrade (
    id uuid primary key default uuid_generate_v4(),
    tenant_id uuid not null references public.escolas(id) on delete cascade,
    limite_atual integer not null,
    limite_solicitado integer not null,
    valor_atual numeric(10,2) not null,
    valor_proposto numeric(10,2) not null,
    status text not null check (status in ('pendente','aprovado','recusado')),
    created_at timestamptz default now()
);

create index if not exists idx_upgrade_tenant on public.solicitacoes_upgrade(tenant_id);

-- ==========================================
-- 7. CONFIGURAÇÃO GLOBAL DE RECEBIMENTO (PIX MANUAL)
-- ==========================================
create table if not exists public.configuracao_recebimento (
    id uuid primary key default uuid_generate_v4(),
    pix_manual_ativo boolean default false,
    tipo_chave_pix text check (
        tipo_chave_pix in ('cpf','cnpj','email','telefone','aleatoria')
    ),
    chave_pix text,
    favorecido text,
    instrucoes_extras text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create trigger trg_config_recebimento_updated
before update on public.configuracao_recebimento
for each row execute function public.set_updated_at();

create unique index if not exists uq_config_recebimento_unico
on public.configuracao_recebimento((true));

-- Seed: Inserir registro único de configuração
INSERT INTO public.configuracao_recebimento (pix_manual_ativo) VALUES (false)
ON CONFLICT DO NOTHING;

-- ==========================================
-- 8. FUNÇÃO DE GERAÇÃO DE FATURAS MENSAIS
-- ==========================================
create or replace function public.gerar_faturas_mensais()
returns void as $$
declare
    rec record;
    vencimento date;
begin
    for rec in
        select *
        from public.assinaturas
        where status = 'ativa'
        and data_fim is null
    loop
        vencimento := make_date(
            extract(year from current_date)::int,
            extract(month from current_date)::int,
            rec.dia_vencimento
        );
        insert into public.faturas (
            tenant_id, assinatura_id, competencia, valor,
            data_vencimento, status
        )
        values (
            rec.tenant_id, rec.id,
            date_trunc('month', current_date),
            rec.valor_total_contratado,
            vencimento, 'pendente'
        );
    end loop;
end;
$$ language plpgsql;

-- ==========================================
-- 9. FUNÇÃO DE INADIMPLÊNCIA AUTOMÁTICA
-- ==========================================
create or replace function public.atualizar_inadimplencia()
returns void as $$
begin
    update public.faturas
    set status = 'atrasado'
    where status = 'pendente'
    and data_vencimento < current_date;

    update public.assinaturas
    set status = 'inadimplente'
    where id in (
        select assinatura_id
        from public.faturas
        where status = 'atrasado'
    );
end;
$$ language plpgsql;
