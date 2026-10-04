-- Cartão de crédito: caixa com tipo 'cartao'. As compras são saídas dele; no fechamento, o que se deve vira a fatura,
-- que o app tira sozinho da conta pagadora no vencimento (não é salva: sai da projeção).

alter table public.caixas drop constraint caixas_tipo_check;

alter table public.caixas
  add constraint caixas_tipo_check check (tipo in ('conta', 'beneficio', 'cartao')),
  add column dia_fechamento integer check (dia_fechamento between 1 and 31),
  add column dia_vencimento integer check (dia_vencimento between 1 and 31),
  add column conta_pagadora_id uuid,
  add column limite_centavos bigint check (limite_centavos > 0),
  -- A conta que paga é do mesmo usuário e não pode ser excluída enquanto pagar um cartão.
  add constraint caixas_conta_pagadora_fkey foreign key (conta_pagadora_id, user_id) references public.caixas (id, user_id),
  -- Ciclo e conta pagadora só existem no cartão, e o cartão sempre tem os três.
  add constraint caixas_cartao_check check (
    (tipo = 'cartao') = (dia_fechamento is not null and dia_vencimento is not null and conta_pagadora_id is not null)
  ),
  add constraint caixas_limite_check check (limite_centavos is null or tipo = 'cartao');
