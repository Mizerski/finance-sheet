import { anoDe, diasNoMes, type DataISO } from '@/shared/lib/datas'
import { temAlvo, type MetaEconomia, type Resgate } from './meta'

/**
 * Um aporte de uma meta num dia: sai do saldo na coluna Economia da planilha.
 * Na projeção, um resgate também entra aqui, com valor negativo (o dinheiro volta para o saldo).
 */
export interface Aporte {
  metaId: string
  nome: string
  data: DataISO
  /** "yyyy-MM", a chave dos ajustes. */
  mes: string
  valorCentavos: number
  /** O valor veio de um ajuste do usuário, não do aporte mensal. */
  ajustado: boolean
  /** Id do resgate, quando é dinheiro tirado da meta (valor negativo). */
  resgateId?: string
}

export interface ResumoMeta {
  /** O que está na meta hoje: os aportes até hoje menos o que já foi usado. */
  guardadoCentavos: number
  /** Sem valor alvo, 0. */
  faltaCentavos: number
  /** De 0 a 1 (0 sem valor alvo). */
  percentual: number
  /** Sem valor alvo, nunca. */
  concluida: boolean
  /** Encerrada até hoje: não guarda mais. */
  encerrada: boolean
  /** Aportes com data até hoje (inclui meses ajustados para zero). */
  aportesVencidos: Aporte[]
  /** Média real por aporte vencido; null antes do primeiro aporte. */
  mediaCentavos: number | null
  /** Ritmo usado nas previsões: a média real ou, sem histórico, o aporte mensal. */
  ritmoCentavos: number
  /** Quanto terá sido guardado em 31/12 do ano de hoje, no ritmo. */
  previstoFimDoAnoCentavos: number
  /** Quanto terá sido guardado daqui a 12 meses, pelo plano (aporte mensal + ajustes). */
  emUmAnoCentavos: number
  /** Data do aporte que completa a meta no ritmo; null se o ritmo for zero ou sem valor alvo. */
  conclusaoPrevista: DataISO | null
  /** Data do aporte que completa a meta seguindo o plano (aporte mensal + ajustes); null sem valor alvo. */
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

/** Resgates da meta até `ate` (inclusive), por data. */
export function resgatesDaMeta(meta: MetaEconomia, ate: DataISO = '9999-12-31'): Resgate[] {
  return (meta.resgates ?? []).filter((r) => r.data <= ate).sort((a, b) => a.data.localeCompare(b.data))
}

/** O que está na meta no fim de `data`: os aportes menos o que foi usado. */
export function guardadoNaMeta(meta: MetaEconomia, data: DataISO): number {
  const aportes = aportesDaMeta(meta, data).reduce((t, a) => t + a.valorCentavos, 0)
  return aportes - resgatesDaMeta(meta, data).reduce((t, r) => t + r.valorCentavos, 0)
}

/**
 * Dinheiro separado nas metas que ficam na própria conta (sem destino) no fim de `data`: saiu do disponível,
 * mas continua na conta. Meta com destino não entra: o dinheiro dela está no saldo da outra conta.
 */
export function guardadoSeparado(metas: MetaEconomia[], data: DataISO): number {
  return metas.filter((m) => !m.destinoId).reduce((t, m) => t + guardadoNaMeta(m, data), 0)
}

/**
 * Aportes da meta até `ate` (inclusive). Cada mês usa o ajuste, se houver, ou o aporte mensal;
 * o último aporte é só o que falta, e depois de atingir o valor alvo os aportes param (sem alvo, nunca param).
 * Um resgate tira dinheiro da meta, e ela volta a guardar até completar de novo; depois de encerrada, não guarda mais.
 */
export function aportesDaMeta(meta: MetaEconomia, ate: DataISO): Aporte[] {
  const aportes: Aporte[] = []
  const alvo = temAlvo(meta) ? meta.valorAlvoCentavos : Infinity
  const resgates = resgatesDaMeta(meta)
  let usados = 0
  let guardado = 0

  for (const data of datasDeAporte(meta)) {
    if (data > ate || (meta.encerradaEm && data > meta.encerradaEm)) break
    // O resgate do mesmo dia vem antes do aporte.
    while (usados < resgates.length && resgates[usados].data <= data) guardado -= resgates[usados++].valorCentavos
    if (guardado >= alvo) {
      // Completa: só volta a guardar se ainda houver um resgate pela frente.
      if (usados >= resgates.length) break
      continue
    }
    const mes = data.slice(0, 7)
    const ajustado = mes in meta.ajustes
    const planejado = ajustado ? meta.ajustes[mes] : meta.aporteMensalCentavos
    const valor = Math.min(planejado, alvo - guardado)
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
 * e divide o que falta pelos outros meses até o prazo. null sem prazo, sem valor alvo ou sem mês livre até o prazo.
 */
export function aporteParaOPrazo(meta: MetaEconomia): number | null {
  if (!meta.prazo || !temAlvo(meta)) return null
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
  // Sem valor alvo, a meta nunca termina: não falta nada, não há percentual nem data de conclusão.
  const alvo = temAlvo(meta) ? meta.valorAlvoCentavos : null
  const vencidos = aportesDaMeta(meta, hoje)
  const aportado = vencidos.reduce((t, a) => t + a.valorCentavos, 0)
  const guardado = guardadoNaMeta(meta, hoje)
  const falta = alvo === null ? 0 : Math.max(alvo - guardado, 0)
  const concluida = alvo !== null && falta === 0
  const encerrada = !!meta.encerradaEm && meta.encerradaEm <= hoje

  const media = vencidos.length ? Math.round(aportado / vencidos.length) : null
  const ritmo = media ?? meta.aporteMensalCentavos

  const fimDoAno = `${anoDe(hoje)}-12-31`
  const restantesNoAno = concluida || encerrada ? 0 : aportesEntre(meta, hoje, fimDoAno)
  const previstoFimDoAno = Math.min(guardado + ritmo * restantesNoAno, alvo ?? Infinity)
  const emUmAno = guardadoNaMeta(meta, `${anoDe(hoje) + 1}${hoje.slice(4)}`)

  const conclusaoPrevista =
    alvo === null || (encerrada && !concluida)
      ? null
      : concluida
        ? (vencidos.at(-1)?.data ?? null)
        : ritmo > 0
          ? aporteNumero(meta, hoje, Math.ceil(falta / ritmo) - 1)
          : null

  let conclusaoNoPlano: DataISO | null = null
  if (alvo !== null) {
    const plano = aportesDaMeta(meta, '9999-12-31')
    const totalNoPlano = guardadoNaMeta(meta, '9999-12-31')
    conclusaoNoPlano = totalNoPlano >= alvo ? (plano.at(-1)?.data ?? null) : null
  }

  return {
    guardadoCentavos: guardado,
    faltaCentavos: falta,
    percentual: alvo ? Math.max(Math.min(guardado / alvo, 1), 0) : 0,
    concluida,
    encerrada,
    aportesVencidos: vencidos,
    mediaCentavos: media,
    ritmoCentavos: ritmo,
    previstoFimDoAnoCentavos: previstoFimDoAno,
    emUmAnoCentavos: emUmAno,
    conclusaoPrevista,
    conclusaoNoPlano,
    noPrazo: meta.prazo ? conclusaoNoPlano !== null && conclusaoNoPlano <= meta.prazo : null,
    aporteParaOPrazoCentavos: aporteParaOPrazo(meta),
  }
}

/**
 * Aportes de todas as metas até `ate`, por data, para a projeção. Aportes de valor zero ficam de fora.
 * Os resgates entram com valor negativo: o dinheiro volta para o saldo.
 */
export function indexarAportes(metas: MetaEconomia[], ate: DataISO): Map<DataISO, Aporte[]> {
  const porData = new Map<DataISO, Aporte[]>()
  const incluir = (a: Aporte) => porData.set(a.data, [...(porData.get(a.data) ?? []), a])
  for (const meta of metas) {
    for (const aporte of aportesDaMeta(meta, ate)) if (aporte.valorCentavos > 0) incluir(aporte)
    for (const r of resgatesDaMeta(meta, ate)) {
      incluir({
        metaId: meta.id,
        nome: meta.nome,
        data: r.data,
        mes: r.data.slice(0, 7),
        valorCentavos: -r.valorCentavos,
        ajustado: false,
        resgateId: r.id,
      })
    }
  }
  return porData
}
