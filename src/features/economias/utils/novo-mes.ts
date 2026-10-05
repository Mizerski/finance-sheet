import type { Projecao } from '@/features/projecao/utils/projecao'
import type { DataISO } from '@/shared/lib/datas'
import { sobraDoMes } from './sobras'

/** Na primeira semana do mês, o app mostra como o mês anterior fechou: um recomeço é hora de rever as metas. */
const DIAS_DO_RESUMO = 7

export interface ResumoNovoMes {
  /** Mês que fechou (0 = janeiro) e o ano dele. */
  mes: number
  ano: number
  entradasCentavos: number
  saidasCentavos: number
  economiaCentavos: number
  sobraCentavos: number
  /** Em janeiro, o ano que fechou inteiro. */
  anoFechado?: { sobraCentavos: number; economiaCentavos: number }
}

/** Resumo do mês anterior nos primeiros dias do mês; null no resto do mês ou sem cálculo naquele mês. */
export function resumoNovoMes(projecoes: Projecao[], hoje: DataISO): ResumoNovoMes | null {
  if (Number(hoje.slice(8, 10)) > DIAS_DO_RESUMO) return null
  const mesHoje = Number(hoje.slice(5, 7)) - 1
  const ano = mesHoje === 0 ? Number(hoje.slice(0, 4)) - 1 : Number(hoje.slice(0, 4))
  const mes = mesHoje === 0 ? 11 : mesHoje - 1

  const projecao = projecoes.find((p) => p.ano === ano)
  const resumo = projecao?.meses[mes]
  if (!projecao || !resumo || resumo.saldoFinalCentavos === null) return null

  const calculados = projecao.meses.filter((m) => m.saldoFinalCentavos !== null)
  return {
    mes,
    ano,
    entradasCentavos: resumo.entradasCentavos,
    saidasCentavos: resumo.saidasCentavos,
    economiaCentavos: resumo.economiaCentavos,
    sobraCentavos: sobraDoMes(resumo),
    ...(mes === 11 && {
      anoFechado: {
        sobraCentavos: calculados.reduce((t, m) => t + sobraDoMes(m), 0),
        economiaCentavos: calculados.reduce((t, m) => t + m.economiaCentavos, 0),
      },
    }),
  }
}
