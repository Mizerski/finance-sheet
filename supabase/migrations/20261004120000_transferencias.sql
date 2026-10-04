-- Transferência entre contas: lançamento com tipo 'transferencia', que sai de caixa_id e entra em caixa_destino_id.
-- Não tem categoria nem tag. O destino só existe na transferência, e ela sempre tem um.

-- Antes, o destino não tinha uso no app: se algum lançamento comum tiver um, ele sai.
update public.lancamentos set caixa_destino_id = null
where caixa_destino_id is not null and tipo <> 'transferencia';

alter table public.lancamentos drop constraint lancamentos_tipo_check;

alter table public.lancamentos
  add constraint lancamentos_tipo_check check (tipo in ('entrada', 'saida', 'transferencia')),
  add constraint lancamentos_destino_check check ((tipo = 'transferencia') = (caixa_destino_id is not null));
