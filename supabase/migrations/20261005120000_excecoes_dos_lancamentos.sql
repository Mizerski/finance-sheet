-- Valor de um dia só num lançamento recorrente ("mudar só este dia"): data -> centavos; 0 = pulado nesse dia.

alter table public.lancamentos
  add column excecoes jsonb not null default '{}'::jsonb check (jsonb_typeof(excecoes) = 'object');
