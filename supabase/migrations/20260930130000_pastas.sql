-- Pastas: organizam a lista de lançamentos na tela. Não afetam a projeção. Cada lançamento fica em no máximo uma.

create table public.pastas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null check (length(trim(nome)) > 0),
  cor text not null check (cor ~ '^#[0-9a-fA-F]{6}$'),
  criado_em timestamptz not null default now()
);

create index pastas_user_id_idx on public.pastas (user_id);

alter table public.pastas enable row level security;

create policy "Cada usuário acessa só as próprias pastas" on public.pastas
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.pastas to authenticated;

-- Excluir a pasta mantém o lançamento, que fica sem pasta.
alter table public.lancamentos add column pasta_id uuid references public.pastas (id) on delete set null;

create index lancamentos_pasta_id_idx on public.lancamentos (pasta_id);
