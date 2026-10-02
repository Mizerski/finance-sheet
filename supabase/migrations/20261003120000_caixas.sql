-- Caixas: contas bancárias e benefícios (vale-refeição, vale-alimentação), cada um com o próprio saldo inicial.
-- Todo lançamento e toda meta passa a pertencer a um caixa. O saldo de `configuracoes` vira a "Conta principal"
-- de cada usuário. A tabela `configuracoes` deixa de ser lida pelo app, mas fica até a próxima migração (para voltar atrás).

create table public.caixas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null check (length(trim(nome)) > 0),
  cor text not null check (cor ~ '^#[0-9a-fA-F]{6}$'),
  tipo text not null check (tipo in ('conta', 'beneficio')),
  saldo_inicial_centavos bigint not null default 0,
  -- O saldo inicial vale no começo deste dia; os dias anteriores ficam fora do cálculo do caixa.
  data_saldo_inicial date not null,
  -- false enquanto o usuário não salvou um saldo inicial (o app mostra os primeiros passos).
  saldo_definido boolean not null default false,
  -- Entra nos números de "Todos" (saldo, planilha, dashboard, risco).
  entra_no_total boolean not null,
  ordem integer not null default 0,
  -- Some do seletor e do formulário, mas mantém o histórico.
  arquivado boolean not null default false,
  criado_em timestamptz not null default now(),
  -- Alvo das chaves estrangeiras compostas: um lançamento só aponta para um caixa do mesmo usuário.
  unique (id, user_id)
);

create index caixas_user_id_idx on public.caixas (user_id);

alter table public.caixas enable row level security;

create policy "Cada usuário acessa só os próprios caixas" on public.caixas
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.caixas to authenticated;

-- Conta principal de cada usuário que já tem dados, com o saldo inicial de `configuracoes`.
-- Sem configuração salva, vale o padrão do app: R$ 0 em 1º de janeiro do ano atual (saldo ainda não definido).
insert into public.caixas (user_id, nome, cor, tipo, saldo_inicial_centavos, data_saldo_inicial, saldo_definido, entra_no_total, ordem)
select
  u.user_id,
  'Conta principal',
  '#1f45c4',
  'conta',
  coalesce(c.saldo_inicial_centavos, 0),
  coalesce(c.data_saldo_inicial, make_date(extract(year from now())::int, 1, 1)),
  c.user_id is not null,
  true,
  0
from (
  select user_id from public.configuracoes
  union select user_id from public.lancamentos
  union select user_id from public.metas_economia
) u
left join public.configuracoes c on c.user_id = u.user_id;

-- Lançamentos: o caixa (na transferência, a origem) e o destino de uma transferência (ainda sem uso no app).
-- Não dá para excluir um caixa com lançamentos ou metas: o app arquiva em vez de excluir.
alter table public.lancamentos
  add column caixa_id uuid,
  add column caixa_destino_id uuid,
  add constraint lancamentos_caixa_fk foreign key (caixa_id, user_id)
    references public.caixas (id, user_id) on delete restrict,
  add constraint lancamentos_caixa_destino_fk foreign key (caixa_destino_id, user_id)
    references public.caixas (id, user_id) on delete restrict,
  add constraint lancamentos_transferencia_check check (caixa_destino_id is null or caixa_destino_id <> caixa_id);

alter table public.metas_economia
  add column caixa_id uuid,
  add constraint metas_economia_caixa_fk foreign key (caixa_id, user_id)
    references public.caixas (id, user_id) on delete restrict;

update public.lancamentos l set caixa_id = cx.id
from public.caixas cx
where cx.user_id = l.user_id and l.caixa_id is null;

update public.metas_economia m set caixa_id = cx.id
from public.caixas cx
where cx.user_id = m.user_id and m.caixa_id is null;

alter table public.lancamentos alter column caixa_id set not null;
alter table public.metas_economia alter column caixa_id set not null;

create index lancamentos_caixa_id_idx on public.lancamentos (caixa_id);
create index lancamentos_caixa_destino_id_idx on public.lancamentos (caixa_destino_id);
create index metas_economia_caixa_id_idx on public.metas_economia (caixa_id);
