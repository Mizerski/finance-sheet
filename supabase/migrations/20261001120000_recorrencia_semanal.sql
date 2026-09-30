-- Recorrência semanal: { tipo: 'semanal', diasDaSemana } com os dias de 0 (domingo) a 6 (sábado).
-- Ex.: terapia toda terça = { "tipo": "semanal", "diasDaSemana": [2] }.

alter table public.lancamentos drop constraint lancamentos_recorrencia_check;

alter table public.lancamentos add constraint lancamentos_recorrencia_check check (
  case recorrencia ->> 'tipo'
    when 'unica' then true
    when 'mensal' then true
    when 'diaria' then true
    when 'semanal' then
      jsonb_typeof(recorrencia -> 'diasDaSemana') = 'array'
      and jsonb_array_length(recorrencia -> 'diasDaSemana') between 1 and 7
    else false
  end
);
