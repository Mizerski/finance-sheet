import type { Lancamento } from '@/features/lancamentos/lancamento'
import { projetarAnos, type CaixaDaProjecao } from '@/features/projecao/projecao'
import { nivelDoSaldo, pisoDoNivel, referenciaDoRisco, type NivelRisco } from '@/features/risco/risco'
import { anoDe, type DataISO } from '@/shared/lib/datas'
import { ARREDONDAMENTO_CENTAVOS, arredondar, capacidadeDePoupanca, periodoDaCapacidade } from './capacidade'
import type { MetaEconomia } from './meta'

/** O resto dos dados, sem a meta avaliada. */
export interface ContextoMeta {
  config: CaixaDaProjecao
  lancamentos: Lancamento[]
  /** As outras metas (sem a que está sendo avaliada). */
  outrasMetas: MetaEconomia[]
  hoje: DataISO
}

export type Saldo = { data: DataISO; valorCentavos: number }

/** O que vale para a meta qualquer que seja o aporte: a sobra sem ela e o maior aporte que cabe. */
export interface LimitesMeta {
  /** Sobra média por mês nos próximos 12 meses, sem esta meta. */
  sobraMediaCentavos: number
  /** Menor saldo sem esta meta, quando já é negativo (aí nenhum aporte cabe). */
  negativoSemMeta: Saldo | null
  /** Maior aporte mensal (múltiplo de R$ 10) que cabe nesta meta; 0 se nenhum. */
  maximoCentavos: number
  /** O gasto de um mês, régua do risco do caixa. */
  referenciaCentavos: number
  /** Risco do caixa nos próximos 12 meses sem esta meta. */
  nivelSemMeta: NivelRisco
  /** Maior aporte mensal que não piora o risco do caixa (≤ o máximo). */
  semPiorarCentavos: number
}

/**
 * Por que o aporte não cabe:
 * - `negativo`: o saldo já fica negativo mesmo sem a meta;
 * - `saldo`: com esse aporte, o saldo fica negativo em algum dia;
 * - `sobra`: o aporte passa da sobra média, então consumiria o dinheiro que já está na conta.
 */
export type MotivoNaoCabe = 'negativo' | 'saldo' | 'sobra'

export interface AvaliacaoAporte {
  cabe: boolean
  motivo: MotivoNaoCabe | null
  /** Dia mais apertado nos próximos 12 meses com a meta como está. */
  menorSaldo: Saldo | null
  /** Risco do caixa com a meta como está. */
  nivel: NivelRisco | null
}

/** Menor saldo entre `hoje` e o fim do período, com as metas dadas. */
export function menorSaldo(ctx: ContextoMeta, metas: MetaEconomia[]): Saldo | null {
  const { fim } = periodoDaCapacidade(ctx.hoje)
  let menor: Saldo | null = null
  for (const p of projetarAnos(ctx.config, ctx.lancamentos, metas, anoDe(ctx.hoje), anoDe(fim))) {
    for (const d of p.dias) {
      if (d.data < ctx.hoje || d.data > fim || d.saldoCentavos === null) continue
      if (!menor || d.saldoCentavos < menor.valorCentavos) menor = { data: d.data, valorCentavos: d.saldoCentavos }
    }
  }
  return menor
}

function comAporte(ctx: ContextoMeta, meta: MetaEconomia, aporte: number): Saldo | null {
  return menorSaldo(ctx, [...ctx.outrasMetas, { ...meta, aporteMensalCentavos: aporte }])
}

/**
 * Maior aporte (múltiplo de R$ 10, até `teto`) que deixa o saldo ≥ `piso` em todos os dias, por bisseção:
 * quanto maior o aporte, menor o saldo em qualquer dia.
 */
function maiorAporte(ctx: ContextoMeta, meta: MetaEconomia, teto: number, piso: number): number {
  let baixo = 0
  let alto = teto / ARREDONDAMENTO_CENTAVOS
  while (baixo < alto) {
    const meio = Math.ceil((baixo + alto) / 2)
    const saldo = comAporte(ctx, meta, meio * ARREDONDAMENTO_CENTAVOS)
    if (!saldo || saldo.valorCentavos >= piso) baixo = meio
    else alto = meio - 1
  }
  return baixo * ARREDONDAMENTO_CENTAVOS
}

/**
 * Limites da meta no fluxo projetado, simulando a própria meta (dia, início e fim ao atingir o alvo):
 * o maior aporte que não deixa o saldo negativo e o maior que não piora o risco do caixa.
 * null se não houver dias calculados nos próximos 12 meses.
 */
export function limitesDaMeta(ctx: ContextoMeta, meta: MetaEconomia): LimitesMeta | null {
  const dias = projetarAnos(
    ctx.config,
    ctx.lancamentos,
    ctx.outrasMetas,
    anoDe(ctx.hoje),
    anoDe(periodoDaCapacidade(ctx.hoje).fim),
  ).flatMap((p) => p.dias)
  const semMeta = capacidadeDePoupanca(dias, ctx.hoje)
  if (!semMeta) return null

  const sobraMediaCentavos = semMeta.sobraMediaCentavos
  const referenciaCentavos = referenciaDoRisco(dias, ctx.hoje)
  const nivelSemMeta = semMeta.menorSaldo ? nivelDoSaldo(semMeta.menorSaldo.valorCentavos, referenciaCentavos) : 1
  const negativoSemMeta = semMeta.motivo === 'negativo' ? semMeta.menorSaldo : null
  const base = { sobraMediaCentavos, referenciaCentavos, nivelSemMeta }
  if (negativoSemMeta) return { ...base, negativoSemMeta, maximoCentavos: 0, semPiorarCentavos: 0 }

  // Acima do alvo o aporte não muda nada; acima da sobra média já não cabe.
  const falta = (meta.valorAlvoCentavos ?? Infinity) - (meta.jaGuardadoCentavos ?? 0)
  const maximo = maiorAporte(ctx, meta, arredondar(Math.min(sobraMediaCentavos, Math.max(falta, 0))), 0)
  const semPiorar =
    nivelSemMeta === 5 ? maximo : maiorAporte(ctx, meta, maximo, pisoDoNivel(nivelSemMeta, referenciaCentavos))
  return { ...base, negativoSemMeta: null, maximoCentavos: maximo, semPiorarCentavos: semPiorar }
}

/** Se o aporte da meta, como está, cabe no fluxo, e o dia mais apertado com ele. */
export function avaliarAporte(ctx: ContextoMeta, meta: MetaEconomia, limites: LimitesMeta): AvaliacaoAporte {
  const menor = comAporte(ctx, meta, meta.aporteMensalCentavos)
  const motivo: MotivoNaoCabe | null = limites.negativoSemMeta
    ? 'negativo'
    : menor && menor.valorCentavos < 0
      ? 'saldo'
      : meta.aporteMensalCentavos > limites.sobraMediaCentavos
        ? 'sobra'
        : null
  const nivel = menor && nivelDoSaldo(menor.valorCentavos, limites.referenciaCentavos)
  return { cabe: motivo === null, motivo, menorSaldo: menor, nivel }
}
