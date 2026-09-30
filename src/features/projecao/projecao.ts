import { CATEGORIA_DESCONHECIDA, type Categoria } from '@/features/categorias/categoria'
import { indexarAportes, type Aporte } from '@/features/economias/aportes'
import type { MetaEconomia } from '@/features/economias/meta'
import type { Lancamento, Natureza, TipoMovimento } from '@/features/lancamentos/lancamento'
import { SEM_PASTA, type Pasta } from '@/features/pastas/pasta'
import { SEM_TAG, type Tag } from '@/features/tags/tag'
import { anoDe, diasDoAno, ehDiaUtil, type DataISO, type DiaCalendario } from '@/shared/lib/datas'
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

function paraOcorrencia(l: Lancamento): Ocorrencia {
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

function somar(ocorrencias: Ocorrencia[], filtro: (o: Ocorrencia) => boolean): number {
  return ocorrencias.reduce((total, o) => (filtro(o) ? total + o.valorCentavos : total), 0)
}

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
  config: Configuracao,
  indice: IndiceLancamentos,
  aportes: Map<DataISO, Aporte[]>,
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
        saldoCentavos: null,
      }
    }

    const ocorrencias = lancamentosDoDia(indice, dia).map(paraOcorrencia)
    const entradas = somar(ocorrencias, (o) => o.tipo === 'entrada')
    const fixas = somar(ocorrencias, (o) => o.tipo === 'saida' && o.natureza === 'fixa')
    const variaveis = somar(ocorrencias, (o) => o.tipo === 'saida' && o.natureza === 'variavel')
    const doDia = aportes.get(dia.data) ?? []
    const economia = doDia.reduce((t, a) => t + a.valorCentavos, 0)
    saldo += entradas - fixas - variaveis - economia

    return {
      ...base,
      noCalculo: true,
      ocorrencias,
      entradasCentavos: entradas,
      saidasFixasCentavos: fixas,
      saidasVariaveisCentavos: variaveis,
      aportes: doDia,
      economiaCentavos: economia,
      saldoCentavos: saldo,
    }
  })
}

function saldoAntesDoDia(d: DiaProjetado): number | null {
  if (d.saldoCentavos === null) return null
  return d.saldoCentavos - d.entradasCentavos + d.saidasFixasCentavos + d.saidasVariaveisCentavos + d.economiaCentavos
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

/** Total projetado nos dias (todas as ocorrências somadas) de cada lançamento, pelo id. */
export function totalPorLancamento(dias: DiaProjetado[]): Map<string, number> {
  const totais = new Map<string, number>()
  for (const d of dias) {
    for (const o of d.ocorrencias) totais.set(o.lancamentoId, (totais.get(o.lancamentoId) ?? 0) + o.valorCentavos)
  }
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
 * Os aportes das metas de economia saem do saldo como uma saída à parte.
 */
export function projetarAnos(
  config: Configuracao,
  lancamentos: Lancamento[],
  metas: MetaEconomia[],
  de: number,
  ate: number,
): Projecao[] {
  const indice = indexar(lancamentos)
  const aportes = indexarAportes(metas, `${ate}-12-31`)
  const projecoes: Projecao[] = []
  let saldo = config.saldoInicialCentavos

  for (let ano = Math.min(de, anoDe(config.dataSaldoInicial)); ano <= ate; ano++) {
    const dias = projetarDias(config, indice, aportes, ano, saldo)
    saldo = dias.at(-1)?.saldoCentavos ?? config.saldoInicialCentavos
    if (ano >= de) projecoes.push({ ano, dias, meses: agregarPorMes(dias), resumo: resumirAno(dias) })
  }
  return projecoes
}
