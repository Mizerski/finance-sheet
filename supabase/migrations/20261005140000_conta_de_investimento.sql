-- Conta de investimento (poupança, CDB, corretora): uma conta fora do risco. A meta que manda o dinheiro para ela
-- conta o saldo dela como guardado (calculado no app, não é salvo).

alter table public.caixas
  add column investimento boolean not null default false,
  add constraint caixas_investimento_check check (not investimento or tipo = 'conta');
