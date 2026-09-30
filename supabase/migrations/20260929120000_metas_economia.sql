-- Metas de economia: um valor a juntar com aportes mensais, descontados do saldo como uma saída.
-- Os aportes não são gravados: o app os calcula a partir do aporte mensal, do dia e dos ajustes.

create table public.metas_economia (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null check (length(trim(nome)) > 0),
  valor_alvo_centavos bigint not null check (valor_alvo_centavos > 0),
  aporte_mensal_centavos bigint not null check (aporte_mensal_centavos >= 0),
  dia_do_mes smallint not null check (dia_do_mes between 1 and 31),
  -- Nenhum aporte acontece antes desta data.
  inicio date not null,
  -- Valor real guardado nos meses que fugiram do plano: { "2026-03": 15000, ... } (centavos).
  ajustes jsonb not null default '{}'::jsonb check (jsonb_typeof(ajustes) = 'object'),
  criado_em timestamptz not null default now()
);

create index metas_economia_user_id_idx on public.metas_economia (user_id);

alter table public.metas_economia enable row level security;

create policy "Cada usuário acessa só as próprias metas de economia" on public.metas_economia
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.metas_economia to authenticated;
