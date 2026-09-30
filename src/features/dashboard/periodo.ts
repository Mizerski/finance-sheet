import {
  addDays,
  addMonths,
  addYears,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { IntervaloAnos } from '@/features/projecao/anos'
import { anoDe, deDataISO, formatarData, paraDataISO, type DataISO } from '@/shared/lib/datas'

/** Intervalo de datas do relatório, inclusivo nas duas pontas. */
export interface Periodo {
  de: DataISO
  ate: DataISO
}

/** Unidades de período que o seletor oferece; "personalizado" é qualquer outro intervalo. */
export type Unidade = 'dia' | 'semana' | 'mes' | 'ano'
export type TipoPeriodo = Unidade | 'personalizado'

/** Semana de domingo a sábado, como no calendário em pt-BR. */
const SEMANA = { locale: ptBR }

export interface BuscaPeriodo {
  de?: DataISO
  ate?: DataISO
}

function dataValida(valor: unknown): valor is DataISO {
  return typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor) && isValid(parseISO(valor))
}

/** `validateSearch` do dashboard: aceita o par de datas só se as duas forem válidas. */
export function validarPeriodo(search: Record<string, unknown>): BuscaPeriodo {
  if (!dataValida(search.de) || !dataValida(search.ate)) return {}
  return search.de <= search.ate ? { de: search.de, ate: search.ate } : { de: search.ate, ate: search.de }
}

export function periodoDoAno(ano: number): Periodo {
  return { de: `${ano}-01-01`, ate: `${ano}-12-31` }
}

/** Mantém o período dentro dos anos que a projeção calcula. */
export function limitarPeriodo({ de, ate }: Periodo, { min, max }: IntervaloAnos): Periodo {
  const inicio = `${min}-01-01`
  const fim = `${max}-12-31`
  const limitar = (d: DataISO) => (d < inicio ? inicio : d > fim ? fim : d)
  return { de: limitar(de), ate: limitar(ate) }
}

/** Período da unidade que contém a data (ex.: a semana de domingo a sábado). */
export function periodoDe(unidade: Unidade, referencia: DataISO): Periodo {
  const data = deDataISO(referencia)
  const [inicio, fim] = {
    dia: [data, data],
    semana: [startOfWeek(data, SEMANA), endOfWeek(data, SEMANA)],
    mes: [startOfMonth(data), endOfMonth(data)],
    ano: [startOfYear(data), endOfYear(data)],
  }[unidade]
  return { de: paraDataISO(inicio), ate: paraDataISO(fim) }
}

export function tipoDoPeriodo(periodo: Periodo): TipoPeriodo {
  const unidades: Unidade[] = ['dia', 'semana', 'mes', 'ano']
  const exata = unidades.find((u) => {
    const p = periodoDe(u, periodo.de)
    return p.de === periodo.de && p.ate === periodo.ate
  })
  return exata ?? 'personalizado'
}

export function diasDoPeriodo({ de, ate }: Periodo): number {
  return differenceInCalendarDays(deDataISO(ate), deDataISO(de)) + 1
}

/** Período vizinho: a unidade seguinte/anterior ou, no personalizado, o mesmo número de dias. */
export function deslocar(periodo: Periodo, passo: 1 | -1): Periodo {
  const tipo = tipoDoPeriodo(periodo)
  const de = deDataISO(periodo.de)
  if (tipo === 'mes') return periodoDe('mes', paraDataISO(addMonths(de, passo)))
  if (tipo === 'ano') return periodoDe('ano', paraDataISO(addYears(de, passo)))
  const dias = diasDoPeriodo(periodo) * passo
  return { de: paraDataISO(addDays(de, dias)), ate: paraDataISO(addDays(deDataISO(periodo.ate), dias)) }
}

const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)

/** "12/03/2026", "08/03 – 14/03/2026", "Março de 2026", "2026" ou "01/02/2026 – 15/04/2026". */
export function rotuloDoPeriodo(periodo: Periodo): string {
  const { de, ate } = periodo
  switch (tipoDoPeriodo(periodo)) {
    case 'dia':
      return formatarData(de)
    case 'mes':
      return capitalizar(format(deDataISO(de), "MMMM 'de' yyyy", { locale: ptBR }))
    case 'ano':
      return de.slice(0, 4)
    default:
      return anoDe(de) === anoDe(ate)
        ? `${format(deDataISO(de), 'dd/MM')} – ${formatarData(ate)}`
        : `${formatarData(de)} – ${formatarData(ate)}`
  }
}

/** Complemento para textos: "no dia", "na semana", "no mês", "no ano" ou "no período". */
export const NO_PERIODO: Record<TipoPeriodo, string> = {
  dia: 'no dia',
  semana: 'na semana',
  mes: 'no mês',
  ano: 'no ano',
  personalizado: 'no período',
}

/** Complemento para comparar com o período vizinho anterior: "no mês anterior"… */
export const NO_ANTERIOR: Record<TipoPeriodo, string> = {
  dia: 'no dia anterior',
  semana: 'na semana anterior',
  mes: 'no mês anterior',
  ano: 'no ano anterior',
  personalizado: 'no período anterior',
}
