-- Persistent rate limiting for Supabase Edge Function webhooks.
-- Safe to apply before deploying the function: the function falls back to
-- in-memory rate limiting if this RPC is not available yet.

create table if not exists public.webhook_rate_limits (
  client_ip text not null,
  window_start timestamptz not null,
  request_count integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (client_ip, window_start)
);

alter table public.webhook_rate_limits enable row level security;

drop policy if exists "Service role manages webhook rate limits" on public.webhook_rate_limits;
create policy "Service role manages webhook rate limits"
on public.webhook_rate_limits
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create or replace function public.check_webhook_rate_limit(
  p_client_ip text,
  p_window_seconds integer default 60,
  p_max_requests integer default 30
)
returns table(allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_ip text := coalesce(nullif(trim(p_client_ip), ''), 'unknown');
  v_window_seconds integer := greatest(coalesce(p_window_seconds, 60), 1);
  v_max_requests integer := greatest(coalesce(p_max_requests, 30), 1);
  v_window_start timestamptz;
  v_count integer;
begin
  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / v_window_seconds) * v_window_seconds
  );

  insert into public.webhook_rate_limits (client_ip, window_start, request_count, updated_at)
  values (v_client_ip, v_window_start, 1, now())
  on conflict (client_ip, window_start)
  do update set
    request_count = public.webhook_rate_limits.request_count + 1,
    updated_at = now()
  returning request_count into v_count;

  allowed := v_count <= v_max_requests;
  remaining := greatest(v_max_requests - v_count, 0);
  reset_at := v_window_start + make_interval(secs => v_window_seconds);
  return next;
end;
$$;

grant execute on function public.check_webhook_rate_limit(text, integer, integer) to service_role;

delete from public.webhook_rate_limits
where window_start < now() - interval '1 day';
