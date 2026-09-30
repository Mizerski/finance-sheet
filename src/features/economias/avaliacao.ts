import type { Lancamento } from '@/features/lancamentos/lancamento'
import type { Configuracao } from '@/features/projecao/configuracao'
import { projetarAnos } from '@/features/projecao/projecao'
import { anoDe, type DataISO } from '@/shared/lib/datas'
import { ARREDONDAMENTO_CENTAVOS, arredondar, capacidadeDePoupanca, periodoDaCapacidade } from './capacidade'
import type { MetaEconomia } from './meta'

/** O resto dos dados, sem a meta avaliada. */
export interface ContextoMeta {
  config: Configuracao
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
 * Limites da meta no fluxo projetado, simulando a própria meta (dia, início e fim ao atingir o alvo).
 * O maior aporte é buscado por bisseção: quanto maior o aporte, menor o saldo em qualquer dia.
 * null se não houver dias calculados nos próximos 12 meses.
 */
export function limitesDaMeta(ctx: ContextoMeta, meta: MetaEconomia): LimitesMeta | null {
  const semMeta = capacidadeDePoupanca(
    projetarAnos(ctx.config, ctx.lancamentos, ctx.outrasMetas, anoDe(ctx.hoje), anoDe(periodoDaCapacidade(ctx.hoje).fim))
      .flatMap((p) => p.dias),
    ctx.hoje,
  )
  if (!semMeta) return null

  const sobraMediaCentavos = semMeta.sobraMediaCentavos
  const negativoSemMeta = semMeta.motivo === 'negativo' ? semMeta.menorSaldo : null
  if (negativoSemMeta) return { sobraMediaCentavos, negativoSemMeta, maximoCentavos: 0 }

  // Acima do alvo o aporte não muda nada; acima da sobra média já não cabe.
  let baixo = 0
  let alto = arredondar(Math.min(sobraMediaCentavos, meta.valorAlvoCentavos)) / ARREDONDAMENTO_CENTAVOS
  while (baixo < alto) {
    const meio = Math.ceil((baixo + alto) / 2)
    const saldo = comAporte(ctx, meta, meio * ARREDONDAMENTO_CENTAVOS)
    if (!saldo || saldo.valorCentavos >= 0) baixo = meio
    else alto = meio - 1
  }
  return { sobraMediaCentavos, negativoSemMeta: null, maximoCentavos: baixo * ARREDONDAMENTO_CENTAVOS }
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
  return { cabe: motivo === null, motivo, menorSaldo: menor }
}
