import { format } from 'date-fns'
import type { DiaProjetado, Projecao } from '@/features/projecao/projecao'
import { anoDe, deDataISO, formatarData, nomeDoDiaDaSemana, nomeDoMes } from '@/shared/lib/datas'
import type { DadoPeriodo } from './graficos'
import { diasDoPeriodo, periodoDe, type Periodo, type Unidade } from './periodo'

/** Dias projetados dentro do período, atravessando quantos anos forem preciso. */
export function diasNoPeriodo(projecoes: Projecao[], { de, ate }: Periodo): DiaProjetado[] {
  return projecoes
    .filter((p) => p.ano >= anoDe(de) && p.ano <= anoDe(ate))
    .flatMap((p) => p.dias.filter((d) => d.data >= de && d.data <= ate))
}

/** Barras por dia até um mês, por semana até um trimestre, por mês até dois anos, depois por ano. */
export function agrupamentoPara(periodo: Periodo): Unidade {
  const dias = diasDoPeriodo(periodo)
  return dias <= 31 ? 'dia' : dias <= 93 ? 'semana' : dias <= 731 ? 'mes' : 'ano'
}

/** Nomes da unidade para títulos e tooltips dos gráficos. */
export const NOME_UNIDADE: Record<Unidade, { cada: string; noFim: string; coluna: string }> = {
  dia: { cada: 'cada dia', noFim: 'no fim do dia', coluna: 'Dia' },
  semana: { cada: 'cada semana', noFim: 'no fim da semana', coluna: 'Semana' },
  mes: { cada: 'cada mês', noFim: 'no fim do mês', coluna: 'Mês' },
  ano: { cada: 'cada ano', noFim: 'no fim do ano', coluna: 'Ano' },
}

function rotulos(unidade: Unidade, primeiro: DiaProjetado, ultimo: DiaProjetado, variosAnos: boolean) {
  const inicio = deDataISO(primeiro.data)
  switch (unidade) {
    case 'dia':
      return {
        rotulo: format(inicio, 'dd/MM'),
        rotuloLongo: `${nomeDoDiaDaSemana(primeiro.diaDaSemana)}, ${formatarData(primeiro.data)}`,
      }
    case 'semana':
      return {
        rotulo: format(inicio, 'dd/MM'),
        // Semana cortada pela ponta do período pode ter um dia só.
        rotuloLongo:
          primeiro.data === ultimo.data
            ? formatarData(primeiro.data)
            : `${format(inicio, 'dd/MM')} – ${formatarData(ultimo.data)}`,
      }
    case 'mes':
      return {
        rotulo: nomeDoMes(primeiro.mes, 'curto') + (variosAnos ? `/${primeiro.data.slice(2, 4)}` : ''),
        rotuloLongo: `${nomeDoMes(primeiro.mes)} de ${primeiro.data.slice(0, 4)}`,
      }
    case 'ano':
      return { rotulo: primeiro.data.slice(0, 4), rotuloLongo: primeiro.data.slice(0, 4) }
  }
}

/**
 * Soma os dias em grupos da unidade. Grupos cortados pelas pontas do período (ex.: meia semana)
 * contam só os dias de dentro, e o rótulo mostra esses dias.
 */
export function agrupar(dias: DiaProjetado[], unidade: Unidade): DadoPeriodo[] {
  const grupos = new Map<string, DiaProjetado[]>()
  for (const d of dias) {
    const chave = periodoDe(unidade, d.data).de
    grupos.set(chave, [...(grupos.get(chave) ?? []), d])
  }
  const variosAnos = dias.length > 0 && anoDe(dias[0].data) !== anoDe(dias[dias.length - 1].data)

  return [...grupos].map(([chave, doGrupo]) => {
    const soma = (campo: 'entradasCentavos' | 'saidasFixasCentavos' | 'saidasVariaveisCentavos' | 'economiaCentavos') =>
      doGrupo.reduce((t, d) => t + d[campo], 0)
    const entradas = soma('entradasCentavos')
    const saidas = soma('saidasFixasCentavos') + soma('saidasVariaveisCentavos')
    const economia = soma('economiaCentavos')
    return {
      chave,
      ...rotulos(unidade, doGrupo[0], doGrupo[doGrupo.length - 1], variosAnos),
      entradas,
      saidas,
      economia,
      sobra: entradas - saidas - economia,
      saldo: doGrupo[doGrupo.length - 1].saldoCentavos,
    }
  })
}
