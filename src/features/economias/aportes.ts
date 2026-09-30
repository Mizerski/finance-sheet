import { anoDe, diasNoMes, type DataISO } from '@/shared/lib/datas'
import type { MetaEconomia } from './meta'

/** Um aporte de uma meta num dia: sai do saldo na coluna Economia da planilha. */
export interface Aporte {
  metaId: string
  nome: string
  data: DataISO
  /** "yyyy-MM", a chave dos ajustes. */
  mes: string
  valorCentavos: number
  /** O valor veio de um ajuste do usuário, não do aporte mensal. */
  ajustado: boolean
}

export interface ResumoMeta {
  /** Soma dos aportes até hoje. */
  guardadoCentavos: number
  faltaCentavos: number
  /** De 0 a 1. */
  percentual: number
  concluida: boolean
  /** Aportes com data até hoje (inclui meses ajustados para zero). */
  aportesVencidos: Aporte[]
  /** Média real por aporte vencido; null antes do primeiro aporte. */
  mediaCentavos: number | null
  /** Ritmo usado nas previsões: a média real ou, sem histórico, o aporte mensal. */
  ritmoCentavos: number
  /** Quanto terá sido guardado em 31/12 do ano de hoje, no ritmo. */
  previstoFimDoAnoCentavos: number
  /** Data do aporte que completa a meta no ritmo; null se o ritmo for zero. */
  conclusaoPrevista: DataISO | null
  /** Data do aporte que completa a meta seguindo o plano (aporte mensal + ajustes). */
  conclusaoNoPlano: DataISO | null
  /** Pelo plano, a meta completa até o prazo; null se ela não tiver prazo. */
  noPrazo: boolean | null
  /** Aporte mensal que completa a meta até o prazo (ver `aporteParaOPrazo`). */
  aporteParaOPrazoCentavos: number | null
}

/** Horizonte de busca quando a meta não tem fim natural (ex.: aporte zero): 100 anos. */
const MESES_MAXIMOS = 1200

function dataDoAporte(ano: number, mes: number, diaDoMes: number): DataISO {
  const dia = Math.min(diaDoMes, diasNoMes(ano, mes))
  return `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

/** Datas de aporte a partir do mês de `inicio`, uma por mês (as anteriores a `inicio` ficam de fora). */
function* datasDeAporte(meta: MetaEconomia): Generator<DataISO> {
  let ano = anoDe(meta.inicio)
  let mes = Number(meta.inicio.slice(5, 7)) - 1
  for (let i = 0; i < MESES_MAXIMOS; i++) {
    const data = dataDoAporte(ano, mes, meta.diaDoMes)
    if (data >= meta.inicio) yield data
    mes = (mes + 1) % 12
    if (mes === 0) ano++
  }
}

/**
 * Aportes da meta até `ate` (inclusive). Cada mês usa o ajuste, se houver, ou o aporte mensal;
 * o último aporte é só o que falta, e depois de atingir o valor alvo os aportes param.
 */
export function aportesDaMeta(meta: MetaEconomia, ate: DataISO): Aporte[] {
  const aportes: Aporte[] = []
  let guardado = 0

  for (const data of datasDeAporte(meta)) {
    if (data > ate || guardado >= meta.valorAlvoCentavos) break
    const mes = data.slice(0, 7)
    const ajustado = mes in meta.ajustes
    const planejado = ajustado ? meta.ajustes[mes] : meta.aporteMensalCentavos
    const valor = Math.min(planejado, meta.valorAlvoCentavos - guardado)
    aportes.push({ metaId: meta.id, nome: meta.nome, data, mes, valorCentavos: valor, ajustado })
    guardado += valor
  }
  return aportes
}

/** Data do n-ésimo aporte (0 = o próximo) depois de `depoisDe`, pelo calendário da meta. */
function aporteNumero(meta: MetaEconomia, depoisDe: DataISO, n: number): DataISO | null {
  let i = 0
  for (const data of datasDeAporte(meta)) {
    if (data <= depoisDe) continue
    if (i++ === n) return data
  }
  return null
}

/** Quantas datas de aporte da meta caem entre `depoisDe` (exclusive) e `ate` (inclusive). */
function aportesEntre(meta: MetaEconomia, depoisDe: DataISO, ate: DataISO): number {
  let n = 0
  for (const data of datasDeAporte(meta)) {
    if (data > ate) break
    if (data > depoisDe) n++
  }
  return n
}

/**
 * Menor aporte mensal que completa a meta até o prazo, arredondado para cima em reais.
 * Como o aporte mensal vale para todo mês sem ajuste (inclusive os que já passaram), a conta mantém os ajustes
 * e divide o que falta pelos outros meses até o prazo. null sem prazo ou sem mês livre até ele.
 */
export function aporteParaOPrazo(meta: MetaEconomia): number | null {
  if (!meta.prazo) return null
  let fixo = 0
  let livres = 0
  for (const data of datasDeAporte(meta)) {
    if (data > meta.prazo) break
    const mes = data.slice(0, 7)
    if (mes in meta.ajustes) fixo += meta.ajustes[mes]
    else livres++
  }
  const falta = meta.valorAlvoCentavos - fixo
  if (falta <= 0) return 0
  return livres ? Math.ceil(falta / livres / 100) * 100 : null
}

/** Situação da meta em `hoje`: quanto foi guardado, a média real e as previsões no ritmo atual. */
export function resumirMeta(meta: MetaEconomia, hoje: DataISO): ResumoMeta {
  const alvo = meta.valorAlvoCentavos
  const vencidos = aportesDaMeta(meta, hoje)
  const guardado = vencidos.reduce((t, a) => t + a.valorCentavos, 0)
  const falta = Math.max(alvo - guardado, 0)
  const concluida = falta === 0

  const media = vencidos.length ? Math.round(guardado / vencidos.length) : null
  const ritmo = media ?? meta.aporteMensalCentavos

  const fimDoAno = `${anoDe(hoje)}-12-31`
  const restantesNoAno = concluida ? 0 : aportesEntre(meta, hoje, fimDoAno)
  const previstoFimDoAno = Math.min(guardado + ritmo * restantesNoAno, alvo)

  const conclusaoPrevista = concluida
    ? (vencidos.at(-1)?.data ?? null)
    : ritmo > 0
      ? aporteNumero(meta, hoje, Math.ceil(falta / ritmo) - 1)
      : null

  const plano = aportesDaMeta(meta, '9999-12-31')
  const totalNoPlano = plano.reduce((t, a) => t + a.valorCentavos, 0)
  const conclusaoNoPlano = totalNoPlano >= alvo ? (plano.at(-1)?.data ?? null) : null

  return {
    guardadoCentavos: guardado,
    faltaCentavos: falta,
    percentual: alvo > 0 ? Math.min(guardado / alvo, 1) : 0,
    concluida,
    aportesVencidos: vencidos,
    mediaCentavos: media,
    ritmoCentavos: ritmo,
    previstoFimDoAnoCentavos: previstoFimDoAno,
    conclusaoPrevista,
    conclusaoNoPlano,
    noPrazo: meta.prazo ? conclusaoNoPlano !== null && conclusaoNoPlano <= meta.prazo : null,
    aporteParaOPrazoCentavos: aporteParaOPrazo(meta),
  }
}

/** Aportes de todas as metas até `ate`, por data, para a projeção. Aportes de valor zero ficam de fora. */
export function indexarAportes(metas: MetaEconomia[], ate: DataISO): Map<DataISO, Aporte[]> {
  const porData = new Map<DataISO, Aporte[]>()
  for (const meta of metas) {
    for (const aporte of aportesDaMeta(meta, ate)) {
      if (aporte.valorCentavos > 0) porData.set(aporte.data, [...(porData.get(aporte.data) ?? []), aporte])
    }
  }
  return porData
}
