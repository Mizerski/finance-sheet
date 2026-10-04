/*
 * Dados de demonstração do app desktop (formato atual de DadosFinancas), usados pelos prints do README.
 * Uma pessoa com conta corrente, poupança e vale-refeição; valores inventados.
 */
import type { Caixa } from '@/features/caixas/caixa'
import type { Categoria } from '@/features/categorias/categoria'
import type { MetaEconomia } from '@/features/economias/meta'
import type { Lancamento, Natureza, Recorrencia, TipoMovimento } from '@/features/lancamentos/lancamento'
import type { Pasta } from '@/features/pastas/pasta'
import type { Tag } from '@/features/tags/tag'
import type { DadosFinancas } from '@/store/estado'

let contador = 0
const novoId = () => `demo-${++contador}`

export function dadosDemo(): DadosFinancas {
  contador = 0

  const caixa = (nome: string, cor: string, tipo: Caixa['tipo'], reais: number, ordem: number): Caixa => ({
    id: novoId(),
    nome,
    cor,
    tipo,
    saldoInicialCentavos: Math.round(reais * 100),
    dataSaldoInicial: '2026-01-01',
    saldoDefinido: true,
    entraNoTotal: tipo === 'conta',
    ordem,
  })
  const K = {
    corrente: caixa('Conta corrente', '#1f45c4', 'conta', 8_500, 0),
    poupanca: caixa('Poupança', '#f5c518', 'conta', 1_200, 1),
    vale: caixa('Vale-refeição', '#2e8b4e', 'beneficio', 120, 2),
  }

  const cat = (nome: string, cor: string, tipo: TipoMovimento): Categoria => ({ id: novoId(), nome, cor, tipo })
  const C = {
    salario: cat('Salário', '#1f45c4', 'entrada'),
    beneficio: cat('Benefícios', '#5b9be0', 'entrada'),
    freela: cat('Freelas', '#142b6e', 'entrada'),
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

  const tag = (nome: string, cor: string, evitavel: boolean): Tag => ({ id: novoId(), nome, cor, evitavel })
  const T = {
    necessario: tag('Necessário', '#556b2f', false),
    superficial: tag('Superficial', '#c99a1a', true),
    impulso: tag('Impulso', '#ee7a1a', true),
    emergencia: tag('Emergência', '#9e1f1f', false),
  }

  const pasta = (nome: string, cor: string): Pasta => ({ id: novoId(), nome, cor })
  const P = {
    casa: pasta('Casa', '#d7322a'),
    carro: pasta('Carro', '#1d1c1a'),
    trabalho: pasta('Trabalho', '#1f45c4'),
    pessoal: pasta('Pessoal', '#f5c518'),
  }

  interface Opcoes {
    tag?: Tag
    pasta?: Pasta
    natureza?: Natureza
    inicio?: string
    fim?: string
    caixa?: Caixa
  }

  const lancamentos: Lancamento[] = []
  function lanc(tipo: TipoMovimento, descricao: string, reais: number, categoria: Categoria, recorrencia: Recorrencia, o: Opcoes = {}) {
    lancamentos.push({
      id: novoId(),
      caixaId: (o.caixa ?? K.corrente).id,
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
  entrada('Recarga do vale', 880, C.beneficio, mensal(1), { pasta: P.trabalho, caixa: K.vale })
  entrada('Rendimento da poupança', 18, C.rendimentos, mensal(1), { pasta: P.pessoal, caixa: K.poupanca })
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
  saida('Mercado da semana', 260, C.mercado, semanal(6), { tag: T.necessario, pasta: P.casa })
  saida('Feira', 50, C.mercado, semanal(3), { tag: T.necessario, pasta: P.casa, caixa: K.vale })
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
  saida('Almoço no trabalho', 28, C.restaurantes, diasUteis, { tag: T.necessario, pasta: P.trabalho, caixa: K.vale })
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
  saida('Streaming de filmes', 44.9, C.assinaturas, mensal(3), { tag: T.superficial, pasta: P.pessoal })
  saida('Streaming de música', 21.9, C.assinaturas, mensal(3), { tag: T.superficial, pasta: P.pessoal })
  saida('Armazenamento na nuvem', 14.9, C.assinaturas, mensal(3), { tag: T.necessario, pasta: P.pessoal })
  saida('Celular novo (quebrou a tela)', 2_400, C.compras, unica('2026-03-28'), { tag: T.emergencia, pasta: P.pessoal })
  saida('Tênis de corrida', 450, C.compras, unica('2026-08-14'), { tag: T.impulso, pasta: P.pessoal })
  saida('Fone bluetooth', 380, C.compras, unica('2026-06-05'), { tag: T.impulso, pasta: P.pessoal })
  saida('Show no festival', 680, C.lazer, unica('2026-10-24'), { tag: T.superficial, pasta: P.pessoal })
  saida('Black Friday', 1_100, C.compras, unica('2026-11-27'), { tag: T.impulso, pasta: P.pessoal })
  saida('Presentes de Natal', 900, C.compras, unica('2026-12-15'), { tag: T.necessario, pasta: P.pessoal })
  saida('Viagem de Réveillon', 4_800, C.lazer, unica('2026-12-27'), { tag: T.superficial, pasta: P.pessoal })
  saida('Aniversário da mãe', 350, C.compras, unica('2027-04-12'), { tag: T.necessario, pasta: P.pessoal })
  saida('Carnaval', 900, C.lazer, unica('2026-02-14'), { tag: T.superficial, pasta: P.pessoal })

  // Transferência entre contas
  lancamentos.push({
    id: novoId(),
    caixaId: K.corrente.id,
    caixaDestinoId: K.poupanca.id,
    descricao: 'Guardar parte do freela',
    tipo: 'transferencia',
    valorCentavos: 2_000_00,
    categoriaId: '',
    pastaId: P.pessoal.id,
    natureza: 'variavel',
    recorrencia: unica('2026-11-23'),
  })

  const metas: MetaEconomia[] = [
    {
      id: novoId(),
      caixaId: K.corrente.id,
      destinoId: K.poupanca.id,
      nome: 'Reserva de emergência',
      valorAlvoCentavos: 36_000_00,
      aporteMensalCentavos: 700_00,
      diaDoMes: 6,
      inicio: '2026-01-01',
      // Março: o celular quebrou e não deu para guardar. Julho: guardou a restituição do IR.
      ajustes: { '2026-03': 0, '2026-07': 1_400_00 },
    },
    {
      id: novoId(),
      caixaId: K.corrente.id,
      nome: 'Notebook novo',
      valorAlvoCentavos: 6_500_00,
      aporteMensalCentavos: 400_00,
      diaDoMes: 15,
      inicio: '2026-02-01',
      prazo: '2027-06-30',
      ajustes: {},
    },
    {
      id: novoId(),
      caixaId: K.corrente.id,
      nome: 'Viagem para o Japão',
      valorAlvoCentavos: 22_000_00,
      aporteMensalCentavos: 450_00,
      diaDoMes: 6,
      inicio: '2026-04-01',
      prazo: '2028-10-31',
      ajustes: { '2026-08': 900_00 },
    },
    {
      id: novoId(),
      caixaId: K.corrente.id,
      nome: 'Cofrinho',
      aporteMensalCentavos: 100_00,
      diaDoMes: 20,
      inicio: '2026-06-01',
      ajustes: {},
    },
  ]

  return {
    caixas: Object.values(K),
    categorias: Object.values(C),
    lancamentos,
    metas,
    tags: Object.values(T),
    pastas: Object.values(P),
  }
}
