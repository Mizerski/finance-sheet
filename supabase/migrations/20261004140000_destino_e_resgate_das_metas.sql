-- Para onde vai o dinheiro da meta e quanto já foi usado.
-- destino_id: conta que recebe os aportes (cada um vira uma transferência); null = separado na própria conta.
-- resgates: dinheiro tirado da meta para usar: [{ "id", "data", "valorCentavos" }].
-- encerrada_em: depois deste dia a meta não guarda mais (o histórico continua).

alter table public.metas_economia
  add column destino_id uuid,
  add column resgates jsonb not null default '[]'::jsonb check (jsonb_typeof(resgates) = 'array'),
  add column encerrada_em date,
  add constraint metas_economia_destino_fk foreign key (destino_id, user_id)
    references public.caixas (id, user_id) on delete restrict,
  add constraint metas_economia_destino_check check (destino_id is null or destino_id <> caixa_id);

create index metas_economia_destino_id_idx on public.metas_economia (destino_id);
