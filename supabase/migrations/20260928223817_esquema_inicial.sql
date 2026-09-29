-- Esquema inicial da Projeção Financeira.
-- Cada linha pertence a um usuário (auth.users) e o RLS garante que ninguém lê nem altera dados de outra pessoa.
-- Valores em centavos (bigint) e datas sem horário (date), como no app.

create table public.configuracoes (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  saldo_inicial_centavos bigint not null default 0,
  data_saldo_inicial date not null,
  atualizado_em timestamptz not null default now()
);

create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null check (length(trim(nome)) > 0),
  cor text not null check (cor ~ '^#[0-9a-fA-F]{6}$'),
  tipo text not null check (tipo in ('entrada', 'saida')),
  criado_em timestamptz not null default now()
);

create table public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  descricao text not null check (length(trim(descricao)) > 0),
  tipo text not null check (tipo in ('entrada', 'saida')),
  valor_centavos bigint not null check (valor_centavos >= 0),
  -- Excluir a categoria mantém o lançamento, que passa a aparecer como "Sem categoria".
  categoria_id uuid references public.categorias (id) on delete set null,
  natureza text not null check (natureza in ('fixa', 'variavel')),
  -- { tipo: 'unica', data } | { tipo: 'mensal', diaDoMes } | { tipo: 'diaria', apenasDiasUteis }
  recorrencia jsonb not null check (recorrencia ->> 'tipo' in ('unica', 'mensal', 'diaria')),
  inicio date,
  fim date,
  criado_em timestamptz not null default now(),
  check (fim is null or inicio is null or fim >= inicio)
);

create index categorias_user_id_idx on public.categorias (user_id);
create index lancamentos_user_id_idx on public.lancamentos (user_id);
create index lancamentos_categoria_id_idx on public.lancamentos (categoria_id);

alter table public.configuracoes enable row level security;
alter table public.categorias enable row level security;
alter table public.lancamentos enable row level security;

create policy "Cada usuário acessa só a própria configuração" on public.configuracoes
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Cada usuário acessa só as próprias categorias" on public.categorias
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Cada usuário acessa só os próprios lançamentos" on public.lancamentos
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.configuracoes, public.categorias, public.lancamentos to authenticated;
