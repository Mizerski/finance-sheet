import { CATEGORIA_DESCONHECIDA, type Categoria } from '@/features/categorias/categoria'
import { gastosPorCategoria, type Projecao } from '@/features/projecao/projecao'
import type { ChartConfig } from '@/shared/ui/chart'

/** Totais de um período (dia, semana, mês ou ano), em centavos. */
export interface ValoresPeriodo {
  entradas: number
  saidas: number
  /** Aportes das metas de economia. */
  economia: number
  /** Entradas − saídas − economia: quanto sobrou (a variação do saldo). */
  sobra: number
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

/** Uma série do gráfico de gastos por ano: uma categoria ou "Outras". */
export interface SerieCategoria {
  chave: string
  nome: string
  cor: string
}

/** Uma linha por ano, com as saídas de cada série de categoria. */
export interface DadoGastoAno {
  /** "2026" (eixo X, tooltip e tabela) */
  ano: string
  numero: number
  /** Saídas por chave de série, em centavos. */
  valores: Record<string, number>
  saidas: number
}

/** Categorias que ganham barra própria; as demais somam em "Outras". */
const MAX_SERIES_CATEGORIA = 6

/**
 * Saídas de cada ano por categoria. As séries são as categorias que mais gastam somando todos os anos,
 * para cada categoria manter a mesma cor e posição em todas as barras.
 */
export function gastosPorAno(projecoes: Projecao[], categorias: Categoria[]): { series: SerieCategoria[]; dados: DadoGastoAno[] } {
  const porAno = projecoes.map((p) => ({ ano: p.ano, gastos: gastosPorCategoria(p.dias, categorias) }))

  const totais = new Map<string, SerieCategoria & { total: number }>()
  for (const { gastos } of porAno) {
    for (const g of gastos) {
      const atual = totais.get(g.categoriaId) ?? { chave: g.categoriaId, nome: g.nome, cor: g.cor, total: 0 }
      totais.set(g.categoriaId, { ...atual, total: atual.total + g.totalCentavos })
    }
  }
  const ordenadas = [...totais.values()].filter((s) => s.total > 0).sort((a, b) => b.total - a.total)
  const principais = ordenadas.length <= MAX_SERIES_CATEGORIA ? ordenadas : ordenadas.slice(0, MAX_SERIES_CATEGORIA - 1)
  const resto = ordenadas.length - principais.length
  const chaves = new Set(principais.map((s) => s.chave))

  const series: SerieCategoria[] = principais.map(({ chave, nome, cor }) => ({ chave, nome, cor }))
  if (resto > 0) series.push({ chave: 'outras', nome: `Outras (${resto})`, cor: CATEGORIA_DESCONHECIDA.cor })

  const dados = porAno.map(({ ano, gastos }) => {
    const valores: Record<string, number> = {}
    for (const g of gastos) {
      const chave = chaves.has(g.categoriaId) ? g.categoriaId : 'outras'
      valores[chave] = (valores[chave] ?? 0) + g.totalCentavos
    }
    return { ano: String(ano), numero: ano, valores, saidas: gastos.reduce((t, g) => t + g.totalCentavos, 0) }
  })

  return { series, dados }
}

/** Séries dos gráficos. As cores vêm dos tokens `--grafico-*` (index.css). */
export const SERIES = {
  saldo: { label: 'Saldo', color: 'var(--grafico-saldo)' },
  entradas: { label: 'Entradas', color: 'var(--grafico-entrada)' },
  saidas: { label: 'Saídas', color: 'var(--grafico-saida)' },
  economia: { label: 'Economia', color: 'var(--grafico-economia)' },
  sobra: { label: 'Sobra', color: 'var(--grafico-saldo)' },
} satisfies ChartConfig

/** Contorno preto das barras e fatias: separa os blocos de cor e dá contraste ao amarelo sobre o papel. */
export const CONTORNO = { stroke: 'var(--foreground)', strokeWidth: 1.5 }

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
