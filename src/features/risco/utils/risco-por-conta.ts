import type { Caixa } from '@/features/caixas/model/caixa'
import type { DiaProjetado } from '@/features/projecao/utils/projecao'
import type { DataISO } from '@/shared/lib/datas'
import { analisarRisco, capacidadePorNivel, nivelDoSaldo, NIVEIS, type AnaliseRisco, type NivelRisco, type RiscoDoMes } from './risco'

/** O risco de uma conta, com os dias projetados dela. */
export interface RiscoDaConta {
  caixa: Caixa
  /** Dias de todos os anos navegáveis, em ordem. */
  dias: DiaProjetado[]
  analise: AnaliseRisco
}

/**
 * O risco do que a tela mostra. Com uma conta só, é a análise dela. No Total com várias contas,
 * vale a conta mais apertada (o pior nível), e cada dia fica com o pior nível entre as contas.
 */
export interface RiscoDaVisao extends AnaliseRisco {
  /** A conta do pior nível; ausente quando a visão tem uma conta só. */
  caixa?: Caixa
  /** O risco de cada conta da visão, na ordem do seletor. */
  contas: RiscoDaConta[]
  /** Nível do caixa no dia (cor da célula de saldo na planilha); null fora do cálculo. */
  nivelDoDia: (dia: DiaProjetado) => NivelRisco | null
}

/** Análise de cada conta (as sem dias calculados no período ficam de fora). */
export function riscosDasContas(contas: { caixa: Caixa; dias: DiaProjetado[] }[], hoje: DataISO): RiscoDaConta[] {
  return contas.flatMap(({ caixa, dias }) => {
    const analise = analisarRisco(dias, hoje)
    return analise ? [{ caixa, dias, analise }] : []
  })
}

/** Uma conta só: o nível do dia sai do saldo do dia que está na tela. */
function deUmaConta(conta: RiscoDaConta): RiscoDaVisao {
  const { referenciaCentavos } = conta.analise
  return {
    ...conta.analise,
    contas: [conta],
    nivelDoDia: (d) => (d.saldoCentavos === null ? null : nivelDoSaldo(d.saldoCentavos, referenciaCentavos)),
  }
}

/** Pior nível de cada dia entre as contas, cada uma com a própria régua. */
function pioresNiveis(contas: RiscoDaConta[]): Map<DataISO, NivelRisco> {
  const niveis = new Map<DataISO, NivelRisco>()
  for (const { dias, analise } of contas) {
    for (const d of dias) {
      if (d.saldoCentavos === null) continue
      const nivel = nivelDoSaldo(d.saldoCentavos, analise.referenciaCentavos)
      if (nivel > (niveis.get(d.data) ?? 0)) niveis.set(d.data, nivel)
    }
  }
  return niveis
}

/** Mês a mês, o da conta mais apertada (em empate de nível, a de menor saldo). */
function pioresMeses(contas: RiscoDaConta[]): RiscoDoMes[] {
  const porMes = new Map<string, RiscoDoMes>()
  for (const { analise } of contas) {
    for (const m of analise.meses) {
      const atual = porMes.get(m.mes)
      if (
        !atual ||
        m.nivel > atual.nivel ||
        (m.nivel === atual.nivel && m.menorSaldo.valorCentavos < atual.menorSaldo.valorCentavos)
      ) {
        porMes.set(m.mes, m)
      }
    }
  }
  return [...porMes.values()].sort((a, b) => a.mes.localeCompare(b.mes))
}

/**
 * Junta o risco das contas da visão. null sem nenhuma conta com dias calculados (ex.: só benefícios).
 * A conta em destaque é a de pior nível; em empate, a que chega nele primeiro.
 * `soAConta`: a visão é exatamente a única conta, então os saldos da tela são os dela.
 */
export function riscoDaVisao(contas: RiscoDaConta[], hoje: DataISO, soAConta: boolean): RiscoDaVisao | null {
  if (contas.length === 0) return null
  if (contas.length === 1 && soAConta) return deUmaConta(contas[0])

  const pior = contas.reduce((a, b) =>
    b.analise.nivel > a.analise.nivel ||
    (b.analise.nivel === a.analise.nivel && b.analise.primeiroDiaNoNivel < a.analise.primeiroDiaNoNivel)
      ? b
      : a,
  )
  const niveis = pioresNiveis(contas)
  const { fim } = pior.analise
  const diasPorNivel: Record<NivelRisco, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const [data, nivel] of niveis) if (data >= hoje && data <= fim) diasPorNivel[nivel]++
  const negativos = contas.map((c) => c.analise.primeiroNegativo).filter((d): d is DataISO => d !== null)

  return {
    ...pior.analise,
    primeiroNegativo: negativos.length ? negativos.reduce((a, b) => (b < a ? b : a)) : null,
    meses: pioresMeses(contas),
    diasPorNivel,
    caixa: pior.caixa,
    contas,
    nivelDoDia: (d) => (d.saldoCentavos === null ? null : (niveis.get(d.data) ?? null)),
  }
}

/**
 * Quanto dá para guardar a mais por mês sem passar de cada nível. Com várias contas, a soma do que cada uma
 * aguenta (cada conta com a própria régua), para nenhuma passar do nível.
 */
export function capacidadePorNivelDaVisao(risco: RiscoDaVisao, hoje: DataISO): Record<NivelRisco, number> {
  const total: Record<NivelRisco, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const { dias, analise } of risco.contas) {
    const porNivel = capacidadePorNivel(dias, hoje, analise.referenciaCentavos)
    for (const n of NIVEIS) total[n] += porNivel[n]
  }
  return total
}
