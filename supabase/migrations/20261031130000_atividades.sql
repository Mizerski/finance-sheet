-- Histórico de atividade: o que a pessoa fez no app ("Adicionou a saída Mercado de R$ 260,00"), com a frase já pronta.
-- Não aponta para lançamentos, metas nem caixas: a frase continua mesmo depois de o item mudar ou ser excluído.

create table public.atividades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  em timestamptz not null default now(),
  tipo text not null check (tipo in ('lancamento', 'meta', 'caixa', 'organizacao', 'dados')),
  texto text not null check (length(trim(texto)) > 0),
  tom text check (tom in ('entrada', 'saida', 'economia')),
  caixa_id uuid
);

create index atividades_user_id_em_idx on public.atividades (user_id, em desc);

alter table public.atividades enable row level security;

create policy "Cada usuário acessa só as próprias atividades" on public.atividades
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, delete on public.atividades to authenticated;

-- Guarda só as últimas 500 de cada pessoa, como no app desktop: as mais antigas saem a cada nova.
create function public.limitar_atividades() returns trigger
  language plpgsql
  security invoker
  set search_path = ''
as $$
begin
  delete from public.atividades
  where user_id = new.user_id
    and id not in (
      select id from public.atividades where user_id = new.user_id order by em desc, id desc limit 500
    );
  return null;
end;
$$;

create trigger atividades_limite
  after insert on public.atividades
  for each row execute function public.limitar_atividades();
