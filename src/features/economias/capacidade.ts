import type { DiaProjetado } from '@/features/projecao/projecao'
import { diasNoMes, type DataISO } from '@/shared/lib/datas'

/** Quantos meses à frente a capacidade olha. */
export const MESES_DA_CAPACIDADE = 12

/** A sugestão é arredondada para baixo em múltiplos de R$ 10. */
export const ARREDONDAMENTO_CENTAVOS = 1000

/**
 * O que define a capacidade:
 * - `negativo`: o saldo projetado já fica negativo, então não há espaço;
 * - `sobra`: a sobra média do mês (guardar mais consumiria o saldo que já está na conta);
 * - `saldo`: o dia mais apertado, quando o aporte extra deixaria o saldo negativo antes de a sobra render.
 */
export type MotivoCapacidade = 'negativo' | 'sobra' | 'saldo'

/**
 * Quanto dá para guardar por mês, além das metas atuais, sem o saldo projetado ficar negativo
 * e sem gastar o que já está na conta. Considera um aporte extra no dia 1º de cada mês, de `primeiroAporte` até `fim`.
 */
export interface CapacidadePoupanca {
  primeiroAporte: DataISO
  fim: DataISO
  /** Valor mensal extra sugerido; 0 se não houver espaço. */
  capacidadeCentavos: number
  motivo: MotivoCapacidade
  /** Dia em que o saldo fica mais apertado com o aporte extra (explica o motivo `saldo`). */
  limite: { data: DataISO; saldoCentavos: number } | null
  /** Menor saldo projetado entre hoje e `fim`, sem o aporte extra. */
  menorSaldo: { data: DataISO; valorCentavos: number } | null
  /** Média mensal de entradas − saídas − economia nos meses do período. */
  sobraMediaCentavos: number
  /** Média mensal já guardada nas metas nos meses do período. */
  economiaMediaCentavos: number
}

function dataISO(ano: number, mes: number, dia: number): DataISO {
  return `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

/** Índice absoluto do mês ("2026-10-15" → 2026 × 12 + 9), para contar meses entre datas. */
function indiceDoMes(data: DataISO): number {
  return Number(data.slice(0, 4)) * 12 + Number(data.slice(5, 7)) - 1
}

/** Período da capacidade: do dia 1º do mês seguinte a `hoje` até o fim do 12º mês. */
export function periodoDaCapacidade(hoje: DataISO): { primeiroAporte: DataISO; fim: DataISO } {
  const inicio = indiceDoMes(hoje) + 1
  const ultimo = inicio + MESES_DA_CAPACIDADE - 1
  return {
    primeiroAporte: dataISO(Math.floor(inicio / 12), inicio % 12, 1),
    fim: dataISO(Math.floor(ultimo / 12), ultimo % 12, diasNoMes(Math.floor(ultimo / 12), ultimo % 12)),
  }
}

/**
 * Capacidade de poupança a partir de `hoje`, pelos dias projetados (de um ou mais anos, em ordem).
 * O aporte extra acumula: no n-ésimo mês já saíram n aportes, então cada dia limita o valor a saldo ÷ n.
 * Retorna null se não houver dias calculados no período (ex.: saldo inicial ainda no futuro).
 */
export function capacidadeDePoupanca(dias: DiaProjetado[], hoje: DataISO): CapacidadePoupanca | null {
  const { primeiroAporte, fim } = periodoDaCapacidade(hoje)
  const inicio = indiceDoMes(primeiroAporte)

  let capacidade = Infinity
  let limite: CapacidadePoupanca['limite'] = null
  let menorSaldo: CapacidadePoupanca['menorSaldo'] = null
  let sobra = 0
  let economia = 0
  let calculados = 0

  for (const d of dias) {
    if (d.data < hoje || d.data > fim || d.saldoCentavos === null) continue
    calculados++
    const saldo = d.saldoCentavos
    if (!menorSaldo || saldo < menorSaldo.valorCentavos) menorSaldo = { data: d.data, valorCentavos: saldo }

    if (d.data >= primeiroAporte) {
      sobra += d.entradasCentavos - d.saidasFixasCentavos - d.saidasVariaveisCentavos - d.economiaCentavos
      economia += d.economiaCentavos
    }

    const aportesAteODia = d.data >= primeiroAporte ? indiceDoMes(d.data) - inicio + 1 : 0
    // Antes do primeiro aporte extra, só um saldo já negativo limita (e zera a capacidade).
    const maximo = aportesAteODia > 0 ? saldo / aportesAteODia : saldo < 0 ? 0 : Infinity
    if (maximo < capacidade) {
      capacidade = maximo
      limite = { data: d.data, saldoCentavos: saldo }
    }
  }

  if (calculados === 0) return null

  const sobraMedia = Math.round(sobra / MESES_DA_CAPACIDADE)
  const pelaSobra = arredondar(sobraMedia)
  const peloSaldo = Number.isFinite(capacidade) ? arredondar(capacidade) : pelaSobra
  const motivo: MotivoCapacidade =
    menorSaldo && menorSaldo.valorCentavos < 0 ? 'negativo' : pelaSobra <= peloSaldo ? 'sobra' : 'saldo'

  return {
    primeiroAporte,
    fim,
    capacidadeCentavos: motivo === 'negativo' ? 0 : Math.min(pelaSobra, peloSaldo),
    motivo,
    limite,
    menorSaldo,
    sobraMediaCentavos: sobraMedia,
    economiaMediaCentavos: Math.round(economia / MESES_DA_CAPACIDADE),
  }
}

/** Para baixo, em múltiplos de R$ 10, nunca abaixo de zero. */
export function arredondar(centavos: number): number {
  return Math.max(Math.floor(centavos / ARREDONDAMENTO_CENTAVOS) * ARREDONDAMENTO_CENTAVOS, 0)
}
