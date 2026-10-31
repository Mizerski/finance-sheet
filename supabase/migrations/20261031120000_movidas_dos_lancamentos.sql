-- Vez de um lançamento recorrente que aconteceu em outro dia ("paguei antes"): data original -> data nova.

alter table public.lancamentos
  add column movidas jsonb not null default '{}'::jsonb check (jsonb_typeof(movidas) = 'object');
