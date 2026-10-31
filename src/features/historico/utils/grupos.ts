import { format } from 'date-fns'
import { formatarData, nomeDoDiaDaSemana, paraDataISO, somarDias, type DataISO } from '@/shared/lib/datas'
import type { Atividade } from '../model/atividade'

export interface DiaDeAtividades {
  data: DataISO
  atividades: Atividade[]
}

/** Dia (no fuso de quem usa) em que a atividade aconteceu. */
export function diaDaAtividade(a: Atividade): DataISO {
  return paraDataISO(new Date(a.em))
}

/** "14:05". */
export function horaDaAtividade(a: Atividade): string {
  return format(new Date(a.em), 'HH:mm')
}

/** Agrupa por dia, mantendo a ordem em que vieram (a mais nova primeiro). */
export function agruparPorDia(atividades: Atividade[]): DiaDeAtividades[] {
  const dias: DiaDeAtividades[] = []
  for (const a of atividades) {
    const data = diaDaAtividade(a)
    const ultimo = dias[dias.length - 1]
    if (ultimo?.data === data) ultimo.atividades.push(a)
    else dias.push({ data, atividades: [a] })
  }
  return dias
}

/** "Hoje", "Ontem" ou "sábado, 31/10/2026". */
export function rotuloDoDia(data: DataISO, hoje: DataISO): string {
  if (data === hoje) return 'Hoje'
  if (data === somarDias(hoje, -1)) return 'Ontem'
  return `${nomeDoDiaDaSemana(new Date(`${data}T12:00:00`).getDay(), 'longo')}, ${formatarData(data)}`
}
