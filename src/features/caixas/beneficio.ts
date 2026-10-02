import type { Lancamento } from '@/features/lancamentos/lancamento'
import type { DiaProjetado } from '@/features/projecao/projecao'
import type { DataISO } from '@/shared/lib/datas'

/**
 * A pergunta de um benefício não é "a conta vai apertar?" (isso é o risco, só das contas), e sim
 * "quanto ainda dá para gastar até a próxima recarga?".
 */
export interface ResumoBeneficio {
  /** Saldo no fim de hoje. */
  saldoHojeCentavos: number
  /** Próxima recarga depois de hoje; null sem recarga lançada à frente. */
  recarga: { data: DataISO; valorCentavos: number } | null
  /** Saldo na véspera da recarga, já com os gastos lançados até lá (sem recarga, o saldo de hoje). */
  sobraCentavos: number
  /** Dias de amanhã até a véspera da recarga; 0 se a recarga é amanhã ou não há recarga. */
  dias: number
  /** A sobra dividida pelos dias que faltam (0 se não sobra); null sem dias para dividir. */
  porDiaCentavos: number | null
  /** Primeiro dia com saldo negativo antes da recarga (ou nos próximos 31 dias, sem recarga). */
  primeiroNegativo: DataISO | null
}

/** Sem recarga lançada, olha só o próximo mês para avisar se o saldo acaba. */
const DIAS_SEM_RECARGA = 31

/** No benefício, toda entrada é uma recarga. */
export function idsDeRecarga(lancamentos: Lancamento[]): Set<string> {
  return new Set(lancamentos.filter((l) => l.tipo === 'entrada').map((l) => l.id))
}

/** Saldo, próxima recarga e quanto dá por dia até ela. null se hoje está fora do cálculo do benefício. */
export function resumirBeneficio(dias: DiaProjetado[], recargas: Set<string>, hoje: DataISO): ResumoBeneficio | null {
  const i = dias.findIndex((d) => d.data === hoje)
  const saldoHoje = i >= 0 ? dias[i].saldoCentavos : null
  if (saldoHoje === null) return null

  let indiceRecarga = -1
  for (let j = i + 1; j < dias.length; j++) {
    if (dias[j].ocorrencias.some((o) => recargas.has(o.lancamentoId))) {
      indiceRecarga = j
      break
    }
  }

  const ate = indiceRecarga >= 0 ? indiceRecarga - 1 : Math.min(i + DIAS_SEM_RECARGA, dias.length - 1)
  const negativo = dias.slice(i, ate + 1).find((d) => d.saldoCentavos !== null && d.saldoCentavos < 0)

  if (indiceRecarga < 0) {
    return {
      saldoHojeCentavos: saldoHoje,
      recarga: null,
      sobraCentavos: saldoHoje,
      dias: 0,
      porDiaCentavos: null,
      primeiroNegativo: negativo?.data ?? null,
    }
  }

  const diaRecarga = dias[indiceRecarga]
  const valorCentavos = diaRecarga.ocorrencias
    .filter((o) => recargas.has(o.lancamentoId))
    .reduce((t, o) => t + o.valorCentavos, 0)
  const sobra = dias[ate].saldoCentavos ?? saldoHoje
  const restantes = ate - i
  return {
    saldoHojeCentavos: saldoHoje,
    recarga: { data: diaRecarga.data, valorCentavos },
    sobraCentavos: sobra,
    dias: restantes,
    porDiaCentavos: restantes > 0 ? Math.max(0, Math.floor(sobra / restantes)) : null,
    primeiroNegativo: negativo?.data ?? null,
  }
}
