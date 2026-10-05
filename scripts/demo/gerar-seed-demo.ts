/*
 * Gera supabase/seed-demo.sql: dados de demonstração para uma conta da versão web.
 * Roda a projeção do próprio app sobre os dados e imprime o risco, a capacidade e as sugestões, para conferir
 * se a demo mostra todas as telas com conteúdo.
 *
 *   npx tsx --tsconfig tsconfig.app.json scripts/demo/gerar-seed-demo.ts [email]
 *
 * O SQL apaga os dados da conta do e-mail e grava os novos. Rode no SQL Editor do Supabase.
 */
import { randomUUID } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import type { Categoria } from '@/features/categorias/model/categoria'
import { capacidadeDePoupanca } from '@/features/economias/utils/capacidade'
import { aumentosDeEntrada, entradasExtras } from '@/features/economias/utils/eventos'
import { gastosGrandes } from '@/features/economias/utils/gastos-grandes'
import type { MetaEconomia } from '@/features/economias/model/meta'
import type { Lancamento, Natureza, Recorrencia, TipoMovimento } from '@/features/lancamentos/model/lancamento'
import type { Pasta } from '@/features/pastas/model/pasta'
import type { Configuracao } from '@/features/projecao/model/configuracao'
import { gastosPorTag, projetarAnos, totalEvitavel } from '@/features/projecao/utils/projecao'
import { analisarRisco } from '@/features/risco/utils/risco'
import type { Tag } from '@/features/tags/model/tag'

const EMAIL = process.argv[2] ?? 'a@a.com'
const HOJE = new Date().toLocaleDateString('sv-SE')

const config: Configuracao = { saldoInicialCentavos: 4_300_00, dataSaldoInicial: '2026-01-01' }

const cat = (nome: string, cor: string, tipo: TipoMovimento): Categoria => ({ id: randomUUID(), nome, cor, tipo })
const C = {
  salario: cat('Salário', '#1f45c4', 'entrada'),
  freela: cat('Freelas', '#5b9be0', 'entrada'),
  rendimentos: cat('Rendimentos', '#157a86', 'entrada'),
  extras: cat('Extras', '#2e8b4e', 'entrada'),
  moradia: cat('Moradia', '#d7322a', 'saida'),
  contas: cat('Contas da casa', '#ee7a1a', 'saida'),
  mercado: cat('Mercado', '#f5c518', 'saida'),
  transporte: cat('Transporte', '#1d1c1a', 'saida'),
  saude: cat('Saúde', '#2e8b4e', 'saida'),
  restaurantes: cat('Restaurantes', '#9e1f1f', 'saida'),
  lazer: cat('Lazer', '#c2378f', 'saida'),
  assinaturas: cat('Assinaturas', '#6c3fb5', 'saida'),
  educacao: cat('Educação', '#142b6e', 'saida'),
  compras: cat('Compras', '#f0a3b8', 'saida'),
  pet: cat('Pet', '#7a4a26', 'saida'),
}

const T = {
  necessario: { id: randomUUID(), nome: 'Necessário', cor: '#556b2f', evitavel: false },
  superficial: { id: randomUUID(), nome: 'Superficial', cor: '#c99a1a', evitavel: true },
  impulso: { id: randomUUID(), nome: 'Impulso', cor: '#ee7a1a', evitavel: true },
  emergencia: { id: randomUUID(), nome: 'Emergência', cor: '#9e1f1f', evitavel: false },
} satisfies Record<string, Tag>

const P = {
  casa: { id: randomUUID(), nome: 'Casa', cor: '#d7322a' },
  carro: { id: randomUUID(), nome: 'Carro', cor: '#1d1c1a' },
  trabalho: { id: randomUUID(), nome: 'Trabalho', cor: '#1f45c4' },
  pessoal: { id: randomUUID(), nome: 'Pessoal', cor: '#f5c518' },
} satisfies Record<string, Pasta>

interface Opcoes {
  tag?: Tag
  pasta?: Pasta
  natureza?: Natureza
  inicio?: string
  fim?: string
}

const lancamentos: Lancamento[] = []
function lanc(tipo: TipoMovimento, descricao: string, reais: number, categoria: Categoria, recorrencia: Recorrencia, o: Opcoes = {}) {
  lancamentos.push({
    id: randomUUID(),
    descricao,
    tipo,
    valorCentavos: Math.round(reais * 100),
    categoriaId: categoria.id,
    tagId: tipo === 'saida' ? o.tag?.id : undefined,
    pastaId: o.pasta?.id,
    natureza: o.natureza ?? (recorrencia.tipo === 'mensal' ? 'fixa' : 'variavel'),
    recorrencia,
    inicio: o.inicio,
    fim: o.fim,
  })
}
const mensal = (diaDoMes: number): Recorrencia => ({ tipo: 'mensal', diaDoMes })
const semanal = (...diasDaSemana: number[]): Recorrencia => ({ tipo: 'semanal', diasDaSemana })
const unica = (data: string): Recorrencia => ({ tipo: 'unica', data })
const diasUteis: Recorrencia = { tipo: 'diaria', apenasDiasUteis: true }
const entrada = (d: string, r: number, c: Categoria, rec: Recorrencia, o?: Opcoes) => lanc('entrada', d, r, c, rec, o)
const saida = (d: string, r: number, c: Categoria, rec: Recorrencia, o?: Opcoes) => lanc('saida', d, r, c, rec, o)

// Entradas
entrada('Salário', 9_850, C.salario, mensal(5), { pasta: P.trabalho, fim: '2026-12-31' })
entrada('Salário (reajuste)', 10_600, C.salario, mensal(5), { pasta: P.trabalho, inicio: '2027-01-01' })
entrada('Vale-refeição', 880, C.salario, mensal(1), { pasta: P.trabalho })
entrada('Rendimento do CDB', 85, C.rendimentos, mensal(1), { pasta: P.pessoal })
entrada('13º salário (1ª parcela)', 4_925, C.salario, unica('2026-11-30'), { pasta: P.trabalho })
entrada('13º salário (2ª parcela)', 4_925, C.salario, unica('2026-12-18'), { pasta: P.trabalho })
entrada('Restituição do IR', 1_450, C.extras, unica('2026-06-30'), { pasta: P.pessoal })
entrada('PLR', 7_200, C.extras, unica('2027-03-20'), { pasta: P.trabalho })
entrada('Venda da bicicleta', 1_100, C.extras, unica('2026-08-09'), { pasta: P.pessoal })
for (const [data, valor, cliente] of [
  ['2026-02-18', 1_200, 'logo padaria'],
  ['2026-04-22', 2_400, 'site da clínica'],
  ['2026-07-10', 1_800, 'identidade visual'],
  ['2026-09-12', 950, 'cardápio digital'],
  ['2026-11-20', 7_500, 'e-commerce'],
  ['2027-03-15', 2_000, 'landing page'],
] as const) {
  entrada(`Freela: ${cliente}`, valor, C.freela, unica(data), { pasta: P.trabalho })
}

// Casa
saida('Aluguel', 2_200, C.moradia, mensal(10), { tag: T.necessario, pasta: P.casa })
saida('Condomínio', 580, C.moradia, mensal(10), { tag: T.necessario, pasta: P.casa })
saida('IPTU', 1_180, C.moradia, unica('2026-02-10'), { tag: T.necessario, pasta: P.casa, natureza: 'fixa' })
saida('IPTU', 1_250, C.moradia, unica('2027-02-10'), { tag: T.necessario, pasta: P.casa, natureza: 'fixa' })
saida('Conta de luz', 210, C.contas, mensal(15), { tag: T.necessario, pasta: P.casa, natureza: 'variavel' })
saida('Conta de água', 85, C.contas, mensal(15), { tag: T.necessario, pasta: P.casa, natureza: 'variavel' })
saida('Internet', 119.9, C.contas, mensal(20), { tag: T.necessario, pasta: P.casa })
saida('Celular', 59.9, C.contas, mensal(20), { tag: T.necessario, pasta: P.pessoal })
saida('Gás', 120, C.contas, mensal(25), { tag: T.necessario, pasta: P.casa, natureza: 'variavel' })
saida('Mercado do mês', 260, C.mercado, semanal(6), { tag: T.necessario, pasta: P.casa })
saida('Feira', 70, C.mercado, semanal(3), { tag: T.necessario, pasta: P.casa })
saida('Padaria', 9, C.mercado, diasUteis, { tag: T.superficial, pasta: P.casa })
saida('Ração e areia', 180, C.pet, mensal(18), { tag: T.necessario, pasta: P.casa })
saida('Veterinário', 420, C.pet, unica('2026-05-21'), { tag: T.emergencia, pasta: P.casa })
saida('Conserto da geladeira', 890, C.contas, unica('2026-05-07'), { tag: T.emergencia, pasta: P.casa })
saida('Faxina', 180, C.contas, mensal(28), { tag: T.superficial, pasta: P.casa, inicio: '2026-03-01' })

// Carro
saida('Combustível', 140, C.transporte, semanal(1), { tag: T.necessario, pasta: P.carro })
saida('Seguro do carro', 195, C.transporte, mensal(12), { tag: T.necessario, pasta: P.carro })
saida('IPVA', 1_850, C.transporte, unica('2026-01-20'), { tag: T.necessario, pasta: P.carro, natureza: 'fixa' })
saida('IPVA', 1_980, C.transporte, unica('2027-01-20'), { tag: T.necessario, pasta: P.carro, natureza: 'fixa' })
saida('Revisão dos 40 mil km', 1_400, C.transporte, unica('2026-11-09'), { tag: T.necessario, pasta: P.carro })
saida('Pneus novos', 1_600, C.transporte, unica('2027-05-14'), { tag: T.necessario, pasta: P.carro })
saida('Uber', 45, C.transporte, semanal(5), { tag: T.superficial, pasta: P.carro })

// Trabalho
saida('Almoço no trabalho', 24, C.restaurantes, diasUteis, { tag: T.necessario, pasta: P.trabalho })
saida('Curso de inglês', 320, C.educacao, mensal(10), { tag: T.necessario, pasta: P.trabalho, inicio: '2026-03-01', fim: '2026-12-31' })
saida('Matrícula da pós', 900, C.educacao, unica('2027-02-05'), { tag: T.necessario, pasta: P.trabalho })
saida('Mensalidade da pós', 690, C.educacao, mensal(10), { tag: T.necessario, pasta: P.trabalho, inicio: '2027-03-01' })
saida('Licença do Figma', 75, C.assinaturas, mensal(7), { tag: T.necessario, pasta: P.trabalho })

// Pessoal
saida('Plano de saúde', 450, C.saude, mensal(8), { tag: T.necessario, pasta: P.pessoal })
saida('Terapia', 160, C.saude, semanal(2), { tag: T.necessario, pasta: P.pessoal })
saida('Academia', 119, C.saude, mensal(5), { tag: T.necessario, pasta: P.pessoal })
saida('Farmácia', 90, C.saude, mensal(22), { tag: T.necessario, pasta: P.pessoal, natureza: 'variavel' })
saida('Dentista', 650, C.saude, unica('2026-10-14'), { tag: T.necessario, pasta: P.pessoal })
saida('Delivery', 68, C.restaurantes, semanal(5), { tag: T.impulso, pasta: P.pessoal })
saida('Barzinho com amigos', 120, C.lazer, semanal(6), { tag: T.superficial, pasta: P.pessoal })
saida('Netflix', 44.9, C.assinaturas, mensal(3), { tag: T.superficial, pasta: P.pessoal })
saida('Spotify', 21.9, C.assinaturas, mensal(3), { tag: T.superficial, pasta: P.pessoal })
saida('iCloud', 14.9, C.assinaturas, mensal(3), { tag: T.necessario, pasta: P.pessoal })
saida('Celular novo (quebrou a tela)', 2_400, C.compras, unica('2026-03-28'), { tag: T.emergencia, pasta: P.pessoal })
saida('Tênis de corrida', 450, C.compras, unica('2026-08-14'), { tag: T.impulso, pasta: P.pessoal })
saida('Fone bluetooth', 380, C.compras, unica('2026-06-05'), { tag: T.impulso, pasta: P.pessoal })
saida('Show no festival', 680, C.lazer, unica('2026-10-24'), { tag: T.superficial, pasta: P.pessoal })
saida('Black Friday', 1_100, C.compras, unica('2026-11-27'), { tag: T.impulso, pasta: P.pessoal })
saida('Presentes de Natal', 900, C.compras, unica('2026-12-15'), { tag: T.necessario, pasta: P.pessoal })
saida('Viagem de Réveillon', 4_800, C.lazer, unica('2026-12-27'), { tag: T.superficial, pasta: P.pessoal })
saida('Aniversário da mãe', 350, C.compras, unica('2027-04-12'), { tag: T.necessario, pasta: P.pessoal })
saida('Carnaval', 900, C.lazer, unica('2026-02-14'), { tag: T.superficial, pasta: P.pessoal })

const metas: MetaEconomia[] = [
  {
    id: randomUUID(),
    nome: 'Reserva de emergência',
    valorAlvoCentavos: 36_000_00,
    aporteMensalCentavos: 700_00,
    diaDoMes: 6,
    inicio: '2026-01-01',
    // Março: o celular quebrou e não deu para guardar. Julho: guardou a restituição do IR.
    ajustes: { '2026-03': 0, '2026-07': 1_400_00 },
  },
  {
    id: randomUUID(),
    nome: 'Notebook novo',
    valorAlvoCentavos: 6_500_00,
    aporteMensalCentavos: 400_00,
    diaDoMes: 15,
    inicio: '2026-02-01',
    prazo: '2027-06-30',
    ajustes: {},
  },
  {
    id: randomUUID(),
    nome: 'Viagem para o Japão',
    valorAlvoCentavos: 22_000_00,
    aporteMensalCentavos: 450_00,
    diaDoMes: 6,
    inicio: '2026-04-01',
    prazo: '2028-10-31',
    ajustes: { '2026-08': 900_00 },
  },
  {
    id: randomUUID(),
    nome: 'Entrada do apartamento',
    valorAlvoCentavos: 80_000_00,
    aporteMensalCentavos: 300_00,
    diaDoMes: 20,
    inicio: '2026-09-01',
    prazo: '2031-12-31',
    ajustes: {},
  },
]

// Conferência com a lógica do app
const ano = Number(HOJE.slice(0, 4))
const projecoes = projetarAnos(config, lancamentos, metas, ano, ano + 2)
const dias = projecoes.flatMap((p) => p.dias)
const risco = analisarRisco(dias, HOJE)
const real = (c: number) => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
console.log('Hoje', HOJE)
if (risco) {
  console.log('Risco: nível', risco.nivel, 'menor saldo', real(risco.menorSaldo.valorCentavos), 'em', risco.menorSaldo.data)
  console.log('Referência (gasto do mês):', real(risco.referenciaCentavos), '— negativo em', risco.primeiroNegativo)
  console.log('Meses:', risco.meses.map((m) => `${m.mes}:${m.nivel}`).join(' '))
  console.log('Dias por nível:', risco.diasPorNivel)
}
const cap = capacidadeDePoupanca(dias, HOJE)
console.log('Capacidade:', cap && real(cap.capacidadeCentavos), cap?.motivo, 'sobra média', cap && real(cap.sobraMediaCentavos))
console.log('Aumentos:', aumentosDeEntrada(dias, lancamentos, HOJE))
console.log('Extras:', entradasExtras(dias, lancamentos, HOJE).map((e) => `${e.descricao} ${e.data}`))
console.log('Gastos grandes:', gastosGrandes(dias, lancamentos, HOJE).itens.map((g) => `${g.descricao} ${g.data} saldo ${real(g.saldoNoDiaCentavos)}`))
const doAno = projecoes[0]
console.log('Evitável no ano:', real(totalEvitavel(gastosPorTag(doAno.dias, Object.values(T)))))
for (const p of projecoes) console.log(p.ano, 'saldo final', real(p.resumo.saldoFinalCentavos ?? 0))
for (const m of doAno.meses) console.log(`  ${m.mes}: entra ${real(m.entradasCentavos)} sai ${real(m.saidasCentavos)} guarda ${real(m.economiaCentavos)} fim ${real(m.saldoFinalCentavos ?? 0)}`)

// SQL
const texto = (s: string | undefined | null) => (s == null || s === '' ? 'null' : `'${s.replaceAll("'", "''")}'`)
const json = (v: unknown) => `'${JSON.stringify(v).replaceAll("'", "''")}'::jsonb`
const linhas = (itens: string[]) => itens.join(',\n  ')

const sql = `-- Dados de demonstração para a conta ${EMAIL}, gerados por scripts/demo/gerar-seed-demo.ts.
-- Rode no SQL Editor do Supabase. Apaga os dados atuais dessa conta e grava os de exemplo.

do $$
declare
  u uuid := (select id from auth.users where email = ${texto(EMAIL)});
begin
  if u is null then
    raise exception 'Nenhum usuário com o e-mail ${EMAIL}';
  end if;

  delete from public.lancamentos where user_id = u;
  delete from public.metas_economia where user_id = u;
  delete from public.categorias where user_id = u;
  delete from public.tags where user_id = u;
  delete from public.pastas where user_id = u;

  insert into public.configuracoes (user_id, saldo_inicial_centavos, data_saldo_inicial)
  values (u, ${config.saldoInicialCentavos}, '${config.dataSaldoInicial}')
  on conflict (user_id) do update
    set saldo_inicial_centavos = excluded.saldo_inicial_centavos,
        data_saldo_inicial = excluded.data_saldo_inicial,
        atualizado_em = now();

  insert into public.categorias (id, user_id, nome, cor, tipo) values
  ${linhas(Object.values(C).map((c) => `('${c.id}', u, ${texto(c.nome)}, '${c.cor}', '${c.tipo}')`))};

  insert into public.tags (id, user_id, nome, cor, evitavel) values
  ${linhas(Object.values(T).map((t) => `('${t.id}', u, ${texto(t.nome)}, '${t.cor}', ${t.evitavel})`))};

  insert into public.pastas (id, user_id, nome, cor) values
  ${linhas(Object.values(P).map((p) => `('${p.id}', u, ${texto(p.nome)}, '${p.cor}')`))};

  insert into public.lancamentos (id, user_id, descricao, tipo, valor_centavos, categoria_id, tag_id, pasta_id, natureza, recorrencia, inicio, fim) values
  ${linhas(
    lancamentos.map(
      (l) =>
        `('${l.id}', u, ${texto(l.descricao)}, '${l.tipo}', ${l.valorCentavos}, '${l.categoriaId}', ${texto(l.tagId)}, ${texto(l.pastaId)}, '${l.natureza}', ${json(l.recorrencia)}, ${texto(l.inicio)}, ${texto(l.fim)})`,
    ),
  )};

  insert into public.metas_economia (id, user_id, nome, valor_alvo_centavos, aporte_mensal_centavos, dia_do_mes, inicio, prazo, ajustes) values
  ${linhas(
    metas.map(
      (m) =>
        `('${m.id}', u, ${texto(m.nome)}, ${m.valorAlvoCentavos}, ${m.aporteMensalCentavos}, ${m.diaDoMes}, '${m.inicio}', ${texto(m.prazo)}, ${json(m.ajustes)})`,
    ),
  )};
end $$;
`

writeFileSync('supabase/seed-demo.sql', sql)
console.log(`\nsupabase/seed-demo.sql: ${lancamentos.length} lançamentos, ${metas.length} metas`)
