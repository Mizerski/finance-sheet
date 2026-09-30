-- Prazo opcional das metas de economia: a data até quando o usuário quer atingir o valor alvo.
-- Sem prazo (null), a meta só mostra quando termina no ritmo atual.

alter table public.metas_economia add column prazo date;

alter table public.metas_economia add constraint metas_economia_prazo_check check (prazo is null or prazo >= inicio);
