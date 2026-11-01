-- O histórico deixa de guardar só as últimas 500: o teto passa a 20 000 por pessoa (o mesmo de LIMITE_ATIVIDADES no app).
-- Quem quer guardar menos escolhe um prazo em "Apagar sozinho", que apaga pelo app.

create or replace function public.limitar_atividades() returns trigger
  language plpgsql
  security invoker
  set search_path = ''
as $$
begin
  delete from public.atividades
  where user_id = new.user_id
    and id not in (
      select id from public.atividades where user_id = new.user_id order by em desc, id desc limit 20000
    );
  return null;
end;
$$;
