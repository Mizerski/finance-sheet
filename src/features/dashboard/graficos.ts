import type { Projecao } from '@/features/projecao/projecao'
import type { ChartConfig } from '@/shared/ui/chart'

/** Totais de um período (dia, semana, mês ou ano), em centavos. */
export interface ValoresPeriodo {
  entradas: number
  saidas: number
  fixas: number
  variaveis: number
  saldo: number | null
}

/** Uma linha por grupo do relatório (dia, semana, mês ou ano), para os gráficos do período. */
export interface DadoPeriodo extends ValoresPeriodo {
  /** Início do grupo (yyyy-MM-dd). */
  chave: string
  /** "12/03", "mar", "2026"… (eixo X) */
  rotulo: string
  /** "qui, 12/03/2026", "março de 2026"… (tooltip e tabela) */
  rotuloLongo: string
}

/** Uma linha por ano, para o gráfico de gastos por ano. */
export interface DadoAnual extends ValoresPeriodo {
  /** "2026" (eixo X, tooltip e tabela) */
  ano: string
  numero: number
}

export function dadosAnuais(projecoes: Projecao[]): DadoAnual[] {
  return projecoes.map(({ ano, resumo }) => ({
    ano: String(ano),
    numero: ano,
    entradas: resumo.totalEntradasCentavos,
    saidas: resumo.totalSaidasCentavos,
    fixas: resumo.totalSaidasFixasCentavos,
    variaveis: resumo.totalSaidasVariaveisCentavos,
    saldo: resumo.saldoFinalCentavos,
  }))
}

/** Séries dos gráficos. As cores vêm dos tokens `--grafico-*` (index.css). */
export const SERIES = {
  saldo: { label: 'Saldo', color: 'var(--grafico-saldo)' },
  entradas: { label: 'Entradas', color: 'var(--grafico-entrada)' },
  saidas: { label: 'Saídas', color: 'var(--grafico-saida)' },
  fixas: { label: 'Fixas', color: 'var(--grafico-fixa)' },
  variaveis: { label: 'Variáveis', color: 'var(--grafico-variavel)' },
} satisfies ChartConfig

/** Classes comuns do container dos gráficos cartesianos (altura inclui o eixo X). */
export const AREA_GRAFICO = 'aspect-auto h-64 w-full'

/**
 * Escala do eixo Y com degraus redondos (1, 2, 2,5 ou 5 × 10ⁿ centavos).
 * Valores negativos ganham só uma folga abaixo do zero, sem um degrau inteiro vazio.
 */
export function escalaY(valores: number[], divisoes = 4): { domain: [number, number]; ticks: number[] } {
  const min = Math.min(0, ...valores)
  const max = Math.max(0, ...valores)
  const bruto = (max - min) / divisoes || 100
  const magnitude = 10 ** Math.floor(Math.log10(bruto))
  const passo = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((p) => p >= bruto) ?? bruto
  const topo = Math.ceil(max / passo) * passo || passo
  const base = min < 0 ? min - (topo - min) * 0.06 : 0

  const ticks: number[] = []
  // `|| 0` evita o -0, que seria exibido como "-R$ 0".
  for (let t = Math.ceil(base / passo) * passo || 0; t <= topo; t += passo) ticks.push(t)
  return { domain: [base, topo], ticks }
}
