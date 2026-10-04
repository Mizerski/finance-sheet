import { addDays, eachDayOfInterval, format, getDaysInMonth, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Data sem horário no formato "yyyy-MM-dd".
 * Strings nesse formato podem ser comparadas diretamente (<, >, ===).
 */
export type DataISO = string

export interface DiaCalendario {
  data: DataISO
  /** 0 = janeiro … 11 = dezembro */
  mes: number
  /** 1 … 31 */
  dia: number
  /** 0 = domingo … 6 = sábado */
  diaDaSemana: number
  /** Quantidade de dias do mês ao qual o dia pertence (28, 29, 30 ou 31). */
  diasNoMes: number
}

export function paraDataISO(data: Date): DataISO {
  return format(data, 'yyyy-MM-dd')
}

export function deDataISO(data: DataISO): Date {
  return parseISO(data)
}

/** Formata para exibição: dd/MM/yyyy */
export function formatarData(data: DataISO): string {
  return format(parseISO(data), 'dd/MM/yyyy')
}

/** Formata sem o ano, para textos curtos: dd/MM */
export function formatarDiaMes(data: DataISO): string {
  return format(parseISO(data), 'dd/MM')
}

/** "2026-09-30", -1 → "2026-09-29" */
export function somarDias(data: DataISO, dias: number): DataISO {
  return paraDataISO(addDays(parseISO(data), dias))
}

/** "2026-09-28" → 2026 */
export function anoDe(data: DataISO): number {
  return Number(data.slice(0, 4))
}

export function diasNoMes(ano: number, mes: number): number {
  return getDaysInMonth(new Date(ano, mes, 1))
}

/** Todos os dias do ano, de 1º de janeiro a 31 de dezembro. */
export function diasDoAno(ano: number): DiaCalendario[] {
  return eachDayOfInterval({
    start: new Date(ano, 0, 1),
    end: new Date(ano, 11, 31),
  }).map(diaDoCalendario)
}

export function diaDoCalendario(d: Date): DiaCalendario {
  return {
    data: paraDataISO(d),
    mes: d.getMonth(),
    dia: d.getDate(),
    diaDaSemana: d.getDay(),
    diasNoMes: getDaysInMonth(d),
  }
}

/** Segunda a sexta. Feriados não são considerados. */
export function ehDiaUtil(dia: DiaCalendario): boolean {
  return dia.diaDaSemana !== 0 && dia.diaDaSemana !== 6
}

export function nomeDoMes(mes: number, formato: 'longo' | 'curto' = 'longo'): string {
  return format(new Date(2000, mes, 1), formato === 'longo' ? 'MMMM' : 'MMM', {
    locale: ptBR,
  })
}

/** "2027-03-05" → "março de 2027" / "mar/2027" */
export function formatarMesAno(data: DataISO, formato: 'longo' | 'curto' = 'longo'): string {
  const mes = Number(data.slice(5, 7)) - 1
  const ano = data.slice(0, 4)
  return formato === 'longo' ? `${nomeDoMes(mes)} de ${ano}` : `${nomeDoMes(mes, 'curto')}/${ano}`
}

/** 0 → "domingo" / "dom", 1 → "segunda-feira" / "seg" … */
export function nomeDoDiaDaSemana(diaDaSemana: number, formato: 'longo' | 'curto' = 'curto'): string {
  // 02/01/2000 foi um domingo.
  const nome = format(new Date(2000, 0, 2 + diaDaSemana), 'EEEE', { locale: ptBR })
  return formato === 'longo' ? nome : nome.slice(0, 3)
}
