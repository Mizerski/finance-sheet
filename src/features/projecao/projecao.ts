import { CATEGORIA_DESCONHECIDA, type Categoria } from '@/features/categorias/categoria'
import { indexarAportes, type Aporte } from '@/features/economias/aportes'
import type { MetaEconomia } from '@/features/economias/meta'
import {
  ehMovimento,
  ehTransferencia,
  type Lancamento,
  type Natureza,
  type TipoMovimento,
  type Transferencia,
} from '@/features/lancamentos/lancamento'
import { SEM_PASTA, type Pasta } from '@/features/pastas/pasta'
import { SEM_TAG, type Tag } from '@/features/tags/tag'
import { anoDe, diasDoAno, ehDiaUtil, type DataISO, type DiaCalendario } from '@/shared/lib/datas'
import type { Periodo } from '@/shared/lib/periodo'
import type { Configuracao } from './configuracao'

export interface Ocorrencia {
  lancamentoId: string
  descricao: string
  tipo: TipoMovimento
  natureza: Natureza
  categoriaId: string
  tagId?: string
  pastaId?: string
  valorCentavos: number
}

/**
 * Um lado de uma transferência num caixa: a saída na conta de origem ou a entrada na de destino.
 * Muda o saldo, mas não é entrada nem gasto (fica fora das ocorrências e dos relatórios).
 */
export interface MovimentoTransferencia {
  lancamentoId: string
  descricao: string
  sentido: 'entrada' | 'saida'
  /** Coluna de saída na planilha da origem. */
  natureza: Natureza
  /** O outro lado: o destino (na saída) ou a origem (na entrada). */
  outroCaixaId: string
  pastaId?: string
  valorCentavos: number
  /**
   * Aporte (entrada) ou resgate (saída) de uma meta que manda o dinheiro para esta conta; `lancamentoId` é o id dela.
   * Ausente = transferência lançada.
   */
  metaId?: string
}

/** O que a projeção precisa de um caixa: o saldo inicial e o id (para saber o lado de cada transferência). */
export type CaixaDaProjecao = Configuracao & { id: string }

export interface DiaProjetado {
  data: DataISO
  mes: number
  dia: number
  /** 0 = domingo … 6 = sábado */
  diaDaSemana: number
  /** false para dias antes de dataSaldoInicial, que não entram no cálculo. */
  noCalculo: boolean
  ocorrencias: Ocorrencia[]
  entradasCentavos: number
  saidasFixasCentavos: number
  saidasVariaveisCentavos: number
  /** Aportes das metas de economia no dia (descontados do saldo, como uma saída). */
  aportes: Aporte[]
  economiaCentavos: number
  /** Transferências do dia. No Total, as que vão de um caixa do total para outro se anulam e ficam de fora. */
  transferencias: MovimentoTransferencia[]
  transferenciaEntradaCentavos: number
  transferenciaSaidaCentavos: number
  /**
   * No Total: saldo inicial de um caixa que começa neste dia, depois dos outros. Soma no saldo, mas não é entrada.
   * Num caixa só, sempre 0 (o saldo inicial fica antes do primeiro dia).
   */
  aberturaCentavos: number
  /** Saldo acumulado ao fim do dia; null fora do cálculo. */
  saldoCentavos: number | null
}

export interface ResumoMes {
  mes: number
  entradasCentavos: number
  saidasFixasCentavos: number
  saidasVariaveisCentavos: number
  saidasCentavos: number
  economiaCentavos: number
  transferenciaEntradaCentavos: number
  transferenciaSaidaCentavos: number
  /** Saldo antes do primeiro dia calculado do mês (= saldo final do mês anterior). */
  saldoInicialCentavos: number | null
  /** Saldo ao fim do último dia do mês. */
  saldoFinalCentavos: number | null
}

export interface GastoCategoria {
  categoriaId: string
  nome: string
  cor: string
  totalCentavos: number
}

export interface GastoTag {
  /** '' = saídas sem tag. */
  tagId: string
  nome: string
  cor: string
  evitavel: boolean
  totalCentavos: number
}

export interface GastoPasta {
  /** '' = saídas sem pasta. */
  pastaId: string
  nome: string
  cor: string
  totalCentavos: number
}

export interface ResumoAno {
  totalEntradasCentavos: number
  totalSaidasFixasCentavos: number
  totalSaidasVariaveisCentavos: number
  totalSaidasCentavos: number
  totalEconomiaCentavos: number
  /** Saldo antes do primeiro dia calculado do ano: o saldo inicial ou o fim do ano anterior. */
  saldoInicial: { valorCentavos: number; data: DataISO } | null
  saldoFinalCentavos: number | null
  menorSaldo: { valorCentavos: number; data: DataISO } | null
}

export interface Projecao {
  ano: number
  dias: DiaProjetado[]
  meses: ResumoMes[]
  resumo: ResumoAno
}

export function ocorreEm(lancamento: Lancamento, dia: DiaCalendario): boolean {
  if (lancamento.inicio && dia.data < lancamento.inicio) return false
  if (lancamento.fim && dia.data > lancamento.fim) return false

  const r = lancamento.recorrencia
  switch (r.tipo) {
    case 'unica':
      return dia.data === r.data
    case 'semanal':
      return r.diasDaSemana.includes(dia.diaDaSemana)
    case 'mensal':
      return dia.dia === Math.min(r.diaDoMes, dia.diasNoMes)
    case 'diaria':
      return !r.apenasDiasUteis || ehDiaUtil(dia)
  }
}

function paraOcorrencia(l: Lancamento & { tipo: TipoMovimento }): Ocorrencia {
  return {
    lancamentoId: l.id,
    descricao: l.descricao,
    tipo: l.tipo,
    natureza: l.natureza,
    categoriaId: l.categoriaId,
    ...(l.tagId && { tagId: l.tagId }),
    ...(l.pastaId && { pastaId: l.pastaId }),
    valorCentavos: l.valorCentavos,
  }
}

function somar<T extends { valorCentavos: number }>(itens: T[], filtro: (item: T) => boolean = () => true): number {
  return itens.reduce((total, item) => (filtro(item) ? total + item.valorCentavos : total), 0)
}

/** O lado da transferência que acontece no caixa: saída na origem, entrada no destino. */
function ladoNoCaixa(l: Transferencia, caixaId: string): MovimentoTransferencia[] {
  const saida = l.caixaId === caixaId
  if (!saida && l.caixaDestinoId !== caixaId) return []
  return [
    {
      lancamentoId: l.id,
      descricao: l.descricao,
      sentido: saida ? 'saida' : 'entrada',
      natureza: l.natureza,
      outroCaixaId: saida ? l.caixaDestinoId : l.caixaId,
      ...(l.pastaId && { pastaId: l.pastaId }),
      valorCentavos: l.valorCentavos,
    },
  ]
}

/** Sem as transferências que aparecem dos dois lados (de um caixa somado para outro): no Total, elas se anulam. */
function semTransferenciasInternas(movimentos: MovimentoTransferencia[]): MovimentoTransferencia[] {
  const saidas = new Set(movimentos.filter((m) => m.sentido === 'saida').map((m) => m.lancamentoId))
  const internas = new Set(
    movimentos.filter((m) => m.sentido === 'entrada' && saidas.has(m.lancamentoId)).map((m) => m.lancamentoId),
  )
  return internas.size ? movimentos.filter((m) => !internas.has(m.lancamentoId)) : movimentos
}

const entra = (m: MovimentoTransferencia) => m.sentido === 'entrada'
const sai = (m: MovimentoTransferencia) => m.sentido === 'saida'

/** Lançamentos únicos por data e recorrentes à parte, para não testar todos a cada dia. */
interface IndiceLancamentos {
  unicas: Map<DataISO, Lancamento[]>
  recorrentes: Lancamento[]
  /** Posição no cadastro, para as ocorrências do dia saírem na mesma ordem. */
  posicao: Map<string, number>
}

function indexar(lancamentos: Lancamento[]): IndiceLancamentos {
  const unicas = new Map<DataISO, Lancamento[]>()
  const recorrentes: Lancamento[] = []
  for (const l of lancamentos) {
    if (l.recorrencia.tipo !== 'unica') recorrentes.push(l)
    else unicas.set(l.recorrencia.data, [...(unicas.get(l.recorrencia.data) ?? []), l])
  }
  return { unicas, recorrentes, posicao: new Map(lancamentos.map((l, i) => [l.id, i])) }
}

function lancamentosDoDia(indice: IndiceLancamentos, dia: DiaCalendario): Lancamento[] {
  const candidatos = [...(indice.unicas.get(dia.data) ?? []), ...indice.recorrentes]
  return candidatos
    .filter((l) => ocorreEm(l, dia))
    .sort((a, b) => indice.posicao.get(a.id)! - indice.posicao.get(b.id)!)
}

/**
 * Projeta dia a dia um ano inteiro. `saldoAbertura` é o saldo antes do primeiro dia calculado:
 * o saldo inicial da configuração, ou o saldo final do ano anterior.
 */
function projetarDias(
  config: CaixaDaProjecao,
  indice: IndiceLancamentos,
  aportes: Map<DataISO, Aporte[]>,
  chegadas: Map<DataISO, MovimentoTransferencia[]>,
  ano: number,
  saldoAbertura: number,
): DiaProjetado[] {
  let saldo = saldoAbertura

  return diasDoAno(ano).map((dia) => {
    const base = { data: dia.data, mes: dia.mes, dia: dia.dia, diaDaSemana: dia.diaDaSemana }

    if (dia.data < config.dataSaldoInicial) {
      return {
        ...base,
        noCalculo: false,
        ocorrencias: [],
        entradasCentavos: 0,
        saidasFixasCentavos: 0,
        saidasVariaveisCentavos: 0,
        aportes: [],
        economiaCentavos: 0,
        transferencias: [],
        transferenciaEntradaCentavos: 0,
        transferenciaSaidaCentavos: 0,
        aberturaCentavos: 0,
        saldoCentavos: null,
      }
    }

    const doDia = lancamentosDoDia(indice, dia)
    const ocorrencias = doDia.filter(ehMovimento).map(paraOcorrencia)
    const transferencias = [
      ...doDia.filter(ehTransferencia).flatMap((l) => ladoNoCaixa(l, config.id)),
      ...(chegadas.get(dia.data) ?? []),
    ]
    const entrou = somar(transferencias, entra)
    const saiu = somar(transferencias, sai)
    const entradas = somar(ocorrencias, (o) => o.tipo === 'entrada')
    const fixas = somar(ocorrencias, (o) => o.tipo === 'saida' && o.natureza === 'fixa')
    const variaveis = somar(ocorrencias, (o) => o.tipo === 'saida' && o.natureza === 'variavel')
    const aportesDoDia = aportes.get(dia.data) ?? []
    const economia = somar(aportesDoDia)
    saldo += entradas - fixas - variaveis - economia + entrou - saiu

    return {
      ...base,
      noCalculo: true,
      ocorrencias,
      entradasCentavos: entradas,
      saidasFixasCentavos: fixas,
      saidasVariaveisCentavos: variaveis,
      aportes: aportesDoDia,
      economiaCentavos: economia,
      transferencias,
      transferenciaEntradaCentavos: entrou,
      transferenciaSaidaCentavos: saiu,
      aberturaCentavos: 0,
      saldoCentavos: saldo,
    }
  })
}

/** Saldo antes do dia: sem o movimento do dia nem o saldo inicial de um caixa que começa nele. */
export function saldoAntesDoDia(d: DiaProjetado): number | null {
  if (d.saldoCentavos === null) return null
  return (
    d.saldoCentavos -
    d.aberturaCentavos -
    d.entradasCentavos +
    d.saidasFixasCentavos +
    d.saidasVariaveisCentavos +
    d.economiaCentavos -
    d.transferenciaEntradaCentavos +
    d.transferenciaSaidaCentavos
  )
}

export function agregarPorMes(dias: DiaProjetado[]): ResumoMes[] {
  return Array.from({ length: 12 }, (_, mes) => {
    const doMes = dias.filter((d) => d.mes === mes)
    const calculados = doMes.filter((d) => d.noCalculo)
    const entradas = calculados.reduce((t, d) => t + d.entradasCentavos, 0)
    const fixas = calculados.reduce((t, d) => t + d.saidasFixasCentavos, 0)
    const variaveis = calculados.reduce((t, d) => t + d.saidasVariaveisCentavos, 0)
    const economia = calculados.reduce((t, d) => t + d.economiaCentavos, 0)

    return {
      mes,
      entradasCentavos: entradas,
      saidasFixasCentavos: fixas,
      saidasVariaveisCentavos: variaveis,
      saidasCentavos: fixas + variaveis,
      economiaCentavos: economia,
      transferenciaEntradaCentavos: calculados.reduce((t, d) => t + d.transferenciaEntradaCentavos, 0),
      transferenciaSaidaCentavos: calculados.reduce((t, d) => t + d.transferenciaSaidaCentavos, 0),
      saldoInicialCentavos: calculados.length ? saldoAntesDoDia(calculados[0]) : null,
      saldoFinalCentavos: doMes.at(-1)?.saldoCentavos ?? null,
    }
  })
}

/** Saídas agrupadas por categoria, do maior para o menor. `mes` omitido = ano inteiro. */
export function gastosPorCategoria(
  dias: DiaProjetado[],
  categorias: Categoria[],
  mes?: number,
): GastoCategoria[] {
  const totais = new Map<string, number>()
  for (const d of dias) {
    if (mes !== undefined && d.mes !== mes) continue
    for (const o of d.ocorrencias) {
      if (o.tipo !== 'saida') continue
      totais.set(o.categoriaId, (totais.get(o.categoriaId) ?? 0) + o.valorCentavos)
    }
  }

  return [...totais]
    .map(([categoriaId, totalCentavos]) => {
      const cat = categorias.find((c) => c.id === categoriaId) ?? CATEGORIA_DESCONHECIDA
      return { categoriaId, nome: cat.nome, cor: cat.cor, totalCentavos }
    })
    .sort((a, b) => b.totalCentavos - a.totalCentavos)
}

/** Saídas agrupadas por tag (as sem tag juntas, com tagId ''), do maior para o menor. */
export function gastosPorTag(dias: DiaProjetado[], tags: Tag[]): GastoTag[] {
  const porId = new Map(tags.map((t) => [t.id, t]))
  const totais = new Map<string, number>()
  for (const d of dias) {
    for (const o of d.ocorrencias) {
      if (o.tipo !== 'saida') continue
      // Tag já excluída conta como sem tag.
      const chave = o.tagId && porId.has(o.tagId) ? o.tagId : ''
      totais.set(chave, (totais.get(chave) ?? 0) + o.valorCentavos)
    }
  }

  return [...totais]
    .map(([tagId, totalCentavos]) => {
      const tag = porId.get(tagId) ?? { ...SEM_TAG, evitavel: false }
      return { tagId, nome: tag.nome, cor: tag.cor, evitavel: tag.evitavel, totalCentavos }
    })
    .sort((a, b) => b.totalCentavos - a.totalCentavos)
}

/** Pasta da ocorrência, ou '' se não tiver (ou se a pasta foi excluída). */
function pastaDa(o: Ocorrencia, pastas: Map<string, Pasta>): string {
  return o.pastaId && pastas.has(o.pastaId) ? o.pastaId : ''
}

/** Saídas agrupadas por pasta (as sem pasta juntas, com pastaId ''), do maior para o menor. */
export function gastosPorPasta(dias: DiaProjetado[], pastas: Pasta[]): GastoPasta[] {
  const porId = new Map(pastas.map((p) => [p.id, p]))
  const totais = new Map<string, number>()
  for (const d of dias) {
    for (const o of d.ocorrencias) {
      if (o.tipo !== 'saida') continue
      const chave = pastaDa(o, porId)
      totais.set(chave, (totais.get(chave) ?? 0) + o.valorCentavos)
    }
  }

  return [...totais]
    .map(([pastaId, totalCentavos]) => {
      const pasta = porId.get(pastaId) ?? SEM_PASTA
      return { pastaId, nome: pasta.nome, cor: pasta.cor, totalCentavos }
    })
    .sort((a, b) => b.totalCentavos - a.totalCentavos)
}

/** Os mesmos dias só com as ocorrências de uma pasta ('' = sem pasta), para detalhar a pasta por categoria. */
export function diasDaPasta(dias: DiaProjetado[], pastaId: string, pastas: Pasta[]): DiaProjetado[] {
  const porId = new Map(pastas.map((p) => [p.id, p]))
  return dias.map((d) => ({ ...d, ocorrencias: d.ocorrencias.filter((o) => pastaDa(o, porId) === pastaId) }))
}

/** Soma das saídas com tags evitáveis. */
export function totalEvitavel(gastos: GastoTag[]): number {
  return gastos.reduce((t, g) => (g.evitavel ? t + g.totalCentavos : t), 0)
}

/** Dias projetados dentro do período, atravessando quantos anos forem preciso. */
export function diasNoPeriodo(projecoes: Projecao[], { de, ate }: Periodo): DiaProjetado[] {
  return projecoes
    .filter((p) => p.ano >= anoDe(de) && p.ano <= anoDe(ate))
    .flatMap((p) => p.dias.filter((d) => d.data >= de && d.data <= ate))
}

/**
 * Cada acontecimento de lançamento nos dias (ocorrências e transferências), um por vez. Com dias de vários caixas,
 * a transferência conta uma vez só: pelo lado da saída, ou pelo da entrada se a origem não estiver nos dias.
 */
function* acontecimentos(dias: DiaProjetado[]): Generator<{ lancamentoId: string; valorCentavos: number }> {
  const comSaida = new Set(dias.flatMap((d) => d.transferencias.filter(sai).map((m) => m.lancamentoId)))
  for (const d of dias) {
    yield* d.ocorrencias
    for (const m of d.transferencias) if (m.sentido === 'saida' || !comSaida.has(m.lancamentoId)) yield m
  }
}

/** Quantas vezes cada lançamento acontece nos dias e quanto isso soma, pelo id (só os que acontecem). */
export function ocorrenciasPorLancamento(dias: DiaProjetado[]): Map<string, { vezes: number; totalCentavos: number }> {
  const porId = new Map<string, { vezes: number; totalCentavos: number }>()
  for (const o of acontecimentos(dias)) {
    const atual = porId.get(o.lancamentoId) ?? { vezes: 0, totalCentavos: 0 }
    porId.set(o.lancamentoId, { vezes: atual.vezes + 1, totalCentavos: atual.totalCentavos + o.valorCentavos })
  }
  return porId
}

/** Total projetado nos dias (ocorrências e transferências somadas) de cada lançamento, pelo id. */
export function totalPorLancamento(dias: DiaProjetado[]): Map<string, number> {
  const totais = new Map<string, number>()
  for (const o of acontecimentos(dias)) totais.set(o.lancamentoId, (totais.get(o.lancamentoId) ?? 0) + o.valorCentavos)
  return totais
}

/** Total projetado no ano (entradas e saídas) de cada categoria, pelo id. */
export function totalPorCategoria(dias: DiaProjetado[]): Map<string, number> {
  const totais = new Map<string, number>()
  for (const d of dias) {
    for (const o of d.ocorrencias) {
      totais.set(o.categoriaId, (totais.get(o.categoriaId) ?? 0) + o.valorCentavos)
    }
  }
  return totais
}

export function resumirAno(dias: DiaProjetado[]): ResumoAno {
  let totalEntradas = 0
  let totalFixas = 0
  let totalVariaveis = 0
  let totalEconomia = 0
  let saldoInicial: ResumoAno['saldoInicial'] = null
  let menorSaldo: ResumoAno['menorSaldo'] = null
  let saldoFinal: number | null = null

  for (const d of dias) {
    totalEntradas += d.entradasCentavos
    totalFixas += d.saidasFixasCentavos
    totalVariaveis += d.saidasVariaveisCentavos
    totalEconomia += d.economiaCentavos
    if (d.saldoCentavos === null) continue
    saldoInicial ??= { valorCentavos: saldoAntesDoDia(d)!, data: d.data }
    saldoFinal = d.saldoCentavos
    // Estritamente menor: em caso de empate, fica a primeira data.
    if (!menorSaldo || d.saldoCentavos < menorSaldo.valorCentavos) {
      menorSaldo = { valorCentavos: d.saldoCentavos, data: d.data }
    }
  }

  return {
    totalEntradasCentavos: totalEntradas,
    totalSaidasFixasCentavos: totalFixas,
    totalSaidasVariaveisCentavos: totalVariaveis,
    totalSaidasCentavos: totalFixas + totalVariaveis,
    totalEconomiaCentavos: totalEconomia,
    saldoInicial,
    saldoFinalCentavos: saldoFinal,
    menorSaldo,
  }
}

/**
 * Projeta os anos de `de` a `ate`, um resultado por ano.
 * O saldo é encadeado desde o ano de dataSaldoInicial: o fim de um ano é a abertura do seguinte.
 * Os aportes das metas de economia saem do saldo como uma saída à parte (e os resgates voltam); as transferências
 * mudam o saldo do lado do caixa (saída na origem, entrada no destino). A meta que manda o dinheiro para este caixa
 * (`destinoId`) chega aqui como transferência.
 */
export function projetarAnos(
  config: CaixaDaProjecao,
  lancamentos: Lancamento[],
  metas: MetaEconomia[],
  de: number,
  ate: number,
): Projecao[] {
  const indice = indexar(lancamentos)
  const fim = `${ate}-12-31`
  const chegando = (m: MetaEconomia) => m.destinoId === config.id && m.caixaId !== config.id
  const aportes = indexarAportes(metas.filter((m) => !chegando(m)), fim)
  const chegadas = chegadasDasMetas(metas.filter(chegando), fim)
  const projecoes: Projecao[] = []
  let saldo = config.saldoInicialCentavos

  for (let ano = Math.min(de, anoDe(config.dataSaldoInicial)); ano <= ate; ano++) {
    const dias = projetarDias(config, indice, aportes, chegadas, ano, saldo)
    saldo = dias.at(-1)?.saldoCentavos ?? config.saldoInicialCentavos
    if (ano >= de) projecoes.push({ ano, dias, meses: agregarPorMes(dias), resumo: resumirAno(dias) })
  }
  return projecoes
}

/** Aportes e resgates das metas que mandam o dinheiro para o caixa, como transferências (entrada e saída), por data. */
function chegadasDasMetas(metas: MetaEconomia[], ate: DataISO): Map<DataISO, MovimentoTransferencia[]> {
  const origem = new Map(metas.map((m) => [m.id, m.caixaId]))
  const porData = new Map<DataISO, MovimentoTransferencia[]>()
  for (const [data, lista] of indexarAportes(metas, ate)) {
    porData.set(
      data,
      lista.map((a) => ({
        lancamentoId: a.metaId,
        metaId: a.metaId,
        descricao: a.nome,
        sentido: a.valorCentavos > 0 ? 'entrada' : 'saida',
        natureza: a.resgateId ? 'variavel' : 'fixa',
        outroCaixaId: origem.get(a.metaId)!,
        valorCentavos: Math.abs(a.valorCentavos),
      })),
    )
  }
  return porData
}

/**
 * Total: a soma dia a dia das projeções de vários caixas (cada um com o próprio saldo inicial, lançamentos e metas),
 * não uma projeção nova com tudo misturado. Todas as listas cobrem os mesmos anos, de `de` a `ate`.
 * O saldo inicial de um caixa que começa depois dos outros entra no dia em `aberturaCentavos`, fora das entradas.
 * Transferência entre dois caixas somados some (o saldo já se anula); para um caixa de fora, fica o lado de dentro.
 * Com um caixa só, devolve a própria projeção dele.
 */
export function somarProjecoes(porCaixa: Projecao[][], de: number, ate: number): Projecao[] {
  if (porCaixa.length === 1) return porCaixa[0]

  const iniciados = porCaixa.map(() => false)
  let somaIniciada = false
  const projecoes: Projecao[] = []

  for (let ano = de; ano <= ate; ano++) {
    const doAno = porCaixa.map((p) => p[ano - de].dias)
    const dias = diasDoAno(ano).map((dia, i): DiaProjetado => {
      const doDia = doAno.map((d) => d[i])
      let abertura = 0
      doDia.forEach((d, c) => {
        if (!d.noCalculo || iniciados[c]) return
        iniciados[c] = true
        if (somaIniciada) abertura += saldoAntesDoDia(d)!
      })
      const calculados = doDia.filter((d) => d.noCalculo)
      const noCalculo = calculados.length > 0
      somaIniciada ||= noCalculo
      const somar = (campo: (d: DiaProjetado) => number) => calculados.reduce((t, d) => t + campo(d), 0)
      const transferencias = semTransferenciasInternas(calculados.flatMap((d) => d.transferencias))

      return {
        data: dia.data,
        mes: dia.mes,
        dia: dia.dia,
        diaDaSemana: dia.diaDaSemana,
        noCalculo,
        ocorrencias: calculados.flatMap((d) => d.ocorrencias),
        entradasCentavos: somar((d) => d.entradasCentavos),
        saidasFixasCentavos: somar((d) => d.saidasFixasCentavos),
        saidasVariaveisCentavos: somar((d) => d.saidasVariaveisCentavos),
        aportes: calculados.flatMap((d) => d.aportes),
        economiaCentavos: somar((d) => d.economiaCentavos),
        transferencias,
        transferenciaEntradaCentavos: transferencias.filter(entra).reduce((t, m) => t + m.valorCentavos, 0),
        transferenciaSaidaCentavos: transferencias.filter(sai).reduce((t, m) => t + m.valorCentavos, 0),
        aberturaCentavos: abertura + somar((d) => d.aberturaCentavos),
        saldoCentavos: noCalculo ? somar((d) => d.saldoCentavos!) : null,
      }
    })
    projecoes.push({ ano, dias, meses: agregarPorMes(dias), resumo: resumirAno(dias) })
  }
  return projecoes
}
