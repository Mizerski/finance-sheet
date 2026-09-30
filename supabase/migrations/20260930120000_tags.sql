-- Tags: dizem se um gasto era necessário ou dava para evitar. Cada lançamento de saída tem no máximo uma.

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null check (length(trim(nome)) > 0),
  cor text not null check (cor ~ '^#[0-9a-fA-F]{6}$'),
  -- Os gastos com esta tag somam no indicador de gastos evitáveis.
  evitavel boolean not null default false,
  criado_em timestamptz not null default now()
);

create index tags_user_id_idx on public.tags (user_id);

alter table public.tags enable row level security;

create policy "Cada usuário acessa só as próprias tags" on public.tags
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.tags to authenticated;

-- Excluir a tag mantém o lançamento, que fica sem tag.
alter table public.lancamentos add column tag_id uuid references public.tags (id) on delete set null;

create index lancamentos_tag_id_idx on public.lancamentos (tag_id);
