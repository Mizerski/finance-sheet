-- Meta sem valor alvo (cofrinho): guarda todo mês, sem fim. O prazo só existe com valor alvo.

alter table public.metas_economia alter column valor_alvo_centavos drop not null;

alter table public.metas_economia
  add constraint metas_economia_prazo_com_alvo_check check (prazo is null or valor_alvo_centavos is not null);
