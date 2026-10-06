import { capacidadeDePoupanca, periodoDaCapacidade } from '@/features/economias/utils/capacidade'
import { gastoEssencial } from '@/features/economias/utils/reserva'
import type { DiaProjetado } from '@/features/projecao/utils/projecao'
import type { DataISO } from '@/shared/lib/datas'

/** Risco do caixa, de 1 (tranquilo) a 5 (risco muito alto). */
export type NivelRisco = 1 | 2 | 3 | 4 | 5

export const NIVEIS: readonly NivelRisco[] = [1, 2, 3, 4, 5]

export interface InfoNivel {
  nome: string
  /** Para espaços apertados (cabeçalho do mês, faixa dos meses). */
  curto: string
  /** Parte de um mês de gastos que o saldo precisa ter, no mínimo, para ficar no nível. */
  fracao: number
  /** O que o nível quer dizer, em dias de gastos (mais fácil de imaginar que uma fração do mês). */
  significado: string
}

/**
 * A régua compara o saldo do dia com o gasto de um mês: quanto do que você gasta num mês ainda está na conta.
 * Abaixo de 5% (ou negativo), qualquer imprevisto deixa a conta no vermelho.
 */
export const NIVEL: Record<NivelRisco, InfoNivel> = {
  1: { nome: 'Tranquilo', curto: 'Tranquilo', fracao: 0.5, significado: 'o que sobra dá para mais de 15 dias de gastos' },
  2: { nome: 'Estável', curto: 'Estável', fracao: 0.25, significado: 'dá para uma a duas semanas de gastos' },
  3: { nome: 'Atenção', curto: 'Atenção', fracao: 0.1, significado: 'dá para 3 a 7 dias de gastos' },
  4: { nome: 'Risco alto', curto: 'Alto', fracao: 0.05, significado: 'dá para só 2 ou 3 dias de gastos' },
  5: {
    nome: 'Risco muito alto',
    curto: 'Muito alto',
    fracao: 0,
    significado: 'dá para menos de 2 dias de gastos, ou falta dinheiro',
  },
}

export interface SaldoNoDia {
  data: DataISO
  valorCentavos: number
}

export interface RiscoDoMes {
  /** "2026-10" */
  mes: string
  /** O nível do dia mais apertado do mês. */
  nivel: NivelRisco
  menorSaldo: SaldoNoDia
}

/** O risco do caixa de `hoje` até o fim do período da capacidade (o 12º mês depois deste). */
export interface AnaliseRisco {
  /** O gasto de um mês: média mensal das saídas nos próximos 12 meses. */
  referenciaCentavos: number
  fim: DataISO
  /** O pior nível do período, o do dia mais apertado. */
  nivel: NivelRisco
  menorSaldo: SaldoNoDia
  /** Primeiro dia em que o caixa chega ao pior nível. */
  primeiroDiaNoNivel: DataISO
  /** Primeiro dia com saldo negativo; null se não faltar dinheiro. */
  primeiroNegativo: DataISO | null
  /** Maior saldo do período (limite da busca da maior conta que cabe). */
  maiorSaldoCentavos: number
  meses: RiscoDoMes[]
  /** Quantos dias do período ficam em cada nível. */
  diasPorNivel: Record<NivelRisco, number>
}

/** Nível do saldo de um dia, comparado ao gasto de um mês. Sem gastos, só o saldo negativo é risco. */
export function nivelDoSaldo(saldoCentavos: number, referenciaCentavos: number): NivelRisco {
  if (saldoCentavos < 0) return 5
  if (referenciaCentavos <= 0) return 1
  for (const nivel of [1, 2, 3, 4] as const) {
    if (saldoCentavos >= NIVEL[nivel].fracao * referenciaCentavos) return nivel
  }
  return 5
}

/** Menor saldo que mantém o caixa no nível (no 5, só não ficar negativo). */
export function pisoDoNivel(nivel: NivelRisco, referenciaCentavos: number): number {
  return Math.ceil(NIVEL[nivel].fracao * Math.max(referenciaCentavos, 0))
}

/** O gasto de um mês que a régua usa: o mesmo das saídas mensais da reserva de emergência. */
export function referenciaDoRisco(dias: DiaProjetado[], hoje: DataISO): number {
  return gastoEssencial(dias, [], hoje).saidasMensaisCentavos
}

/**
 * Risco pelos dias projetados, de `hoje` até o fim do período; null sem dias calculados.
 * No empate do menor saldo, fica a primeira data.
 */
export function analisarRisco(
  dias: DiaProjetado[],
  hoje: DataISO,
  referenciaCentavos = referenciaDoRisco(dias, hoje),
): AnaliseRisco | null {
  const { fim } = periodoDaCapacidade(hoje)
  const diasPorNivel: Record<NivelRisco, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  const meses: RiscoDoMes[] = []
  const niveis: { data: DataISO; nivel: NivelRisco }[] = []
  let menor: SaldoNoDia | null = null
  let maior = 0
  let negativo: DataISO | null = null

  for (const d of dias) {
    if (d.data < hoje || d.data > fim || d.saldoCentavos === null) continue
    const saldo = { data: d.data, valorCentavos: d.saldoCentavos }
    const nivel = nivelDoSaldo(saldo.valorCentavos, referenciaCentavos)
    diasPorNivel[nivel]++
    niveis.push({ data: d.data, nivel })
    maior = Math.max(maior, saldo.valorCentavos)
    if (saldo.valorCentavos < 0) negativo ??= d.data
    if (!menor || saldo.valorCentavos < menor.valorCentavos) menor = saldo

    const mes = d.data.slice(0, 7)
    const doMes = meses.at(-1)
    if (doMes?.mes !== mes) meses.push({ mes, nivel, menorSaldo: saldo })
    else if (saldo.valorCentavos < doMes.menorSaldo.valorCentavos) Object.assign(doMes, { nivel, menorSaldo: saldo })
  }

  if (!menor) return null
  const nivel = nivelDoSaldo(menor.valorCentavos, referenciaCentavos)
  return {
    referenciaCentavos,
    fim,
    nivel,
    menorSaldo: menor,
    primeiroDiaNoNivel: niveis.find((n) => n.nivel === nivel)!.data,
    primeiroNegativo: negativo,
    maiorSaldoCentavos: maior,
    meses,
    diasPorNivel,
  }
}

/**
 * Quanto dá para guardar a mais por mês (aporte no dia 1º, como na capacidade) sem o caixa passar de cada nível.
 * Nos níveis melhores que o atual, 0: o caixa já fica abaixo deles sem guardar nada.
 */
export function capacidadePorNivel(
  dias: DiaProjetado[],
  hoje: DataISO,
  referenciaCentavos: number,
): Record<NivelRisco, number> {
  const valor = (nivel: NivelRisco) =>
    capacidadeDePoupanca(dias, hoje, pisoDoNivel(nivel, referenciaCentavos))?.capacidadeCentavos ?? 0
  return { 1: valor(1), 2: valor(2), 3: valor(3), 4: valor(4), 5: valor(5) }
}

/**
 * Para quantos dias de gastos o saldo dá, contando o mês com 30 dias (inteiro para baixo); null sem gastos.
 * É o mesmo que o percentual do mês, dito de um jeito que dá para imaginar ("uns 6 dias" em vez de "21%").
 */
export function diasDeGastos(saldoCentavos: number, referenciaCentavos: number): number | null {
  return referenciaCentavos > 0 ? Math.floor((Math.max(saldoCentavos, 0) / referenciaCentavos) * 30) : null
}

/** "menos de 1 dia", "uns 6 dias", "mais de um mês". */
export function textoDias(dias: number): string {
  if (dias < 1) return 'menos de 1 dia'
  if (dias >= 30) return 'mais de um mês'
  return dias === 1 ? '1 dia' : `uns ${dias} dias`
}

/** Quanto do gasto de um mês o saldo representa, em % inteiro para baixo (15 = 15%); null sem gastos. */
export function percentualDoMes(saldoCentavos: number, referenciaCentavos: number): number | null {
  return referenciaCentavos > 0 ? Math.floor((Math.max(saldoCentavos, 0) / referenciaCentavos) * 100) : null
}

/** O maior saldo do dia mais apertado entre os meses, para a escala das barras do mês a mês. */
export function maiorDosMeses(...listas: RiscoDoMes[][]): number {
  return Math.max(0, ...listas.flat().map((m) => m.menorSaldo.valorCentavos))
}
