-- O que a pessoa já tinha guardado fora do app ao criar a meta. Conta para o alvo e o progresso, mas não entra no saldo.

alter table public.metas_economia
  add column ja_guardado_centavos bigint not null default 0 check (ja_guardado_centavos >= 0);
