-- Extrato de cada atividade do histórico (o que foi lançado, o que mudou, antes e depois), já em texto.
-- Opcional: as atividades de antes desta coluna continuam só com a frase.

alter table public.atividades add column detalhe jsonb;
